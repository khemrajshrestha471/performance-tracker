import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: Date | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  current_address: string | null;
  permanent_address: string | null;
  marital_status: string | null;
  blood_group: string | null;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date;
}

interface CountResult {
  count: number;
}

interface QueryResult<T> {
  rows: T[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    employees: FormattedEmployee[];
    pagination: Pagination;
  };
  message?: string;
  error?: string;
}

interface FormattedEmployee
  extends Omit<
    Employee,
    "date_of_birth" | "created_at" | "updated_at" | "deleted_at"
  > {
  date_of_birth: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string;
}

async function executeQuery<T>(
  queryText: string,
  params: (string | number)[] = []
): Promise<QueryResult<T>> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    return { rows: result.rows as T[] };
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return `\${params[${parseInt(index) - 1}]}`;
    });

    const result = await eval(`sql\`${interpolatedQuery}\``);
    return { rows: result as T[] };
  }
}

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      // Cast the response to the expected type
      return tokenResult as NextResponse<ApiResponse>;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Get pagination and filter parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Get total count of deleted employees
    const countQuery = `
      SELECT COUNT(*) as count
      FROM employee_personal_details 
      WHERE deleted_at IS NOT NULL
      ${
        search
          ? `AND (
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        employee_id ILIKE $1 OR
        phone_number ILIKE $1
      )`
          : ""
      }
    `;

    const countParams = search ? [`%${search}%`] : [];
    const countResult = await executeQuery<CountResult>(
      countQuery,
      countParams
    );
    const total = countResult.rows[0].count;

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
      ${
        search
          ? `AND (
        first_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        email ILIKE $1 OR 
        employee_id ILIKE $1 OR
        phone_number ILIKE $1
      )`
          : ""
      }
      ORDER BY deleted_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const employeesResult = await executeQuery<Employee>(
      employeesQuery,
      countParams
    );

    // Format dates for better readability
    const formatEmployeeDates = (emp: Employee): FormattedEmployee => ({
      ...emp,
      date_of_birth: emp.date_of_birth
        ? emp.date_of_birth.toISOString().split("T")[0]
        : null,
      created_at: emp.created_at.toISOString(),
      updated_at: emp.updated_at ? emp.updated_at.toISOString() : null,
      deleted_at: emp.deleted_at.toISOString(),
    });

    const deletedEmployees = employeesResult.rows.map(formatEmployeeDates);

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
          hasPrevPage: page > 1,
        },
      },
    });

    // Update tokens if refreshed
    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve deleted employees",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
