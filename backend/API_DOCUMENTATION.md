# Open Pub Quiz API Documentation

Welcome to the Open Pub Quiz API documentation! This API provides a comprehensive set of endpoints for managing real-time pub quiz sessions, including teams, questions, answers, theme-based question management, and session configuration.

## Quick Start

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.openpubquiz.com/api`

### Interactive Documentation
Access the interactive Swagger UI documentation at: `/api/docs`

### Health Check
Check API status at: `/health`

## API Overview

The Open Pub Quiz API is organized into the following main areas:

### 🎯 Sessions
Manage quiz sessions, including creation, status updates, and session flow control.

**Key Endpoints:**
- `POST /quiz` - Create a new session
- `GET /quiz/{code}` - Get session details
- `PATCH /quiz/{code}/status` - Update session status
- `POST /quiz/{code}/start-question` - Start a question
- `POST /quiz/{code}/end-question` - End current question
- `GET /quiz/{code}/leaderboard` - Get session leaderboard

### 👥 Teams
Handle team registration, management, and scoring.

**Key Endpoints:**
- `POST /teams/join` - Join a session as a team
- `GET /teams/{id}` - Get team details
- `PATCH /teams/{id}/points` - Update team points
- `GET /teams/session/{sessionCode}` - Get all teams in a session

### ❓ Questions
Create and manage quiz questions with different types.

**Key Endpoints:**
- `POST /questions` - Create a question
- `GET /questions/session/{sessionCode}` - Get session questions
- `PUT /questions/{id}` - Update a question
- `POST /questions/bulk` - Create multiple questions

### ✅ Answers
Submit and manage team answers with automatic scoring.

**Key Endpoints:**
- `POST /answers` - Submit an answer
- `GET /answers/question/{questionId}` - Get answers for a question
- `PATCH /answers/{id}/score` - Manually score an answer

### 🎨 Themes & Question Sets (Admin)
Manage themes and predefined question sets for quiz sessions.

**Key Endpoints:**
- `GET /admin/themes` - Get all themes
- `POST /admin/themes` - Create a new theme
- `PUT /admin/themes/{id}` - Update a theme
- `GET /admin/themes/{id}/questions` - Get questions for a theme
- `POST /admin/themes/{id}/questions` - Add questions to a theme
- `PUT /admin/themes/{themeId}/questions/{questionId}` - Update a question
- `DELETE /admin/themes/{themeId}/questions/{questionId}` - Delete a question
- `GET /admin/themes/{id}/stats` - Get theme statistics

### ⚙️ Session Configuration
Configure quiz sessions with themes and question types.

**Key Endpoints:**
- `GET /session-config/themes` - Get available themes
- `GET /session-config/themes/{themeId}/question-counts` - Get question counts by type
- `POST /session-config/configure` - Configure a session
- `GET /session-config/{sessionCode}` - Get session configuration
- `POST /session-config/{sessionCode}/generate-questions/{roundNumber}` - Generate questions for a round

### 🔧 System
Monitor system health and perform maintenance tasks.

**Key Endpoints:**
- `GET /health` - System health check
- `GET /quiz/cleanup/stats` - Get cleanup statistics
- `POST /quiz/cleanup/run` - Run cleanup process

## Authentication

### API Key Authentication (Admin Endpoints)
Admin endpoints require API key authentication for security:

**Header**: `X-API-Key: your-api-key-here`

**Permissions**: API keys can have specific permissions:
- `themes:read` - Read theme information
- `themes:write` - Create/update themes
- `questions:read` - Read question sets
- `questions:write` - Create/update question sets

**Example**:
```bash
curl -X GET http://localhost:3000/api/admin/themes \
  -H "X-API-Key: your-api-key-here"
```

### Public Endpoints
Most endpoints (sessions, teams, questions, answers, session configuration) are publicly accessible and do not require authentication.

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status code when limit is exceeded

## Data Models

### Session
```json
{
  "id": "uuid",
  "code": "ABC123",
  "name": "Friday Night Quiz",
  "status": "WAITING|ACTIVE|FINISHED",
  "current_round": 1,
  "current_question_id": "uuid|null",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z",
  "teams": [...]
}
```

### Question
```json
{
  "id": "uuid",
  "session_code": "ABC123",
  "round_number": 1,
  "question_number": 1,
  "type": "MULTIPLE_CHOICE|OPEN_TEXT|SEQUENCE|TRUE_FALSE|NUMERICAL|IMAGE|AUDIO|VIDEO",
  "question_text": "What is the capital of France?",
  "fun_fact": "Paris has been the capital since 987 CE",
  "time_limit": 30,
  "points": 10,
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correct_answer": "Paris",
  "sequence_items": ["First", "Second", "Third"],
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Team
```json
{
  "id": "uuid",
  "name": "The Quiz Masters",
  "session_code": "ABC123",
  "total_points": 150,
  "joined_at": "2024-01-15T10:30:00.000Z",
  "last_activity": "2024-01-15T11:30:00.000Z"
}
```

### Answer
```json
{
  "id": "uuid",
  "question_id": "uuid",
  "team_id": "uuid",
  "answer_text": "Paris",
  "is_correct": true,
  "points_awarded": 10,
  "submitted_at": "2024-01-15T10:35:00.000Z"
}
```

### Theme
```json
{
  "id": "uuid",
  "name": "General Knowledge",
  "description": "General knowledge questions covering various topics",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### QuestionSet
```json
{
  "id": "uuid",
  "theme_id": "uuid",
  "type": "MULTIPLE_CHOICE",
  "question_text": "What is the capital of France?",
  "fun_fact": "Paris has been the capital since 987 CE",
  "time_limit": 30,
  "points": 10,
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correct_answer": "Paris",
  "difficulty": "medium",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### SessionConfiguration
```json
{
  "id": "uuid",
  "quiz_session_id": "uuid",
  "total_rounds": 3,
  "round_configurations": [
    {
      "roundNumber": 1,
      "themeId": "uuid",
      "themeName": "General Knowledge",
      "questionTypes": [
        {
          "type": "MULTIPLE_CHOICE",
          "enabled": true,
          "questionCount": 5,
          "maxAvailable": 10
        },
        {
          "type": "OPEN_TEXT",
          "enabled": true,
          "questionCount": 3,
          "maxAvailable": 8
        }
      ]
    }
  ],
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

## Question Types

### Multiple Choice
- **Type**: `MULTIPLE_CHOICE`
- **Answer Format**: Integer (0-based index)
- **Required Fields**: `options`, `correctAnswer`
- **Example**: `{"answer": 1}` (selects "Paris" from options)

### Open Text
- **Type**: `OPEN_TEXT`
- **Answer Format**: String
- **Required Fields**: `correctAnswer`
- **Example**: `{"answer": "Paris"}`

### Sequence
- **Type**: `SEQUENCE`
- **Answer Format**: Array of integers (order indices)
- **Required Fields**: `sequenceItems`
- **Example**: `{"answer": [2, 0, 1, 3]}` (reorders items)

### True/False
- **Type**: `TRUE_FALSE`
- **Answer Format**: Boolean
- **Required Fields**: `correctAnswer`
- **Example**: `{"answer": true}`

### Numerical
- **Type**: `NUMERICAL`
- **Answer Format**: Number
- **Required Fields**: `numericalAnswer`, `numericalTolerance`
- **Example**: `{"answer": 42}`

### Image/Audio/Video
- **Types**: `IMAGE`, `AUDIO`, `VIDEO`
- **Answer Format**: String (text answer)
- **Required Fields**: `mediaUrl`, `correctAnswer`
- **Example**: `{"answer": "Eiffel Tower"}`

## Real-time Features

The API supports real-time communication via Socket.IO for:
- Question start/end notifications
- Answer submissions
- Leaderboard updates
- Session status changes

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message"
}
```

Common HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (API key required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limit)
- **500**: Internal Server Error
- **503**: Service Unavailable

For detailed error information, see [API Error Codes](API_ERROR_CODES.md).

## Examples

### Creating a Session
```bash
curl -X POST http://localhost:3000/api/quiz \
  -H "Content-Type: application/json" \
  -d '{"name": "Friday Night Quiz"}'
```

### Joining a Team
```bash
curl -X POST http://localhost:3000/api/teams/join \
  -H "Content-Type: application/json" \
  -d '{"sessionCode": "ABC123", "teamName": "The Quiz Masters"}'
```

### Creating a Theme (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/themes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"name": "Technology", "description": "Tech-related questions"}'
```

### Adding Questions to a Theme (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/themes/theme-id/questions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "questions": [
      {
        "type": "MULTIPLE_CHOICE",
        "question_text": "What year was the first iPhone released?",
        "options": ["2005", "2007", "2009", "2010"],
        "correct_answer": "2007",
        "points": 10,
        "difficulty": "medium"
      }
    ]
  }'
```

### Configuring a Session
```bash
curl -X POST http://localhost:3000/api/session-config/configure \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "ABC123",
    "totalRounds": 3,
    "roundConfigurations": [
      {
        "roundNumber": 1,
        "themeId": "theme-uuid",
        "questionTypes": [
          {"type": "MULTIPLE_CHOICE", "enabled": true, "questionCount": 5},
          {"type": "OPEN_TEXT", "enabled": true, "questionCount": 3}
        ]
      }
    ]
  }'
```

### Generating Questions for a Round
```bash
curl -X POST http://localhost:3000/api/session-config/ABC123/generate-questions/1 \
  -H "Content-Type: application/json"
```

### Creating a Question
```bash
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "ABC123",
    "roundNumber": 1,
    "questionNumber": 1,
    "type": "MULTIPLE_CHOICE",
    "questionText": "What is the capital of France?",
    "points": 10,
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "Paris"
  }'
```

### Submitting an Answer
```bash
curl -X POST http://localhost:3000/api/answers \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": "123e4567-e89b-12d3-a456-426614174000",
    "teamId": "456e7890-e89b-12d3-a456-426614174000",
    "answer": 1
  }'
```

## Best Practices

### Session Management
1. Create sessions with descriptive names
2. Monitor session status and handle state transitions
3. Use session events for audit trails
4. Clean up inactive sessions regularly

### Theme Management
1. Create themes with clear, descriptive names
2. Organize questions by difficulty levels
3. Ensure each theme has a good variety of question types
4. Use bulk operations for adding multiple questions

### Session Configuration
1. Configure sessions before participants join
2. Validate question availability before configuration
3. Use appropriate question counts per round
4. Test configurations with sample data

### Question Design
1. Use appropriate question types for different content
2. Set reasonable time limits
3. Provide fun facts for engagement
4. Use bulk creation for multiple questions

### Answer Handling
1. Validate answer formats before submission
2. Handle automatic and manual scoring appropriately
3. Monitor answer patterns for insights
4. Implement answer review workflows

### Security
1. Keep API keys secure and rotate regularly
2. Use appropriate permissions for different API keys
3. Monitor API key usage
4. Implement rate limiting for admin endpoints

### Performance
1. Use pagination for large datasets
2. Implement caching for frequently accessed data
3. Monitor rate limits and optimize request patterns
4. Use bulk operations when possible

## Development

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database setup: `npm run setup:db`
5. Create API key: `npm run create:api-key`
6. Start the server: `npm run dev`
7. Access documentation at `http://localhost:3000/api/docs`

### Testing
- Use the interactive documentation for endpoint testing
- Check the health endpoint for system status
- Monitor server logs for debugging
- Test admin endpoints with API key authentication

## Support

- **Interactive Documentation**: `/api/docs`
- **Error Codes**: [API_ERROR_CODES.md](API_ERROR_CODES.md)
- **Health Check**: `/health`
- **Theme Management**: [THEME_MANAGEMENT.md](THEME_MANAGEMENT.md)
- **GitHub Issues**: Report bugs and feature requests

## Versioning

The API follows semantic versioning. Current version: **2.0.0**

Breaking changes will be communicated in advance and documented in release notes.

## License

This API is part of the Open Pub Quiz project and is licensed under the MIT License.
