import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (process.env.RUN_FROM === "locally") {
      // Local PostgreSQL with pg pool
      const { query } = await import('@/lib/db');

      if (refreshToken) {
        // Delete refresh token from database
        await query(
          'DELETE FROM refresh_tokens WHERE token = $1',
          [refreshToken]
        );
      }
    } else {
      // Serverless Neon database
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);

      if (refreshToken) {
        // Delete refresh token from database using tagged template literal
        await sql`
          DELETE FROM refresh_tokens 
          WHERE token = ${refreshToken}
        `;
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    // Clear cookies
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error' 
          : undefined
      },
      { status: 500 }
    );
  }
}