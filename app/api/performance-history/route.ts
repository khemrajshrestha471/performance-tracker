import { NextResponse } from 'next/server';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';
import { getTokenInfo } from '@/lib/tokenUtils';

// Database-related types
type QueryParam = string | number | boolean | null;
type QueryParams = QueryParam[];
interface QueryObject {
  text: string;
  params?: QueryParams;
}

interface QueryResult<T> {
  rows: T[];
}

// Request/response types
interface PerformanceReviewRequest {
  employee_id: string;
  performance_score: number;
  key_strengths?: string;
  areas_for_improvement?: string;
  goals_achieved?: string;
  next_period_goals?: string;
  feedback?: string;
  promotion_eligible?: boolean;
  bonus_awarded?: number;
}

interface EmployeeDetails {
  employee_id: string;
  manager_id: string;
}

interface DepartmentDetails {
  department_name: string;
}

interface PerformanceReviewRecord {
  employee_id: string;
  reviewer_id: string;
  performance_score: number;
  key_strengths: string | null;
  areas_for_improvement: string | null;
  goals_achieved: string | null;
  next_period_goals: string | null;
  feedback: string | null;
  promotion_eligible: boolean;
  bonus_awarded: number | null;
}

interface SuccessResponse {
  success: true;
  message: string;
  performance: PerformanceReviewRecord;
}

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: Record<string, string>;
}

type ApiResponse = SuccessResponse | ErrorResponse;

// Execute a single query
async function executeQuery<T>(queryText: string, params?: QueryParams): Promise<QueryResult<T>> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    return { rows: result.rows as T[] };
  } else {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return params ? `\${params[${parseInt(index) - 1}]}` : '';
    });
    
    const result = await eval(`sql\`${interpolatedQuery}\``);
    return { rows: result as T[] };
  }
}

// Execute multiple queries in a transaction
async function executeTransaction(queries: QueryObject[]): Promise<QueryResult<PerformanceReviewRecord>[]> {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    try {
      await query("BEGIN");
      const results: QueryResult<PerformanceReviewRecord>[] = [];
      for (const q of queries) {
        const result = await query(q.text, q.params);
        results.push({ rows: result.rows as PerformanceReviewRecord[] });
      }
      await query("COMMIT");
      return results;
    } catch (error) {
      await query("ROLLBACK");
      throw new Error("Transaction failed: " + (error instanceof Error ? error.message : String(error)));
    }
  } else {
    try {
      const results: QueryResult<PerformanceReviewRecord>[] = [];
      for (const q of queries) {
        const result = await executeQuery<PerformanceReviewRecord>(q.text, q.params);
        results.push(result);
      }
      return results;
    } catch (error) {
      throw new Error("Transaction failed: " + (error instanceof Error ? error.message : String(error)));
    }
  }
}

function createErrorResponse(message: string, status: number, details?: Record<string, string>): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === "development" && { error: message })
  };
  return NextResponse.json(response, { status });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult as NextResponse<ErrorResponse>;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const tokenInfo = getTokenInfo(accessToken);
    const { userRole, reviewerManagerId } = tokenInfo;

    const requestData: PerformanceReviewRequest = await request.json();

    // Validate employee_id format
    if (!/^(EMP)[a-zA-Z0-9]+$/.test(requestData.employee_id)) {
      return createErrorResponse("Invalid Employee ID format", 400);
    }

    // Validate required fields
    const requiredFields: (keyof PerformanceReviewRequest)[] = ["employee_id", "performance_score"];
    for (const field of requiredFields) {
      if (requestData[field] === undefined || requestData[field] === null) {
        return createErrorResponse(`${field} is required`, 400);
      }
    }

    // Only managers can create performance reviews
    if (userRole !== "manager") {
      return createErrorResponse("Only managers can create performance reviews", 403);
    }

    // Check if employee exists and is not deleted
    const employeeCheck = await executeQuery<EmployeeDetails>(
      `SELECT employee_id, manager_id FROM employee_personal_details 
       WHERE employee_id = $1 AND deleted_at IS NULL`,
      [requestData.employee_id]
    );

    if (employeeCheck.rows.length === 0) {
      return createErrorResponse("Employee not found or is inactive", 404);
    }

    // Get department for the employee being reviewed
    const employeeDept = await executeQuery<DepartmentDetails>(
      `SELECT department_name 
       FROM department_designation_history 
       WHERE employee_id = $1 AND is_active = true
       LIMIT 1`,
      [requestData.employee_id]
    );

    if (employeeDept.rows.length === 0) {
      return createErrorResponse("Employee department not found", 404);
    }

    // Get department for the manager
    const managerDept = await executeQuery<DepartmentDetails>(
      `SELECT d.department_name
       FROM department_designation_history d
       JOIN employee_personal_details e ON d.employee_id = e.employee_id
       WHERE e.manager_id = $1 AND d.is_active = true
       LIMIT 1`,
      [reviewerManagerId]
    );

    if (managerDept.rows.length === 0) {
      return createErrorResponse("Manager department not found", 404);
    }

    // Check if departments match
    if (employeeDept.rows[0].department_name !== managerDept.rows[0].department_name) {
      return createErrorResponse(
        "Department mismatch - you can only review employees in your department",
        403,
        {
          employeeDepartment: employeeDept.rows[0].department_name,
          managerDepartment: managerDept.rows[0].department_name
        }
      );
    }

    // Validate performance score range
    if (requestData.performance_score < 0 || requestData.performance_score > 100) {
      return createErrorResponse("Performance score must be between 0 and 100", 400);
    }

    // Validate bonus_awarded if provided
    if (requestData.bonus_awarded !== undefined && 
        (isNaN(requestData.bonus_awarded) || requestData.bonus_awarded < 0)) {
      return createErrorResponse("Bonus amount must be a positive number", 400);
    }

    // Prepare transaction queries
    const transactionQueries: QueryObject[] = [
      {
        text: `INSERT INTO performance_history (
          employee_id, reviewer_id, performance_score,
          key_strengths, areas_for_improvement, goals_achieved,
          next_period_goals, feedback, promotion_eligible, bonus_awarded
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        params: [
          requestData.employee_id,
          reviewerManagerId,
          requestData.performance_score,
          requestData.key_strengths ?? null,
          requestData.areas_for_improvement ?? null,
          requestData.goals_achieved ?? null,
          requestData.next_period_goals ?? null,
          requestData.feedback ?? null,
          requestData.promotion_eligible ?? false,
          requestData.bonus_awarded ?? null,
        ]
      }
    ];

    // If bonus is awarded, add the update query to the transaction
    if (requestData.bonus_awarded) {
      transactionQueries.push({
        text: `UPDATE department_designation_history
               SET salary_per_month_npr = salary_per_month_npr + $1
               WHERE employee_id = $2 AND is_active = true`,
        params: [requestData.bonus_awarded, requestData.employee_id]
      });
    }

    // Execute the transaction
    const results = await executeTransaction(transactionQueries);
    const performanceResult = results[0].rows[0];

    const response = NextResponse.json<SuccessResponse>(
      {
        success: true,
        message: "Performance review created successfully",
        performance: performanceResult,
      },
      { status: 201 }
    );

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return createErrorResponse(errorMessage, 500);
  }
}