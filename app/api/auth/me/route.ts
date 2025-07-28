import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifyAccessToken } from "@/lib/auth";
import { TokenPayload } from "@/types/auth";

export async function GET(request: Request) {
  try {
    // 1. Get token from HTTP-only cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated or Invalid token!" },
        { status: 401 }
      );
    }

    // 2. Verify token
    let tokenData: TokenPayload;
    
    try {
      tokenData = verifyAccessToken(token);
    } catch (error) {
      // Clear invalid token cookie
      const response = NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
      response.cookies.delete("accessToken");
      return response;
    }

    // 3. Handle Admin role
    if (tokenData.role === "admin") {
      const userResult = await query(
        `SELECT 
          id, 
          full_name, 
          email, 
          phone_number, 
          company_website, 
          pan_number, 
          created_at, 
          updated_at 
         FROM users 
         WHERE id = $1`,
        [tokenData.id]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Admin user not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          ...userResult.rows[0],
          role: "admin"
        }
      });
    }

    // 4. Handle Manager role
    if (tokenData.role === "manager") {
      if (!tokenData.employee_id) {
        return NextResponse.json(
          { success: false, message: "Employee ID missing in token" },
          { status: 401 }
        );
      }

      // Get manager's personal details
      const managerResult = await query(
        `SELECT 
          id, 
          employee_id, 
          manager_id, 
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
          created_at, 
          updated_at 
         FROM employee_personal_details 
         WHERE employee_id = $1`,
        [tokenData.employee_id]
      );

      if (managerResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "Manager not found" },
          { status: 404 }
        );
      }

      // Get manager's current department and designation
      const departmentDesignationResult = await query(
        `SELECT 
          department_name, 
          designation
         FROM department_designation_history 
         WHERE employee_id = $1 
         AND is_active = true
         ORDER BY start_date DESC
         LIMIT 1`,
        [tokenData.employee_id]
      );

      const department = departmentDesignationResult.rows[0]?.department_name || null;
      const designation = departmentDesignationResult.rows[0]?.designation || null;

      return NextResponse.json({
        success: true,
        user: {
          ...managerResult.rows[0],
          role: "manager",
          department,
          designation
        }
      });
    }

    // 5. Handle unknown roles
    return NextResponse.json(
      { success: false, message: "Unauthorized role" },
      { status: 403 }
    );

  } catch (error) {
    console.error("Error in /auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}