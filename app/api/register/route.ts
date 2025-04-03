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
    if (!email || !password || !userData.name || !userData.role) {
      return NextResponse.json(
        { error: "邮箱、密码、姓名和角色是必填字段" },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/callback`;
    
    // 使用Supabase创建用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: redirectTo,
      },
    });
    
    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "用户创建失败" },
        { status: 400 }
      );
    }

    // 在users表中创建用户记录
    const { error: dbError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email: email,
          name: userData.name,
          role: userData.role,
          school: userData.school || null,
          class: userData.class || null,
          teacher_id: userData.teacher_id || null,
        },
      ]);

    if (dbError) {
      // 如果创建users记录失败,尝试删除auth用户
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "用户数据创建失败: " + dbError.message },
        { status: 500 }
      );
    }
    
    // 用户创建成功
    return NextResponse.json(
      { 
        message: "用户注册成功，请验证邮箱", 
        emailConfirmed: !!authData.user?.email_confirmed_at 
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