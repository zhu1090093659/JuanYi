import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST(request: Request) {
  try {
    // 解析 FormData
    const formData = await request.formData()
    
    // 获取JSON数据
    const examData = JSON.parse(formData.get('examData') as string)
    
    // 获取文件
    const examFile = formData.get('examFile') as File
    const answerFile = formData.get('answerFile') as File

    // 验证必要字段
    if (!examData.name || !examData.subject_id || !examData.student_id) {
      return NextResponse.json(
        { error: '缺少必要字段' },
        { status: 400 }
      )
    }

    if (!examFile || !answerFile) {
      return NextResponse.json(
        { error: '缺少试卷或答案文件' },
        { status: 400 }
      )
    }

    // 使用服务角色密钥创建 Supabase 客户端
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore }, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // 上传试卷文件到存储桶
    const examFileName = `${Date.now()}_${examFile.name.replace(/\s+/g, '_')}`
    const examFilePath = `exams/${examData.student_id}/${examFileName}`

    const { data: examStorageData, error: examStorageError } = await supabase.storage
      .from('exams')
      .upload(examFilePath, examFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (examStorageError) {
      console.error('上传试卷文件错误:', examStorageError)
      return NextResponse.json(
        { error: '上传试卷文件失败', details: examStorageError },
        { status: 500 }
      )
    }

    // 上传答案文件到存储桶
    const answerFileName = `${Date.now()}_${answerFile.name.replace(/\s+/g, '_')}`
    const answerFilePath = `answers/${examData.student_id}/${examFileName.split('_')[0]}/${answerFileName}`

    const { data: answerStorageData, error: answerStorageError } = await supabase.storage
      .from('answers')
      .upload(answerFilePath, answerFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (answerStorageError) {
      console.error('上传答案文件错误:', answerStorageError)
      return NextResponse.json(
        { error: '上传答案文件失败', details: answerStorageError },
        { status: 500 }
      )
    }

    // 创建试卷记录
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        name: examData.name,
        subject_id: examData.subject_id,
        description: examData.description || null,
        notes: examData.notes || null,
        student_id: examData.student_id,
        exam_file_path: examFilePath,
        answer_file_path: answerFilePath,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (examError) {
      console.error('创建试卷记录错误:', examError)
      return NextResponse.json(
        { error: '创建试卷记录失败', details: examError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '试卷上传成功',
      exam: exam
    })
  } catch (error: any) {
    console.error('上传试卷处理错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message },
      { status: 500 }
    )
  }
} 