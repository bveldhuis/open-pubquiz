import request from 'supertest';
import express from 'express';
import { ServiceFactory } from '../services/ServiceFactory';

// Mock the entire ServiceFactory module
jest.mock('../services/ServiceFactory');

// Create mocks for services
const mockSessionService = {
  joinSession: jest.fn(),
  getSessionByCodeOrThrow: jest.fn(),
};

const mockTeamService = {
  createTeamService: jest.fn().mockReturnValue({}),
  getTeamById: jest.fn(),
  getTeamByIdOrThrow: jest.fn(),
  deleteTeam: jest.fn(),
  getLeaderboard: jest.fn(),
  getExistingTeams: jest.fn(),
  updateTeamActivity: jest.fn(),
};

// Mock ServiceFactory
const mockServiceFactory = {
  getInstance: jest.fn().mockReturnValue({
    createSessionService: jest.fn().mockReturnValue(mockSessionService),
    createTeamService: jest.fn().mockReturnValue(mockTeamService),
  }),
};

(ServiceFactory as any).getInstance = mockServiceFactory.getInstance;

describe('Team Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create Express app and load routes
    app = express();
    app.use(express.json());
    
    // Import routes after mocks are set up
    const { teamRoutes } = require('../routes/teamRoutes');
    app.use('/api/teams', teamRoutes);
  });

  describe('POST /teams/join', () => {
    it('should join session successfully with new team', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        teamName: 'Test Team'
      };

      const mockJoinResult = {
        team: {
          id: 'team-1',
          name: 'Test Team',
          total_points: 0,
          joined_at: new Date('2024-01-01T10:00:00Z')
        },
        session: { id: 'session-1', code: 'ABC123' },
        isNewTeam: true
      };

      mockSessionService.joinSession.mockResolvedValue(mockJoinResult);

      const response = await request(app)
        .post('/api/teams/join')
        .send(requestData)
        .expect(201);

      expect(response.body).toEqual({
        team: {
          id: 'team-1',
          name: 'Test Team',
          totalPoints: 0,
          joinedAt: '2024-01-01T10:00:00.000Z'
        }
      });

      expect(mockSessionService.joinSession).toHaveBeenCalledWith('ABC123', 'Test Team');
    });

    it('should return 400 when session code is missing', async () => {
      const requestData = {
        teamName: 'Test Team'
      };

      const response = await request(app)
        .post('/api/teams/join')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Session code and team name are required'
      });

      expect(mockSessionService.joinSession).not.toHaveBeenCalled();
    });

    it('should return 400 when team name is missing', async () => {
      const requestData = {
        sessionCode: 'ABC123'
      };

      const response = await request(app)
        .post('/api/teams/join')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Session code and team name are required'
      });

      expect(mockSessionService.joinSession).not.toHaveBeenCalled();
    });

    it('should return 400 when both fields are missing', async () => {
      const requestData = {};

      const response = await request(app)
        .post('/api/teams/join')
        .send(requestData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Session code and team name are required'
      });
    });

    it('should handle service errors properly', async () => {
      const requestData = {
        sessionCode: 'INVALID',
        teamName: 'Test Team'
      };

      mockSessionService.joinSession.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post('/api/teams/join')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to join team'
      });
    });

    it('should handle team name already exists error', async () => {
      const requestData = {
        sessionCode: 'ABC123',
        teamName: 'Existing Team'
      };

      mockSessionService.joinSession.mockRejectedValue(new Error('Team name already exists in this session'));

      const response = await request(app)
        .post('/api/teams/join')
        .send(requestData)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to join team'
      });
    });
  });

  describe('GET /teams/:teamId', () => {
    it('should return team details when team exists', async () => {
      const teamId = 'team-1';
      const mockTeam = {
        id: teamId,
        name: 'Test Team',
        total_points: 15,
        joined_at: new Date('2024-01-01T10:00:00Z')
      };

      mockTeamService.getTeamById.mockResolvedValue(mockTeam);

      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(200);

      expect(response.body).toEqual({
        team: {
          id: teamId,
          name: 'Test Team',
          total_points: 15,
          joined_at: '2024-01-01T10:00:00.000Z'
        }
      });

      expect(mockTeamService.getTeamById).toHaveBeenCalledWith(teamId);
    });

    it('should return 404 when team not found', async () => {
      const teamId = 'nonexistent';

      mockTeamService.getTeamById.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Team not found'
      });
    });

    it('should handle service errors', async () => {
      const teamId = 'team-1';

      mockTeamService.getTeamById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to fetch team'
      });
    });
  });

  describe('DELETE /teams/:teamId', () => {
    it('should delete team successfully', async () => {
      const teamId = 'team-1';

      mockTeamService.deleteTeam.mockResolvedValue(undefined);

      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true
      });

      expect(mockTeamService.deleteTeam).toHaveBeenCalledWith(teamId);
    });

    it('should handle team not found error', async () => {
      const teamId = 'nonexistent';

      mockTeamService.deleteTeam.mockRejectedValue(new Error('Team not found'));

      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to remove team'
      });
    });

    it('should handle database errors', async () => {
      const teamId = 'team-1';

      mockTeamService.deleteTeam.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to remove team'
      });
    });
  });


});