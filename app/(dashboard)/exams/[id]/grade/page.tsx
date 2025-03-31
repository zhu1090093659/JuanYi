"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { GradingPanel } from "@/components/grading/grading-panel"
import { StudentAnswerView } from "@/components/grading/student-answer-view"
import { QuestionView } from "@/components/grading/question-view"
import { batchGradeExam } from "@/app/actions/grading"

export default function ExamGradingPage() {
  const params = useParams();
  const examId = params?.id as string;
  
  const [examData, setExamData] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [isGrading, setIsGrading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchExamData()
  }, [examId])

  async function fetchExamData() {
    try {
      setLoading(true)
      setError(null)

      // Get exam information
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select(`
          *,
          subjects(name)
        `)
        .eq("id", examId)
        .single()

      if (examError) throw examError
      setExamData(exam)

      // Get questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("number", { ascending: true })

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])

      // Get students with answers for this exam
      const { data: answersData, error: answersError } = await supabase
        .from("answers")
        .select(`
          *,
          students:users(id, name, class)
        `)
        .eq("exam_id", examId)

      if (answersError) throw answersError

      // Extract unique students from answers
      const uniqueStudents = Array.from(
        new Map(
          (answersData || []).map((answer) => [
            answer.student_id,
            { id: answer.student_id, name: answer.students.name, class: answer.students.class },
          ]),
        ).values(),
      )
      setStudents(uniqueStudents)
      setAnswers(answersData || [])

      // Get grades
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .eq("exam_id", examId)

      if (gradesError) throw gradesError
      setGrades(gradesData || [])
    } catch (error: any) {
      console.error("Error fetching exam data:", error)
      setError(error.message || "加载试卷数据时出错")
    } finally {
      setLoading(false)
    }
  }

  const handleStartBatchGrading = async () => {
    try {
      setIsGrading(true)
      await batchGradeExam(examId)
      toast({
        title: "批量评分已开始",
        description: "系统正在处理所有答案，这可能需要一些时间",
      })
      // Refresh data after a short delay
      setTimeout(() => {
        fetchExamData()
        setIsGrading(false)
      }, 3000)
    } catch (error: any) {
      toast({
        title: "批量评分失败",
        description: error.message || "无法启动批量评分",
        variant: "destructive",
      })
      setIsGrading(false)
    }
  }

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex] || null
  }

  const getCurrentStudent = () => {
    return students[currentStudentIndex] || null
  }

  const getCurrentAnswer = () => {
    const question = getCurrentQuestion()
    const student = getCurrentStudent()
    if (!question || !student) return null

    return answers.find((answer) => answer.question_id === question.id && answer.student_id === student.id) || null
  }

  const getCurrentGrade = () => {
    const question = getCurrentQuestion()
    const student = getCurrentStudent()
    if (!question || !student) return null

    return grades.find((grade) => grade.question_id === question.id && grade.student_id === student.id) || null
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentStudentIndex < students.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
      setCurrentQuestionIndex(questions.length - 1)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载中...</span>
      </div>
    )
  }

  if (error || !examData) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold">{error || "未找到数据"}</h2>
          <p className="text-muted-foreground mt-2">无法加载试卷数据</p>
          <Button className="mt-4" asChild>
            <Link href="/exams">返回试卷列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold">没有题目</h2>
          <p className="text-muted-foreground mt-2">此试卷尚未添加任何题目</p>
          <Button className="mt-4" asChild>
            <Link href={`/exams/${examId}/edit`}>添加题目</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-bold">没有学生答案</h2>
          <p className="text-muted-foreground mt-2">此试卷尚未收集任何学生答案</p>
          <Button className="mt-4" asChild>
            <Link href="/exams">返回试卷列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const currentStudent = getCurrentStudent()
  const currentAnswer = getCurrentAnswer()
  const currentGrade = getCurrentGrade()

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-1 mb-4">
        <Link href="/exams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回试卷列表
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{examData.name}</h2>
          <p className="text-muted-foreground">
            {examData.subjects?.name} · 共 {questions.length} 道题目 · {students.length} 名学生
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleStartBatchGrading} disabled={isGrading}>
            {isGrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                批量评分中...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                AI 批量评分
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>题目 {currentQuestion?.number}</CardTitle>
                  <CardDescription>
                    {currentQuestion?.type === "objective"
                      ? "客观题"
                      : currentQuestion?.type === "subjective"
                        ? "主观题"
                        : currentQuestion?.type === "calculation"
                          ? "计算题"
                          : "论述题"}{" "}
                    ·{currentQuestion?.score} 分
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0 && currentStudentIndex === 0}
                  >
                    上一题
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextQuestion}
                    disabled={
                      currentQuestionIndex === questions.length - 1 && currentStudentIndex === students.length - 1
                    }
                  >
                    下一题
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionView question={currentQuestion} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>学生答案</CardTitle>
              <CardDescription>
                {currentStudent?.name} · {currentStudent?.class}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentAnswerView answer={currentAnswer} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>评分面板</CardTitle>
              <CardDescription>AI 辅助评分</CardDescription>
            </CardHeader>
            <CardContent>
              <GradingPanel
                examId={examId}
                question={currentQuestion}
                student={currentStudent}
                answer={currentAnswer}
                initialGrade={currentGrade}
                onGraded={fetchExamData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
