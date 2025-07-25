import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyAndRefreshTokens } from "@/lib/authUtils";

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

    // Fetch all employee data in parallel
    const [personalDetails, departmentHistory, performanceHistory] =
      await Promise.all([
        // Personal Details
        query(
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
        query(
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
        query(
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

    return NextResponse.json({
      success: true,
      data: {
        personal_details: personalDetails.rows[0],
        department_history: departmentHistory.rows,
        performance_history: performanceHistory.rows,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "An unknown error occurred" : undefined,
      },
      { status: 500 }
    );
  }
}
