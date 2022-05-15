import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

const isLocalHost = (url: string) => {
  return url.indexOf('localhost') !== -1 || url.indexOf('127.0.0.1') !== -1;
};

export function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (
    !isLocalHost(req.url) &&
    req.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_BASE_URL as string,
      301,
    );
  }
  return NextResponse.next();
}
