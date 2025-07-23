import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const employeeId = params.id;

    // Get only non-deleted employee
    const employeeResult = await query(
      `SELECT 
        employee_id, first_name, last_name, email, phone_number, 
        date_of_birth, emergency_contact_name, emergency_contact_phone,
        current_address, permanent_address, marital_status, blood_group
       FROM employee_personal_details 
       WHERE employee_id = $1 AND deleted_at IS NULL`,
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found or has been deleted",
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      employee: employeeResult.rows[0],
    });

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error: any) {
    console.error("Get employee error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const employeeId = params.id;
    const updateData = await request.json();

    // 1. Validate allowed fields including is_manager
    const allowedFields = [
      "first_name",
      "last_name",
      "phone_number",
      "date_of_birth",
      "emergency_contact_name",
      "emergency_contact_phone",
      "current_address",
      "permanent_address",
      "marital_status",
      "blood_group",
      "is_manager",
    ];

    // 2. Check if employee exists and isn't deleted
    const checkEmployee = await query(
      "SELECT employee_id, is_manager FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
      [employeeId]
    );

    if (checkEmployee.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found or has been deleted",
        },
        { status: 404 }
      );
    }

    const currentEmployee = checkEmployee.rows[0];
    const isBecomingManager =
      updateData.is_manager === true || updateData.is_manager === "true"
        ? true
        : false;

    // 3. Prepare dynamic update query
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === "is_manager") {
          fields.push(`${key} = $${paramIndex}`);
          values.push(isBecomingManager); // Force boolean
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Handle employee_id change if becoming manager
    let newEmployeeId = employeeId;
    if (isBecomingManager && !currentEmployee.is_manager) {
      // Change from EMP to MNG prefix
      newEmployeeId = employeeId.replace(/^EMP/, "MNG");
      fields.push(`employee_id = $${paramIndex}`);
      values.push(newEmployeeId);
      paramIndex++;
    } else if (!isBecomingManager && currentEmployee.is_manager) {
      // Change from MNG to EMP prefix
      newEmployeeId = employeeId.replace(/^MNG/, "EMP");
      fields.push(`employee_id = $${paramIndex}`);
      values.push(newEmployeeId);
      paramIndex++;
    }

    values.push(employeeId);

    // 4. Execute update
    const updateQuery = `
      UPDATE employee_personal_details
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE employee_id = $${paramIndex} AND deleted_at IS NULL
      RETURNING 
        employee_id, first_name, last_name, email, 
        phone_number, is_manager
    `;

    const result = await query(updateQuery, values);

    // 5. Return response
    const response = NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      employee: result.rows[0],
    });

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const employeeId = params.id;

    // First check if employee exists and isn't already deleted
    const checkEmployee = await query(
      "SELECT employee_id FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
      [employeeId]
    );

    if (checkEmployee.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found or already deleted",
        },
        { status: 404 }
      );
    }

    // Perform soft delete
    const result = await query(
      `UPDATE employee_personal_details
       SET deleted_at = NOW()
       WHERE employee_id = $1 AND deleted_at IS NULL
       RETURNING employee_id, email`,
      [employeeId]
    );

    const response = NextResponse.json({
      success: true,
      message: "Employee soft-deleted successfully",
      deletedEmployee: result.rows[0],
    });

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
