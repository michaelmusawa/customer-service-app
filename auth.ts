import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { getUser } from '@/app/lib/action';

const prisma = new PrismaClient()


export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            const session = await prisma.session.create({
              data: {
                userId: user.id,
                sessionToken: `token-${Date.now()}`, // Generate or use a JWT here if needed
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiration
              },
            });
            console.log('Session created:', session);
            return { ...user, role: user.role }
        }
      }
 
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});