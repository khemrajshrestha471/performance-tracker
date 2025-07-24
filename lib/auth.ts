// import bcrypt from 'bcryptjs';
// import jwt, { SignOptions } from 'jsonwebtoken';
// import ms from 'ms';
// import { User } from '../types/auth';

// interface AuthConfig {
//   accessTokenSecret: jwt.Secret;
//   refreshTokenSecret: jwt.Secret;
//   accessTokenExpiresIn: string;
//   refreshTokenExpiresIn: string;
//   bcryptSaltRounds: number;
// }

// const getAuthConfig = (): AuthConfig => {
//   const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
//   const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
//   const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '30m';
//   const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
//   const bcryptSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

//   if (!accessTokenSecret || !refreshTokenSecret) {
//     throw new Error('Token secrets are not defined in environment variables');
//   }

//   return {
//     accessTokenSecret,
//     refreshTokenSecret,
//     accessTokenExpiresIn: accessTokenExpiresIn,
//     refreshTokenExpiresIn,
//     bcryptSaltRounds: bcryptSaltRounds
//   };
// };

// const authConfig = getAuthConfig();

// export const hashPassword = async (password: string): Promise<string> => {
//   if (!password || password.length < 8) {
//     throw new Error('Password must be at least 8 characters long');
//   }
//   return await bcrypt.hash(password, authConfig.bcryptSaltRounds);
// };

// export const comparePasswords = async (
//   password: string,
//   hash: string
// ): Promise<boolean> => {
//   if (!password || !hash) {
//     return false;
//   }
//   return await bcrypt.compare(password, hash);
// };

// export const generateAccessToken = (user: Pick<User, 'id'>): string => {
//   const payload = {
//     id: user.id,
//   };

//   const options: SignOptions = {
//     expiresIn: authConfig.accessTokenExpiresIn as ms.StringValue, // Type assertion
//   };

//   return jwt.sign(payload, authConfig.accessTokenSecret, options);
// };

// export const generateRefreshToken = (user: Pick<User, 'id'>): string => {
//   const payload = {
//     id: user.id,
//   };

//   const options: SignOptions = {
//     expiresIn: authConfig.refreshTokenExpiresIn as ms.StringValue, // Type assertion
//   };

//   return jwt.sign(payload, authConfig.refreshTokenSecret, options);
// };

// export const verifyAccessToken = <T = any>(token: string): T => {
//   try {
//     return jwt.verify(token, authConfig.accessTokenSecret) as T;
//   } catch (error) {
//     console.error('Access token verification failed:', error);
//     throw new Error('Invalid or expired access token');
//   }
// };

// export const verifyRefreshToken = <T = any>(token: string): T => {
//   try {
//     return jwt.verify(token, authConfig.refreshTokenSecret) as T;
//   } catch (error) {
//     console.error('Refresh token verification failed:', error);
//     throw new Error('Invalid or expired refresh token');
//   }
// };

// export const getUserIdFromToken = (token: string, isRefreshToken = false): number => {
//   const decoded = isRefreshToken 
//     ? verifyRefreshToken<{ id: number }>(token)
//     : verifyAccessToken<{ id: number }>(token);
//   return decoded.id;
// };













import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import { User } from '../types/auth';

interface AuthConfig {
  accessTokenSecret: jwt.Secret;
  refreshTokenSecret: jwt.Secret;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptSaltRounds: number;
}

interface TokenPayload {
  id: number;
}

const getAuthConfig = (): AuthConfig => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '30m';
  const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const bcryptSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error('Token secrets are not defined in environment variables');
  }

  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiresIn,
    refreshTokenExpiresIn,
    bcryptSaltRounds
  };
};

const authConfig = getAuthConfig();

export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  return await bcrypt.hash(password, authConfig.bcryptSaltRounds);
};

export const comparePasswords = async (
  password: string,
  hash: string
): Promise<boolean> => {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
};

export const generateAccessToken = (user: Pick<User, 'id'>): string => {
  const payload: TokenPayload = {
    id: user.id,
  };

  const options: SignOptions = {
    expiresIn: authConfig.accessTokenExpiresIn as ms.StringValue,
  };

  return jwt.sign(payload, authConfig.accessTokenSecret, options);
};

export const generateRefreshToken = (user: Pick<User, 'id'>): string => {
  const payload: TokenPayload = {
    id: user.id,
  };

  const options: SignOptions = {
    expiresIn: authConfig.refreshTokenExpiresIn as ms.StringValue,
  };

  return jwt.sign(payload, authConfig.refreshTokenSecret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, authConfig.accessTokenSecret) as TokenPayload;
  } catch (error) {
    console.error('Access token verification failed:', error);
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, authConfig.refreshTokenSecret) as TokenPayload;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    throw new Error('Invalid or expired refresh token');
  }
};

export const getUserIdFromToken = (token: string, isRefreshToken = false): number => {
  const decoded = isRefreshToken 
    ? verifyRefreshToken(token)
    : verifyAccessToken(token);
  return decoded.id;
};