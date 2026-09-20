import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUserPayload } from '../types';

export const generateToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
};
