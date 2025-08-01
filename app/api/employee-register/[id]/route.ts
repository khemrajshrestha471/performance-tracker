import { NextRequest, NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";
import { hashPassword } from "@/lib/auth";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Define types for our data
type QueryParams = (string | number | boolean | null)[];
type QueryObject = { text: string; params?: QueryParams };
type QueryResult = { rows: Record<string, unknown>[] };

type Employee = {
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
  manager_id?: string | null;
  deleted_at?: string | null;
  is_manager?: boolean;
  assigned_manager_id?: string | null;
};

type Manager = {
  employee_id: string;
  manager_id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

type EmployeeUpdateData = {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  permanent_address?: string;
  marital_status?: string;
  blood_group?: string;
  promote_to_manager?: boolean;
  password?: string;
};

// Type-safe query execution function
async function executeQuery(
  queryText: string,
  params: QueryParams = []
): Promise<QueryResult> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    return { rows: result.rows };
  } else {
    const sql: NeonQueryFunction<false, false> = neon(
      process.env.DATABASE_URL!
    );

    // Handle queries without parameters
    if (params.length === 0) {
      const template: TemplateStringsArray = Object.assign([queryText], {
        raw: [queryText],
      });
      const result = await sql(template);
      return { rows: result };
    }

    // Split query into parts and create parameter mapping
    const parts = queryText.split(/(\$\d+)/g);
    const querySegments: string[] = [];
    const queryParams: QueryParams = [];

    let currentSegment = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith("$")) {
        const paramIndex = parseInt(part.substring(1)) - 1;
        if (paramIndex >= 0 && paramIndex < params.length) {
          querySegments.push(currentSegment);
          currentSegment = "";
          queryParams.push(params[paramIndex]);
        } else {
          currentSegment += part;
        }
      } else {
        currentSegment += part;
      }
    }
    querySegments.push(currentSegment);

    // Create proper TemplateStringsArray
    const template: TemplateStringsArray = Object.assign(querySegments, {
      raw: querySegments,
    });

    try {
      const result = await sql(template, ...queryParams);
      return { rows: result };
    } catch (error) {
      console.error("Error executing query:", error);
      throw new Error("Failed to execute query");
    }
  }
}

// Type-safe transaction function
async function executeTransaction(queries: QueryObject[]): Promise<QueryResult[]> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    try {
      await query("BEGIN");
      const results: QueryResult[] = [];
      for (const q of queries) {
        const result = await query(q.text, q.params);
        results.push({ rows: result.rows });
      }
      await query("COMMIT");
      return results;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } else {
    try {
      const results: QueryResult[] = [];
      for (const q of queries) {
        const result = await executeQuery(q.text, q.params || []);
        results.push(result);
      }
      return results;
    } catch (error) {
      throw error;
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const { id: employeeId } = params;

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    // Get only non-deleted employee
    const employeeResult = await executeQuery(
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
      employee: employeeResult.rows[0] as Employee,
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const { id: employeeId } = params;
    const updateData = await request.json() as EmployeeUpdateData;

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

    if (isManagerPromotionRequest && !updateData.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required for manager promotion",
        },
        { status: 400 }
      );
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

    // 1. Get employee details
    const employeeRes = await executeQuery(
      `SELECT * FROM employee_personal_details 
       WHERE employee_id = $1 AND deleted_at IS NULL`,
      [employeeId]
    );

    if (employeeRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const employee = employeeRes.rows[0] as Employee;
    const managerId = employeeId.replace(/^EMP/, "MNG");

    // Prepare queries for transaction
    const queries: QueryObject[] = [];

    // 2. Handle manager promotion
    if (isManagerPromotionRequest) {
      // Check if already a manager
      const managerCheck = await executeQuery(
        "SELECT 1 FROM manager_role WHERE employee_id = $1 OR manager_id = $2",
        [employeeId, managerId]
      );

      if (managerCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, message: "Employee is already a manager" },
          { status: 400 }
        );
      }

      // Hash the password
      const hashedPassword = await hashPassword(updateData.password!);

      // Add queries for manager promotion
      queries.push({
        text: `INSERT INTO manager_role 
               (employee_id, manager_id, email, password_hash, created_at) 
               VALUES ($1, $2, $3, $4, NOW())`,
        params: [employeeId, managerId, employee.email, hashedPassword],
      });

      queries.push({
        text: `UPDATE employee_personal_details 
               SET manager_id = $1, updated_at = NOW()
               WHERE employee_id = $2`,
        params: [managerId, employeeId],
      });
    }

    // 3. Handle regular field updates
    const fields: string[] = [];
    let paramIndex = 1;
    const values: QueryParams = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (
        allowedFields.includes(key) &&
        !["promote_to_manager", "password"].includes(key)
      ) {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        ) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        } else {
          return NextResponse.json(
            { success: false, message: `Invalid type for field: ${key}` },
            { status: 400 }
          );
        }
      }
    }

    if (fields.length > 0) {
      values.push(employeeId);
      queries.push({
        text: `UPDATE employee_personal_details
               SET ${fields.join(", ")}, updated_at = NOW()
               WHERE employee_id = $${paramIndex}`,
        params: values,
      });
    }

    // Execute all queries in a transaction
    if (queries.length > 0) {
      await executeTransaction(queries);
    }

    // Get updated employee data
    const result = await executeQuery(
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
        ...(result.rows[0] as Employee),
        manager_id: isManagerPromotionRequest
          ? managerId
          : (result.rows[0] as Employee).manager_id,
      },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const { id: employeeId } = params;

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    // First check if employee exists and isn't already deleted
    const checkEmployee = await executeQuery(
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
    const result = await executeQuery(
      `UPDATE employee_personal_details
       SET deleted_at = NOW()
       WHERE employee_id = $1 AND deleted_at IS NULL
       RETURNING employee_id, email`,
      [employeeId]
    );

    const response = NextResponse.json({
      success: true,
      message: "Employee soft-deleted successfully",
      deletedEmployee: result.rows[0] as Pick<Employee, 'employee_id' | 'email'>,
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