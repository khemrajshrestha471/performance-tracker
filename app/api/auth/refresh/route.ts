import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 1. Get refresh token from cookies or request body
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token is required" },
        { status: 400 }
      );
    }

    console.log("Received refresh token:", refreshToken);

    // 2. Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
      console.log("Decoded token:", decoded);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { success: false, message: "Invalid token signature" },
        { status: 401 }
      );
    }

    const { id, role } = decoded;

    // 3. Validate refresh token in database - ROLE-SPECIFIC QUERY
    let tokenResult;
    if (role === "admin") {
      tokenResult = await query(
        `SELECT * FROM refresh_tokens 
         WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
        [refreshToken, id]
      );
    } else if (role === "manager") {
      tokenResult = await query(
        `SELECT * FROM refresh_tokens 
         WHERE token = $1 AND manager_id = $2 AND expires_at > NOW()`,
        [refreshToken, id]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid user role" },
        { status: 400 }
      );
    }

    console.log("Token validation results:", tokenResult.rows);

    if (tokenResult.rows.length === 0) {
      // Additional debug logging
      const existsQuery =
        role === "admin"
          ? `SELECT EXISTS(SELECT 1 FROM refresh_tokens WHERE token = $1 AND user_id = $2)`
          : `SELECT EXISTS(SELECT 1 FROM refresh_tokens WHERE token = $1 AND manager_id = $2)`;

      const existsResult = await query(existsQuery, [refreshToken, id]);
      console.log("Token exists check:", existsResult.rows[0].exists);

      const expiredQuery = `SELECT expires_at < NOW() AS is_expired 
                          FROM refresh_tokens 
                          WHERE token = $1`;
      const expiredResult = await query(expiredQuery, [refreshToken]);
      console.log("Token expired check:", expiredResult.rows[0]?.is_expired);

      // Clear invalid tokens
      const response = NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 }
      );
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }

    // 4. Prepare entity data for new tokens
    const entityData = {
      id,
      ...(decoded.employee_id && { employee_id: decoded.employee_id }),
      ...(decoded.manager_id && { manager_id: decoded.manager_id }),
    };

    // 5. Generate new tokens
    const newAccessToken = generateAccessToken(entityData, role);
    const newRefreshToken = generateRefreshToken(entityData, role);

    // 6. Update refresh token in database - ROLE-SPECIFIC UPDATE
    if (role === "admin") {
      await query(
        `UPDATE refresh_tokens 
         SET token = $1, expires_at = NOW() + INTERVAL '7 days' 
         WHERE token = $2 AND user_id = $3`,
        [newRefreshToken, refreshToken, id]
      );
    } else if (role === "manager") {
      await query(
        `UPDATE refresh_tokens 
         SET token = $1, expires_at = NOW() + INTERVAL '7 days' 
         WHERE token = $2 AND manager_id = $3`,
        [newRefreshToken, refreshToken, id]
      );
    }

    // 7. Create response with new tokens
    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // 8. Set HTTP-only cookies
    response.cookies.set({
      name: "accessToken",
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 1800, // 30 minutes default
    });

    response.cookies.set({
      name: "refreshToken",
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 604800, // 7 days default
    });

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);

    // Clear tokens on error
    const response = NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to refresh token",
      },
      { status: 500 }
    );
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }
}
