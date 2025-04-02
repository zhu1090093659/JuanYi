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
    
    // 从users表获取详细信息
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (error) {
      // 如果是"不存在记录"的错误，返回特定状态码
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { 
            error: "用户记录不存在",
            authUser: {
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata
            }
          },
          { status: 404 }
        );
      }
      
      console.error("获取用户数据失败:", error);
      return NextResponse.json(
        { error: "获取用户数据失败" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("获取用户信息出错:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 