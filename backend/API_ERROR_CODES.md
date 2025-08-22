# API Error Codes Documentation

This document provides a comprehensive list of all error codes and responses that can be returned by the Open Pub Quiz API.

## HTTP Status Codes

### 2xx Success
- **200 OK**: Request completed successfully
- **201 Created**: Resource created successfully

### 4xx Client Errors
- **400 Bad Request**: Invalid request data or parameters
- **401 Unauthorized**: Authentication required or invalid credentials
- **403 Forbidden**: Insufficient permissions for the requested operation
- **404 Not Found**: Requested resource not found
- **429 Too Many Requests**: Rate limit exceeded

### 5xx Server Errors
- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily unavailable

## Error Response Format

All error responses follow this standard format:

```json
{
  "error": "Human-readable error message"
}
```

## Detailed Error Codes

### 400 Bad Request

#### Missing Required Fields
```json
{
  "error": "Session name is required"
}
```
**Cause**: Required field is missing from request body
**Solution**: Include all required fields in the request

#### Invalid Question Type
```json
{
  "error": "Invalid question type"
}
```
**Cause**: Question type is not one of the allowed values
**Solution**: Use one of: `MULTIPLE_CHOICE`, `OPEN_TEXT`, `SEQUENCE`, `TRUE_FALSE`, `NUMERICAL`, `IMAGE`, `AUDIO`, `VIDEO`

#### Invalid Multiple Choice Question
```json
{
  "error": "Multiple choice questions require at least 2 options"
}
```
**Cause**: Multiple choice question has insufficient options
**Solution**: Provide at least 2 options for multiple choice questions

#### Invalid Sequence Question
```json
{
  "error": "Sequence questions require at least 2 items"
}
```
**Cause**: Sequence question has insufficient items
**Solution**: Provide at least 2 items for sequence questions

#### Invalid Points Value
```json
{
  "error": "Points must be a number"
}
```
**Cause**: Points field is not a valid number
**Solution**: Provide a valid integer for points

#### Invalid Answer Data
```json
{
  "error": "Question ID, team ID, and answer are required"
}
```
**Cause**: Missing required fields for answer submission
**Solution**: Include questionId, teamId, and answer in request

#### Invalid Session Code Format
```json
{
  "error": "Session code must be 6 characters long"
}
```
**Cause**: Session code doesn't match required format
**Solution**: Use a 6-character alphanumeric session code

#### Invalid Theme Configuration
```json
{
  "error": "Theme name is required"
}
```
**Cause**: Theme name is missing from request
**Solution**: Include a theme name in the request

#### Invalid Question Set Data
```json
{
  "error": "Question text is required"
}
```
**Cause**: Required question set field is missing
**Solution**: Include all required fields for question sets

#### Invalid Session Configuration
```json
{
  "error": "At least one question type must be enabled per round"
}
```
**Cause**: No question types are enabled for a round
**Solution**: Enable at least one question type per round

#### Insufficient Questions Available
```json
{
  "error": "Not enough questions available for type MULTIPLE_CHOICE. Available: 3, Requested: 5"
}
```
**Cause**: Requested question count exceeds available questions
**Solution**: Reduce the requested question count or add more questions to the theme

#### Invalid Difficulty Level
```json
{
  "error": "Invalid difficulty level"
}
```
**Cause**: Difficulty is not one of the allowed values
**Solution**: Use one of: `easy`, `medium`, `hard`

### 401 Unauthorized

#### API Key Missing
```json
{
  "error": "API key is required"
}
```
**Cause**: API key header is missing from request
**Solution**: Include `X-API-Key` header with valid API key

#### Invalid API Key
```json
{
  "error": "Invalid or inactive API key"
}
```
**Cause**: API key is invalid or has been deactivated
**Solution**: Use a valid, active API key

### 403 Forbidden

#### Insufficient Permissions
```json
{
  "error": "Permission 'themes:write' required"
}
```
**Cause**: API key doesn't have required permission
**Solution**: Use an API key with the required permission

#### Theme Management Permission Required
```json
{
  "error": "Permission 'themes:read' required"
}
```
**Cause**: API key lacks theme read permission
**Solution**: Use an API key with `themes:read` permission

#### Question Management Permission Required
```json
{
  "error": "Permission 'questions:write' required"
}
```
**Cause**: API key lacks question write permission
**Solution**: Use an API key with `questions:write` permission

### 404 Not Found

#### Session Not Found
```json
{
  "error": "Session not found"
}
```
**Cause**: Session with the provided code doesn't exist
**Solution**: Verify the session code is correct and the session exists

#### Question Not Found
```json
{
  "error": "Question not found"
}
```
**Cause**: Question with the provided ID doesn't exist
**Solution**: Verify the question ID is correct

#### Team Not Found
```json
{
  "error": "Team not found"
}
```
**Cause**: Team with the provided ID doesn't exist
**Solution**: Verify the team ID is correct

#### Answer Not Found
```json
{
  "error": "Answer not found"
}
```
**Cause**: Answer with the provided ID doesn't exist
**Solution**: Verify the answer ID is correct

#### Theme Not Found
```json
{
  "error": "Theme not found"
}
```
**Cause**: Theme with the provided ID doesn't exist
**Solution**: Verify the theme ID is correct

#### Question Set Not Found
```json
{
  "error": "Question set not found"
}
```
**Cause**: Question set with the provided ID doesn't exist
**Solution**: Verify the question set ID is correct

#### Session Configuration Not Found
```json
{
  "error": "Session configuration not found"
}
```
**Cause**: Session configuration doesn't exist for the session
**Solution**: Configure the session first using the session configuration endpoint

#### Round Configuration Not Found
```json
{
  "error": "Round configuration not found for round 1"
}
```
**Cause**: Round configuration doesn't exist for the specified round
**Solution**: Verify the round number and session configuration

### 429 Too Many Requests

#### Rate Limit Exceeded
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```
**Cause**: API rate limit exceeded
**Solution**: Wait before making additional requests (default: 100 requests per 15 minutes)

### 500 Internal Server Error

#### Database Connection Error
```json
{
  "error": "Failed to create session"
}
```
**Cause**: Database connection or query failed
**Solution**: Check server logs and database connectivity

#### Service Error
```json
{
  "error": "Failed to submit answer"
}
```
**Cause**: Internal service error
**Solution**: Check server logs and try again later

#### Theme Creation Error
```json
{
  "error": "Failed to create theme"
}
```
**Cause**: Database error during theme creation
**Solution**: Check server logs and database connectivity

#### Question Generation Error
```json
{
  "error": "Failed to generate questions for round"
}
```
**Cause**: Error during question generation process
**Solution**: Check server logs and verify session configuration

### 503 Service Unavailable

#### Health Check Failed
```json
{
  "status": "ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": {
    "connected": false,
    "migrationsUpToDate": false,
    "error": "Connection timeout"
  }
}
```
**Cause**: Database connection failed or migrations are out of date
**Solution**: Check database connectivity and migration status

## Validation Rules

### Session Code
- **Format**: 6 characters, alphanumeric (A-Z, 0-9)
- **Pattern**: `^[A-Z0-9]{6}$`
- **Example**: `ABC123`

### UUID Fields
- **Format**: Standard UUID v4 format
- **Pattern**: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
- **Example**: `123e4567-e89b-12d3-a456-426614174000`

### Numeric Fields
- **Points**: Integer ≥ 0
- **Time Limit**: Integer ≥ 1 (in seconds)
- **Round Number**: Integer ≥ 1
- **Question Number**: Integer ≥ 1
- **Question Count**: Integer ≥ 0

### Array Fields
- **Options**: Array of strings, minimum 2 items for multiple choice
- **Sequence Items**: Array of strings, minimum 2 items for sequence questions
- **Permissions**: Array of strings (e.g., `["themes:read", "questions:write"]`)

### Theme Fields
- **Name**: String, unique, required
- **Description**: String, optional
- **Is Active**: Boolean, defaults to true

### Question Set Fields
- **Type**: One of the supported question types
- **Difficulty**: `easy`, `medium`, or `hard`
- **Is Active**: Boolean, defaults to true

### Session Configuration Fields
- **Total Rounds**: Integer ≥ 1
- **Round Configurations**: Array of round configuration objects
- **Question Types**: At least one enabled per round

## Best Practices

### Error Handling
1. Always check the HTTP status code first
2. Parse the error message for user-friendly display
3. Log detailed error information for debugging
4. Implement retry logic for 5xx errors
5. Respect rate limits and implement exponential backoff
6. Handle authentication errors appropriately

### Request Validation
1. Validate all required fields before sending
2. Ensure data types match expected formats
3. Check field constraints (min/max values, patterns)
4. Handle validation errors gracefully in your application
5. Verify API key permissions before making requests

### Rate Limiting
1. Monitor your request frequency
2. Implement caching where appropriate
3. Use bulk endpoints for multiple operations
4. Consider implementing request queuing for high-volume scenarios

### Authentication
1. Store API keys securely
2. Use appropriate permissions for different operations
3. Rotate API keys regularly
4. Monitor API key usage

## Troubleshooting

### Common Issues

1. **Session Code Not Working**
   - Verify the session exists and is active
   - Check for typos in the session code
   - Ensure the session hasn't expired

2. **Question Creation Fails**
   - Verify all required fields are present
   - Check question type-specific requirements
   - Ensure session code is valid

3. **Answer Submission Fails**
   - Verify question and team IDs are correct
   - Check answer format matches question type
   - Ensure the question is currently active

4. **Database Connection Issues**
   - Check database server status
   - Verify connection credentials
   - Check network connectivity

5. **API Key Authentication Fails**
   - Verify API key is correct and active
   - Check API key has required permissions
   - Ensure API key is included in request headers

6. **Theme Management Issues**
   - Verify API key has appropriate permissions
   - Check theme name uniqueness
   - Ensure all required fields are provided

7. **Session Configuration Issues**
   - Verify session exists before configuration
   - Check question availability in selected themes
   - Ensure at least one question type is enabled per round

### Debugging Tips

1. **Enable Detailed Logging**
   - Set `NODE_ENV=development` for detailed error messages
   - Check server logs for stack traces

2. **Use Health Endpoint**
   - Monitor `/health` endpoint for system status
   - Check database connectivity and migration status

3. **Validate Request Data**
   - Use the interactive API documentation to test endpoints
   - Verify request format matches API specification

4. **Check API Key Status**
   - Verify API key is active and has required permissions
   - Check API key usage logs

## Support

For additional support:
- Check the interactive API documentation at `/api/docs`
- Review server logs for detailed error information
- Contact support with error details and request context
- Refer to [THEME_MANAGEMENT.md](THEME_MANAGEMENT.md) for theme management specific issues
