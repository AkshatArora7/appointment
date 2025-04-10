import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    clientId?: string | null;
    clientSlug?: string | null;
    clientName?: string | null;
    clientType?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      clientId?: string | null;
      clientSlug?: string | null;
      clientName?: string | null;
      clientType?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    clientId?: string | null;
    clientSlug?: string | null;
    clientName?: string | null;
    clientType?: string | null;
  }
}
