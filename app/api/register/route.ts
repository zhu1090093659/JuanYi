import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建Supabase客户端
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: Request) {
  try {
    const { email, password, userData } = await request.json();
    
    // 验证必要的字段
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码是必填字段" },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/callback`;
    
    // 使用Supabase创建用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // 用户创建成功
    return NextResponse.json(
      { 
        message: "用户注册成功，请验证邮箱", 
        emailConfirmed: !!data.user?.email_confirmed_at 
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("注册处理错误:", error);
    return NextResponse.json(
      { error: error.message || "注册处理出错" },
      { status: 500 }
    );
  }
} 