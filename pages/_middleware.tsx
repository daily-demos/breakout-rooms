import  { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

type Environment = "production" | "development";

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  const currentEnv = process.env.NODE_ENV as Environment;

  if (currentEnv === 'production' &&
    req.headers.get("x-forwarded-proto") !== "https") {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_BASE_URL as string, 301);
  }
  return NextResponse.next();
}