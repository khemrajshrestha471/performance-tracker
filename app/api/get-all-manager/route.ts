import { NextResponse } from 'next/server';
import { verifyAndRefreshTokens, setAuthCookies, AuthTokens } from '@/lib/authUtils';

interface Manager {
  employee_id: string;
  manager_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: string | null;
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

export async function GET() {
  try {
    // Verify tokens
    const tokenResult = await verifyAndRefreshTokens();
    if (tokenResult instanceof NextResponse) return tokenResult;

    const { accessToken, refreshToken } = tokenResult as AuthTokens;

    // Get all active managers (non-deleted)
    const managersQuery = `
      SELECT 
        employee_id,
        manager_id, 
        first_name, 
        last_name, 
        email, 
        phone_number,
        date_of_birth
      FROM employee_personal_details 
      WHERE deleted_at IS NULL
      AND manager_id IS NOT NULL
      ORDER BY last_name, first_name
    `;

    const managersResult = await executeQuery<Manager>(managersQuery, []);
    const managers = managersResult.rows;

    // Create response
    const response = NextResponse.json({
      success: true,
      count: managers.length,
      managers: managers,
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
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}