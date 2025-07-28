import jwt from 'jsonwebtoken';

export interface DecodedToken {
  id: number;
  role: string;
  employee_id: string;
  manager_id: string;
  iat: number;
  exp: number;
}

export const decodeToken = (accessToken: string): DecodedToken | null => {
  try {
    const decoded = jwt.decode(accessToken) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const getTokenInfo = (accessToken: string) => {
  const decodedToken = decodeToken(accessToken);
  
  if (!decodedToken) {
    throw new Error("Invalid token");
  }

  return {
    userRole: decodedToken.role,
    reviewerManagerId: decodedToken.manager_id,
    currentEmployeeId: decodedToken.employee_id
  };
};