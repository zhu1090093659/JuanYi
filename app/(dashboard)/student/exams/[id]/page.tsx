"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { FileText, Download, MessageSquare, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function StudentExamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("details")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examData, setExamData] = useState<any>(null)
  const [feedback, setFeedback] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    fetchExamData()
  }, [user, params.id])

  const fetchExamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 检查参数是否存在
      if (!params.id) {
        setError("试卷ID无效")
        return
      }

      // 获取试卷详情
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select(`
          *,
          subjects(name),
          created_by:users(name)
        `)
        .eq("id", params.id)
        .eq("student_id", user?.id)
        .single()

      if (examError) {
        console.error("获取试卷详情错误:", examError)
        setError(examError.message || "获取试卷详情失败")
        return
      }

      if (!exam) {
        setError("找不到试卷或您无权查看此试卷")
        return
      }

      setExamData(exam)

      // 如果试卷已批改，获取反馈信息
      if (exam.status === "completed") {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("feedback")
          .select("*")
          .eq("exam_id", params.id)
          .eq("student_id", user?.id)

        if (!feedbackError && feedbackData) {
          setFeedback(feedbackData)
        }
      }
    } catch (error: any) {
      console.error("加载试卷详情错误:", error)
      setError(error.message || "加载试卷详情时出错")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExam = async () => {
    try {
      if (!examData || !examData.exam_file_path) {
        toast({
          title: "下载失败",
          description: "试卷文件不存在",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase.storage
        .from("exams")
        .download(examData.exam_file_path)

      if (error) throw error

      // 创建下载链接
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = `${examData.name || "试卷"}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "下载成功",
        description: "试卷已成功下载",
      })
    } catch (error: any) {
      console.error("下载试卷错误:", error)
      toast({
        title: "下载失败",
        description: error.message || "下载试卷时出错",
        variant: "destructive",
      })
    }
  }

  const handleDownloadAnswer = async () => {
    try {
      if (!examData || !examData.answer_file_path) {
        toast({
          title: "下载失败",
          description: "答案文件不存在",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase.storage
        .from("answers")
        .download(examData.answer_file_path)

      if (error) throw error

      // 创建下载链接
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = `${examData.name || "答案"}_答案.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "下载成功",
        description: "答案已成功下载",
      })
    } catch (error: any) {
      console.error("下载答案错误:", error)
      toast({
        title: "下载失败",
        description: error.message || "下载答案时出错",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = () => {
    const status = examData?.status || "未知"
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">已批改</Badge>
      case "grading":
        return <Badge className="bg-blue-500">批阅中</Badge>
      case "submitted":
        return <Badge className="bg-yellow-500">已提交</Badge>
      default:
        return <Badge className="bg-gray-500">未提交</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-3xl font-bold tracking-tight">加载中...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/exams")}>
          返回试卷列表
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{examData?.name}</h2>
          <div className="flex items-center mt-2 space-x-2">
            <span className="text-muted-foreground">科目：{examData?.subjects?.name}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">
              提交日期：{new Date(examData?.created_at).toLocaleDateString()}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>{getStatusBadge()}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push("/exams")}>
            返回列表
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">试卷详情</TabsTrigger>
          <TabsTrigger value="feedback" disabled={examData?.status !== "completed"}>
            批改反馈
          </TabsTrigger>
          <TabsTrigger value="files">文件下载</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>试卷信息</CardTitle>
              <CardDescription>试卷的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">科目</p>
                  <p className="text-sm text-muted-foreground">{examData?.subjects?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">状态</p>
                  <p className="text-sm">{getStatusBadge()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">提交日期</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(examData?.created_at).toLocaleDateString()}
                  </p>
                </div>
                {examData?.status === "completed" && (
                  <div>
                    <p className="text-sm font-medium">得分</p>
                    <p className="text-sm text-muted-foreground">
                      {examData?.score} / {examData?.total_score} 
                      ({Math.round((examData?.score / examData?.total_score) * 100)}%)
                    </p>
                  </div>
                )}
              </div>

              {examData?.description && (
                <div>
                  <p className="text-sm font-medium">描述</p>
                  <p className="text-sm text-muted-foreground">{examData?.description}</p>
                </div>
              )}
              
              {examData?.notes && (
                <div>
                  <p className="text-sm font-medium">备注</p>
                  <p className="text-sm text-muted-foreground">{examData?.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          {examData?.status === "completed" ? (
            <Card>
              <CardHeader>
                <CardTitle>批改反馈</CardTitle>
                <CardDescription>教师对您试卷的批改意见和建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedback.length > 0 ? (
                  feedback.map((item, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-md">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">反馈 #{index + 1}</h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-line">{item.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p>暂无批改反馈</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>试卷尚未批改完成</AlertTitle>
              <AlertDescription>请等待教师批改后查看反馈</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>文件下载</CardTitle>
              <CardDescription>下载试卷和答案文件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleDownloadExam} variant="outline" className="h-24">
                  <div className="flex flex-col items-center">
                    <FileText className="h-8 w-8 mb-2" />
                    <span>下载试卷</span>
                  </div>
                </Button>
                <Button onClick={handleDownloadAnswer} variant="outline" className="h-24">
                  <div className="flex flex-col items-center">
                    <Download className="h-8 w-8 mb-2" />
                    <span>下载答案</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 