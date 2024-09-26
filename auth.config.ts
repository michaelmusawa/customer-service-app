import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

declare module "next-auth" {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string
      role: string
      image?: string | null
      name?: string | null
      email?: string | null
    }
  }
}
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        
      }
      return token
    },
    async session ({ session, token}) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  providers: [Credentials], 
} satisfies NextAuthConfig;

