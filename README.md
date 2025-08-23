# Open Pub Quiz

A real-time pub quiz application built with Angular frontend and Node.js backend, featuring live participant interaction, QR code joining, and comprehensive quiz management.

## Features

- **Real-time Quiz Sessions**: Create and manage live quiz sessions with real-time updates
- **QR Code Joining**: Participants can join sessions by scanning QR codes
- **Multiple Question Types**: Support for various question formats (multiple choice, text, numerical, etc.)
- **Live Leaderboard**: Real-time scoring and team rankings
- **Responsive Design**: Works on desktop and mobile devices
- **Session Management**: Comprehensive presenter controls and participant monitoring

## Tech Stack

### Frontend
- **Angular 20**: Modern frontend framework
- **Angular Material**: UI component library
- **Socket.io Client**: Real-time communication
- **QR Code Generation**: For session joining

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Socket.io**: Real-time bidirectional communication
- **TypeORM**: Database ORM
- **MySQL**: Database
- **JWT**: Authentication

### Testing
- **Playwright**: End-to-end testing
- **Jest**: Unit testing
- **Karma**: Frontend testing

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bveldhuis/open-pubquiz.git
cd open-pubquiz
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## Development

### Project Structure

```
open-pubquiz/
├── frontend/          # Angular application
├── backend/           # Node.js API server
├── e2e/              # End-to-end tests
├── scripts/          # Utility scripts
└── docker-compose.yml
```

### Running Tests

#### End-to-End Tests

**Windows (PowerShell):**
```powershell
# Run all E2E tests
.\scripts\run-e2e-tests.ps1

# Run tests in headed mode (see browser)
.\scripts\run-e2e-tests.ps1 -TestMode headed
```

**Linux/macOS (Bash):**
```bash
# Make script executable first
chmod +x scripts/run-e2e-tests.sh

# Run all E2E tests
./scripts/run-e2e-tests.sh
```

#### Unit Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Development Workflow

1. **Start development servers:**
```bash
# Backend (with hot reload)
cd backend
npm run dev

# Frontend (with hot reload)
cd frontend
npm start
```

2. **Database management:**
```bash
# Run migrations
cd backend
npm run migration:run

# Seed database
npm run seed
```

## Testing

The project includes comprehensive testing at multiple levels:

### Unit Tests
- **Backend**: Jest-based tests for services and routes
- **Frontend**: Karma-based tests for components and services

### End-to-End Tests
- **Playwright**: Complete user workflow testing
- **Multi-browser support**: Chrome, Firefox, Safari
- **Mobile testing**: Responsive design validation
- **CI/CD integration**: Automated testing in GitHub Actions

### Test Coverage
- Backend: Unit tests for all services and routes
- Frontend: Component and service testing
- E2E: Complete user journey validation

## Deployment

### Docker Deployment

The application is containerized and ready for deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Configuration

Create environment files for different deployments:

```bash
# Backend
cp backend/env.example backend/.env

# Frontend
cp frontend/environment.example.ts frontend/src/environments/environment.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Development Guidelines

- Follow Angular and Node.js best practices
- Write tests for new features
- Use TypeScript for type safety
- Follow the existing code style
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
