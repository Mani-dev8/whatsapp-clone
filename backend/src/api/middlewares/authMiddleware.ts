import { Request } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { UnauthorizedError, ForbiddenError } from '@/util/errorTypes';
import { UserDocument } from '../models/userModel';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: UserDocument;
}

export type JwtPayload = {
  userId: string;
  email: string;
  role?: string;
};

export async function expressAuthentication(
  request: AuthenticatedRequest,
  securityName: string,
  scopes?: string[],
): Promise<JwtPayload> {
  if (securityName !== 'jwt') {
    throw new ForbiddenError('Invalid authentication method');
  }

  const token = extractTokenFromRequest(request);
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    request.user = {
      _id: new mongoose.Types.ObjectId(decoded.userId),
      email: decoded.email,
      role: decoded.role || 'user',
    } as UserDocument;

    if (scopes && scopes.length > 0) {
      if (!decoded.role || !scopes.includes(decoded.role)) {
        throw new ForbiddenError('User does not have the required permissions');
      }
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError(
      'Authentication failed: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    );
  }
}

function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}