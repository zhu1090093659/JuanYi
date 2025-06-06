import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// 定义允许的题目类型
const ALLOWED_QUESTION_TYPES = [
  'objective',     // 客观题
  'subjective',    // 主观题
  'calculation',   // 计算题
  'essay'         // 论述题
]

export async function POST(request: Request) {
  try {
    // 解析 FormData
    const formData = await request.formData()
    
    // 获取 JSON 数据
    const examData = JSON.parse(formData.get('examData') as string)
    const questions = JSON.parse(formData.get('questions') as string)
    
    // 获取文件
    const examFile = formData.get('examFile') as File | null
    const examImages = formData.getAll('examImages') as File[]

    // 验证必要字段
    if (!examData.name || !examData.subject_id) {
      return NextResponse.json(
        { error: '缺少必要字段' },
        { status: 400 }
      )
    }

    // 使用服务角色密钥创建 Supabase 客户端
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore }, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    // 创建考试记录
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({
        name: examData.name,
        subject_id: examData.subject_id,
        description: examData.description || null,
        grade: examData.grade || null,
        class: examData.class || null,
        total_score: examData.total_score ? parseFloat(String(examData.total_score)) : null,
        exam_date: examData.exam_date || null,
        created_by: examData.created_by,
        status: examData.status || 'draft'
      })
      .select()
      .single()

    if (examError) {
      console.error('创建考试错误:', examError)
      return NextResponse.json(
        { error: '创建考试失败', details: examError },
        { status: 500 }
      )
    }

    const examId = exam.id

    // 确保存储桶存在
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.some(bucket => bucket.name === 'exam_files')) {
      const { error: createBucketError } = await supabase.storage.createBucket('exam_files', {
        public: false
      })
      if (createBucketError) {
        console.error('创建存储桶失败:', createBucketError)
        return NextResponse.json(
          { error: '创建存储桶失败', details: createBucketError },
          { status: 500 }
        )
      }
    }

    // 上传试卷文件
    if (examFile) {
      const examFilePath = `exams/${examId}/exam_file_${examFile.name}`
      const fileBuffer = await examFile.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('exam_files')
        .upload(examFilePath, fileBuffer, {
          contentType: examFile.type,
          upsert: true
        })
        
      if (uploadError) {
        console.error('试卷文件上传失败:', uploadError)
        return NextResponse.json(
          { error: '试卷文件上传失败', details: uploadError },
          { status: 500 }
        )
      }
    }

    // 上传试卷图片
    if (examImages && examImages.length > 0) {
      for (let i = 0; i < examImages.length; i++) {
        const image = examImages[i]
        const imagePath = `exams/${examId}/exam_image_${i+1}_${image.name}`
        const imageBuffer = await image.arrayBuffer()
        
        const { error: uploadError } = await supabase.storage
          .from('exam_files')
          .upload(imagePath, imageBuffer, {
            contentType: image.type,
            upsert: true
          })
          
        if (uploadError) {
          console.error(`试卷图片 ${i+1} 上传失败:`, uploadError)
          return NextResponse.json(
            { error: `试卷图片 ${i+1} 上传失败`, details: uploadError },
            { status: 500 }
          )
        }
      }
    }

    // 保存题目
    if (questions && questions.length > 0) {
      // 验证并格式化题目
      const formattedQuestions = questions.map((q: any) => {
        // 验证题目类型
        const questionType = q.type?.toLowerCase() || 'objective'
        if (!ALLOWED_QUESTION_TYPES.includes(questionType)) {
          console.warn(`未知的题目类型: ${questionType}，将使用默认类型: objective`)
        }

        return {
          exam_id: examId,
          number: parseInt(q.id) || 1,
          content: q.content,
          type: ALLOWED_QUESTION_TYPES.includes(questionType) ? questionType : 'objective',
          standard_answer: q.answer || '',
          score: parseFloat(String(q.score)) || 0
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(formattedQuestions)
        
      if (questionsError) {
        console.error('题目保存失败:', questionsError)
        return NextResponse.json(
          { error: '题目保存失败', details: questionsError },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, examId })
  } catch (error: any) {
    console.error('创建考试过程中出错:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    )
  }
} 