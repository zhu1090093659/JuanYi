import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: Request) {
  try {
    // 解析JSON数据
    const data = await request.json()
    
    // 验证必要字段
    if (!data.examId || !data.studentId || !data.answerContent) {
      return NextResponse.json(
        { error: '缺少必要字段' },
        { status: 400 }
      )
    }

    // 验证图片数据
    if (!data.answerContent.startsWith('data:image/')) {
      return NextResponse.json(
        { error: '无效的图片格式' },
        { status: 400 }
      )
    }

    // 使用服务角色密钥创建 Supabase 客户端
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore }, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // 创建answers记录，直接存储base64数据
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .insert({
        student_id: data.studentId,
        exam_id: data.examId,
        content: data.answerContent, // 存储base64图片数据
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (answerError) {
      console.error('创建答案记录错误:', answerError)
      return NextResponse.json(
        { error: '创建答案记录失败', details: answerError },
        { status: 500 }
      )
    }

    // 更新试卷状态为已提交答案
    const { error: examUpdateError } = await supabase
      .from('exams')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.examId)

    if (examUpdateError) {
      console.error('更新试卷状态错误:', examUpdateError)
      // 不阻止流程，只记录错误
    }

    return NextResponse.json({
      success: true,
      message: '答案上传成功',
      answer: answer
    })
  } catch (error: any) {
    console.error('上传答案处理错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message },
      { status: 500 }
    )
  }
} 