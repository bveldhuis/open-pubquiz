import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Question } from '../entities/Question';
import { Team } from '../entities/Team';
import { Answer } from '../entities/Answer';
import { SessionEvent, EventType } from '../entities/SessionEvent';

interface JoinSessionData {
  sessionCode: string;
  teamName: string;
}

interface SubmitAnswerData {
  sessionCode: string;
  teamId: string;
  questionId: string;
  answer: string | string[]; // string for text/multiple choice, string[] for sequence
}

interface PresenterAction {
  sessionCode: string;
  action: 'start_question' | 'end_question' | 'show_leaderboard' | 'show_review' | 'next_round';
  questionId?: string;
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join session as participant
    socket.on('join_session', async (data: JoinSessionData) => {
      try {
        const { sessionCode, teamName } = data;
        
        // Find session
        const sessionRepository = AppDataSource.getRepository(QuizSession);
        const session = await sessionRepository.findOne({ 
          where: { code: sessionCode },
          relations: ['teams']
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Check if team name already exists in this session
        const existingTeam = session.teams.find(team => team.name === teamName);
        if (existingTeam) {
          socket.emit('error', { message: 'Team name already exists in this session' });
          return;
        }

        // Create new team
        const teamRepository = AppDataSource.getRepository(Team);
        const team = teamRepository.create({
          quiz_session_id: session.id,
          name: teamName
        });
        await teamRepository.save(team);

        // Join socket room
        socket.join(sessionCode);
        socket.data.sessionCode = sessionCode;
        socket.data.teamId = team.id;
        socket.data.teamName = teamName;

        // Emit team joined event
        socket.emit('team_joined', { 
          teamId: team.id, 
          teamName: teamName,
          sessionStatus: session.status
        });

        // Notify presenter
        socket.to(sessionCode).emit('team_joined_session', {
          teamId: team.id,
          teamName: teamName
        });

        console.log(`👥 Team ${teamName} joined session ${sessionCode}`);
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Submit answer
    socket.on('submit_answer', async (data: SubmitAnswerData) => {
      try {
        const { sessionCode, teamId, questionId, answer } = data;

        // Validate session and team
        const sessionRepository = AppDataSource.getRepository(QuizSession);
        const session = await sessionRepository.findOne({ 
          where: { code: sessionCode },
          relations: ['teams']
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const team = session.teams.find(t => t.id === teamId);
        if (!team) {
          socket.emit('error', { message: 'Team not found' });
          return;
        }

        // Check if question is active
        if (session.current_question_id !== questionId) {
          socket.emit('error', { message: 'Question is not active' });
          return;
        }

        // Check if answer already exists
        const answerRepository = AppDataSource.getRepository(Answer);
        const existingAnswer = await answerRepository.findOne({
          where: { question_id: questionId, team_id: teamId }
        });

        if (existingAnswer) {
          socket.emit('error', { message: 'Answer already submitted' });
          return;
        }

        // Create answer
        const answerText = Array.isArray(answer) ? answer.join('|') : answer;
        const newAnswer = answerRepository.create({
          question_id: questionId,
          team_id: teamId,
          answer_text: answerText
        });
        await answerRepository.save(newAnswer);

        // Emit answer submitted
        socket.emit('answer_submitted', { 
          questionId, 
          success: true 
        });

        // Notify presenter
        socket.to(sessionCode).emit('answer_received', {
          teamId,
          teamName: team.name,
          questionId
        });

        console.log(`📝 Answer submitted by ${team.name} for question ${questionId}`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Presenter actions
    socket.on('presenter_action', async (data: PresenterAction) => {
      try {
        const { sessionCode, action, questionId } = data;

        const sessionRepository = AppDataSource.getRepository(QuizSession);
        const session = await sessionRepository.findOne({ 
          where: { code: sessionCode }
        });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Log event
        const eventRepository = AppDataSource.getRepository(SessionEvent);
        await eventRepository.save({
          quiz_session_id: session.id,
          event_type: action as EventType,
          event_data: { questionId }
        });

        // Handle different actions
        switch (action) {
          case 'start_question':
            if (questionId) {
              await sessionRepository.update(session.id, {
                current_question_id: questionId,
                status: QuizSessionStatus.ACTIVE
              });
              
              // Get question details
              const questionRepository = AppDataSource.getRepository(Question);
              const question = await questionRepository.findOne({
                where: { id: questionId }
              });

              io.to(sessionCode).emit('question_started', {
                question,
                timeLimit: question?.time_limit
              });
            }
            break;

          case 'end_question':
            await sessionRepository.update(session.id, {
              status: QuizSessionStatus.PAUSED
            });
            
            io.to(sessionCode).emit('question_ended');
            break;

          case 'show_leaderboard':
            const teamRepository = AppDataSource.getRepository(Team);
            const teams = await teamRepository.find({
              where: { quiz_session_id: session.id },
              order: { total_points: 'DESC' }
            });
            
            io.to(sessionCode).emit('leaderboard_updated', { teams });
            break;

          case 'show_review':
            if (questionId) {
              const answerRepository = AppDataSource.getRepository(Answer);
              const answers = await answerRepository.find({
                where: { question_id: questionId },
                relations: ['team']
              });
              
              io.to(sessionCode).emit('review_answers', {
                questionId,
                answers: answers.map(a => ({
                  teamName: a.team.name,
                  answer: a.answer_text,
                  isCorrect: a.is_correct,
                  pointsAwarded: a.points_awarded
                }))
              });
            }
            break;

          case 'next_round':
            await sessionRepository.update(session.id, {
              current_round: session.current_round + 1,
              current_question_id: null,
              status: QuizSessionStatus.WAITING
            });
            
            io.to(sessionCode).emit('round_started', {
              roundNumber: session.current_round + 1
            });
            break;
        }

        console.log(`🎮 Presenter action: ${action} in session ${sessionCode}`);
      } catch (error) {
        console.error('Error handling presenter action:', error);
        socket.emit('error', { message: 'Failed to execute presenter action' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
