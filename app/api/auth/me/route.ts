import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

export async function GET(request: Request) {
  try {
    // Verify tokens and get user ID
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { accessToken, refreshToken, userId } = tokenResult as AuthTokens;

    // Get user data
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { password_hash, ...user } = userResult.rows[0];

    // Create response
    const response = NextResponse.json({
      success: true,
      user,
      accessToken,
      refreshToken
    });

    // If tokens were refreshed, set new cookies
    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}