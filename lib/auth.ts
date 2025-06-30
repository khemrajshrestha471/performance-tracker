import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import ms from 'ms'; 
import { User } from '../types/auth';

// Define auth configuration interface
interface AuthConfig {
  jwtSecret: jwt.Secret;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
}

// Get auth configuration with proper type safety
const getAuthConfig = (): AuthConfig => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const bcryptSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return {
    jwtSecret,
    jwtExpiresIn,
    bcryptSaltRounds
  };
};

// Initialize config - this will throw if JWT_SECRET is missing
const authConfig = getAuthConfig();

/**
 * Hashes a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return await bcrypt.hash(password, authConfig.bcryptSaltRounds);
};

/**
 * Compares a plain text password with a hashed password
 */
export const comparePasswords = async (
  password: string,
  hash: string
): Promise<boolean> => {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
};

/**
 * Generates a JWT token for a user
 */
export const generateToken = (user: Pick<User, 'id' | 'email'>): string => {
  const payload = {
    id: user.id,
    email: user.email,
  };

  const options: SignOptions = {
    expiresIn: authConfig.jwtExpiresIn as ms.StringValue, // Type assertion here
  };

  return jwt.sign(payload, authConfig.jwtSecret, options);
};

/**
 * Verifies a JWT token
 */
export const verifyToken = <T = any>(token: string): T => {
  try {
    return jwt.verify(token, authConfig.jwtSecret) as T;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Middleware to verify JWT from Authorization header
 */
export const verifyAuthHeader = (authHeader: string | undefined) => {
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) {
    throw new Error('Malformed authorization header');
  }

  return verifyToken(token);
};

/**
 * Extracts user ID from JWT token
 */
export const getUserIdFromToken = (token: string): number => {
  const decoded = verifyToken<{ id: number }>(token);
  return decoded.id;
};