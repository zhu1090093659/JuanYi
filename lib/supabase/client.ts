import { createClient } from "@supabase/supabase-js"
import type { SupabaseClientOptions } from "@supabase/supabase-js"

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 输出环境变量状态（仅开发环境）
if (process.env.NODE_ENV !== 'production') {
  console.log("Supabase配置状态:", {
    URL环境变量存在: !!supabaseUrl,
    ANON_KEY环境变量存在: !!supabaseAnonKey,
    站点URL: process.env.NEXT_PUBLIC_SITE_URL || '未设置'
  })
}

// 检查环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase环境变量缺失! 请设置NEXT_PUBLIC_SUPABASE_URL和NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Supabase客户端配置选项
const options: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true  // 启用检测URL中的会话信息
  }
}

// 创建客户端实例
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  options
)

