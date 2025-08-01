import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

// Define types for performance history data
interface PerformanceHistory {
  performance_id: string;
  employee_id: string;
  employee_name: string;
  review_date: Date;
  reviewer_id: string | null;
  reviewer_name: string | null;
  performance_score: number;
  key_strengths: string;
  areas_for_improvement: string;
  goals_achieved: string;
  next_period_goals: string;
  feedback: string;
  promotion_eligible: boolean;
  bonus_awarded: boolean;
  created_at: Date;
}

interface QueryResult {
  rows: PerformanceHistory[];
  rowCount: number;
}

interface UpdatePerformanceData {
  review_date?: Date;
  reviewer_id?: string;
  performance_score?: number;
  key_strengths?: string;
  areas_for_improvement?: string;
  goals_achieved?: string;
  next_period_goals?: string;
  feedback?: string;
  promotion_eligible?: boolean;
  bonus_awarded?: boolean;
}

async function executeQuery(
  queryText: string,
  params: (string | number | boolean | Date | null)[] = []
): Promise<QueryResult> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    // Ensure rowCount is always a number, defaulting to 0 if null
    return {
      rows: result.rows as PerformanceHistory[],
      rowCount: result.rowCount ?? 0, // Use nullish coalescing to handle null
    };
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return params ? `\${params[${parseInt(index) - 1}]}` : "";
    });

    const result = await eval(`sql\`${interpolatedQuery}\``);
    return {
      rows: result as PerformanceHistory[],
      rowCount: result.length, // Neon returns array, so length is always a number
    };
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const employeeId = params.id;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    const performanceHistory = await executeQuery(
      `SELECT 
        ph.performance_id,
        ph.employee_id,
        e.first_name || ' ' || e.last_name AS employee_name,
        ph.review_date,
        ph.reviewer_id,
        r.first_name || ' ' || r.last_name AS reviewer_name,
        ph.performance_score,
        ph.key_strengths,
        ph.areas_for_improvement,
        ph.goals_achieved,
        ph.next_period_goals,
        ph.feedback,
        ph.promotion_eligible,
        ph.bonus_awarded,
        ph.created_at
      FROM performance_history ph
      JOIN employee_personal_details e ON ph.employee_id = e.employee_id
      LEFT JOIN employee_personal_details r ON ph.reviewer_id = r.employee_id
      WHERE ph.employee_id = $1
      ORDER BY ph.review_date DESC`,
      [employeeId]
    );

    // Return 404 if no records found
    if (performanceHistory.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No performance history found for this employee",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: performanceHistory.rows,
    });
  } catch (error) {
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const employeeId = params.id;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    // Get the update data from request body with type assertion
    const requestBody = (await request.json()) as UpdatePerformanceData;

    // Construct the update query dynamically based on provided fields
    const updateFields: string[] = [];
    const values: (string | number | boolean | Date | null)[] = [];
    let paramIndex = 1;

    // List of allowed fields that can be updated
    const allowedFields = [
      "review_date",
      "reviewer_id",
      "performance_score",
      "key_strengths",
      "areas_for_improvement",
      "goals_achieved",
      "next_period_goals",
      "feedback",
      "promotion_eligible",
      "bonus_awarded",
    ];

    for (const field of allowedFields) {
      if (requestBody[field as keyof UpdatePerformanceData] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(
          requestBody[field as keyof UpdatePerformanceData] as
            | string
            | number
            | boolean
            | Date
            | null
        );
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // Add employee_id to values at the end
    values.push(employeeId);

    const updateQuery = `
      UPDATE performance_history
      SET ${updateFields.join(", ")}
      WHERE employee_id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(updateQuery, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No performance record found for this employee or no changes made",
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Performance record updated successfully",
      data: result.rows[0],
    });

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
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
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
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const employeeId = params.id;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    if (!/^(EMP|MNG)[a-zA-Z0-9]+$/.test(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    const checkQuery = `
      SELECT performance_id FROM performance_history 
      WHERE employee_id = $1
      LIMIT 1
    `;
    const checkResult = await executeQuery(checkQuery, [employeeId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No performance records found for this employee",
        },
        { status: 404 }
      );
    }

    // Delete all performance records for this employee
    const deleteQuery = `
      DELETE FROM performance_history
      WHERE employee_id = $1
      RETURNING *
    `;
    const result = await executeQuery(deleteQuery, [employeeId]);

    const response = NextResponse.json({
      success: true,
      message: `Deleted ${result.rowCount} performance record(s) for employee ${employeeId}`,
      deletedCount: result.rowCount,
    });

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
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
