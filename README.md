# 🎯 Open Pub Quiz

A self-hosted pub quiz web application with real-time updates, multiple question types, and professional UI.

## ✨ Features

- **Real-time Updates**: Live question updates, timers, and leaderboards via Socket.IO
- **Multiple Question Types**: Multiple choice, open text, and drag-and-drop sequence questions
- **QR Code Join**: Participants can join sessions by scanning QR codes
- **Professional UI**: Responsive Angular Material design
- **Timer Support**: Configurable time limits for questions
- **Review Phase**: Display correct answers and participant submissions
- **Fun Facts**: Interesting facts displayed with each question
- **Docker Ready**: Easy deployment with Docker and docker-compose

## 🏗 Architecture

- **Frontend**: Angular PWA with Angular Material
- **Backend**: Node.js + Express + Socket.IO
- **Database**: MySQL with TypeORM
- **Containerization**: Docker + docker-compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)

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

## 📱 Usage

### Presenter Mode
1. Go to http://localhost:4200/presenter
2. Create a new quiz session
3. Share the QR code with participants
4. Control the quiz flow: start questions, show timers, display leaderboard

### Participant Mode
1. Scan the QR code or go to http://localhost:4200/join
2. Enter the session code and team name
3. Answer questions in real-time
4. View leaderboard and review phases

## 🛠 Development

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
