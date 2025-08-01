import { NextResponse } from 'next/server';
import { comparePasswords, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { LoginData } from '@/types/auth';

async function executeQuery(queryText: string, params?: (string | number | boolean | null)[]) {
  if (process.env.RUN_FROM === "locally") {
    const { query } = await import("@/lib/db");
    const result = await query(queryText, params);
    return { rows: result.rows };
  } else {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Convert parameterized query to Neon's tagged template format
    const interpolatedQuery = queryText.replace(/\$(\d+)/g, (_, index) => {
      return params ? `\${params[${parseInt(index) - 1}]}` : '';
    });
    
    // Use eval to create the tagged template (careful with security here)
    const result = await eval(`sql\`${interpolatedQuery}\``);
    return { rows: result };
  }
}

export async function POST(request: Request) {
  const { email, password }: LoginData = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // 1. First check manager credentials
    const managerResult = await executeQuery(
      "SELECT * FROM manager_role WHERE email = $1",
      [email]
    );

    if (managerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const manager = managerResult.rows[0];
    const passwordMatch = await comparePasswords(
      password,
      manager.password_hash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2. Get current department information
    const departmentResult = await executeQuery(
      `SELECT department_name 
       FROM department_designation_history 
       WHERE employee_id = $1 
       AND is_active = true
       ORDER BY start_date DESC
       LIMIT 1`,
      [manager.employee_id]
    );

    // 3. Get current designation information
    const designationResult = await executeQuery(
      `SELECT designation
       FROM department_designation_history 
       WHERE employee_id = $1 
       AND is_active = true
       ORDER BY start_date DESC
       LIMIT 1`,
      [manager.employee_id]
    );

    const department = departmentResult.rows[0]?.department_name || null;
    const designation = designationResult.rows[0]?.designation || null;

    // 4. Prepare token payload
    const managerForToken = {
      id: manager.id,
      employee_id: manager.employee_id,
      manager_id: manager.manager_id,
      department,
      designation
    };

    // 5. Generate tokens
    const accessToken = generateAccessToken(managerForToken, "manager");
    const refreshToken = generateRefreshToken(managerForToken, "manager");

    // 6. Store refresh token in database
    await executeQuery(
      "INSERT INTO refresh_tokens (manager_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [manager.id, refreshToken]
    );

    // 7. Remove sensitive data from response
    const { password_hash, ...userWithoutPassword } = manager;

    // 8. Prepare response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        ...userWithoutPassword,
        role: "manager",
        department,
        designation
      },
      accessToken,
      refreshToken,
    });

    // 9. Set HTTP-only cookies
    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 1, // 1 day in seconds
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "An unknown error occurred" : undefined
      },
      { status: 500 }
    );
  }
}