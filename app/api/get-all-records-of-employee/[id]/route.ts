import { NextResponse } from 'next/server';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

// Type Definitions
interface EmployeePersonalDetails {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  current_address: string | null;
  permanent_address: string | null;
  marital_status: string | null;
  blood_group: string | null;
  created_at: string;
}

interface DepartmentDesignationHistory {
  history_id: string;
  department_name: string;
  designation: string;
  start_date: string;
  end_date: string | null;
  reporting_manager_id: string | null;
  is_active: boolean;
  salary_per_month_npr: number;
  created_at: string;
}

interface PerformanceHistory {
  performance_id: string;
  employee_id: string;
  employee_name: string;
  review_date: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  performance_score: number;
  key_strengths: string | null;
  areas_for_improvement: string | null;
  goals_achieved: string | null;
  next_period_goals: string | null;
  feedback: string | null;
  promotion_eligible: boolean;
  bonus_awarded: boolean;
  created_at: string;
}

interface EmployeeDataResponse {
  personal_details: EmployeePersonalDetails;
  department_history: DepartmentDesignationHistory[];
  performance_history: PerformanceHistory[];
}

interface QueryResult<T> {
  rows: T[];
}

type QueryParam = string | number | boolean | null;

async function executeQuery<T>(queryText: string, params: QueryParam[] = []): Promise<QueryResult<T>> {
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

interface RequestParams {
  id: string;
}

export async function GET(
  request: Request,
  { params }: { params: RequestParams }
) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;
    const employeeId = params.id;

    // Validate employee ID
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

    // Fetch all employee data in parallel
    const [personalDetails, departmentHistory, performanceHistory] = await Promise.all([
      // Personal Details
      executeQuery<EmployeePersonalDetails>(
        `SELECT 
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
          created_at
        FROM employee_personal_details 
        WHERE employee_id = $1`,
        [employeeId]
      ),

      // Department and Designation History
      executeQuery<DepartmentDesignationHistory>(
        `SELECT 
          history_id,
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
      ),

      // Performance History
      executeQuery<PerformanceHistory>(
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
      ),
    ]);

    // Check if employee exists
    if (personalDetails.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Create response
    const responseData: EmployeeDataResponse = {
      personal_details: personalDetails.rows[0],
      department_history: departmentHistory.rows,
      performance_history: performanceHistory.rows,
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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}