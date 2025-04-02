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
    
    // 获取要更新的数据
    const userData = await request.json();
    
    // 验证必须字段
    if (!userData.name) {
      return NextResponse.json(
        { error: "姓名不能为空" },
        { status: 400 }
      );
    }
    
    // 更新users表中的用户信息
    const { error: updateError } = await supabase
      .from("users")
      .update({
        name: userData.name,
        school: userData.school || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);
    
    if (updateError) {
      console.error("更新用户数据失败:", updateError);
      return NextResponse.json(
        { error: "更新用户信息失败", details: updateError },
        { status: 500 }
      );
    }
    
    // 同时更新Auth用户元数据
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name: userData.name,
        school: userData.school
      }
    });
    
    // 获取更新后的用户数据
    const { data: updatedUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { 
          success: true,
          message: "用户信息已更新，但无法获取最新数据" 
        }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("更新用户信息出错:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 