import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

export async function GET(request: Request) {
  try {
    // Verify tokens - ensure only authorized users can access deleted records
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Get pagination and filter parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100'); // Default higher limit for complete details
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Get total count of deleted employees
    const countQuery = `
      SELECT COUNT(*) 
      FROM employee_personal_details 
      WHERE deleted_at IS NOT NULL
      ${search ? `AND (
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        employee_id ILIKE $1 OR
        phone_number ILIKE $1
      )` : ''}
    `;

    const countParams = search ? [`%${search}%`] : [];
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get complete details of deleted employees
    const employeesQuery = `
      SELECT 
        id,
        employee_id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        emergency_contact_name,
        emergency_contact_phone,
        current_address,
        permanent_address,
        marital_status,
        blood_group,
        created_at,
        updated_at,
        deleted_at
      FROM employee_personal_details
      WHERE deleted_at IS NOT NULL
      ${search ? `AND (
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        employee_id ILIKE $1 OR
        phone_number ILIKE $1
      )` : ''}
      ORDER BY deleted_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const employeesResult = await query(employeesQuery, countParams);
    
    // Format dates for better readability
    const deletedEmployees = employeesResult.rows.map(emp => ({
      ...emp,
      date_of_birth: emp.date_of_birth ? new Date(emp.date_of_birth).toISOString().split('T')[0] : null,
      created_at: new Date(emp.created_at).toISOString(),
      updated_at: emp.updated_at ? new Date(emp.updated_at).toISOString() : null,
      deleted_at: new Date(emp.deleted_at).toISOString()
    }));

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        employees: deletedEmployees,
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

    // Update tokens if refreshed
    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve deleted employees',
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : "An unknown error occurred" : undefined
      },
      { status: 500 }
    );
  }
}