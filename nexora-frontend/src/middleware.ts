import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher(['/chat(.*)', '/dashboard(.*)'])
const isPublic = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware((auth, req) => {
  const { userId } = auth()
  const { pathname } = req.nextUrl

  // Logged in + hitting landing page → go to chat
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  // Not logged in + hitting protected route → go to landing
  if (!userId && isProtected(req)) {
    return NextResponse.redirect(new URL('/', req.url))
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}