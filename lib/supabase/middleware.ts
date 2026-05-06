import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase env vars are not set, allow the request to continue
  // This prevents crashes during initial setup or when env vars are loading
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
  const isPublicRoute = request.nextUrl.pathname === "/"
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  const isProtectedRoute = !isAuthRoute && !isPublicRoute

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute && !request.nextUrl.pathname.includes("/verify-email")) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    const url = request.nextUrl.clone()
    if (profile?.role === "admin") {
      url.pathname = "/admin/dashboard"
    } else {
      url.pathname = "/dashboard"
    }
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to login for protected routes.
  // This block is skipped when NEXT_PUBLIC_REQUIRE_AUTH !== "true" (open-access mode).
  if (!user && isProtectedRoute && process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  if (user && request.nextUrl.pathname === "/dashboard") {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (profile?.role === "admin") {
      const url = request.nextUrl.clone()
      url.pathname = "/admin/dashboard"
      return NextResponse.redirect(url)
    }
  }

  if (user && request.ip) {
    try {
      // Check for suspicious patterns (multiple IPs, unusual user agents, etc.)
      const userAgent = request.headers.get("user-agent") || ""
      const isUnusualUserAgent = !userAgent.includes("Mozilla") && !userAgent.includes("Chrome")

      if (isUnusualUserAgent) {
        await supabase.from("suspicious_sessions").insert({
          user_id: user.id,
          suspicious_activity: "Unusual user agent detected",
          risk_level: "low",
          ip_address: request.ip,
          user_agent: userAgent,
        })
      }
    } catch (error) {
      // Silently fail to avoid breaking the request flow
      console.error("Error logging suspicious activity:", error)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
