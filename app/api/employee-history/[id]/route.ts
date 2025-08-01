import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

// Define types for our data
type QueryResult = {
  rows: Array<Record<string, unknown>>;
};

type EmployeeHistoryRecord = {
  history_id: string;
  employee_id: string;
  department_name: string;
  designation: string;
  start_date: string;
  end_date: string | null;
  reporting_manager_id: string | null;
  is_active: boolean;
  salary_per_month_npr: number | null;
  created_at?: string;
  updated_at?: string;
};

type EmployeeCheckResult = {
  employee_id: string;
};

type HistoryCheckResult = {
  history_id: string;
};

async function executeQuery(
  queryText: string,
  params?: (string | number | boolean | null)[]
): Promise<QueryResult> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    return { rows: result.rows };
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    // Convert parameterized query to Neon's tagged template format
    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return params ? `\${params[${parseInt(index) - 1}]}` : "";
    });

    // Use eval to create the tagged template (careful with security here)
    const result = await eval(`sql\`${interpolatedQuery}\``);
    return { rows: result };
  }
}

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
    const employeeCheck = await executeQuery(
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
    const result = await executeQuery(
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
      history: result.rows as EmployeeHistoryRecord[],
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
    const updateData = (await request.json()) as Partial<EmployeeHistoryRecord>;

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
    const employeeCheck = await executeQuery(
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
      const checkHistory = await executeQuery(
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
        const managerCheck = await executeQuery(
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
      const fields: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && key !== "history_id") {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value as string | number | boolean | null);
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

      const result = await executeQuery(updateQuery, values);

      const response = NextResponse.json({
        success: true,
        message: "Employee history record updated successfully",
        history: result.rows[0] as EmployeeHistoryRecord,
      });

      if (tokenResult.accessToken !== accessToken) {
        setAuthCookies(response, { accessToken, refreshToken });
      }

      return response;
    }
    // If no history_id provided, update the current active record
    else {
      // Get current active record
      const currentRecord = await executeQuery(
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

      const historyId = currentRecord.rows[0].history_id as string;

      // Prepare dynamic update query for current record
      const fields: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value as string | number | boolean | null);
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

      const result = await executeQuery(updateQuery, values);

      const response = NextResponse.json({
        success: true,
        message: "Current employee history record updated successfully",
        history: result.rows[0] as EmployeeHistoryRecord,
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

    // Check if employee exists
    const employeeCheck = await executeQuery(
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
    const recordsToDelete = await executeQuery(
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
    const result = await executeQuery(
      "DELETE FROM department_designation_history WHERE employee_id = $1 RETURNING history_id, employee_id",
      [employeeId]
    );

    const response = NextResponse.json({
      success: true,
      message: `Deleted ${result.rows.length} history records for employee ${employeeId}`,
      deletedRecords: result.rows as Array<{
        history_id: string;
        employee_id: string;
      }>,
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
