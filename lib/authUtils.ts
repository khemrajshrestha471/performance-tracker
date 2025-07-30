import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { apiAxios } from "@/lib/apiAxios";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userId: number;
}

export async function verifyAndRefreshTokens(): Promise<
  AuthTokens | NextResponse
> {
  try {
    // Properly await the cookies() function
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    try {
      const payload = verifyAccessToken(accessToken);
      return {
        accessToken,
        refreshToken,
        userId: payload.id,
      };
    } catch (error) {
      console.error("Access token verification failed:", error);

      // Attempt to refresh tokens using apiAxios
      try {
        const { data: refreshData } = await apiAxios.post("/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = refreshData.accessToken;
        const payload = verifyAccessToken(newAccessToken);

        return {
          accessToken: newAccessToken,
          refreshToken: refreshData.refreshToken || refreshToken,
          userId: payload.id,
        };
      } catch (refreshError) {
        if (
          refreshError &&
          typeof refreshError === "object" &&
          "response" in refreshError &&
          refreshError.response &&
          typeof refreshError.response === "object" &&
          "status" in refreshError.response &&
          refreshError.response.status === 401
        ) {
          return NextResponse.json(
            { success: false, message: "Session expired" },
            { status: 401 }
          );
        }
        throw refreshError;
      }
    }
  } catch (error) {
    console.error("Error in verifyAndRefreshTokens:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Authentication error",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
): Promise<void> {
  try {
    // Set access token cookie
    response.cookies.set({
      name: "accessToken",
      value: tokens.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) || 60 * 15,
    });

    // Set refresh token cookie
    response.cookies.set({
      name: "refreshToken",
      value: tokens.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
      maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) || 60 * 60 * 24 * 7,
    });
  } catch (error) {
    console.error("Error setting auth cookies:", error);
    throw error;
  }
}
