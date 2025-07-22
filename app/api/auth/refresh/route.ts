import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateAccessToken, verifyRefreshToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const { id } = verifyRefreshToken<{ id: number }>(refreshToken);

    // Check if refresh token exists in database
    const tokenResult = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
      [refreshToken, id]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({ id });

    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });

    // Set new access token cookie
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
    });

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to refresh token',
      },
      { status: 500 }
    );
  }
}