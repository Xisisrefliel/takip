import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUserByEmail, verifyPassword } from "@/lib/auth";
import { DEFAULT_REGION } from "@/data/regions";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email as string);
        if (!user || !user.password) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          preferredRegion: user.preferredRegion ?? DEFAULT_REGION,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.preferredRegion) {
        token.preferredRegion = session.preferredRegion;
      } else if (user) {
        token.id = user.id;
        token.preferredRegion =
          (user as { preferredRegion?: string | null }).preferredRegion ??
          DEFAULT_REGION;
      } else if (token.id && !token.preferredRegion) {
        const [dbUser] = await db
          .select({ preferredRegion: schema.users.preferredRegion })
          .from(schema.users)
          .where(eq(schema.users.id, token.id as string))
          .limit(1);

        token.preferredRegion = dbUser?.preferredRegion ?? DEFAULT_REGION;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.preferredRegion =
          (token.preferredRegion as string | undefined) ?? DEFAULT_REGION;
      }
      return session;
    },
  },
});

