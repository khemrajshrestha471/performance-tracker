import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

export async function POST(request: Request) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const requestData = await request.json();

    // Validate required fields
    const requiredFields = [
      "employee_id",
      "department_name",
      "designation",
      "start_date",
    ];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if employee exists
    const employeeCheck = await query(
      "SELECT employee_id FROM employee_personal_details WHERE employee_id = $1 AND deleted_at IS NULL",
      [requestData.employee_id]
    );

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    if (requestData.reporting_manager_id) {
      const managerCheck = await query(
        `SELECT employee_id FROM employee_personal_details 
     WHERE manager_id = $1 
     AND deleted_at IS NULL`,
        [requestData.reporting_manager_id]
      );

      if (managerCheck.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Reporting manager ID is not valid (no employee has this manager ID assigned)",
          },
          { status: 400 }
        );
      }
    }

    // Insert new history record
    const result = await query(
      `INSERT INTO department_designation_history (
        employee_id,
        department_name,
        designation,
        start_date,
        end_date,
        reporting_manager_id,
        is_active,
        salary_per_month_npr
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        history_id,
        employee_id,
        department_name,
        designation,
        start_date,
        end_date,
        reporting_manager_id,
        is_active,
        salary_per_month_npr`,
      [
        requestData.employee_id,
        requestData.department_name,
        requestData.designation,
        requestData.start_date,
        requestData.end_date || null,
        requestData.reporting_manager_id || null,
        requestData.is_active || true,
        requestData.salary_per_month_npr || null,
      ]
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Department/designation history created successfully",
        history: result.rows[0],
      },
      { status: 201 }
    );

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
