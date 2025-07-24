import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

export async function POST(request: Request) {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    const {
      employee_id,
      review_date,
      reviewer_id,
      performance_score,
      key_strengths,
      areas_for_improvement,
      goals_achieved,
      next_period_goals,
      feedback,
      promotion_eligible,
      bonus_awarded
    } = await request.json();

    // Validate required fields
    if (!employee_id || !review_date || !reviewer_id) {
      return NextResponse.json(
        { success: false, message: 'Employee ID, review date, and reviewer ID are required' },
        { status: 400 }
      );
    }

    // Validate performance score range if provided
    if (performance_score && (performance_score < 0 || performance_score > 100)) {
      return NextResponse.json(
        { success: false, message: 'Performance score must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Start a transaction
    await query('BEGIN');

    try {
      // Insert performance review
      const result = await query(
        `INSERT INTO performance_history (
          employee_id,
          review_date,
          reviewer_id,
          performance_score,
          key_strengths,
          areas_for_improvement,
          goals_achieved,
          next_period_goals,
          feedback,
          promotion_eligible,
          bonus_awarded
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          employee_id,
          review_date,
          reviewer_id,
          performance_score,
          key_strengths,
          areas_for_improvement,
          goals_achieved,
          next_period_goals,
          feedback,
          promotion_eligible,
          bonus_awarded
        ]
      );

      const newReview = result.rows[0];

      // If bonus is awarded, update the current salary_per_month_npr in department_designation_history
      if (bonus_awarded && bonus_awarded > 0) {
        console.log(`Processing bonus of ${bonus_awarded} for employee ${employee_id}`);
        
        // Get current salary_per_month_npr (using correct column name 'salary_per_month_npr' and field 'is_active')
        const currentSalaryResult = await query(
          `SELECT history_id, salary_per_month_npr FROM department_designation_history 
           WHERE employee_id = $1 AND is_active = TRUE 
           LIMIT 1`,
          [employee_id]
        );

        if (currentSalaryResult.rows.length > 0) {
          const currentRecord = currentSalaryResult.rows[0];
          const currentSalary = currentRecord.salary_per_month_npr || 0;
          const newSalary = Number(currentSalary) + Number(bonus_awarded);
          
          console.log(`Updating salary_per_month_npr from ${currentSalary} to ${newSalary} for history_id ${currentRecord.history_id}`);

          // Update the current salary_per_month_npr (using correct column name 'salary_per_month_npr')
          const updateResult = await query(
            `UPDATE department_designation_history 
             SET salary_per_month_npr = $1 
             WHERE history_id = $2 AND employee_id = $3
             RETURNING salary_per_month_npr`,
            [newSalary, currentRecord.history_id, employee_id]
          );

          console.log('salary_per_month_npr update result:', updateResult.rows[0]);
        } else {
          console.log('No current department record found, creating one');
          
          // Create a new current record with bonus as initial salary_per_month_npr
          const insertResult = await query(
            `INSERT INTO department_designation_history (
              employee_id, department_name, designation, 
              start_date, is_active, salary_per_month_npr
            ) VALUES ($1, 'Default Department', 'Default Designation', 
                     CURRENT_DATE, TRUE, $2)
            RETURNING salary_per_month_npr`,
            [employee_id, bonus_awarded]
          );
          
          console.log('New department record created with salary_per_month_npr:', insertResult.rows[0].salary_per_month_npr);
        }
      }

      // Commit the transaction
      await query('COMMIT');

      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'Performance review created successfully',
        data: newReview
      }, { status: 201 });

      // If tokens were refreshed, set new cookies
      if (tokenResult.accessToken !== accessToken) {
        setAuthCookies(response, { accessToken, refreshToken });
      }

      return response;

    } catch (innerError) {
      // Rollback transaction if any operation fails
      await query('ROLLBACK');
      throw innerError;
    }

  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : "An unknown error occurred" : undefined
      },
      { status: 500 }
    );
  }
}