import { auth } from "@/auth";
import { SettingsForm } from "@/components/SettingsForm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEFAULT_REGION } from "@/data/regions";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user] =
    (session?.user?.id &&
      (await db
        .select({
          name: users.name,
          email: users.email,
          preferredRegion: users.preferredRegion,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1))) ||
    [];

  const initialName = user?.name ?? session?.user?.name ?? "";
  const initialEmail = user?.email ?? session?.user?.email ?? "";
  const initialRegion = user?.preferredRegion ?? session?.user?.preferredRegion ?? DEFAULT_REGION;

  return (
    <div className="min-h-screen py-8 sm:py-12 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-foreground/60 mt-1">Manage your account and preferences.</p>
      </div>
      
      <SettingsForm
        initialName={initialName}
        initialEmail={initialEmail}
        initialRegion={initialRegion}
      />
    </div>
  );
}
