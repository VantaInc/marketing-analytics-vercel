import { type NextRequest, NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE, AUTH_STATE_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });

  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    maxAge: 0,
    path: "/",
  });
  response.cookies.set(AUTH_STATE_COOKIE, "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
