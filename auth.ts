import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { z } from "zod";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { getUser } from "@/app/lib/action";
import poolPromise from "@/app/lib/db";
import sql from "mssql";

const prisma = new PrismaClient();

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
            try {
              const pool = await poolPromise; // Ensure the pool is connected
              const sessionToken = `token-${Date.now()}`; // Generate a session token
              const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour expiration
          
              // Insert session into the database
              const result = await pool.request()
                .input('userId', sql.VarChar, user.id) // Bind the user ID
                .input('sessionToken', sql.VarChar, sessionToken) // Bind the session token
                .input('expires', sql.DateTime, expirationDate) // Bind the expiration date
                .query(`
                  INSERT INTO [Session] (userId, sessionToken, expires)
                  OUTPUT INSERTED.*
                  VALUES (@userId, @sessionToken, @expires)
                `);
          
              const session = result.recordset[0]; // The newly created session
          
              // Return user with the role
              return { ...user, role: user.role };
            } catch (error) {
              console.error('Something went wrong creating a session:', error);
            }
          }
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
});
