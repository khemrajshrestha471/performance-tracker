import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { AuthResponse, SignUpData } from '../../../../types/auth';

export async function POST(request: Request) {
  const {
    full_name,
    email,
    password,
    phone_number,
    company_website,
    pan_number
  }: SignUpData = await request.json();

  // Validation
  if (!full_name || !email || !password) {
    return NextResponse.json(
      { success: false, message: 'Full name, email and password are required' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 8 characters long' },
      { status: 400 }
    );
  }

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const result = await query(
      `INSERT INTO users 
       (full_name, email, password_hash, phone_number, company_website, pan_number) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, full_name, email, phone_number, company_website, pan_number, created_at, updated_at`,
      [full_name, email, hashedPassword, phone_number || null, company_website || null, pan_number || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    const response = NextResponse.json(
      { 
        success: true, 
        message: 'User created successfully',
        token,
        user 
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 86400
    });

    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}