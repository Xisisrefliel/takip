import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      preferredRegion?: string | null;
    };
  }

  interface User {
    preferredRegion?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    preferredRegion?: string | null;
  }
}
