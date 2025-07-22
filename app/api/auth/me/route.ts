import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Correct way to access cookies
    const cookieStore = cookies() as unknown as { get: (name: string) => { value: string } | undefined };
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify access token (don't throw if expired)
    let userId: number;
    try {
      const payload = verifyAccessToken<{ id: number }>(accessToken);
      userId = payload.id;
    } catch (error) {
      // If access token is expired, try to refresh it
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { success: false, message: 'Session expired' },
          { status: 401 }
        );
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.accessToken;
      const payload = verifyAccessToken<{ id: number }>(newAccessToken);
      userId = payload.id;

      // Set new access token in cookies
      const response = NextResponse.json({
        success: true,
        user: null, // Will be set in the next query
        accessToken: newAccessToken,
        refreshToken
      });

      response.cookies.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'strict',
        maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
      });

      return response;
    }

    // Get user data
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { password_hash, ...user } = userResult.rows[0];

    return NextResponse.json({
      success: true,
      user,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}