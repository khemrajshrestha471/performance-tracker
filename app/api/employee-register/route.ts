import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';
import { v4 as uuidv4 } from 'uuid';

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

    // Check if employee already exists (by email)
    const existingEmployee = await query(
      'SELECT * FROM employee_personal_details WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (existingEmployee.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Employee with this email already exists' },
        { status: 409 }
      );
    }

    // Generate employee_id: "EMP" + last 5 digits of UUID
    const uuid = uuidv4();
    const employeeId = 'EMP' + uuid.replace(/-/g, '').slice(-5);

    // Insert personal details with generated employee_id
    const employeeResult = await query(
      `INSERT INTO employee_personal_details (
        employee_id,
        first_name, last_name, email, phone_number, date_of_birth,
        emergency_contact_name, emergency_contact_phone, current_address,
        permanent_address, marital_status, blood_group
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, employee_id, first_name, last_name, email, created_at`,
      [
        employeeId,
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