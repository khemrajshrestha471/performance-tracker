export interface User {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone_number: string | null;
  company_website: string | null;
  pan_number: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Manager {
  id: number;
  employee_id: string;
  manager_id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: Omit<User, 'password_hash'>;
}

export interface SignUpData {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  company_website?: string;
  pan_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface DecodedToken {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

export interface TokenPayload {
  id: number;
  employee_id?: string;
  manager_id?: string;
  role: 'admin' | 'manager';
}