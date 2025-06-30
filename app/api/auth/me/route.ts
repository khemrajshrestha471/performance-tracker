import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { AuthResponse } from '../../../../types/auth';

export async function GET(request: Request) {
  try {
    // Get token from cookies
    const token = request.headers.get('cookie')?.split('; ')
      .find(cookie => cookie.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token missing' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken<{ id: number }>(token);
    
    // Get user from database
    const userResult = await query(
      'SELECT id, full_name, email, phone_number, company_website, pan_number, created_at, updated_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'User retrieved successfully',
      user
    });

  } catch (error:any) {
    console.error('Error in /me endpoint:', error);
    
    if (error.message === 'Invalid or expired token') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

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