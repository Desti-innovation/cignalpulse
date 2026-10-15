import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/session"
import { decryptAdmin } from "@/lib/admin-session"

// User routes
const protectedRoutes = ["/dashboard"]
const publicOnlyRoutes = ["/login"]
const firstLoginRoutes = ["/change-password"]
const profileSetupRoutes = ["/complete-profile"]

// Admin routes
const adminProtectedRoutes = ["/admin"]
const adminPublicOnlyRoutes = ["/admin/login"]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ============================================================
  // ADMIN ROUTES — handled first, isolated from user logic
  // ============================================================
  const isAdminRoute = adminProtectedRoutes.some((r) => path.startsWith(r))
  if (isAdminRoute) {
    const isAdminPublicOnly = adminPublicOnlyRoutes.some((r) =>
      path.startsWith(r)
    )

    const adminCookie = request.cookies.get("admin_session")?.value
    const adminSession = adminCookie ? await decryptAdmin(adminCookie) : null

    // Not logged in as admin → trying to reach protected admin route
    if (!isAdminPublicOnly && !adminSession) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Logged in as admin → trying to reach the login page
    if (isAdminPublicOnly && adminSession) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    // Otherwise let it through
    return NextResponse.next()
  }

  // ============================================================
  // USER ROUTES — existing logic, unchanged
  // ============================================================
  const isProtected = protectedRoutes.some((r) => path.startsWith(r))
  const isPublicOnly = publicOnlyRoutes.some((r) => path.startsWith(r))
  const isFirstLoginRoute = firstLoginRoutes.some((r) => path.startsWith(r))
  const isProfileSetupRoute = profileSetupRoutes.some((r) => path.startsWith(r))

  const cookie = request.cookies.get("session")?.value
  const session = cookie ? await decrypt(cookie) : null

  // 1. Protected routes
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (isProtected && session?.firstLogin) {
    return NextResponse.redirect(new URL("/change-password", request.url))
  }
  if (isProtected && !session?.profileCompleted) {
    return NextResponse.redirect(new URL("/complete-profile", request.url))
  }

  // 2. Change password page
  if (isFirstLoginRoute && session && !session.firstLogin) {
    const target = session.profileCompleted ? "/dashboard" : "/complete-profile"
    return NextResponse.redirect(new URL(target, request.url))
  }

  // 3. Complete profile page
  if (isProfileSetupRoute && session) {
    if (session.firstLogin) {
      return NextResponse.redirect(new URL("/change-password", request.url))
    }
    if (session.profileCompleted) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // 4. Login page
  if (isPublicOnly && session) {
    const target = session.firstLogin
      ? "/change-password"
      : session.profileCompleted
      ? "/dashboard"
      : "/complete-profile"
    return NextResponse.redirect(new URL(target, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}