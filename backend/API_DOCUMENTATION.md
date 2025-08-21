# Open Pub Quiz API Documentation

Welcome to the Open Pub Quiz API documentation! This API provides a comprehensive set of endpoints for managing real-time pub quiz sessions, including teams, questions, answers, and session management.

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

### 🔧 System
Monitor system health and perform maintenance tasks.

**Key Endpoints:**
- `GET /health` - System health check
- `GET /quiz/cleanup/stats` - Get cleanup statistics
- `POST /quiz/cleanup/run` - Run cleanup process

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible. Future versions may include authentication mechanisms.

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
  "type": "MULTIPLE_CHOICE|OPEN_TEXT|SEQUENCE",
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
4. Start the server: `npm run dev`
5. Access documentation at `http://localhost:3000/api/docs`

### Testing
- Use the interactive documentation for endpoint testing
- Check the health endpoint for system status
- Monitor server logs for debugging

## Support

- **Interactive Documentation**: `/api/docs`
- **Error Codes**: [API_ERROR_CODES.md](API_ERROR_CODES.md)
- **Health Check**: `/health`
- **GitHub Issues**: Report bugs and feature requests

## Versioning

The API follows semantic versioning. Current version: **1.0.0**

Breaking changes will be communicated in advance and documented in release notes.

## License

This API is part of the Open Pub Quiz project and is licensed under the MIT License.
