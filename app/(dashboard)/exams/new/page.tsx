"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function NewExamPage() {
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
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

  // 加载科目列表
  useState(() => {
    async function fetchSubjects() {
      const { data } = await supabase.from("subjects").select("*")
      if (data) setSubjects(data)
    }
    fetchSubjects()
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

      toast({
        title: "创建成功",
        description: "试卷已成功创建",
      })

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
              <CardDescription>上传试卷文件和答案模板</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>试卷文件</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">拖放文件或点击上传</p>
                  <Button variant="outline" className="mt-4">
                    选择文件
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>答题卡/答案文件</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">上传标准答案或答题卡模板</p>
                  <Button variant="outline" className="mt-4">
                    选择文件
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("basic")}>
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
              <Button variant="outline" onClick={() => setActiveTab("upload")}>
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

