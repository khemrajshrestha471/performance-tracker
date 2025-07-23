import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

export async function GET(request: Request) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get query parameters for filtering
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';

    // Get total count of active employees
    const countQuery = `
      SELECT COUNT(*) 
      FROM employee_personal_details 
      WHERE deleted_at IS NULL
      ${search ? `AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR employee_id ILIKE $1)` : ''}
    `;

    const countParams = search ? [`%${search}%`] : [];
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated employee list
    const employeesQuery = `
      SELECT 
        id,
        employee_id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        created_at
      FROM employee_personal_details
      WHERE deleted_at IS NULL
      ${search ? `AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR employee_id ILIKE $1)` : ''}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const employeesResult = await query(employeesQuery, countParams);
    const employees = employeesResult.rows;

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });

    // If tokens were refreshed, set new cookies
    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;

  } catch (error: any) {
    console.error('Get employees error:', error);
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