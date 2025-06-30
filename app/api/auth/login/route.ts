import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePasswords, generateToken } from '@/lib/auth';
import { AuthResponse, LoginData } from '../../../../types/auth';

export async function POST(request: Request) {
  const { email, password }: LoginData = await request.json();

  // Validation
  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    // Check if user exists
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' }, // Don't specify whether email or password is wrong
        { status: 401 }
      );
    }

    const user = userResult.rows[0];
    
    // Verify password
    const passwordMatch = await comparePasswords(password, user.password_hash);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email
    });

    // Create response with user data (excluding password)
    const { password_hash, ...userWithoutPassword } = user;
    
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 86400 // 1 day
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        // error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}