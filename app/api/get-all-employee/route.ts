import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

interface CountResult {
  count: string;
}

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: string | null;
  created_at: string;
}

interface QueryResult<T> {
  rows: T[];
}

interface PaginationData {
  employees: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

type QueryParam = string | number | null | boolean;

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

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get query parameters for filtering
    const search = searchParams.get("search") || "";

    // Build query conditions and parameters
    const conditions: string[] = [];
    const queryParams: QueryParam[] = [];

    if (search) {
      conditions.push(
        `(first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR employee_id ILIKE $1)`
      );
      queryParams.push(`%${search}%`);
    }

    const baseCondition = `deleted_at IS NULL`;
    const fullWhereClause =
      conditions.length > 0
        ? `WHERE ${baseCondition} AND ${conditions.join(" AND ")}`
        : `WHERE ${baseCondition}`;

    // Get total count of active employees
    const countQuery = `
      SELECT COUNT(*) as count
      FROM employee_personal_details 
      ${fullWhereClause}
    `;

    const countResult = await executeQuery<CountResult>(
      countQuery,
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated employee list
    const employeesQuery = `
      SELECT 
        id,
        employee_id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        created_at
      FROM employee_personal_details
      ${fullWhereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const employeesResult = await executeQuery<Employee>(
      employeesQuery,
      queryParams
    );
    const employees = employeesResult.rows;

    // Create response
    const responseData: PaginationData = {
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };

    const response = NextResponse.json({
      success: true,
      data: responseData,
    });

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
