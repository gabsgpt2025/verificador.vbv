// TODO: REMOVER - bypass temporário de senha
// Este arquivo implementa login sem senha para fins de teste.
// Remova este arquivo e todas as referências ao cookie "bypass_auth_role" antes de ir para produção.

import { NextRequest, NextResponse } from "next/server"

// TODO: REMOVER - bypass temporário de senha
const BYPASS_COOKIE = "bypass_auth_role"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const role = searchParams.get("role")
  const action = searchParams.get("action")

  // TODO: REMOVER - bypass temporário de senha
  // Clear the bypass cookie and redirect to login
  if (action === "logout") {
    const response = NextResponse.json({ success: true })
    response.cookies.delete(BYPASS_COOKIE)
    return response
  }

  // TODO: REMOVER - bypass temporário de senha
  // Set bypass cookie with the requested role and redirect to the appropriate dashboard
  if (role === "admin" || role === "user") {
    const redirectPath = role === "admin" ? "/admin/dashboard" : "/dashboard"
    const response = NextResponse.redirect(new URL(redirectPath, request.url))
    response.cookies.set(BYPASS_COOKIE, role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
      sameSite: "lax",
    })
    return response
  }

  return NextResponse.redirect(new URL("/auth/login", request.url))
}
