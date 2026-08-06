import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);

  clearAuthCookies(response);

  return response;
}
