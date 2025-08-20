import { Server, Socket } from 'socket.io';
import { AppDataSource } from '../config/database';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Question, QuestionType } from '../entities/Question';
import { Team } from '../entities/Team';
import { Answer } from '../entities/Answer';
import { SequenceAnswer } from '../entities/SequenceAnswer';
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

    // Join room (for presenter)
    socket.on('join_room', async (data: { sessionCode: string }) => {
      try {
        const { sessionCode } = data;
        socket.join(sessionCode);
        socket.data.sessionCode = sessionCode;
        console.log(`🎮 Presenter joined room: ${sessionCode}`);
        
        // Send existing teams to the presenter
        const sessionRepository = AppDataSource.getRepository(QuizSession);
        const session = await sessionRepository.findOne({ 
          where: { code: sessionCode },
          relations: ['teams']
        });
        
        if (session && session.teams.length > 0) {
          console.log(`📋 Sending ${session.teams.length} existing teams to presenter`);
          socket.emit('existing_teams', {
            teams: session.teams.map(team => ({
              id: team.id,
              name: team.name
            }))
          });
          
          // Also emit individual team_joined_session events for each existing team
          // This ensures the presenter gets notifications for all teams
          for (const team of session.teams) {
            console.log(`📢 Emitting team_joined_session event for existing team ${team.name}`);
            socket.emit('team_joined_session', {
              teamId: team.id,
              teamName: team.name
            });
          }
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

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
        let team: Team;

        if (!existingTeam) {
          // Create new team only if it doesn't exist
          const teamRepository = AppDataSource.getRepository(Team);
          team = teamRepository.create({
            quiz_session_id: session.id,
            name: teamName
          });
          await teamRepository.save(team);
          console.log(`👥 New team ${teamName} created and joined session ${sessionCode}`);
        } else {
          team = existingTeam;
          console.log(`👥 Existing team ${teamName} rejoined session ${sessionCode}`);
        }

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

        // Notify presenter about team joining (both new and existing teams)
        // Check if there are any sockets in the room (presenters)
        const roomSockets = await io.in(sessionCode).fetchSockets();
        if (roomSockets.length > 0) {
          console.log(`📢 Emitting team_joined_session event for team ${teamName} in room ${sessionCode} (${roomSockets.length} presenters in room)`);
          socket.to(sessionCode).emit('team_joined_session', {
            teamId: team.id,
            teamName: teamName
          });
        } else {
          console.log(`📢 No presenters in room ${sessionCode}, not emitting team_joined_session event`);
        }

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

        // Get question details for scoring
        const questionRepository = AppDataSource.getRepository(Question);
        const question = await questionRepository.findOne({ where: { id: questionId } });
        
        if (!question) {
          socket.emit('error', { message: 'Question not found' });
          return;
        }

        // Process answer based on question type
        let answerText: string;
        let isCorrect: boolean | null = null;
        let pointsAwarded = 0;

        if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
          answerText = answer.join('|');
        } else if (typeof answer === 'string') {
          answerText = answer;
        } else {
          socket.emit('error', { message: 'Invalid answer format' });
          return;
        }

        // Auto-score multiple choice questions
        if (question.type === QuestionType.MULTIPLE_CHOICE && question.correct_answer) {
          console.log('🔍 Multiple choice scoring:');
          console.log('  - Submitted answer:', `"${answerText}"`);
          console.log('  - Correct answer:', `"${question.correct_answer}"`);
          console.log('  - Submitted length:', answerText.length);
          console.log('  - Correct length:', question.correct_answer.length);
          console.log('  - Submitted char codes:', Array.from(answerText).map(c => c.charCodeAt(0)));
          console.log('  - Correct char codes:', Array.from(question.correct_answer).map(c => c.charCodeAt(0)));
          console.log('  - Submitted (normalized):', `"${answerText.toLowerCase().trim()}"`);
          console.log('  - Correct (normalized):', `"${question.correct_answer.toLowerCase().trim()}"`);
          
          isCorrect = answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
          pointsAwarded = isCorrect ? question.points : 0;
          
          console.log('  - Result:', isCorrect ? 'CORRECT' : 'INCORRECT');
          console.log('  - Points awarded:', pointsAwarded);
        }
        
        // Auto-score sequence questions
        if (question.type === QuestionType.SEQUENCE && question.sequence_items && Array.isArray(answer)) {
          console.log('🔍 Sequence scoring:');
          console.log('  - Correct sequence:', question.sequence_items);
          console.log('  - Submitted sequence:', answer);
          
          const correctSequence = question.sequence_items;
          const submittedSequence = answer;
          
          // Check if all items are in correct order
          let correctCount = 0;
          for (let i = 0; i < Math.min(correctSequence.length, submittedSequence.length); i++) {
            if (correctSequence[i] === submittedSequence[i]) {
              correctCount++;
            }
          }
          
          console.log('  - Correct items:', correctCount, 'out of', correctSequence.length);
          
          // Full points if all correct, 1 point if only 1 wrong, 0 points otherwise
          if (correctCount === correctSequence.length) {
            isCorrect = true;
            pointsAwarded = question.points;
            console.log('  - Result: PERFECT (all correct)');
          } else if (correctCount === correctSequence.length - 1) {
            isCorrect = true;
            pointsAwarded = 1;
            console.log('  - Result: PARTIAL (1 wrong)');
          } else {
            isCorrect = false;
            pointsAwarded = 0;
            console.log('  - Result: INCORRECT');
          }
          
          console.log('  - Points awarded:', pointsAwarded);
        }
        
        // Open text questions are not auto-scored (isCorrect remains null)
        if (question.type === QuestionType.OPEN_TEXT) {
          console.log('🔍 Open text question - manual scoring required');
        }

        // Create answer
        const newAnswer = answerRepository.create({
          question_id: questionId,
          team_id: teamId,
          answer_text: answerText,
          is_correct: isCorrect,
          points_awarded: pointsAwarded
        });
        await answerRepository.save(newAnswer);

        // Create sequence answers if needed
        if (question.type === QuestionType.SEQUENCE && Array.isArray(answer)) {
          const sequenceAnswerRepository = AppDataSource.getRepository(SequenceAnswer);
          for (let i = 0; i < answer.length; i++) {
            const sequenceAnswer = sequenceAnswerRepository.create({
              answer_id: newAnswer.id,
              item_text: answer[i],
              position: i
            });
            await sequenceAnswerRepository.save(sequenceAnswer);
          }
        }

        // Update team points if auto-scored
        if (isCorrect !== null) {
          const teamRepository = AppDataSource.getRepository(Team);
          await teamRepository.update(teamId, {
            total_points: team.total_points + pointsAwarded
          });
        }

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
        console.log('🎮 Received presenter action:', data);
        const { sessionCode, action, questionId } = data;

        // Check database connection
        if (!AppDataSource.isInitialized) {
          console.error('❌ Database not initialized');
          socket.emit('error', { message: 'Database connection error' });
          return;
        }

        console.log(`✅ Database connection status: ${AppDataSource.isInitialized}`);

        const sessionRepository = AppDataSource.getRepository(QuizSession);
        const session = await sessionRepository.findOne({ 
          where: { code: sessionCode }
        });

        if (!session) {
          console.error(`❌ Session not found: ${sessionCode}`);
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        console.log(`✅ Session found: ${session.id}`);

        // Map action to EventType enum
        const actionToEventType = (action: string): EventType => {
          switch (action) {
            case 'start_question':
              return EventType.START_QUESTION;
            case 'end_question':
              return EventType.END_QUESTION;
            case 'show_leaderboard':
              return EventType.SHOW_LEADERBOARD;
            case 'show_review':
              return EventType.SHOW_REVIEW;
            case 'next_round':
              return EventType.NEXT_ROUND;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
        };

        // Log event
        const eventRepository = AppDataSource.getRepository(SessionEvent);
        await eventRepository.save({
          quiz_session_id: session.id,
          event_type: actionToEventType(action),
          event_data: { questionId }
        });

        console.log(`✅ Event logged: ${action}`);

        // Handle different actions
        switch (action) {
          case 'start_question':
            if (questionId) {
              console.log(`🎯 Starting question: ${questionId}`);
              
              await sessionRepository.update(session.id, {
                current_question_id: questionId,
                status: QuizSessionStatus.ACTIVE
              });
              console.log(`✅ Session updated with question: ${questionId}`);
              
              // Get question details
              const questionRepository = AppDataSource.getRepository(Question);
              
              // First, let's check if the question exists
              const questionCount = await questionRepository.count({
                where: { id: questionId }
              });
              console.log(`🔍 Question count for ID ${questionId}: ${questionCount}`);
              
              const question = await questionRepository.findOne({
                where: { id: questionId }
              });

              if (!question) {
                console.error(`❌ Question not found: ${questionId}`);
                socket.emit('error', { message: 'Question not found' });
                return;
              }

              console.log(`✅ Question found:`, question);
              console.log(`📢 Emitting question_started to room ${sessionCode}:`, { question, timeLimit: question?.time_limit });
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
        console.error('❌ Error handling presenter action:', error);
        if (error instanceof Error) {
          console.error('❌ Error stack:', error.stack);
        }
        socket.emit('error', { message: 'Failed to execute presenter action' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
