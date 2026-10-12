import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    homeWardId: string | null;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      homeWardId: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    homeWardId: string | null;
    mustChangePassword: boolean;
  }
}
