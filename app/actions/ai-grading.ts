"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { gradeAnswer, batchGradeAnswers } from "@/lib/ai"

// 批量评分函数
export async function batchGradeExam(examId: string) {
  const supabase = createClient()

  try {
    // 更新考试状态为"评分中"
    await supabase.from("exams").update({ status: "grading" }).eq("id", examId)

    // 获取所有题目
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, content, standard_answer, score")
      .eq("exam_id", examId)

    if (questionsError) throw questionsError
    if (!questions || questions.length === 0) throw new Error("No questions found for this exam")

    // 获取所有未评分的答案
    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select(`
        id, 
        question_id, 
        student_id, 
        content,
        exam_id
      `)
      .eq("exam_id", examId)
      .not("id", "in", supabase.from("grades").select("answer_id").eq("exam_id", examId))

    if (answersError) throw answersError
    if (!answers || answers.length === 0) {
      // 如果没有未评分的答案，直接更新考试状态为已完成
      await supabase
        .from("exams")
        .update({
          status: "completed",
          graded_at: new Date().toISOString(),
        })
        .eq("id", examId)

      return { success: true, message: "All answers already graded" }
    }

    // 使用批量评分函数
    const gradingResults = await batchGradeAnswers(examId, questions, answers)

    // 将评分结果保存到数据库
    for (const result of gradingResults) {
      const answer = answers.find((a) => a.question_id === result.questionId && a.student_id === result.studentId)

      if (answer) {
        await supabase.from("grades").upsert({
          exam_id: examId,
          question_id: result.questionId,
          student_id: result.studentId,
          answer_id: answer.id,
          score: result.result.score,
          ai_score: result.result.score,
          ai_confidence: result.result.confidence,
          feedback: result.result.feedback,
          scoring_points: result.result.scoringPoints,
          graded_by: "ai",
          graded_at: new Date().toISOString(),
        })
      }
    }

    // 检查是否所有答案都已评分
    const { count: remainingCount, error: countError } = await supabase
      .from("answers")
      .select("id", { count: "exact" })
      .eq("exam_id", examId)
      .not("id", "in", supabase.from("grades").select("answer_id").eq("exam_id", examId))

    if (countError) throw countError

    // 如果所有答案都已评分，更新考试状态为已完成
    if (remainingCount === 0) {
      await supabase
        .from("exams")
        .update({
          status: "completed",
          graded_at: new Date().toISOString(),
        })
        .eq("id", examId)
    }

    revalidatePath(`/exams/${examId}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      gradedCount: gradingResults.length,
      remainingCount: remainingCount || 0,
    }
  } catch (error: any) {
    console.error("批量评分错误:", error)

    // 更新考试状态为错误
    await supabase.from("exams").update({ status: "error" }).eq("id", examId)

    throw new Error(`批量评分过程中发生错误: ${error.message}`)
  }
}

// 评分单个学生答案
export async function gradeStudentAnswer(questionId: string, studentId: string, examId: string) {
  const supabase = createClient()

  try {
    // 获取题目信息
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single()

    if (questionError) throw questionError
    if (!question) throw new Error("题目不存在")

    // 获取学生答案
    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", questionId)
      .eq("student_id", studentId)
      .eq("exam_id", examId)
      .single()

    if (answerError) throw answerError
    if (!answer) throw new Error("答案不存在")

    // 使用 AI 评分
    const result = await gradeAnswer(question.content, question.standard_answer, answer.content, question.score)

    // 更新数据库中的评分结果
    const { error: upsertError } = await supabase.from("grades").upsert({
      exam_id: examId,
      question_id: questionId,
      student_id: studentId,
      answer_id: answer.id,
      score: result.score,
      ai_score: result.score,
      ai_confidence: result.confidence,
      feedback: result.feedback,
      scoring_points: result.scoringPoints,
      graded_by: "ai",
      graded_at: new Date().toISOString(),
    })

    if (upsertError) throw upsertError

    revalidatePath(`/exams/${examId}`)
    revalidatePath(`/exams/${examId}/ai-grading`)

    return result
  } catch (error: any) {
    console.error("评分单个答案错误:", error)
    throw new Error(`评分过程中发生错误: ${error.message}`)
  }
}

// 教师修改 AI 评分
export async function updateGrade(
  gradeId: string,
  updates: {
    score?: number
    feedback?: string
    scoring_points?: string
  },
) {
  const supabase = createClient()

  try {
    // 获取原始评分信息
    const { data: grade, error: gradeError } = await supabase.from("grades").select("*").eq("id", gradeId).single()

    if (gradeError) throw gradeError
    if (!grade) throw new Error("评分记录不存在")

    // 更新评分
    const { error: updateError } = await supabase
      .from("grades")
      .update({
        ...updates,
        graded_by: "teacher", // 标记为教师修改
        teacher_modified_at: new Date().toISOString(),
      })
      .eq("id", gradeId)

    if (updateError) throw updateError

    revalidatePath(`/exams/${grade.exam_id}`)
    revalidatePath(`/exams/${grade.exam_id}/ai-grading`)
    revalidatePath(`/exams/${grade.exam_id}/review`)

    return { success: true }
  } catch (error: any) {
    console.error("更新评分错误:", error)
    throw new Error(`更新评分过程中发生错误: ${error.message}`)
  }
}

// 分析考试结果
export async function analyzeExamResults(examId: string) {
  const supabase = createClient()

  try {
    // 获取考试信息
    const { data: exam, error: examError } = await supabase.from("exams").select("*").eq("id", examId).single()

    if (examError) throw examError
    if (!exam) throw new Error("考试不存在")

    // 获取所有题目
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("number", { ascending: true })

    if (questionsError) throw questionsError
    if (!questions || questions.length === 0) throw new Error("No questions found for this exam")

    // 获取所有评分
    const { data: grades, error: gradesError } = await supabase
      .from("grades")
      .select(`
        *,
        students:users(id, name, class)
      `)
      .eq("exam_id", examId)

    if (gradesError) throw gradesError
    if (!grades || grades.length === 0) throw new Error("No grades found for this exam")

    // 计算统计数据
    const totalStudents = new Set(grades.map((g) => g.student_id)).size
    const totalQuestions = questions.length
    const totalPossibleScore = questions.reduce((sum, q) => sum + q.score, 0)

    // 计算平均分
    const studentScores = {}
    grades.forEach((grade) => {
      if (!studentScores[grade.student_id]) {
        studentScores[grade.student_id] = {
          total: 0,
          count: 0,
          student: grade.students,
        }
      }
      studentScores[grade.student_id].total += grade.score
      studentScores[grade.student_id].count++
    })

    const averageScore =
      Object.values(studentScores).reduce((sum: any, student: any) => sum + student.total, 0) / totalStudents

    // 计算及格率
    const passingScore = totalPossibleScore * 0.6
    const passingCount = Object.values(studentScores).filter((student: any) => student.total >= passingScore).length
    const passingRate = (passingCount / totalStudents) * 100

    // 计算题目难度
    const questionDifficulty = questions.map((question) => {
      const questionGrades = grades.filter((g) => g.question_id === question.id)
      const avgScore = questionGrades.reduce((sum, g) => sum + g.score, 0) / questionGrades.length
      const difficultyRate = (1 - avgScore / question.score) * 100

      return {
        questionId: question.id,
        questionNumber: question.number,
        avgScore,
        maxScore: question.score,
        difficultyRate,
      }
    })

    // 更新考试分析结果
    const { error: updateError } = await supabase.from("exam_analytics").upsert({
      exam_id: examId,
      average_score: averageScore,
      passing_rate: passingRate,
      highest_score: Math.max(...Object.values(studentScores).map((s: any) => s.total)),
      lowest_score: Math.min(...Object.values(studentScores).map((s: any) => s.total)),
      question_analytics: JSON.stringify(questionDifficulty),
      analyzed_at: new Date().toISOString(),
    })

    if (updateError) throw updateError

    revalidatePath(`/exams/${examId}`)
    revalidatePath(`/exams/${examId}/analytics`)
    revalidatePath(`/dashboard`)

    return {
      success: true,
      averageScore,
      passingRate,
      questionDifficulty,
    }
  } catch (error: any) {
    console.error("分析考试结果错误:", error)
    throw new Error(`分析考试结果过程中发生错误: ${error.message}`)
  }
}

