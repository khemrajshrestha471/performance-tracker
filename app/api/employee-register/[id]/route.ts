import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";
import { hashPassword } from "@/lib/auth";

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

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "An unknown error occurred"
            : undefined,
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

    if (!/^EMP[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only EMP employees can be promoted to manager",
        },
        { status: 400 }
      );
    }

    // Check if this is a manager promotion request
    const isManagerPromotionRequest = "promote_to_manager" in updateData;

    if (isManagerPromotionRequest) {
      if (!updateData.password) {
        return NextResponse.json(
          {
            success: false,
            message: "Password is required for manager promotion",
          },
          { status: 400 }
        );
      }
    }

    // Validate allowed fields
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
      "promote_to_manager",
      "password",
    ];

    // Start transaction
    await query("BEGIN");

    try {
      // 1. Get employee details
      const employeeRes = await query(
        `SELECT * FROM employee_personal_details 
         WHERE employee_id = $1 AND deleted_at IS NULL`,
        [employeeId]
      );

      if (employeeRes.rows.length === 0) {
        await query("ROLLBACK");
        return NextResponse.json(
          { success: false, message: "Employee not found" },
          { status: 404 }
        );
      }

      const employee = employeeRes.rows[0];
      const managerId = employeeId.replace(/^EMP/, "MNG");

      // 2. Handle manager promotion
      if (isManagerPromotionRequest) {
        // Check if already a manager
        const managerCheck = await query(
          "SELECT 1 FROM manager_role WHERE employee_id = $1 OR manager_id = $2",
          [employeeId, managerId]
        );

        if (managerCheck.rows.length > 0) {
          await query("ROLLBACK");
          return NextResponse.json(
            { success: false, message: "Employee is already a manager" },
            { status: 400 }
          );
        }

        // Hash the password
        const hashedPassword = await hashPassword(updateData.password);

        // Insert into manager_role table with MNG prefix for manager_id
        await query(
          `INSERT INTO manager_role 
           (employee_id, manager_id, email, password_hash, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [employeeId, managerId, employee.email, hashedPassword]
        );

        // Update manager_id in employee_personal_details to MNG version
        await query(
          `UPDATE employee_personal_details 
           SET manager_id = $1, updated_at = NOW()
           WHERE employee_id = $2`,
          [managerId, employeeId]
        );
      }

      // 3. Handle regular field updates
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (
          allowedFields.includes(key) &&
          !["promote_to_manager", "password"].includes(key)
        ) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length > 0) {
        values.push(employeeId);
        await query(
          `UPDATE employee_personal_details
           SET ${fields.join(", ")}, updated_at = NOW()
           WHERE employee_id = $${paramIndex}`,
          values
        );
      }

      // Commit transaction
      await query("COMMIT");

      // Get updated employee data
      const result = await query(
        `SELECT e.*, 
         CASE WHEN m.employee_id IS NOT NULL THEN true ELSE false END as is_manager,
         m.manager_id as assigned_manager_id
         FROM employee_personal_details e
         LEFT JOIN manager_role m ON e.employee_id = m.employee_id
         WHERE e.employee_id = $1`,
        [employeeId]
      );

      // Return response
      const response = NextResponse.json({
        success: true,
        message: isManagerPromotionRequest
          ? "Employee promoted to manager successfully"
          : "Employee updated successfully",
        employee: {
          ...result.rows[0],
          // For promoted managers, include the MNG ID in the response
          manager_id: isManagerPromotionRequest
            ? managerId
            : result.rows[0].manager_id,
        },
      });

      if (tokenResult.accessToken !== accessToken) {
        setAuthCookies(response, { accessToken, refreshToken });
      }

      return response;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "An unknown error occurred"
            : undefined,
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

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "An unknown error occurred"
            : undefined,
      },
      { status: 500 }
    );
  }
}
