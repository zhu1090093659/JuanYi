import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// 默认科目列表，当数据库访问失败时使用
const DEFAULT_SUBJECTS = [
  { id: "math", name: "数学" },
  { id: "physics", name: "物理" },
  { id: "chemistry", name: "化学" },
  { id: "biology", name: "生物" },
  { id: "chinese", name: "语文" },
  { id: "english", name: "英语" }
];

// 创建一个简单的API获取科目列表
export async function GET() {
  try {
    // 尝试创建Supabase客户端
    let supabase;
    try {
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ cookies: () => cookieStore }, {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      });
    } catch (clientError) {
      console.error("Supabase客户端创建失败:", clientError);
      // 返回默认科目列表
      return NextResponse.json({ subjects: DEFAULT_SUBJECTS });
    }

    // 检查必要的环境变量
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("Supabase环境变量未配置，使用默认科目列表");
      return NextResponse.json({ subjects: DEFAULT_SUBJECTS });
    }

    // 从数据库获取所有科目
    let result;
    try {
      result = await supabase
        .from("subjects")
        .select("*")
        .order("name", { ascending: true });
    } catch (dbError) {
      console.error("查询数据库错误:", dbError);
      return NextResponse.json({ subjects: DEFAULT_SUBJECTS });
    }
    
    // 处理查询错误
    if (result.error) {
      console.error("获取科目列表错误:", result.error);
      return NextResponse.json({ subjects: DEFAULT_SUBJECTS });
    }

    // 如果没有科目数据，则提供默认列表
    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      console.log("数据库中没有科目数据，使用默认列表");
      return NextResponse.json({ subjects: DEFAULT_SUBJECTS });
    }

    return NextResponse.json({ subjects: result.data });
    
  } catch (error: any) {
    console.error("处理科目列表请求错误:", error);
    // 确保即使出现严重错误也返回默认科目
    return NextResponse.json({ subjects: DEFAULT_SUBJECTS });
  }
} 