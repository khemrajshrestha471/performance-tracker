// import { cookies } from 'next/headers';
// import { verifyAccessToken } from '@/lib/auth';
// import { NextResponse } from 'next/server';

// export interface AuthTokens {
//   accessToken: string;
//   refreshToken: string;
//   userId: number;
// }

// export async function verifyAndRefreshTokens(): Promise<AuthTokens | NextResponse> {
//   const cookieStore = cookies() as unknown as { get: (name: string) => { value: string } | undefined };
//   const accessToken = cookieStore.get('accessToken')?.value;
//   const refreshToken = cookieStore.get('refreshToken')?.value;

//   if (!accessToken || !refreshToken) {
//     return NextResponse.json(
//       { success: false, message: 'Not authenticated' },
//       { status: 401 }
//     );
//   }

//   try {
//     // const payload = verifyAccessToken<{ id: number }>(accessToken);
//     const payload = verifyAccessToken(accessToken);
//     return { accessToken, refreshToken, userId: payload.id };
//   } catch (error) {
//     console.error(error)
//     const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ refreshToken }),
//     });

//     if (!refreshResponse.ok) {
//       return NextResponse.json(
//         { success: false, message: 'Session expired' },
//         { status: 401 }
//       );
//     }

//     const refreshData = await refreshResponse.json();
//     const newAccessToken = refreshData.accessToken;
//     // const payload = verifyAccessToken<{ id: number }>(newAccessToken);
//     const payload = verifyAccessToken(newAccessToken);

//     return { 
//       accessToken: newAccessToken, 
//       refreshToken, 
//       userId: payload.id 
//     };
//   }
// }

// export function setAuthCookies(response: NextResponse, tokens: { accessToken: string, refreshToken: string }): void {
//   response.cookies.set('accessToken', tokens.accessToken, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     path: '/',
//     sameSite: 'strict',
//     maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
//   });
// }






import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: number;
}

export async function verifyAndRefreshTokens(): Promise<AuthTokens | NextResponse> {
  try {
    // Properly await the cookies() function
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      const payload = verifyAccessToken(accessToken);
      return { 
        accessToken, 
        refreshToken, 
        userId: payload.id 
      };
    } catch (error) {
      console.error('Access token verification failed:', error);
      
      // Attempt to refresh tokens
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
      const payload = verifyAccessToken(newAccessToken);

      return { 
        accessToken: newAccessToken, 
        refreshToken: refreshData.refreshToken || refreshToken,
        userId: payload.id 
      };
    }
  } catch (error) {
    console.error('Error in verifyAndRefreshTokens:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function setAuthCookies(response: NextResponse, tokens: { accessToken: string, refreshToken: string }): Promise<void> {
  try {
    // Set access token cookie
    response.cookies.set({
      name: 'accessToken',
      value: tokens.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 60 * 15 // 15 minutes default
    });

    // Set refresh token cookie
    response.cookies.set({
      name: 'refreshToken',
      value: tokens.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 60 * 60 * 24 * 7 // 1 week default
    });
  } catch (error) {
    console.error('Error setting auth cookies:', error);
    throw error;
  }
}