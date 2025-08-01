import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";
import { Department, DepartmentValues } from "@/types/enum";
import { apiAxios } from "@/lib/apiAxios";

// Type Definitions
interface DepartmentEmployeeHistory {
  history_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  department_name: Department;
  designation: string;
  start_date: string;
  end_date: string | null;
  reporting_manager_id: string | null;
  is_active: boolean;
  salary_per_month_npr: number;
}

interface AuthMeResponse {
  user?: {
    department: Department;
  };
}

interface QueryResult<T> {
  rows: T[];
}

type QueryParam = string | number | boolean | null;

interface ApiError {
  response?: {
    status?: number;
  };
}

async function executeQuery<T>(
  queryText: string,
  params: QueryParam[] = []
): Promise<QueryResult<T>> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    return { rows: result.rows as T[] };
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return params ? `\${params[${parseInt(index) - 1}]}` : "";
    });

    const result = await eval(`sql\`${interpolatedQuery}\``);
    return { rows: result as T[] };
  }
}

export async function GET(request: Request) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    let authMeResponse: { data?: AuthMeResponse };

    try {
      authMeResponse = await apiAxios.get<AuthMeResponse>("/auth/me", {
        headers: {
          Cookie: request.headers.get("Cookie") || "",
        },
      });
    } catch (error: unknown) {
      const statusCode = (error as ApiError)?.response?.status || 500;
      return NextResponse.json(
        { success: false, message: "Failed to fetch user information" },
        { status: statusCode }
      );
    }

    const userDepartment = authMeResponse.data?.user?.department;

    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const requestedDepartment = searchParams.get("department");

    // Validate department parameter exists
    if (!requestedDepartment) {
      return NextResponse.json(
        { success: false, message: "Department parameter is required" },
        { status: 400 }
      );
    }

    // Validate department is in enum
    if (!DepartmentValues.includes(requestedDepartment as Department)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid department",
          validDepartments: DepartmentValues,
        },
        { status: 400 }
      );
    }

    // Check if user's department matches the requested department
    if (userDepartment !== requestedDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authorized to access this department's data",
          yourDepartment: userDepartment,
          requestedDepartment: requestedDepartment,
        },
        { status: 403 }
      );
    }

    // Query to get employee history for the department
    const result = await executeQuery<DepartmentEmployeeHistory>(
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
      [requestedDepartment]
    );

    const employees = result.rows;

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Employee history retrieved successfully",
        employees,
      },
      { status: 200 }
    );

    // If tokens were refreshed, set new cookies
    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
