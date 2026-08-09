import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const isProtected = createRouteMatcher(['/chat(.*)', '/dashboard(.*)'])

const publicClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const authMiddleware = publicClerkKey
  ? clerkMiddleware((auth, req) => {
      const { userId } = auth()

      // The root route is the functional Nexora workspace for both guest and signed-in users.
      if (!userId && isProtected(req)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    })
  : (req: NextRequest) => NextResponse.next()

export default authMiddleware

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
