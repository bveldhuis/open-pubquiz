import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { ApiKey } from '../entities/ApiKey';

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKey;
}

export const apiKeyAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      res.status(401).json({ error: 'API key is required' });
      return;
    }

    const apiKeyRepository = AppDataSource.getRepository(ApiKey);
    const key = await apiKeyRepository.findOne({
      where: {
        api_key: apiKey as string,
        is_active: true
      }
    });

    if (!key) {
      res.status(401).json({ error: 'Invalid or inactive API key' });
      return;
    }

    // Update last used timestamp
    key.last_used = new Date();
    await apiKeyRepository.save(key);

    // Attach API key info to request
    req.apiKey = key;
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
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
