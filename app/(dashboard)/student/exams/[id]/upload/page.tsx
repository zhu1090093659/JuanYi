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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Upload, AlertCircle, FileText, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

// 未找到试卷时显示的组件
const NotFoundCard = ({ examId }: { examId: string }) => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>未找到试卷</AlertTitle>
        <AlertDescription>未找到ID为 {examId} 的试卷，或者您无权访问此试卷。</AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>试卷不存在</CardTitle>
          <CardDescription>您可能需要上传一份新的试卷</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>系统未找到您要提交答案的试卷，可能是因为：</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>试卷ID不正确</li>
            <li>试卷已被删除</li>
            <li>您没有访问权限</li>
          </ul>
          <p>您可以通过以下方式继续：</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/exams">
              <ArrowRight className="mr-2 h-4 w-4" />
              查看我的试卷
            </Link>
          </Button>
          <Button asChild>
            <Link href="/student/upload-exam">
              <Upload className="mr-2 h-4 w-4" />
              上传新试卷
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function UploadAnswerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examData, setExamData] = useState<any>(null)
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [answerPreview, setAnswerPreview] = useState<string | null>(null)
  const [answerBase64, setAnswerBase64] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!user) return
    fetchExamData()
  }, [user, params.id])

  const fetchExamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 检查参数是否存在
      if (!params || !params.id) {
        console.error("试卷ID无效或未定义:", params?.id)
        setError("试卷ID无效")
        setLoading(false)
        return
      }
      
      console.log("正在获取试卷详情, ID:", params.id, "用户ID:", user?.id)
      
      // 检查用户是否已登录
      if (!user?.id) {
        console.error("用户未登录或ID无效")
        setError("请先登录后再试")
        setLoading(false)
        return
      }

      // 获取试卷详情 - 使用通配符查询所有列以避免列名不匹配问题
      let exam = null
      let examError = null
      
      try {
        // 使用通配符查询所有字段，而不是明确指定列名
        const result = await supabase
          .from("exams")
          .select("*")
          .eq("id", params.id)
          .single()
          
        exam = result.data
        examError = result.error
        
        console.log("数据库返回的试卷数据结构:", exam ? Object.keys(exam) : "无数据")
      } catch (e) {
        console.error("Supabase查询错误:", e)
        setError("数据库查询失败，请稍后再试")
        setLoading(false)
        return
      }

      if (examError) {
        console.error("获取试卷详情错误:", JSON.stringify(examError))
        setError(examError.message || examError.details || "获取试卷详情失败，请稍后再试")
        setLoading(false)
        return
      }

      if (!exam) {
        console.error("未找到试卷:", params.id)
        setError("找不到试卷或您无权查看此试卷")
        setLoading(false)
        return
      }
      
      console.log("成功获取试卷详情:", exam.id, exam.name)

      // 检查试卷状态
      if (exam.status === "completed") {
        setError("该试卷已批阅完成，不能再上传答案")
        setLoading(false)
        return
      }

      // 获取科目信息
      let subjectName = "未知科目"
      if (exam.subject_id) {
        try {
          const result = await supabase
            .from("subjects")
            .select("name")
            .eq("id", exam.subject_id)
            .single()
          
          if (result.data && result.data.name) {
            subjectName = result.data.name
          }
        } catch (e) {
          console.error("获取科目信息错误:", e)
          // 继续使用默认科目名
        }
      }

      // 确定文件路径字段名 - 这里处理可能的不同列名
      const filePath = exam.file_path || exam.exam_file_path || "";
      
      // 设置试卷数据 - 包含科目名称，确保所有属性都有默认值
      setExamData({
        ...exam,
        subjects: { name: subjectName },
        name: exam.name || "未命名试卷",
        description: exam.description || "",
        notes: exam.notes || "",
        // 确保下载功能可以正常工作
        exam_file_path: filePath
      })
      
      setLoading(false)
    } catch (error: any) {
      console.error("加载试卷详情错误:", error?.message || "未知错误")
      setError(error?.message || "加载试卷详情时出错，请稍后再试")
      setLoading(false)
    }
  }

  // 转换文件为base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleAnswerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // 检查文件大小，限制为5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("图片大小不能超过5MB")
        return
      }
      
      setAnswerFile(file)
      
      // 创建预览
      const fileUrl = URL.createObjectURL(file)
      setAnswerPreview(fileUrl)
      
      try {
        // 转换为base64
        const base64Data = await convertFileToBase64(file)
        setAnswerBase64(base64Data)
      } catch (err) {
        console.error("转换图片为base64失败:", err)
        setError("图片处理失败，请重试")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!answerFile || !answerBase64) {
      setError("请上传答案图片")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // 准备上传数据
      const uploadData = {
        examId: params.id,
        studentId: user?.id,
        answerContent: answerBase64, // 使用base64数据
        notes: notes
      }
      
      // 上传到服务器
      const response = await fetch("/api/student/upload-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(uploadData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "上传失败")
      }
      
      toast({
        title: "上传成功",
        description: "您的答案已成功上传，等待教师批阅",
      })
      
      // 重定向到试卷详情页
      router.push(`/student/exams/${params.id}`)
      
    } catch (error: any) {
      console.error("上传答案错误:", error)
      setError(error.message || "上传答案时出错")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadExam = async () => {
    try {
      if (!examData) {
        toast({
          title: "下载失败",
          description: "试卷数据不存在",
          variant: "destructive",
        })
        return
      }
      
      // 确定文件路径 - 尝试不同可能的属性名
      const filePath = examData.file_path || examData.exam_file_path;
      
      if (!filePath) {
        toast({
          title: "下载失败",
          description: "试卷文件路径不存在",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase.storage
        .from("exams")
        .download(filePath)

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
    // 试卷不存在或无权访问时显示特殊组件
    if (error.includes("找不到试卷") || error.includes("无权查看")) {
      return <NotFoundCard examId={params.id as string} />
    }
    
    // 其他错误正常显示
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => router.push("/exams")}>
            返回试卷列表
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">上传答案</h2>
          <div className="flex items-center mt-2 space-x-2">
            <span className="text-muted-foreground">试卷：{examData?.name}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground">科目：{examData?.subjects?.name}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/student/exams/${params.id}`)}>
            返回试卷详情
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>试卷概况</CardTitle>
            <CardDescription>试卷的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">试卷名称</p>
              <p className="text-sm text-muted-foreground">{examData?.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">科目</p>
              <p className="text-sm text-muted-foreground">{examData?.subjects?.name}</p>
            </div>
            {examData?.description && (
              <div className="space-y-2">
                <p className="text-sm font-medium">描述</p>
                <p className="text-sm text-muted-foreground">{examData?.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>上传答案</CardTitle>
            <CardDescription>请上传您的答案图片</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form id="answer-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="answerFile">答案图片</Label>
                <Input
                  id="answerFile"
                  type="file"
                  accept="image/*"
                  onChange={handleAnswerFileChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  请上传清晰的答案图片，确保所有答案都清晰可见
                </p>
                
                {/* 图片预览 */}
                {answerPreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">图片预览</p>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={answerPreview} 
                        alt="答案预览" 
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">备注（可选）</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="如有需要说明的事项，请在此处备注"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="answer-form" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  上传答案
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 