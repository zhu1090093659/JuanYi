import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')

  // 如果有错误，重定向到带有错误信息的错误页面
  if (error) {
    console.error('验证回调错误:', { error, error_code, error_description })
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/verify-error?error=${error}&error_code=${error_code}&error_description=${encodeURIComponent(
        error_description || ''
      )}`
    )
  }

  // 无错误，且有code参数，处理验证
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('缺少Supabase环境变量')
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/verify-error?error=server_error&error_description=${encodeURIComponent(
          '服务器配置错误：缺少Supabase环境变量'
        )}`
      )
    }
    
    // 创建服务端Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('交换会话失败:', error)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/verify-error?error=exchange_failed&error_description=${encodeURIComponent(
            error.message || '验证码交换失败'
          )}`
        )
      }
    } catch (err) {
      console.error('处理验证时出错:', err)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/verify-error?error=unexpected_error&error_description=${encodeURIComponent(
          '验证处理过程中发生未知错误'
        )}`
      )
    }
  }

  // 重定向到成功页面或登录页面
  return NextResponse.redirect(`${requestUrl.origin}/auth/verify-success`)
} 