import { NextResponse } from "next/server";
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

  if (process.env.RUN_FROM === "locally") {
    // Local PostgreSQL with pg pool
    const { query } = await import("@/lib/db");

    try {
      const userResult = await query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const user = userResult.rows[0];
      const passwordMatch = await comparePasswords(password, user.password_hash);

      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const accessToken = generateAccessToken(user.id, "admin");
      const refreshToken = generateRefreshToken(user.id, "admin");

      // Store refresh token in database
      await query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
        [user.id, refreshToken]
      );

      const { password_hash, ...userWithoutPassword } = user;

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          ...userWithoutPassword,
          role: "admin",
        },
        accessToken,
        refreshToken,
      });

      // Set HTTP-only cookies
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
      });

      response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      });

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Internal server error",
          error: process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "An unknown error occurred"
            : undefined,
        },
        { status: 500 }
      );
    }
  } else {
    // Serverless Neon database
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    try {
      // Check if user exists using tagged template literal
      const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;

      if (userResult.length === 0) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const user = userResult[0];
      const passwordMatch = await comparePasswords(password, user.password_hash);

      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      const accessToken = generateAccessToken(user.id, "admin");
      const refreshToken = generateRefreshToken(user.id, "admin");

      // Store refresh token in database using tagged template literal
      await sql`
        INSERT INTO refresh_tokens (user_id, token, expires_at) 
        VALUES (${user.id}, ${refreshToken}, NOW() + INTERVAL '7 days')
      `;

      const { password_hash, ...userWithoutPassword } = user;

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          ...userWithoutPassword,
          role: "admin",
        },
        accessToken,
        refreshToken,
      });

      // Set HTTP-only cookies
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
      });

      response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "strict",
        maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
      });

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Internal server error",
          error: process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "An unknown error occurred"
            : undefined,
        },
        { status: 500 }
      );
    }
  }
}