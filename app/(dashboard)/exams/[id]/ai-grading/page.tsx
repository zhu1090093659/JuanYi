"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Bot, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { AIGradingProcess } from "@/components/ai-grading/ai-grading-process"
import { GradingResults } from "@/components/ai-grading/grading-results"

export default function AIGradingPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("process")
  const [isGrading, setIsGrading] = useState(false)
  const [gradingProgress, setGradingProgress] = useState(0)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchExamData()
  }, [params.id])

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
        .eq("id", params.id)
        .single()

      if (examError) throw examError
      setExamData(exam)

      // Get questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", params.id)
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
        .eq("exam_id", params.id)

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
        .eq("exam_id", params.id)

      if (gradesError) throw gradesError
      setGrades(gradesData || [])

      // Calculate grading progress
      if (questionsData && uniqueStudents.length > 0 && gradesData) {
        const totalAnswers = questionsData.length * uniqueStudents.length
        const gradedAnswers = gradesData.length
        const progress = totalAnswers > 0 ? (gradedAnswers / totalAnswers) * 100 : 0
        setGradingProgress(progress)
      }
    } catch (error: any) {
      console.error("Error fetching exam data:", error)
      setError(error.message || "加载试卷数据时出错")
    } finally {
      setLoading(false)
    }
  }

  const startAIGrading = async () => {
    try {
      setIsGrading(true)

      // Simulate AI grading process
      toast({
        title: "AI 批量评分已开始",
        description: "系统正在处理所有答案，这可能需要一些时间",
      })

      // In a real application, you would call your server action here
      // await batchGradeExam(params.id)

      // For demo purposes, we'll simulate the grading process
      let progress = 0
      const interval = setInterval(() => {
        progress += 5
        setGradingProgress(Math.min(progress, 100))

        if (progress >= 100) {
          clearInterval(interval)
          setIsGrading(false)
          toast({
            title: "AI 批量评分完成",
            description: "所有答案已成功评分",
          })
          fetchExamData() // Refresh data
        }
      }, 1000)
    } catch (error: any) {
      toast({
        title: "批量评分失败",
        description: error.message || "无法启动批量评分",
        variant: "destructive",
      })
      setIsGrading(false)
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
          <Button onClick={startAIGrading} disabled={isGrading || gradingProgress === 100}>
            {isGrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI 评分中...
              </>
            ) : gradingProgress === 100 ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                评分已完成
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                开始 AI 批量评分
              </>
            )}
          </Button>

          <Button variant="outline" onClick={fetchExamData} disabled={isGrading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>评分进度</CardTitle>
          <CardDescription>AI 批量评分的当前进度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">
                {gradingProgress === 100 ? "已完成" : isGrading ? "评分中..." : "等待评分"}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(gradingProgress)}%</span>
            </div>
            <Progress value={gradingProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {grades.length} / {questions.length * students.length} 个答案已评分
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="process">评分过程</TabsTrigger>
          <TabsTrigger value="results">评分结果</TabsTrigger>
        </TabsList>

        <TabsContent value="process" className="space-y-4">
          <AIGradingProcess
            examId={params.id}
            questions={questions}
            students={students}
            answers={answers}
            grades={grades}
            isGrading={isGrading}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <GradingResults examId={params.id} questions={questions} students={students} grades={grades} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

