"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, FileText, Upload, AlertCircle, FileIcon, X, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { extractTextFromFile } from "@/lib/file-parser"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"
// 导入环境检查相关组件
import { EnvProvider, ClientOnly, PdfFeature } from "@/components/env-checker"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// 动态导入PDF和DOCX预览组件，确保它们仅在客户端渲染
const PDFViewer = dynamic(() => import("@/components/pdf-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
})

const DocxViewer = dynamic(() => import("@/components/docx-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
})

interface Question {
  id: string;
  content: string;
  type: 'objective' | 'subjective' | 'calculation' | 'essay';
  answer: string;
  score: number;
  options?: string[];
}

interface ExamData {
  name: string;
  subject_id: string;
  description?: string;
  grade?: string;
  class?: string;
  total_score?: number | null;
  exam_date?: string;
  created_by: string;
  status?: string;
}

interface SubmitData {
  examData: ExamData;
  questions: Question[];
  examFile: File | null;
  examImages: File[] | null;
}

export default function NewExamPage() {
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [examFile, setExamFile] = useState<File | null>(null)
  const [examImages, setExamImages] = useState<File[]>([])
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const examFileInputRef = useRef<HTMLInputElement>(null)
  const examImagesInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    subject_id: "",
    description: "",
    grade: "",
    class: "",
    total_score: 100,
    exam_date: new Date().toISOString().split("T")[0],
    status: "draft",
  })

  const { toast } = useToast()
  const router = useRouter()

  const [parseProgress, setParseProgress] = useState(0);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // 检查API Key是否已设置
  useEffect(() => {
    const apiKey = localStorage.getItem("openai_api_key")
    if (!apiKey) {
      toast({
        title: "未设置API Key",
        description: (
          <div>
            <p>您尚未设置OpenAI API Key，试卷解析功能将不可用。</p>
            <Link href="/settings" className="text-blue-600 underline">
              前往设置
            </Link>
          </div>
        ),
        variant: "destructive",
      })
    }
  }, [toast])

  // 加载科目列表
  useEffect(() => {
    async function fetchSubjects() {
      const { data } = await supabase.from("subjects").select("*")
      if (data) setSubjects(data)
    }
    fetchSubjects()
  }, [])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }
  
  const handleExamFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // 如果是图片文件，添加到图片列表中
      if (file.type.startsWith('image/')) {
        setExamImages(prev => [...prev, file]);
        // 清空单文件选择
        setExamFile(null);
        toast({
          title: "图片已添加",
          description: `已添加图片: ${file.name}`,
        });
      } else {
        // 清空图片列表
        setExamImages([]);
        setExamFile(file);
        toast({
          title: "文件已选择",
          description: `试卷文件: ${file.name}`,
        });
      }
    }
  }

  // 处理多图片上传
  const handleExamImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      if (newImages.length > 0) {
        setExamImages(prev => [...prev, ...newImages]);
        // 清空单文件选择
        setExamFile(null);
        toast({
          title: "图片已添加",
          description: `已添加${newImages.length}张图片`,
        });
      }
    }
  }

  // 移除某张图片
  const removeImage = (index: number) => {
    setExamImages(prev => prev.filter((_, i) => i !== index));
  }

  // 处理图片选择按钮点击
  const handleImagesClick = () => {
    examImagesInputRef.current?.click();
  }

  // 将图片转换为Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // 返回base64字符串，去掉前缀
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  // 添加新的解析试卷函数
  const parseExamFile = async () => {
    if (!examFile && examImages.length === 0) {
      toast({
        title: "请先上传试卷",
        description: "请先选择并上传试卷文件或试卷图片",
        variant: "destructive",
      });
      return;
    }

    try {
      // 开始解析
      setIsParsingFile(true);
      setParseError(null);
      setParseProgress(0);
      setShowProgressDialog(true);
      
      // 启动模拟进度
      const totalDuration = 360; // 总时长360秒
      const interval = 500; // 每500毫秒更新一次
      const steps = totalDuration * 1000 / interval;
      const increment = 100 / steps;
      
      const progressTimer = setInterval(() => {
        setParseProgress(prev => {
          const newProgress = prev + increment;
          return newProgress < 99 ? newProgress : 99;
        });
      }, interval);
      
      const apiKey = localStorage.getItem("openai_api_key");
      if (!apiKey) {
        clearInterval(progressTimer);
        setShowProgressDialog(false);
        throw new Error("未设置API Key，请先在设置中配置OpenAI API Key");
      }
      
      const model = localStorage.getItem("openai_model") || "gpt-4o";
      
      if (examFile) {
        // 处理文档文件 (PDF, DOCX, TXT)
        const fileType = examFile.name.split('.').pop()?.toLowerCase();
        if (fileType === 'txt' || fileType === 'pdf' || fileType === 'docx') {
          // 提取文件文本
          const fileContent = await extractTextFromFile(examFile);
          
          // 调用API解析试卷
          const response = await fetch('/api/exam-parser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              fileContent,
              apiKey,
              model
            }),
          });
          
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            clearInterval(progressTimer);
            setShowProgressDialog(false);
            throw new Error(result.error || '试卷解析失败');
          }
          
          // 更新试卷数据
          setQuestions(result.questions);
          setFormData(prev => ({
            ...prev,
            total_score: result.totalScore
          }));
        } else {
          clearInterval(progressTimer);
          setShowProgressDialog(false);
          throw new Error(`不支持的文件格式: ${fileType || '未知'}`);
        }
      } else if (examImages.length > 0) {
        // 处理图片文件
        // 将图片转换为base64编码
        const base64Images = await Promise.all(examImages.map(fileToBase64));
        
        // 调用多模态API解析图片
        const response = await fetch('/api/exam-parser-multimodal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            images: base64Images,
            apiKey,
            model
          }),
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          clearInterval(progressTimer);
          setShowProgressDialog(false);
          throw new Error(result.error || '试卷图片解析失败');
        }
        
        // 更新试卷数据
        setQuestions(result.questions);
        setFormData(prev => ({
          ...prev,
          total_score: result.totalScore
        }));
      }
      
      // 解析成功，将进度设置为100%
      setParseProgress(100);
      
      // 稍微延迟关闭进度对话框，让用户看到100%进度
      setTimeout(() => {
        clearInterval(progressTimer);
        setShowProgressDialog(false);
      }, 500);
      
      toast({
        title: "试卷解析成功",
        description: `成功解析出${questions.length}道题目`,
      });
      
      // 自动切换到题目列表标签
      setActiveTab("questions");
    } catch (error: any) {
      console.error("试卷解析错误:", error);
      setParseError(error.message || '试卷解析失败');
      setShowProgressDialog(false);
      toast({
        title: "试卷解析失败",
        description: error.message || '无法解析试卷',
        variant: "destructive",
      });
    } finally {
      setIsParsingFile(false);
    }
  }

  const handleExamFileClick = () => {
    examFileInputRef.current?.click()
  }
  
  const handleSubmit = async () => {
    if (!formData.name || !formData.subject_id) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 获取当前用户
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("未登录")
      }

      // 准备提交数据
      const submitData = {
        examData: {
          ...formData,
          created_by: user.id,
          total_score: formData.total_score ? parseFloat(String(formData.total_score)) : null
        },
        questions: questions.map(q => ({
          ...q,
          type: mapQuestionType(q.type)
        }))
      }

      // 创建 FormData 对象
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('examData', JSON.stringify(submitData.examData))
      formDataToSubmit.append('questions', JSON.stringify(submitData.questions))
      
      // 添加文件
      if (examFile) {
        formDataToSubmit.append('examFile', examFile)
      }
      
      if (examImages && examImages.length > 0) {
        examImages.forEach((image) => {
          formDataToSubmit.append('examImages', image)
        })
      }

      // 调用新的 API 路由
      const response = await fetch('/api/exams/create', {
        method: 'POST',
        body: formDataToSubmit
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '创建考试失败')
      }

      toast({
        title: "创建成功",
        description: "试卷已成功创建",
      })

      // 强制刷新试卷列表
      router.refresh()
      // 跳转到试卷列表
      router.push("/exams")
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message || "无法创建试卷",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 添加类型映射函数
  const mapQuestionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'choice': 'objective',        // 单选题
      'multiChoice': 'objective',   // 多选题
      'fill': 'subjective',         // 填空题
      'shortAnswer': 'subjective',  // 简答题
      'essay': 'essay'              // 论述题
    }
    
    const mappedType = typeMap[type] || 'objective'
    if (!typeMap[type]) {
      console.warn(`未知的题目类型: ${type}，将使用默认类型: objective`)
    }
    
    return mappedType
  }

  // 在组件中添加题目类型映射函数
  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case 'objective':
        return '客观题';
      case 'subjective':
        return '主观题';
      case 'calculation':
        return '计算题';
      case 'essay':
        return '论述题';
      default:
        return '未知类型';
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-1">
        <Link href="/exams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回试卷列表
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">新建试卷</h2>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="upload">上传试卷</TabsTrigger>
          <TabsTrigger value="questions">试卷题目</TabsTrigger>
          <TabsTrigger value="settings">评分设置</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>设置试卷的基本信息和考试详情</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-name">试卷名称</Label>
                  <Input
                    id="exam-name"
                    placeholder="例如：期中考试 - 高二数学"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">科目</Label>
                  <Select value={formData.subject_id} onValueChange={(value) => handleChange("subject_id", value)}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">年级</Label>
                  <Select value={formData.grade} onValueChange={(value) => handleChange("grade", value)}>
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior1">初一</SelectItem>
                      <SelectItem value="junior2">初二</SelectItem>
                      <SelectItem value="junior3">初三</SelectItem>
                      <SelectItem value="senior1">高一</SelectItem>
                      <SelectItem value="senior2">高二</SelectItem>
                      <SelectItem value="senior3">高三</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">班级</Label>
                  <Select value={formData.class} onValueChange={(value) => handleChange("class", value)}>
                    <SelectTrigger id="class">
                      <SelectValue placeholder="选择班级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class1">1班</SelectItem>
                      <SelectItem value="class2">2班</SelectItem>
                      <SelectItem value="class3">3班</SelectItem>
                      <SelectItem value="class4">4班</SelectItem>
                      <SelectItem value="class5">5班</SelectItem>
                      <SelectItem value="class6">6班</SelectItem>
                      <SelectItem value="all">全部班级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">试卷描述</Label>
                <Textarea
                  id="description"
                  placeholder="请输入试卷描述和备注信息"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total-score">总分</Label>
                  <Input
                    id="total-score"
                    type="number"
                    placeholder="100"
                    value={formData.total_score}
                    onChange={(e) => handleChange("total_score", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam-date">考试日期</Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => handleChange("exam_date", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/exams">取消</Link>
              </Button>
              <Button onClick={() => setActiveTab("upload")}>下一步</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>上传试卷</CardTitle>
              <CardDescription>上传试卷文件或拍照图片，试卷中应包含标准答案</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 隐藏的文件输入框 */}
              <input
                type="file"
                ref={examFileInputRef}
                className="hidden"
                accept=".pdf,.docx,.txt,image/*"
                onChange={handleExamFileChange}
              />
              <input
                type="file"
                ref={examImagesInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleExamImagesChange}
              />
              
              <div className="grid w-full items-center gap-4">
                <Label htmlFor="exam-file">试卷文件或图片</Label>
                
                {/* 已上传文件预览区域 */}
                {examFile ? (
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 border-primary"
                  >
                    <div className="flex flex-col items-center text-center">
                      <FileIcon className="h-8 w-8 text-primary mb-2" />
                      <p className="font-medium">{examFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(examFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex mt-2 gap-2">
                        <Button variant="outline" onClick={handleExamFileClick}>
                          更换文件
                        </Button>
                        <Button 
                          onClick={parseExamFile} 
                          disabled={isParsingFile}
                        >
                          {isParsingFile ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              解析中...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-2 h-4 w-4" />
                              开始解析
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* 文件预览区域 */}
                      <div className="mt-4 w-full max-w-3xl">
                        <EnvProvider>
                          <ClientOnly>
                            {examFile.type === 'application/pdf' && (
                              <PDFViewer file={examFile} className="w-full" />
                            )}
                            {examFile.name.endsWith('.docx') && (
                              <DocxViewer file={examFile} className="w-full" />
                            )}
                          </ClientOnly>
                        </EnvProvider>
                      </div>
                    </div>
                  </div>
                ) : examImages.length > 0 ? (
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 border-primary"
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">已上传 {examImages.length} 张试卷图片</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleImagesClick}>
                            <Plus className="h-4 w-4 mr-1" />添加图片
                          </Button>
                          <Button 
                            size="sm"
                            onClick={parseExamFile} 
                            disabled={isParsingFile}
                          >
                            {isParsingFile ? (
                              <>
                                <Spinner className="mr-2 h-4 w-4" />
                                解析中...
                              </>
                            ) : (
                              <>
                                <FileText className="mr-2 h-4 w-4" />
                                开始解析
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {examImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={URL.createObjectURL(image)} 
                              alt={`试卷图片 ${index + 1}`}
                              className="w-full h-auto object-cover rounded-md border"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <p className="text-xs text-center mt-1">
                              {image.name.length > 20 
                                ? image.name.substring(0, 20) + '...' 
                                : image.name}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        提示: 请确保图片清晰可见，包含完整试卷内容和标准答案
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 border-border"
                  >
                    <p className="text-muted-foreground">上传试卷文件 (支持PDF、Word文档) 或试卷照片</p>
                    <p className="text-muted-foreground mt-2">请确保试卷中包含标准答案</p>
                    <div className="flex mt-4 gap-2">
                      <Button variant="outline" onClick={handleExamFileClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        选择文件
                      </Button>
                      <Button onClick={handleImagesClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        上传试卷照片
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {parseError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>解析错误</AlertTitle>
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("basic")}>
                上一步
              </Button>
              <Button onClick={() => setActiveTab("settings")}>下一步</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>试卷题目</CardTitle>
              <CardDescription>查看试卷题目和答案</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无题目，请先上传并解析试卷文件</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setActiveTab("upload")}
                  >
                    前往上传试卷
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">共 {questions.length} 道题目，总分 {formData.total_score} 分</h3>
                  </div>
                  
                  {questions.map((question, index) => (
                    <div 
                      key={question.id || index} 
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium flex items-center">
                          {question.id || `题目 ${index + 1}`} 
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({question.score} 分)
                          </span>
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {getQuestionTypeDisplay(question.type)}
                        </div>
                      </div>
                      
                      <div className="pt-1">
                        <p className="whitespace-pre-wrap">{question.content}</p>
                      </div>
                      
                      {(question.type === 'choice' || question.type === 'multiChoice') && question.options && (
                        <div className="grid grid-cols-1 gap-2 pl-4">
                          {question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-start">
                              <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                              <p className="whitespace-pre-wrap">{
                                // 预处理选项内容，移除可能存在的选项序号
                                option.replace(/^[A-Z]\.?\s+/i, '')
                              }</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="pt-2 border-t">
                        <h5 className="text-sm font-medium text-green-600 dark:text-green-400">标准答案:</h5>
                        <p className="whitespace-pre-wrap mt-1">
                          {question.answer ? question.answer : (
                            <span className="text-yellow-600 dark:text-yellow-400">
                              无标准答案，请手动添加
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
                上一步
              </Button>
              <Button onClick={() => setActiveTab("settings")}>下一步</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>评分设置</CardTitle>
              <CardDescription>设置 AI 评分规则和人工干预策略</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scoring-mode">评分模式</Label>
                <Select defaultValue="ai-assisted">
                  <SelectTrigger id="scoring-mode">
                    <SelectValue placeholder="选择评分模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-auto">AI 全自动评分</SelectItem>
                    <SelectItem value="ai-assisted">AI 辅助人工评分</SelectItem>
                    <SelectItem value="manual">纯人工评分</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confidence-threshold">AI 置信度阈值</Label>
                <div className="grid grid-cols-[1fr_80px] gap-4">
                  <Input id="confidence-threshold" type="range" min="0" max="100" defaultValue="80" />
                  <Input type="number" min="0" max="100" defaultValue="80" className="w-20" />
                </div>
                <p className="text-sm text-muted-foreground">低于此置信度的答案将标记为需要人工审核</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("questions")}>
                上一步
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "保存中..." : "保存并创建"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 解析进度对话框 */}
      {showProgressDialog && (
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>正在解析试卷</DialogTitle>
              <DialogDescription>
                系统正在分析试卷内容，请耐心等待...
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">解析进度</span>
                <span className="text-sm text-muted-foreground">{Math.round(parseProgress)}%</span>
              </div>
              <Progress value={parseProgress} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {parseProgress < 100 ? "正在分析试卷中的题目和答案..." : "解析完成！"}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
