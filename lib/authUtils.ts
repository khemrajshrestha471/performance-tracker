import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: number;
}

export async function verifyAndRefreshTokens(): Promise<AuthTokens | NextResponse> {
  const cookieStore = cookies() as unknown as { get: (name: string) => { value: string } | undefined };
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const payload = verifyAccessToken<{ id: number }>(accessToken);
    return { accessToken, refreshToken, userId: payload.id };
  } catch (error) {
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

    return { 
      accessToken: newAccessToken, 
      refreshToken, 
      userId: payload.id 
    };
  }
}

export function setAuthCookies(response: NextResponse, tokens: { accessToken: string, refreshToken: string }): void {
  response.cookies.set('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
  });
}