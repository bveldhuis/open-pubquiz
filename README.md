# 🎯 Open Pub Quiz

A comprehensive, self-hosted pub quiz application that transforms traditional pub quizzes into an interactive, digital experience with real-time updates, 8 different question types, and professional presenter controls.

## ✨ Features

### 🎮 Interactive Quiz Experience
- **Real-time Updates**: Live question updates, timers, and leaderboards via Socket.IO
- **8 Question Types**: Multiple choice, open text, sequence (drag-and-drop), true/false, numerical, image, audio, and video questions
- **QR Code Join**: Participants can join sessions by scanning QR codes
- **Timer Support**: Configurable time limits for questions with visual countdown
- **Fun Facts**: Educational tidbits displayed with each question

### 🎯 Presenter Controls
- **Professional Interface**: Complete control over quiz flow and participant management
- **Live Scoring**: Real-time scoring with automatic and manual scoring options
- **Review Phase**: Display correct answers and participant submissions after each question
- **Multi-Round Support**: Organize questions into rounds with different themes
- **Session Management**: Create, manage, and archive quiz sessions

### 📱 User Experience
- **Responsive Design**: Professional UI that works on desktop, tablet, and mobile
- **Team Management**: Support for multiple teams with real-time join/leave functionality
- **Live Leaderboards**: Real-time scoring updates and team rankings
- **Auto & Manual Scoring**: Automatic scoring for objective questions, manual override for subjective answers

### 🏗 Architecture

- **Frontend**: Angular PWA with Angular Material
- **Backend**: Node.js + Express + Socket.IO
- **Database**: MySQL with TypeORM
- **Containerization**: Docker + docker-compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 22+ (for development)

### API Documentation
The Open Pub Quiz API is fully documented with:
- **Interactive Swagger UI**: Available at `/api/docs` when the server is running
- **Comprehensive Documentation**: See [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
- **Error Codes Reference**: See [API_ERROR_CODES.md](backend/API_ERROR_CODES.md)
- **Health Check**: Available at `/health` endpoint

### Running with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd open-pubquiz
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

### Development Setup

1. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

2. Set up the database:
```bash
# Create .env file in backend directory
cp backend/.env.example backend/.env
# Edit the database configuration
```

3. Run the application:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Running Tests Locally

#### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

#### Frontend Tests
```bash
cd frontend
npm test                   # Run all tests
npm test -- --watch       # Run tests in watch mode
npm test -- --coverage    # Run tests with coverage report
```

## 📱 Usage

### Presenter Mode
1. Go to http://localhost:4200/presenter
2. Create a new quiz session with custom configuration
3. Share the QR code with participants
4. Control the quiz flow: start questions, show timers, display leaderboard
5. Review answers and manually score subjective responses
6. Manage rounds and end sessions

### Participant Mode
1. Scan the QR code or go to http://localhost:4200/join
2. Enter the session code and team name
3. Answer questions in real-time with various formats
4. View live leaderboard and review phases
5. See fun facts and educational content

## 🛠 Development

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

#### Pull Request Checks
When a PR is created against the `main` branch, the following checks run automatically:
- **Backend Unit Tests**: Runs Jest tests with MySQL test database
- **Frontend Unit Tests**: Runs Angular tests with code coverage
- **Lint Checks**: Validates code style for both frontend and backend
- **Build Validation**: Ensures both applications build successfully
- **Docker Build Validation**: Verifies Docker images can be built (without pushing)

#### Main Branch Deployment
When code is merged to `main`, the following additional steps run:
- **Docker Image Building**: Builds and pushes Docker images to GitHub Container Registry
- **Image Tagging**: Tags images as `latest` for production deployment

### Technology Stack
- **Node.js**: 22.x
- **Angular**: 20.x
- **Express**: 4.18.2
- **MySQL**: 8.4
- **TypeScript**: 5.8.x
- **Docker**: Latest Alpine images

### Project Structure
```
open-pubquiz/
├── frontend/          # Angular PWA application
├── backend/           # Node.js Express server
│   └── HEALTH_ENDPOINT.md # Health endpoint documentation
├── docker-compose.yml # Docker orchestration
└── README.md         # This file
```

### Adding Questions
Questions are stored in the MySQL database. You can add them via:
- API endpoints (POST /api/questions)
- Database seeding scripts
- Admin interface (future enhancement)

### Customization
- **Theming**: Modify Angular Material theme in `frontend/src/styles/`
- **Question Types**: Extend the question type system in the backend
- **UI Components**: Customize Angular Material components

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🐛 Issues

Please report bugs and feature requests through the GitHub issues page.
