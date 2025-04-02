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
    const { userId, role } = await request.json();
    
    // 验证数据
    if (!userId || !role) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 验证角色值
    if (!["admin", "teacher", "student"].includes(role)) {
      return NextResponse.json(
        { error: "无效的角色值" },
        { status: 400 }
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
    
    // 只有管理员可以更改用户角色
    if (currentUserData.role !== "admin") {
      return NextResponse.json(
        { error: "只有管理员可以更改用户角色" },
        { status: 403 }
      );
    }
    
    // 不能修改自己的角色
    if (userId === currentUserData.id) {
      return NextResponse.json(
        { error: "不能修改自己的角色" },
        { status: 400 }
      );
    }
    
    // 检查目标用户是否存在
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "找不到指定用户" },
        { status: 404 }
      );
    }
    
    // 1. 更新users表中的角色
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
    
    if (updateError) {
      console.error("更新用户角色失败:", updateError);
      return NextResponse.json(
        { error: "更新用户角色失败" },
        { status: 500 }
      );
    }
    
    // 2. 同时更新Auth用户元数据，保持一致性
    // 获取目标用户的Auth信息
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (!userError && userData?.user) {
      // 保留原有元数据，只更新角色
      const currentMetadata = userData.user.user_metadata || {};
      
      await supabase.auth.admin.updateUserById(
        userId,
        { 
          user_metadata: { 
            ...currentMetadata,
            role
          } 
        }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: "用户角色已更新" 
    });
  } catch (error) {
    console.error("更新用户角色出错:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
} 