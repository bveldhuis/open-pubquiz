import { AppDataSource } from '../config/database';
import { ApiKey } from '../entities/ApiKey';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKey;
}

export const apiKeyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    const keyRecord = await apiKeyRepository.findOne({ 
      where: { 
        api_key: apiKey,
        is_active: true 
      } 
    });

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await apiKeyRepository.update(keyRecord.id, { last_used: new Date() });

    req.apiKey = keyRecord;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    if (!req.apiKey.permissions.includes(permission)) {
      res.status(403).json({ error: `Permission '${permission}' required` });
      return;
    }

    next();
  };
};
