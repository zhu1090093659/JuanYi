"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Upload } from "lucide-react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function UploadExamPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [examFile, setExamFile] = useState<File | null>(null)
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    subject_id: "",
    description: "",
    notes: ""
  })
  
  // 在组件加载时获取科目列表
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        // 设置默认科目列表，确保始终有可用数据
        const defaultSubjects = [
          { id: "math", name: "数学" },
          { id: "physics", name: "物理" },
          { id: "chemistry", name: "化学" },
          { id: "biology", name: "生物" },
          { id: "chinese", name: "语文" },
          { id: "english", name: "英语" }
        ];
        
        // 尝试从API获取科目列表，失败则使用默认列表
        try {
          // 即使用户未登录仍尝试获取科目列表，但不显示错误
          if (!user?.id) {
            console.log("用户未登录，使用默认科目列表")
            setSubjects(defaultSubjects)
            return
          }
          
          const response = await fetch("/api/subjects")
          if (!response.ok) {
            throw new Error("获取科目列表失败")
          }
          
          const data = await response.json()
          if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
            console.log("成功获取科目列表:", data.subjects.length)
            setSubjects(data.subjects)
          } else {
            console.log("未获取到科目数据，使用默认列表")
            setSubjects(defaultSubjects)
          }
        } catch (error: any) {
          console.error("获取科目列表错误:", error)
          // 使用默认科目列表，确保页面可用
          setSubjects(defaultSubjects)
        }
      } catch (outerError) {
        console.error("科目处理外部错误:", outerError)
        // 确保至少有一个默认选项
        setSubjects([{ id: "default", name: "默认科目" }])
      }
    }
    
    fetchSubjects()
  }, [user])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleExamFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExamFile(e.target.files[0])
    }
  }

  const handleAnswerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnswerFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setError("请先登录后再试")
      return
    }
    
    if (!examFile || !answerFile) {
      setError("请上传试卷和答案文件")
      return
    }

    if (!formData.name || !formData.subject_id) {
      setError("请填写试卷名称和科目")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // 创建FormData对象
      const uploadData = new FormData()
      uploadData.append("examFile", examFile)
      uploadData.append("answerFile", answerFile)
      
      // 添加试卷基本信息
      const examData = {
        ...formData,
        student_id: user.id,
        status: "submitted", // 初始状态为"已提交"
        created_at: new Date().toISOString()
      }
      
      uploadData.append("examData", JSON.stringify(examData))
      
      console.log("准备上传试卷:", formData.name, "科目ID:", formData.subject_id)
      
      // 上传到服务器
      const response = await fetch("/api/student/upload-exam", {
        method: "POST",
        body: uploadData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "上传失败")
      }
      
      toast({
        title: "上传成功",
        description: "您的试卷已成功上传，等待教师批阅",
      })
      
      // 重定向到学生试卷列表
      router.push("/exams")
      
    } catch (error: any) {
      console.error("上传试卷错误:", error)
      setError(error.message || "上传试卷时出错")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">上传试卷</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>试卷信息</CardTitle>
            <CardDescription>请填写试卷的基本信息并上传文件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">试卷名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="例：2023年高一数学期中考试"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">科目</Label>
                <Select 
                  value={formData.subject_id} 
                  onValueChange={(value) => handleChange("subject_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择科目" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default" disabled>
                        加载科目中...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">试卷描述</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="简要描述试卷内容、考试范围等"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="examFile">上传试卷（PDF格式）</Label>
              <Input
                id="examFile"
                type="file"
                accept=".pdf"
                onChange={handleExamFileChange}
              />
              <p className="text-xs text-muted-foreground">
                请上传清晰的试卷PDF文件，确保所有题目和选项都清晰可见
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="answerFile">上传答案（PDF格式）</Label>
              <Input
                id="answerFile"
                type="file"
                accept=".pdf"
                onChange={handleAnswerFileChange}
              />
              <p className="text-xs text-muted-foreground">
                请上传您的答案PDF文件，确保书写清晰、整洁
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="如有需要特别说明的事项，请在此处备注"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/exams")}>
              取消
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  上传试卷
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
} 