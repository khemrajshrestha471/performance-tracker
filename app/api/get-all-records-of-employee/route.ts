import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyAndRefreshTokens } from "@/lib/authUtils";

export async function GET() {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    // Fetch all employee data in parallel
    const [employees, departmentHistories, performanceHistories] =
      await Promise.all([
        // All Employee Personal Details
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
         FROM employee_personal_details`
        ),

        // All Department and Designation Histories
        query(
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

        // All Performance Histories
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
         ORDER BY ph.employee_id, ph.review_date DESC`
        ),
      ]);

    // Structure the data by employee
    const employeesData = employees.rows.map((employee) => {
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
    });

    return NextResponse.json({
      success: true,
      data: employeesData,
    });
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
