"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function ExamDetailsPage({ params }: { params: { id: string } }) {
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchExamData()
  }, [params.id])

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
          created_by:users(name)
        `)
        .eq("id", params.id)
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

  if (error || !examData) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-1 mb-4">
        <Link href="/exams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回试卷列表
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{examData.name}</h2>
          <p className="text-muted-foreground">
            {examData.subjects?.name} · {examData.grade} ·{new Date(examData.exam_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href={`/exams/${params.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              批阅试卷
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">试卷状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examData.status === "completed"
                ? "已完成"
                : examData.status === "grading"
                  ? "批阅中"
                  : examData.status === "published"
                    ? "已发布"
                    : "草稿"}
            </div>
            <p className="text-xs text-muted-foreground">
              {examData.status === "completed"
                ? `完成于 ${examData.graded_at ? new Date(examData.graded_at).toLocaleDateString() : "未知"}`
                : "尚未完成批阅"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examData.total_score}</div>
            <p className="text-xs text-muted-foreground">试卷满分</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">创建者</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examData.created_by?.name || "未知"}</div>
            <p className="text-xs text-muted-foreground">创建于 {new Date(examData.created_at).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">班级</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examData.class || "全部班级"}</div>
            <p className="text-xs text-muted-foreground">{examData.grade}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>试卷描述</CardTitle>
          <CardDescription>试卷的详细描述和备注</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{examData.description || "无描述"}</p>
        </CardContent>
      </Card>
    </div>
  )
}

