import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

export async function GET() {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Get all active managers (non-deleted)
    const managersResult = await query(
      `SELECT 
        employee_id, 
        first_name, 
        last_name, 
        email, 
        phone_number,
        date_of_birth,
        is_manager
       FROM employee_personal_details 
       WHERE is_manager = true 
       AND deleted_at IS NULL
       ORDER BY last_name, first_name`,
      []
    );

    const response = NextResponse.json({
      success: true,
      count: managersResult.rows.length,
      managers: managersResult.rows
    });

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : "An unknown error occurred" : undefined
      },
      { status: 500 }
    );
  }
}