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
        role: "admin", // Explicitly setting role to Admin
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
      },
      { status: 500 }
    );
  }
}
