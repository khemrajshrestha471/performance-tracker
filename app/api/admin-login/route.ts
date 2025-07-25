import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePasswords, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { LoginData } from '@/types/auth';

export async function POST(request: Request) {
  const { email, password }: LoginData = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    // 1. Find manager by email in manager_role table
    const managerResult = await query(
      `SELECT m.*, e.first_name, e.last_name, e.id as user_db_id
       FROM manager_role m
       JOIN employee_personal_details e ON m.employee_id = e.employee_id
       WHERE m.email = $1`,
      [email]
    );

    if (managerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const manager = managerResult.rows[0];
    
    // 2. Verify password
    const passwordMatch = await comparePasswords(password, manager.password_hash);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Generate tokens with manager-specific data
    const tokenPayload = {
      id: manager.user_db_id, // Using the integer ID for token
      employee_id: manager.employee_id,
      manager_id: manager.manager_id,
      email: manager.email,
      firstName: manager.first_name,
      lastName: manager.last_name,
      role: 'manager'
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 4. Store refresh token in database using the integer ID
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [manager.user_db_id, refreshToken] // Using the numeric ID here
    );

    // 5. Prepare response data (excluding sensitive fields)
    const { password_hash, user_db_id, ...managerWithoutPassword } = manager;
    
    const response = NextResponse.json({
      success: true,
      message: 'Manager login successful',
      manager: {
        employee_id: manager.employee_id,
        manager_id: manager.manager_id,
        email: manager.email,
        first_name: manager.first_name,
        last_name: manager.last_name
      },
      accessToken,
      refreshToken
    });

    // 6. Set HTTP-only cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 900 // 15 minutes
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 604800 // 7 days
    });

    return response;

  } catch (error:any) {
    console.error('Manager login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}