import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const url = request.nextUrl

  // If user is logged in and trying to access login page, redirect to home
  if (token && (
    url.pathname === '/login'
  )) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is not logged in and trying to access protected pages, redirect to login
  if (!token && (
    url.pathname === '/' ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/admin')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/admin/:path*'
  ]
}