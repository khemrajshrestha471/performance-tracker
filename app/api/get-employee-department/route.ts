import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";
import { Department, DepartmentValues } from "@/types/enum"; // Adjust import path

export async function GET(request: Request) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const departmentName = searchParams.get("department");

    // Validate department parameter
    if (!departmentName) {
      return NextResponse.json(
        { success: false, message: "Department parameter is required" },
        { status: 400 }
      );
    }

    // Validate department is in enum
    if (!DepartmentValues.includes(departmentName as Department)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid department",
          validDepartments: DepartmentValues,
        },
        { status: 400 }
      );
    }

    // Query to get employee history for the department
    const result = await query(
      `SELECT 
        h.history_id,
        h.employee_id,
        p.first_name,
        p.last_name,
        h.department_name,
        h.designation,
        h.start_date,
        h.end_date,
        h.reporting_manager_id,
        h.is_active,
        h.salary_per_month_npr
      FROM department_designation_history h
      JOIN employee_personal_details p ON h.employee_id = p.employee_id
      WHERE h.department_name = $1
      AND p.deleted_at IS NULL
      ORDER BY h.start_date DESC`,
      [departmentName]
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Employee history retrieved successfully",
        employees: result.rows,
      },
      { status: 200 }
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
