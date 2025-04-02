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

// 动态导入PDF和DOCX预览组件，确保它们仅在客户端渲染
const PDFViewer = dynamic(() => import("@/components/pdf-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
})

const DocxViewer = dynamic(() => import("@/components/docx-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px]" />
})

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
  })

  const { toast } = useToast()
  const router = useRouter()

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
      
      const apiKey = localStorage.getItem("openai_api_key");
      if (!apiKey) {
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
            throw new Error(result.error || '试卷解析失败');
          }
          
          // 更新试卷数据
          setQuestions(result.questions);
          setFormData(prev => ({
            ...prev,
            total_score: result.totalScore
          }));
        } else {
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
          throw new Error(result.error || '试卷图片解析失败');
        }
        
        // 更新试卷数据
        setQuestions(result.questions);
        setFormData(prev => ({
          ...prev,
          total_score: result.totalScore
        }));
      }
      
      toast({
        title: "试卷解析成功",
        description: `成功解析出${questions.length}道题目`,
      });
      
      // 自动切换到题目列表标签
      setActiveTab("questions");
    } catch (error: any) {
      console.error("试卷解析错误:", error);
      setParseError(error.message || '试卷解析失败');
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
    if (!formData.name || !formData.subject_id || !formData.grade) {
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

      // 创建考试
      const { data, error } = await supabase
        .from("exams")
        .insert({
          name: formData.name,
          subject_id: formData.subject_id,
          description: formData.description,
          grade: formData.grade,
          class: formData.class || null,
          total_score: formData.total_score,
          exam_date: formData.exam_date,
          created_by: user.id,
          status: "draft",
        })
        .select()

      if (error) throw error
      
      if (data && data[0]) {
        const examId = data[0].id
        
        // 上传试卷文件或图片
        if (examFile) {
          const examFilePath = `exams/${examId}/exam_file_${examFile.name}`
          const { error: uploadError } = await supabase.storage
            .from('exam_files')
            .upload(examFilePath, examFile)
            
          if (uploadError) {
            console.error("试卷文件上传失败:", uploadError)
            toast({
              title: "试卷文件上传失败",
              description: uploadError.message,
              variant: "destructive",
            })
          }
        }
        
        // 上传多张试卷图片
        if (examImages.length > 0) {
          for (let i = 0; i < examImages.length; i++) {
            const image = examImages[i];
            const imagePath = `exams/${examId}/exam_image_${i+1}_${image.name}`;
            
            const { error: uploadError } = await supabase.storage
              .from('exam_files')
              .upload(imagePath, image);
              
            if (uploadError) {
              console.error(`试卷图片 ${i+1} 上传失败:`, uploadError);
              toast({
                title: `试卷图片 ${i+1} 上传失败`,
                description: uploadError.message,
                variant: "destructive",
              });
            }
          }
        }
        
        // 保存解析出的题目
        if (questions.length > 0) {
          try {
            // 准备题目数据，确保格式正确
            const formattedQuestions = questions.map(q => ({
              exam_id: examId,
              question_number: q.id,
              content: q.content,
              type: q.type,
              options: q.options ? JSON.stringify(q.options) : null,
              answer: q.answer,
              score: q.score
            }));
            
            const { error: questionsError } = await supabase
              .from('questions')
              .insert(formattedQuestions);
              
            if (questionsError) {
              console.error("题目保存失败:", questionsError);
              toast({
                title: "题目保存失败",
                description: questionsError.message,
                variant: "destructive",
              });
            }
          } catch (questionsErr) {
            console.error("题目保存过程中出错:", questionsErr);
          }
        }
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
                        <span className="text-sm px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                          {question.type === 'choice' ? '单选题' : 
                           question.type === 'multiChoice' ? '多选题' : 
                           question.type === 'fill' ? '填空题' : 
                           question.type === 'shortAnswer' ? '简答题' : '论述题'}
                        </span>
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
                        <p className="whitespace-pre-wrap mt-1">{question.answer}</p>
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
    </div>
  )
}
