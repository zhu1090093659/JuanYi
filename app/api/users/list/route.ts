import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 创建一个不依赖cookies的Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: Request) {
  try {
    // 从请求头中获取授权令牌
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "未提供授权令牌" },
        { status: 401 }
      );
    }
    
    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 通过令牌获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "无效的授权令牌" },
        { status: 401 }
      );
    }
    
    // 从users表获取当前用户详细信息
    const { data: currentUserData, error: currentUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (currentUserError || !currentUserData) {
      return NextResponse.json(
        { error: "获取用户信息失败" },
        { status: 500 }
      );
    }
    
    // 只有管理员和教师可以查看用户列表
    if (!["admin", "teacher"].includes(currentUserData.role)) {
      return NextResponse.json(
        { error: "权限不足" },
        { status: 403 }
      );
    }
    
    // 直接从users表获取所有用户
    let query = supabase.from("users").select("*");
    
    // 教师只能查看自己学校的用户
    if (currentUserData.role === "teacher" && currentUserData.school) {
      query = query.eq("school", currentUserData.school);
    }
    
    const { data: users, error: usersError } = await query;
    
    if (usersError) {
      console.error("获取用户列表失败:", usersError);
      return NextResponse.json(
        { error: "获取用户列表失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("获取用户列表出错:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 