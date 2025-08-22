import { Question, QuestionType } from '../entities/Question';
import { Team } from '../entities/Team';
import { QuizSession, QuizSessionStatus } from '../entities/QuizSession';
import { Answer } from '../entities/Answer';
import { SessionEvent, EventType } from '../entities/SessionEvent';

describe('Entity Models', () => {
  describe('QuestionType Enum', () => {
    it('should have all expected question types', () => {
      expect(QuestionType.MULTIPLE_CHOICE).toBe('multiple_choice');
      expect(QuestionType.OPEN_TEXT).toBe('open_text');
      expect(QuestionType.SEQUENCE).toBe('sequence');
      expect(QuestionType.TRUE_FALSE).toBe('true_false');
      expect(QuestionType.NUMERICAL).toBe('numerical');
      expect(QuestionType.IMAGE).toBe('image');
      expect(QuestionType.AUDIO).toBe('audio');
      expect(QuestionType.VIDEO).toBe('video');
    });

    it('should contain exactly 8 question types', () => {
      const questionTypes = Object.values(QuestionType);
      expect(questionTypes).toHaveLength(8);
    });
  });

  describe('QuizSessionStatus Enum', () => {
    it('should have all expected session statuses', () => {
      expect(QuizSessionStatus.WAITING).toBe('waiting');
      expect(QuizSessionStatus.ACTIVE).toBe('active');
      expect(QuizSessionStatus.PAUSED).toBe('paused');
      expect(QuizSessionStatus.FINISHED).toBe('finished');
    });

    it('should contain exactly 4 session statuses', () => {
      const sessionStatuses = Object.values(QuizSessionStatus);
      expect(sessionStatuses).toHaveLength(4); // includes PAUSED
    });
  });

  describe('EventType Enum', () => {
    it('should have all expected event types', () => {
      expect(EventType.SESSION_CREATED).toBe('session_created');
      expect(EventType.SESSION_ENDED).toBe('session_ended');
      expect(EventType.QUESTION_STARTED).toBe('question_started');
      expect(EventType.QUESTION_ENDED).toBe('question_ended');
      expect(EventType.ROUND_STARTED).toBe('round_started');
      expect(EventType.ROUND_ENDED).toBe('round_ended');
      expect(EventType.START_QUESTION).toBe('start_question');
      expect(EventType.END_QUESTION).toBe('end_question');
      expect(EventType.SHOW_LEADERBOARD).toBe('show_leaderboard');
      expect(EventType.SHOW_REVIEW).toBe('show_review');
      expect(EventType.NEXT_ROUND).toBe('next_round');
    });

    it('should contain exactly 11 event types', () => {
      const eventTypes = Object.values(EventType);
      expect(eventTypes).toHaveLength(11);
    });
  });

  describe('Entity Instantiation', () => {
    it('should create Question entity without errors', () => {
      expect(() => new Question()).not.toThrow();
      const question = new Question();
      expect(question).toBeInstanceOf(Question);
    });

    it('should create Team entity without errors', () => {
      expect(() => new Team()).not.toThrow();
      const team = new Team();
      expect(team).toBeInstanceOf(Team);
    });

    it('should create QuizSession entity without errors', () => {
      expect(() => new QuizSession()).not.toThrow();
      const session = new QuizSession();
      expect(session).toBeInstanceOf(QuizSession);
    });

    it('should create Answer entity without errors', () => {
      expect(() => new Answer()).not.toThrow();
      const answer = new Answer();
      expect(answer).toBeInstanceOf(Answer);
    });

    it('should create SessionEvent entity without errors', () => {
      expect(() => new SessionEvent()).not.toThrow();
      const event = new SessionEvent();
      expect(event).toBeInstanceOf(SessionEvent);
    });
  });

  describe('Entity Type Safety', () => {
    it('should accept valid question types', () => {
      const question = new Question();
      
      // Test each question type can be assigned
      Object.values(QuestionType).forEach(type => {
        expect(() => {
          question.type = type;
        }).not.toThrow();
      });
    });

    it('should accept valid session statuses', () => {
      const session = new QuizSession();
      
      // Test each status can be assigned
      Object.values(QuizSessionStatus).forEach(status => {
        expect(() => {
          session.status = status;
        }).not.toThrow();
      });
    });

    it('should accept valid event types', () => {
      const event = new SessionEvent();
      
      // Test each event type can be assigned
      Object.values(EventType).forEach(eventType => {
        expect(() => {
          event.event_type = eventType;
        }).not.toThrow();
      });
    });
  });

  describe('Property Assignment', () => {
    it('should allow property assignment on Question', () => {
      const question = new Question();
      
      expect(() => {
        question.question_text = 'Test question';
        question.type = QuestionType.OPEN_TEXT;
        question.points = 5;
        question.options = ['A', 'B', 'C', 'D'];
        question.sequence_items = ['First', 'Second', 'Third'];
      }).not.toThrow();

      expect(question.question_text).toBe('Test question');
      expect(question.type).toBe(QuestionType.OPEN_TEXT);
      expect(question.points).toBe(5);
      expect(Array.isArray(question.options)).toBe(true);
      expect(Array.isArray(question.sequence_items)).toBe(true);
    });

    it('should allow property assignment on Team', () => {
      const team = new Team();
      
      expect(() => {
        team.name = 'Test Team';
        team.total_points = 10;
        team.quiz_session_id = 'session-1';
      }).not.toThrow();

      expect(team.name).toBe('Test Team');
      expect(team.total_points).toBe(10);
      expect(team.quiz_session_id).toBe('session-1');
    });

    it('should allow property assignment on QuizSession', () => {
      const session = new QuizSession();
      
      expect(() => {
        session.name = 'Test Session';
        session.code = 'ABC123';
        session.status = QuizSessionStatus.ACTIVE;
        session.current_round = 2;
      }).not.toThrow();

      expect(session.name).toBe('Test Session');
      expect(session.code).toBe('ABC123');
      expect(session.status).toBe(QuizSessionStatus.ACTIVE);
      expect(session.current_round).toBe(2);
    });
  });
});