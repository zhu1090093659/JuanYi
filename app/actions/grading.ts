"use server"

import { gradeAnswer, generateFeedback } from "@/lib/ai"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// 评分 Server Action
export async function gradeStudentAnswer(questionId: string, studentId: string, examId: string) {
  const supabase = createClient()

  // 获取题目信息
  const { data: question } = await supabase.from("questions").select("*").eq("id", questionId).single()

  if (!question) {
    throw new Error("题目不存在")
  }

  // 获取学生答案
  const { data: answer } = await supabase
    .from("answers")
    .select("*")
    .eq("question_id", questionId)
    .eq("student_id", studentId)
    .eq("exam_id", examId)
    .single()

  if (!answer) {
    throw new Error("答案不存在")
  }

  // 使用 AI 评分
  const result = await gradeAnswer(question.content, question.standard_answer, answer.content, question.score)

  // 更新数据库中的评分结果
  await supabase.from("grades").upsert({
    exam_id: examId,
    question_id: questionId,
    student_id: studentId,
    score: result.score,
    ai_score: result.score,
    ai_confidence: result.confidence,
    feedback: result.feedback,
    scoring_points: result.scoringPoints,
    graded_by: "ai",
    graded_at: new Date().toISOString(),
  })

  revalidatePath(`/exams/${examId}`)

  return result
}

// 教师修改评分 Server Action
export async function updateGrade(gradeId: string, score: number, feedback: string, examId: string) {
  const supabase = createClient()

  await supabase
    .from("grades")
    .update({
      score,
      feedback,
      graded_by: "teacher",
      graded_at: new Date().toISOString(),
    })
    .eq("id", gradeId)

  revalidatePath(`/exams/${examId}`)
}

// 批量评分 Server Action
export async function batchGradeExam(examId: string) {
  const supabase = createClient()

  // 获取考试信息
  const { data: exam } = await supabase.from("exams").select("*").eq("id", examId).single()

  if (!exam) {
    throw new Error("考试不存在")
  }

  // 更新考试状态为"评分中"
  await supabase.from("exams").update({ status: "grading" }).eq("id", examId)

  // 获取所有题目
  const { data: questions } = await supabase.from("questions").select("*").eq("exam_id", examId)

  // 获取所有答案
  const { data: answers } = await supabase.from("answers").select("*").eq("exam_id", examId)

  // 批量评分（这里可以使用队列或批处理来优化）
  for (const answer of answers || []) {
    const question = questions?.find((q) => q.id === answer.question_id)
    if (question) {
      try {
        await gradeStudentAnswer(question.id, answer.student_id, examId)
      } catch (error) {
        console.error(`评分错误: 学生 ${answer.student_id}, 题目 ${question.id}`, error)
      }
    }
  }

  // 更新考试状态为"已完成"
  await supabase
    .from("exams")
    .update({
      status: "completed",
      graded_at: new Date().toISOString(),
    })
    .eq("id", examId)

  revalidatePath(`/exams/${examId}`)
  revalidatePath("/dashboard")
}

// 生成学生反馈报告
export async function generateStudentReport(studentId: string, examId: string) {
  const supabase = createClient()

  // 获取学生信息
  const { data: student } = await supabase.from("users").select("*").eq("id", studentId).single()

  // 获取考试信息
  const { data: exam } = await supabase.from("exams").select("*, subjects(name)").eq("id", examId).single()

  // 获取学生在此考试中的所有评分
  const { data: grades } = await supabase
    .from("grades")
    .select("*, questions(*)")
    .eq("student_id", studentId)
    .eq("exam_id", examId)

  // 分析优势和弱点
  const strengths = []
  const weaknesses = []

  // 简单示例：分数高于80%的题目视为优势，低于60%的视为弱点
  for (const grade of grades || []) {
    const percentScore = (grade.score / grade.questions.score) * 100
    if (percentScore >= 80) {
      strengths.push(`${grade.questions.content} (得分率: ${percentScore.toFixed(0)}%)`)
    } else if (percentScore < 60) {
      weaknesses.push(`${grade.questions.content} (得分率: ${percentScore.toFixed(0)}%)`)
    }
  }

  // 使用 AI 生成个性化反馈
  const feedback = await generateFeedback(
    student?.name || "学生",
    exam?.subjects?.name || "未知科目",
    strengths,
    weaknesses,
  )

  // 保存反馈到数据库
  await supabase.from("reports").upsert({
    student_id: studentId,
    exam_id: examId,
    content: feedback,
    strengths,
    weaknesses,
    created_at: new Date().toISOString(),
  })

  return feedback
}

