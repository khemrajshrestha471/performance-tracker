import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

export async function POST(request: Request) {
  try {
    // Verify tokens and get user ID
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult; // This is an error response
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    const {
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
      blood_group
    } = await request.json();

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if employee already exists
    const existingEmployee = await query(
      'SELECT * FROM employee_personal_details WHERE email = $1',
      [email]
    );

    if (existingEmployee.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Employee with this email already exists' },
        { status: 409 }
      );
    }

    // Insert personal details
    const employeeResult = await query(
      `INSERT INTO employee_personal_details (
        first_name, last_name, email, phone_number, date_of_birth,
        emergency_contact_name, emergency_contact_phone, current_address,
        permanent_address, marital_status, blood_group
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING employee_id, first_name, last_name, email, created_at`,
      [
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
        blood_group
      ]
    );

    const newEmployee = employeeResult.rows[0];

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Employee registered successfully',
      employee: newEmployee
    }, { status: 201 });

    // If tokens were refreshed, set new cookies
    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;

  } catch (error: any) {
    console.error('Employee registration error:', error);
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