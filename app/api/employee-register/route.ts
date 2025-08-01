import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";
import { v4 as uuidv4 } from "uuid";

// Define types for our data
type QueryResult = {
  rows: Array<Record<string, unknown>>;
};

type EmployeePersonalDetails = {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  date_of_birth?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  current_address?: string | null;
  permanent_address?: string | null;
  marital_status?: string | null;
  blood_group?: string | null;
  created_at?: string;
};

type EmployeeInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  permanent_address?: string;
  marital_status?: string;
  blood_group?: string;
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

export async function POST(request: Request) {
  try {
    // Verify tokens and get user ID
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult; // This is an error response
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    const inputData = (await request.json()) as EmployeeInput;

    // Validate required fields
    if (!inputData.first_name || !inputData.last_name || !inputData.email) {
      return NextResponse.json(
        {
          success: false,
          message: "First name, last name, and email are required",
        },
        { status: 400 }
      );
    }

    // Check if employee already exists (by email)
    const existingEmployee = await executeQuery(
      "SELECT * FROM employee_personal_details WHERE email = $1 AND deleted_at IS NULL",
      [inputData.email]
    );

    if (existingEmployee.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Employee with this email already exists" },
        { status: 409 }
      );
    }

    // Generate employee_id: "EMP" + last 5 digits of UUID
    const uuid = uuidv4();
    const employeeId = "EMP" + uuid.replace(/-/g, "").slice(-5);

    // Prepare parameters for the query
    const queryParams: (string | null)[] = [
      employeeId,
      inputData.first_name,
      inputData.last_name,
      inputData.email,
      inputData.phone_number || null,
      inputData.date_of_birth || null,
      inputData.emergency_contact_name || null,
      inputData.emergency_contact_phone || null,
      inputData.current_address || null,
      inputData.permanent_address || null,
      inputData.marital_status || null,
      inputData.blood_group || null,
    ];

    // Insert personal details with generated employee_id
    const employeeResult = await executeQuery(
      `INSERT INTO employee_personal_details (
        employee_id,
        first_name, last_name, email, phone_number, date_of_birth,
        emergency_contact_name, emergency_contact_phone, current_address,
        permanent_address, marital_status, blood_group
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, employee_id, first_name, last_name, email, created_at`,
      queryParams
    );

    const newEmployee = employeeResult.rows[0] as EmployeePersonalDetails;

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Employee registered successfully",
        employee: newEmployee,
      },
      { status: 201 }
    );

    // If tokens were refreshed, set new cookies
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
