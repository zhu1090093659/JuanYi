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

export async function POST(request: Request) {
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
    
    // 获取请求数据
    const userData = await request.json();
    
    // 创建用户记录，确保id与Auth用户id一致
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: userData.name || user.user_metadata?.name || user.email?.split('@')[0] || "未命名用户",
        role: userData.role || user.user_metadata?.role || "student",
        school: userData.school || user.user_metadata?.school || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error("创建用户记录失败:", createError);
      return NextResponse.json(
        { error: "创建用户记录失败", details: createError },
        { status: 500 }
      );
    }
    
    // 如果Auth用户元数据中没有这些信息，同时更新Auth用户元数据
    if (!user.user_metadata?.name || !user.user_metadata?.role) {
      await supabase.auth.admin.updateUser(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name: newUser.name,
          role: newUser.role,
          school: newUser.school
        }
      });
    }
    
    return NextResponse.json({ 
      success: true,
      user: newUser
    });
  } catch (error) {
    console.error("创建用户记录出错:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 