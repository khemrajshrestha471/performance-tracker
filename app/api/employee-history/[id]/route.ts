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

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employeeCheck = await query(
      "SELECT employee_id FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Get all history records for employee
    const result = await query(
      `SELECT 
        history_id,
        employee_id,
        department_name,
        designation,
        start_date,
        end_date,
        reporting_manager_id,
        is_active,
        salary_per_month_npr,
        created_at
       FROM department_designation_history 
       WHERE employee_id = $1
       ORDER BY start_date DESC`,
      [employeeId]
    );

    const response = NextResponse.json({
      success: true,
      history: result.rows,
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
          process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "An unknown error occurred" : undefined,
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

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    // Validate allowed fields
    const allowedFields = [
      "department_name",
      "designation",
      "start_date",
      "end_date",
      "reporting_manager_id",
      "is_active",
      "salary_per_month_npr",
    ];

    // Check if employee exists
    const employeeCheck = await query(
      "SELECT employee_id FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // If history_id is provided, update specific record
    if (updateData.history_id) {
      // Check if history record exists and belongs to this employee
      const checkHistory = await query(
        "SELECT history_id FROM department_designation_history WHERE history_id = $1 AND employee_id = $2",
        [updateData.history_id, employeeId]
      );

      if (checkHistory.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "History record not found for this employee",
          },
          { status: 404 }
        );
      }

      // Check reporting manager if provided
      if (updateData.reporting_manager_id) {
        const managerCheck = await query(
          "SELECT employee_id FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
          [updateData.reporting_manager_id]
        );

        if (managerCheck.rows.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Reporting manager not found or not a valid manager",
            },
            { status: 400 }
          );
        }
      }

      // Prepare dynamic update query for specific record
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && key !== "history_id") {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        return NextResponse.json(
          { success: false, message: "No valid fields to update" },
          { status: 400 }
        );
      }

      values.push(updateData.history_id, employeeId);

      // Execute update for specific record
      const updateQuery = `
        UPDATE department_designation_history
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE history_id = $${paramIndex} AND employee_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await query(updateQuery, values);

      const response = NextResponse.json({
        success: true,
        message: "Employee history record updated successfully",
        history: result.rows[0],
      });

      if (tokenResult.accessToken !== accessToken) {
        setAuthCookies(response, { accessToken, refreshToken });
      }

      return response;
    }
    // If no history_id provided, update the current active record
    else {
      // Get current active record
      const currentRecord = await query(
        "SELECT history_id FROM department_designation_history WHERE employee_id = $1 AND is_active = true",
        [employeeId]
      );

      if (currentRecord.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No active history record found for this employee",
          },
          { status: 404 }
        );
      }

      const historyId = currentRecord.rows[0].history_id;

      // Prepare dynamic update query for current record
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        return NextResponse.json(
          { success: false, message: "No valid fields to update" },
          { status: 400 }
        );
      }

      values.push(historyId, employeeId);

      // Execute update for current record
      const updateQuery = `
        UPDATE department_designation_history
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE history_id = $${paramIndex} AND employee_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await query(updateQuery, values);

      const response = NextResponse.json({
        success: true,
        message: "Current employee history record updated successfully",
        history: result.rows[0],
      });

      if (tokenResult.accessToken !== accessToken) {
        setAuthCookies(response, { accessToken, refreshToken });
      }

      return response;
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "An unknown error occurred" : undefined,
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

    // Check if employee exists
    const employeeCheck = await query(
      "SELECT employee_id FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
      [employeeId]
    );

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // First get all history records that will be deleted (for the response)
    const recordsToDelete = await query(
      "SELECT history_id FROM department_designation_history WHERE employee_id = $1",
      [employeeId]
    );

    if (recordsToDelete.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No history records found for this employee",
        },
        { status: 404 }
      );
    }

    // Delete all history records for this employee
    const result = await query(
      "DELETE FROM department_designation_history WHERE employee_id = $1 RETURNING history_id, employee_id",
      [employeeId]
    );

    const response = NextResponse.json({
      success: true,
      message: `Deleted ${result.rows.length} history records for employee ${employeeId}`,
      deletedRecords: result.rows,
    });

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error) {
    console.error("Delete employee history error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "An unknown error occurred" : undefined,
      },
      { status: 500 }
    );
  }
}
