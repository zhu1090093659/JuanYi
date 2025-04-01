import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

// 创建Supabase客户端
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "凭证登录",
      credentials: {
        email: { label: "邮箱", type: "email", placeholder: "您的邮箱地址" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        try {
          const supabase = createSupabaseClient();
          
          // 使用Supabase进行身份验证
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;
          
          if (!data.user) {
            throw new Error("用户未找到");
          }
          
          // 确保用户邮箱已验证
          if (!data.user.email_confirmed_at) {
            throw new Error("Email not confirmed");
          }
          
          // 获取用户详细信息
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();
            
          if (userError) throw userError;
          
          // 返回用户信息以用于NextAuth会话
          return {
            id: data.user.id,
            email: data.user.email,
            name: userData?.name,
            role: userData?.role,
            school: userData?.school,
            class: userData?.class,
            emailVerified: new Date(data.user.email_confirmed_at)
          };
        } catch (error: any) {
          console.error("授权错误:", error.message);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 初次登录时，将用户信息添加到token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.school = user.school;
        token.class = user.class;
        token.emailVerified = user.emailVerified || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      // 将token中的信息添加到session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.school = token.school as string;
        session.user.class = token.class as string;
        session.user.emailVerified = token.emailVerified as Date;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login", // 错误显示在登录页
    newUser: "/register", // 新用户注册页
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 