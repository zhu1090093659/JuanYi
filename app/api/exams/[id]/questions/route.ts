import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const examId = context.params.id

    // 使用服务角色密钥创建 Supabase 客户端
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore }, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // 获取题目数据
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('number', { ascending: true })

    if (error) {
      console.error('获取题目数据失败:', error)
      return NextResponse.json(
        { error: '获取题目数据失败', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('服务器错误:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    )
  }
} 