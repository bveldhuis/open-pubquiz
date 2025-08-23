import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Open Pub Quiz API',
      version: '2.0.0',
      description: 'A comprehensive API for managing real-time pub quiz sessions with teams, questions, answers, and theme-based question management.',
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
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for admin authentication'
        }
      },
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
              enum: ['MULTIPLE_CHOICE', 'OPEN_TEXT', 'SEQUENCE', 'TRUE_FALSE', 'NUMERICAL', 'IMAGE', 'AUDIO', 'VIDEO'],
              description: 'Question type'
            },
            question_text: { type: 'string' },
            fun_fact: { type: 'string', nullable: true },
            time_limit: { type: 'integer', minimum: 1, nullable: true },
            points: { type: 'integer', minimum: 1 },
            options: { 
              type: 'array', 
              items: { type: 'string' },
              nullable: true,
              description: 'Options for multiple choice questions'
            },
            correct_answer: { type: 'string', nullable: true },
            sequence_items: { 
              type: 'array', 
              items: { type: 'string' },
              nullable: true,
              description: 'Items to sequence for sequence questions'
            },
            media_url: { 
              type: 'string', 
              format: 'uri',
              nullable: true,
              description: 'URL for media content (image, audio, video)'
            },
            numerical_answer: { 
              type: 'number', 
              nullable: true,
              description: 'Correct numerical answer for numerical questions'
            },
            numerical_tolerance: { 
              type: 'number', 
              nullable: true,
              description: 'Allowed tolerance for numerical answers'
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
        },
        // New schemas for theme management system
        Theme: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: 'Theme name (e.g., "General Knowledge", "Technology")' },
            description: { type: 'string', nullable: true, description: 'Theme description' },
            is_active: { type: 'boolean', description: 'Whether the theme is active' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'name', 'is_active', 'created_at', 'updated_at']
        },
        QuestionSet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            theme_id: { type: 'string', format: 'uuid' },
            type: { 
              type: 'string', 
              enum: ['MULTIPLE_CHOICE', 'OPEN_TEXT', 'SEQUENCE', 'TRUE_FALSE', 'NUMERICAL', 'IMAGE', 'AUDIO', 'VIDEO'],
              description: 'Question type'
            },
            question_text: { type: 'string' },
            fun_fact: { type: 'string', nullable: true },
            time_limit: { type: 'integer', minimum: 1, nullable: true },
            points: { type: 'integer', minimum: 1 },
            options: { 
              type: 'array', 
              items: { type: 'string' },
              nullable: true,
              description: 'Options for multiple choice questions'
            },
            correct_answer: { type: 'string', nullable: true },
            sequence_items: { 
              type: 'array', 
              items: { type: 'string' },
              nullable: true,
              description: 'Items to sequence for sequence questions'
            },
            media_url: { 
              type: 'string', 
              format: 'uri',
              nullable: true,
              description: 'URL for media content (image, audio, video)'
            },
            numerical_answer: { 
              type: 'number', 
              nullable: true,
              description: 'Correct numerical answer for numerical questions'
            },
            numerical_tolerance: { 
              type: 'number', 
              nullable: true,
              description: 'Allowed tolerance for numerical answers'
            },
            difficulty: { 
              type: 'string', 
              enum: ['easy', 'medium', 'hard'],
              description: 'Question difficulty level'
            },
            is_active: { type: 'boolean', description: 'Whether the question is active' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'theme_id', 'type', 'question_text', 'points', 'difficulty', 'is_active', 'created_at', 'updated_at']
        },
        SessionConfiguration: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quiz_session_id: { type: 'string', format: 'uuid' },
            total_rounds: { type: 'integer', minimum: 1 },
            round_configurations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  roundNumber: { type: 'integer', minimum: 1 },
                  themeId: { type: 'string', format: 'uuid' },
                  themeName: { type: 'string' },
                  questionTypes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        enabled: { type: 'boolean' },
                        questionCount: { type: 'integer', minimum: 0 },
                        maxAvailable: { type: 'integer', minimum: 0 }
                      },
                      required: ['type', 'enabled', 'questionCount', 'maxAvailable']
                    }
                  }
                },
                required: ['roundNumber', 'themeId', 'themeName', 'questionTypes']
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'quiz_session_id', 'total_rounds', 'round_configurations', 'created_at', 'updated_at']
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            key_name: { type: 'string', description: 'Human-readable name for the API key' },
            api_key: { type: 'string', description: 'The actual API key (hidden in responses)' },
            permissions: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'List of permissions (e.g., ["themes:read", "questions:write"])'
            },
            is_active: { type: 'boolean', description: 'Whether the API key is active' },
            last_used: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'key_name', 'permissions', 'is_active', 'created_at', 'updated_at']
        },
        ThemeStats: {
          type: 'object',
          properties: {
            totalQuestions: { type: 'integer', minimum: 0 },
            questionsByType: {
              type: 'object',
              additionalProperties: { type: 'integer', minimum: 0 }
            },
            questionsByDifficulty: {
              type: 'object',
              properties: {
                easy: { type: 'integer', minimum: 0 },
                medium: { type: 'integer', minimum: 0 },
                hard: { type: 'integer', minimum: 0 }
              }
            }
          },
          required: ['totalQuestions', 'questionsByType', 'questionsByDifficulty']
        },
        QuestionCounts: {
          type: 'object',
          properties: {
            questionCounts: {
              type: 'object',
              additionalProperties: { type: 'integer', minimum: 0 },
              description: 'Map of question type to count'
            }
          },
          required: ['questionCounts']
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
        Unauthorized: {
          description: 'Unauthorized - API key required or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
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
        name: 'Admin',
        description: 'Admin endpoints for theme and question set management (requires API key)'
      },
      {
        name: 'Session Configuration',
        description: 'Session configuration and question generation endpoints'
      },
      {
        name: 'System',
        description: 'System health and maintenance endpoints'
      }
    ]
  },
  apis: ['./dist/routes/*.js', './dist/index.js']
};

export const specs = swaggerJsdoc(options);
