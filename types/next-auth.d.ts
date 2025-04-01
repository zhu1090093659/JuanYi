import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * 扩展Session类型以包含额外的用户信息
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      school?: string;
      class?: string;
      emailVerified?: Date;
    };
  }

  /**
   * 扩展User类型以包含额外的用户信息
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    school?: string;
    class?: string;
    emailVerified?: Date;
  }
}

declare module "next-auth/jwt" {
  /**
   * 扩展JWT类型以包含额外的用户信息
   */
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    role?: string;
    school?: string;
    class?: string;
    emailVerified?: Date;
  }
} 