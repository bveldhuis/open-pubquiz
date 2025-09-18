import { Server, Socket } from 'socket.io';
import { EventType } from '../entities/SessionEvent';
import { ServiceFactory } from '../services/ServiceFactory';

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
  action: 'start_question' | 'end_question' | 'show_leaderboard' | 'show_review' | 'next_round' | 'end_session';
  questionId?: string;
  leaderboard?: any[];
}

interface TimerUpdateData {
  sessionCode: string;
  timeRemaining: number;
}

export function setupSocketHandlers(io: Server) {
  const serviceFactory = ServiceFactory.getInstance();
  const sessionService = serviceFactory.createSessionService(serviceFactory.createTeamService());
  const teamService = serviceFactory.createTeamService();
  const questionService = serviceFactory.createQuestionService(sessionService);
  const answerService = serviceFactory.createAnswerService(questionService, teamService);
  
  // Set up heartbeat mechanism for iOS Safari compatibility
  io.engine.on('connection_error', (err) => {
    console.log('🔌 Connection error:', err.req, err.code, err.message, err.context);
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Send periodic pings to keep connection alive (especially for iOS Safari)
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds

    // Clean up interval on disconnect
    socket.on('disconnect', () => {
      clearInterval(pingInterval);
    });

    // Join room (for presenter)
    socket.on('join_room', async (data: { sessionCode: string }) => {
      try {
        const { sessionCode } = data;
        socket.join(sessionCode);
        socket.data.sessionCode = sessionCode;
        console.log(`🎮 Presenter joined room: ${sessionCode}`);
        
        // Send existing teams to the presenter
        const teams = await teamService.getExistingTeams(sessionCode);
        
        if (teams.length > 0) {
          console.log(`📋 Sending ${teams.length} existing teams to presenter`);
          socket.emit('existing_teams', { teams });
          
          // Also emit individual team_joined_session events for each existing team
          // This ensures the presenter gets notifications for all teams
          for (const team of teams) {
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
        
        // Join session using service
        const result = await sessionService.joinSession(sessionCode, teamName);
        const { team, session, isNewTeam } = result;

        if (isNewTeam) {
          console.log(`👥 New team ${teamName} created and joined session ${sessionCode}`);
        } else {
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

        // Check if there's an active question and send it to the reconnecting participant
        if (session.current_question_id) {
          try {
            console.log(`❓ Sending active question ${session.current_question_id} to reconnecting team ${teamName}`);
            const activeQuestion = await questionService.getQuestionById(session.current_question_id);
            
            if (activeQuestion) {
              socket.emit('question_started', {
                question: activeQuestion,
                timeLimit: activeQuestion.time_limit || 0 // Send 0 for NULL time limits
              });
              console.log(`✅ Active question sent to reconnecting team ${teamName}`);
              
              // Get current timer status from presenter socket
              const roomSockets = await io.in(sessionCode).fetchSockets();
              const presenterSocket = roomSockets.find(s => s.data.sessionCode === sessionCode && s.data.currentTimer !== undefined);
              
              if (presenterSocket && presenterSocket.data.currentTimer !== undefined) {
                const currentTimer = presenterSocket.data.currentTimer;
                console.log(`⏰ Sending current timer status (${currentTimer}s) to reconnecting team ${teamName}`);
                socket.emit('timer-update', { timeRemaining: currentTimer });
              } else if (activeQuestion.time_limit === null || activeQuestion.time_limit === undefined) {
                console.log(`⏰ Sending unlimited timer status to reconnecting team ${teamName}`);
                socket.emit('timer-update', { timeRemaining: 0 });
              } else {
                console.log(`⏰ No active timer found for reconnecting team ${teamName}`);
              }
            }
          } catch (error) {
            console.error('Error sending active question to reconnecting participant:', error);
          }
        }

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
        if (error instanceof Error && error.message === 'Cannot join an ended session') {
          socket.emit('session_ended_error', { message: 'This session has ended and cannot accept new participants' });
        } else {
          socket.emit('error', { message: 'Failed to join session' });
        }
      }
    });

    // Submit answer
    socket.on('submit_answer', async (data: SubmitAnswerData) => {
      try {
        const { sessionCode, teamId, questionId, answer } = data;

        // Validate session and team
        const session = await sessionService.getSessionByCodeOrThrow(sessionCode, ['teams']);
        const team = session.teams.find((t: any) => t.id === teamId);
        
        if (!team) {
          socket.emit('error', { message: 'Team not found' });
          return;
        }

        // Check if question is active
        if (session.current_question_id !== questionId) {
          socket.emit('error', { message: 'Question is not active' });
          return;
        }

        // Submit answer using service
        const result = await answerService.submitAnswer(questionId, teamId, answer);

        // Emit answer submitted
        socket.emit('answer_submitted', { 
          questionId, 
          success: true 
        });

        // Notify presenter
        socket.to(sessionCode).emit('answer_received', {
          teamId,
          teamName: result.team.name,
          questionId
        });

        console.log(`📝 Answer submitted by ${result.team.name} for question ${questionId}`);
      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Timer update from presenter
    socket.on('timer_update', (data: TimerUpdateData) => {
      try {
        const { sessionCode, timeRemaining } = data;
        console.log(`⏰ Timer update: ${timeRemaining}s remaining in session ${sessionCode}`);
        
        // Store current timer status in socket data for reconnecting participants
        socket.data.currentTimer = timeRemaining;
        
        // Broadcast timer update to all participants in the session
        socket.to(sessionCode).emit('timer-update', { timeRemaining });
      } catch (error) {
        console.error('Error handling timer update:', error);
      }
    });

    // Presenter actions
    socket.on('presenter_action', async (data: PresenterAction) => {
      try {
        console.log('🎮 Received presenter action:', data);
        const { sessionCode, action, questionId } = data;

        // Get session
        const session = await sessionService.getSessionByCodeOrThrow(sessionCode);
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
            case 'end_session':
              return EventType.SESSION_ENDED;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
        };

        // Log event
        await sessionService.logEvent(session.id, actionToEventType(action), { questionId });
        console.log(`✅ Event logged: ${action}`);

        // Handle different actions
        switch (action) {
          case 'start_question':
            if (questionId) {
              console.log(`🎯 Starting question: ${questionId}`);
              
              const question = await questionService.startQuestion(sessionCode, questionId);
              console.log(`✅ Session updated with question: ${questionId}`);
              console.log(`✅ Question found:`, question);
              console.log(`📢 Emitting question_started to room ${sessionCode}:`, { question, timeLimit: question?.time_limit });
              
              io.to(sessionCode).emit('question_started', {
                question,
                timeLimit: question?.time_limit
              });
            }
            break;

          case 'end_question':
            await questionService.endQuestion(sessionCode);
            io.to(sessionCode).emit('question_ended');
            break;

          case 'show_leaderboard':
            const teams = await teamService.getLeaderboard(sessionCode);
            io.to(sessionCode).emit('leaderboard_updated', { teams });
            break;

          case 'show_review':
            if (questionId) {
              const answers = await answerService.getAnswersForQuestion(questionId);
              
              io.to(sessionCode).emit('review_answers', {
                questionId,
                answers: answers.map((a: any) => ({
                  teamName: a.team.name,
                  answer: a.answer_text,
                  isCorrect: a.is_correct,
                  pointsAwarded: a.points_awarded
                }))
              });
            }
            break;

          case 'next_round':
            const newRound = await sessionService.startNextRound(sessionCode);
            
            io.to(sessionCode).emit('round_started', {
              roundNumber: newRound
            });
            break;

          case 'end_session':
            console.log(`🏁 Ending session: ${sessionCode}`);
            
            // Get the final leaderboard with accurate calculations
            const finalLeaderboard = await teamService.getLeaderboard(sessionCode);
            
            // End the session
            await sessionService.endSession(sessionCode);
            
            // Emit session ended event to all participants with accurate leaderboard
            io.to(sessionCode).emit('session-ended', {
              leaderboard: finalLeaderboard
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
