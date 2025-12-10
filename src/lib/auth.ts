import { hash, compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_REGION } from "@/data/regions";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function createUser(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomUUID();
  
  await db.insert(users).values({
    id: userId,
    email,
    password: hashedPassword,
    emailVerified: null,
    preferredRegion: DEFAULT_REGION,
  });

  return { id: userId, email };
}

