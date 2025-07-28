import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  verifyAndRefreshTokens,
  setAuthCookies,
  AuthTokens,
} from "@/lib/authUtils";
import { getTokenInfo } from "@/lib/tokenUtils";

export async function POST(request: Request) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    const { userRole, reviewerManagerId } = getTokenInfo(accessToken);

    const requestData = await request.json();

    // Validate employee_id format
    if (!/^(EMP)[a-zA-Z0-9]+$/.test(requestData.employee_id)) {
      return NextResponse.json(
        { success: false, message: "Invalid Employee ID format" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["employee_id", "performance_score"];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Only managers can create performance reviews
    if (userRole !== "manager") {
      return NextResponse.json(
        {
          success: false,
          message: "Only managers can create performance reviews",
        },
        { status: 403 }
      );
    }

    // Check if employee exists and is not deleted
    const employeeCheck = await query(
      `SELECT employee_id, manager_id FROM employee_personal_details 
       WHERE employee_id = $1 AND deleted_at IS NULL`,
      [requestData.employee_id]
    );

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found or is inactive" },
        { status: 404 }
      );
    }

    // Get department for the employee being reviewed
    const employeeDept = await query(
      `SELECT department_name 
       FROM department_designation_history 
       WHERE employee_id = $1 AND is_active = true
       LIMIT 1`,
      [requestData.employee_id]
    );

    if (employeeDept.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee department not found" },
        { status: 404 }
      );
    }

    // Get department for the manager (using manager_id from token)
    const managerDept = await query(
      `SELECT d.department_name
       FROM department_designation_history d
       JOIN employee_personal_details e ON d.employee_id = e.employee_id
       WHERE e.manager_id = $1 AND d.is_active = true
       LIMIT 1`,
      [reviewerManagerId]
    );

    if (managerDept.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Manager department not found" },
        { status: 404 }
      );
    }

    // Check if departments match
    if (
      employeeDept.rows[0].department_name !==
      managerDept.rows[0].department_name
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Department mismatch - you can only review employees in your department",
          details: {
            employeeDepartment: employeeDept.rows[0].department_name,
            managerDepartment: managerDept.rows[0].department_name,
          },
        },
        { status: 403 }
      );
    }

    // Validate performance score range
    if (
      requestData.performance_score < 0 ||
      requestData.performance_score > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Performance score must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    // Validate bonus_awarded if provided
    if (
      requestData.bonus_awarded &&
      (isNaN(requestData.bonus_awarded) || requestData.bonus_awarded < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bonus amount must be a positive number",
        },
        { status: 400 }
      );
    }

    // Start a transaction
    await query("BEGIN");

    // Insert new performance record
    const result = await query(
      `INSERT INTO performance_history (
        employee_id,
        reviewer_id,
        performance_score,
        key_strengths,
        areas_for_improvement,
        goals_achieved,
        next_period_goals,
        feedback,
        promotion_eligible,
        bonus_awarded
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        requestData.employee_id,
        reviewerManagerId,
        requestData.performance_score,
        requestData.key_strengths || null,
        requestData.areas_for_improvement || null,
        requestData.goals_achieved || null,
        requestData.next_period_goals || null,
        requestData.feedback || null,
        requestData.promotion_eligible || false,
        requestData.bonus_awarded || null,
      ]
    );

    // If bonus is awarded, update the employee's salary
    if (requestData.bonus_awarded) {
      await query(
        `UPDATE department_designation_history
         SET salary_per_month_npr = salary_per_month_npr + $1
         WHERE employee_id = $2 AND is_active = true`,
        [requestData.bonus_awarded, requestData.employee_id]
      );
    }

    // Commit the transaction
    await query("COMMIT");

    const response = NextResponse.json(
      {
        success: true,
        message: "Performance review created successfully",
        performance: result.rows[0],
      },
      { status: 201 }
    );

    if (tokenResult.accessToken !== accessToken) {
      setAuthCookies(response, { accessToken, refreshToken });
    }

    return response;
  } catch (error) {
    // Rollback the transaction in case of error
    await query("ROLLBACK");

    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        errorMessage =
          "Invalid employee or reviewer reference. Please check the IDs.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
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
