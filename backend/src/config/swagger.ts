import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Open Pub Quiz API',
      version: '1.0.0',
      description: 'A comprehensive API for managing real-time pub quiz sessions with teams, questions, and answers.',
      contact: {
        name: 'Open Pub Quiz Team',
        email: 'support@openpubquiz.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.openpubquiz.com/api',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          },
          required: ['error']
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', pattern: '^[A-Z0-9]{6}$' },
            name: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['WAITING', 'ACTIVE', 'FINISHED'],
              description: 'Current session status'
            },
            current_round: { type: 'integer', minimum: 1 },
            current_question_id: { type: 'string', format: 'uuid', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            teams: {
              type: 'array',
              items: { $ref: '#/components/schemas/Team' }
            }
          },
          required: ['id', 'code', 'name', 'status', 'current_round', 'created_at', 'updated_at']
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            session_code: { type: 'string' },
            total_points: { type: 'integer', minimum: 0 },
            joined_at: { type: 'string', format: 'date-time' },
            last_activity: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'name', 'session_code', 'total_points', 'joined_at']
        },
        Question: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            session_code: { type: 'string' },
            round_number: { type: 'integer', minimum: 1 },
            question_number: { type: 'integer', minimum: 1 },
            type: { 
              type: 'string', 
              enum: ['MULTIPLE_CHOICE', 'OPEN_TEXT', 'SEQUENCE'],
              description: 'Question type'
            },
            question_text: { type: 'string' },
            fun_fact: { type: 'string', nullable: true },
            time_limit: { type: 'integer', minimum: 1, nullable: true },
            points: { type: 'integer', minimum: 1 },
            options: { 
              type: 'array', 
              items: { type: 'string' },
              nullable: true
            },
            correct_answer: { type: 'string', nullable: true },
            sequence_items: { 
              type: 'array', 
              items: { type: 'string' },
              nullable: true
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'session_code', 'round_number', 'question_number', 'type', 'question_text', 'points']
        },
        Answer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            question_id: { type: 'string', format: 'uuid' },
            team_id: { type: 'string', format: 'uuid' },
            answer_text: { type: 'string' },
            is_correct: { type: 'boolean' },
            points_awarded: { type: 'integer', minimum: 0 },
            submitted_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'question_id', 'team_id', 'answer_text', 'is_correct', 'points_awarded', 'submitted_at']
        },
        SessionStatus: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['WAITING', 'ACTIVE', 'FINISHED']
            },
            currentRound: { type: 'integer', minimum: 1 },
            currentQuestionId: { type: 'string', format: 'uuid', nullable: true },
            teamCount: { type: 'integer', minimum: 0 }
          },
          required: ['status', 'currentRound', 'teamCount']
        },
        Leaderboard: {
          type: 'object',
          properties: {
            teams: {
              type: 'array',
              items: { $ref: '#/components/schemas/Team' }
            }
          },
          required: ['teams']
        },
        SessionEvent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            session_code: { type: 'string' },
            event_type: { 
              type: 'string', 
              enum: ['SESSION_CREATED', 'TEAM_JOINED', 'TEAM_LEFT', 'QUESTION_STARTED', 'QUESTION_ENDED', 'ANSWER_SUBMITTED', 'ROUND_STARTED', 'SESSION_ENDED']
            },
            event_data: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'session_code', 'event_type', 'created_at']
        },
        CleanupStats: {
          type: 'object',
          properties: {
            totalSessions: { type: 'integer', minimum: 0 },
            activeSessions: { type: 'integer', minimum: 0 },
            inactiveSessions: { type: 'integer', minimum: 0 },
            sessionsToCleanup: { type: 'integer', minimum: 0 }
          },
          required: ['totalSessions', 'activeSessions', 'inactiveSessions', 'sessionsToCleanup']
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        TooManyRequests: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Sessions',
        description: 'Quiz session management endpoints'
      },
      {
        name: 'Teams',
        description: 'Team management endpoints'
      },
      {
        name: 'Questions',
        description: 'Question management endpoints'
      },
      {
        name: 'Answers',
        description: 'Answer submission and management endpoints'
      },
      {
        name: 'System',
        description: 'System health and maintenance endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/index.ts']
};

export const specs = swaggerJsdoc(options);
