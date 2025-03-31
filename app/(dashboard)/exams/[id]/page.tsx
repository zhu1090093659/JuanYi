"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useParams } from "next/navigation"

export default function ExamGradingPage() {
  const params = useParams();
  const examId = params?.id as string;
  
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // 如果 ID 是 "new"，则重定向到新建试卷页面
    if (examId === "new") {
      router.push("/exams/new")
      return
    }

    fetchExamData()
  }, [examId, router])

  async function fetchExamData() {
    try {
      setLoading(true)
      setError(null)

      // 获取考试信息
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select(`
          *,
          subjects(name),
          questions(*)
        `)
        .eq("id", examId)
        .single()

      if (examError) {
        if (examError.code === "PGRST116") {
          setError("未找到试卷")
        } else {
          setError(examError.message)
        }
        return
      }

      setExamData(exam)
    } catch (error: any) {
      console.error("Error fetching exam data:", error)
      setError(error.message || "加载试卷数据时出错")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex-1 p-8 pt-6">加载中...</div>
  }

  if (error) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">{error}</h2>
          <p className="text-muted-foreground mt-2">无法加载试卷数据</p>
          <Button className="mt-4" asChild>
            <Link href="/exams">返回试卷列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">未找到数据</h2>
          <p className="text-muted-foreground">无法加载试卷数据</p>
          <Button className="mt-4" asChild>
            <Link href="/exams">返回试卷列表</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 pt-6">
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
            {examData.subjects?.name} · {examData.grade} · 共 {examData.questions?.length || 0} 道题目
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href={`/exams/${examId}/details`}>查看详情</Link>
          </Button>
          <Button>开始批阅</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>试卷信息</CardTitle>
            <CardDescription>试卷的基本信息和状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">科目</p>
                  <p className="text-sm text-muted-foreground">{examData.subjects?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">年级</p>
                  <p className="text-sm text-muted-foreground">{examData.grade}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">总分</p>
                  <p className="text-sm text-muted-foreground">{examData.total_score}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">考试日期</p>
                  <p className="text-sm text-muted-foreground">{new Date(examData.exam_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">描述</p>
                <p className="text-sm text-muted-foreground">{examData.description || "无描述"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>批阅状态</CardTitle>
            <CardDescription>试卷的批阅进度和状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">当前状态</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      examData.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : examData.status === "grading"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {examData.status === "completed"
                      ? "已完成"
                      : examData.status === "grading"
                        ? "批阅中"
                        : examData.status === "published"
                          ? "已发布"
                          : "草稿"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">批阅进度</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: "0%" }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">0/0 名学生已批阅</p>
              </div>
              <div className="pt-4">
                <Button className="w-full">开始批阅</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
