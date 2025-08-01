import { NextResponse } from "next/server";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";

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
  employee_id: string;
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

interface EmployeeExportData {
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
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return params ? `\${params[${parseInt(index) - 1}]}` : "";
    });

    const result = await eval(`sql\`${interpolatedQuery}\``);
    return { rows: result as T[] };
  }
}

export async function GET() {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Fetch all employee data in parallel
    const [employees, departmentHistories, performanceHistories] =
      await Promise.all([
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
          FROM employee_personal_details`
        ),

        executeQuery<DepartmentDesignationHistory>(
          `SELECT 
            history_id,
            employee_id,
            department_name,
            designation,
            start_date,
            end_date,
            reporting_manager_id,
            is_active,
            salary_per_month_npr,
            created_at
          FROM department_designation_history
          ORDER BY employee_id, start_date DESC`
        ),

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
          ORDER BY ph.employee_id, ph.review_date DESC`
        ),
      ]);

    // Structure the data by employee
    const employeesData: EmployeeExportData[] = employees.rows.map(
      (employee) => {
        const employeeId = employee.employee_id;

        const departmentHistory = departmentHistories.rows.filter(
          (history) => history.employee_id === employeeId
        );

        const performanceHistory = performanceHistories.rows.filter(
          (performance) => performance.employee_id === employeeId
        );

        return {
          personal_details: employee,
          department_history: departmentHistory,
          performance_history: performanceHistory,
        };
      }
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      data: employeesData,
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