import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";
import { LoginData } from "@/types/auth";

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
    const managerResult = await query(
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
    const departmentResult = await query(
      `SELECT department_name 
       FROM department_designation_history 
       WHERE employee_id = $1 
       AND is_active = true
       ORDER BY start_date DESC
       LIMIT 1`,
      [manager.employee_id]
    );

    // 3. Get current designation information (added based on your table structure)
    const designationResult = await query(
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
      department, // Include department in token if needed
      designation // Include designation in token if needed
    };

    // 5. Generate tokens
    const accessToken = generateAccessToken(managerForToken, "manager");
    const refreshToken = generateRefreshToken(managerForToken, "manager");

    // 6. Store refresh token in database
    await query(
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
      },
      { status: 500 }
    );
  }
}