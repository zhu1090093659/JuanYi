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
import { ArrowLeft, Save, X, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, useParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

interface Question {
  id: string;
  content: string;
  type: string;
  standard_answer: string;
  score: number;
  number: number;
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

export default function EditExamPage() {
  const params = useParams();
  const examId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  
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

  // 加载现有试卷数据
  useEffect(() => {
    async function fetchExamData() {
      try {
        console.log("开始加载试卷数据...");
        
        // 第一步：获取试卷基本信息
        const { data: exam, error: examError } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();

        if (examError) {
          console.error("加载试卷数据出错:", examError);
          throw examError;
        }

        console.log("试卷基本信息:", exam);

        // 第二步：获取题目数据
        console.log("开始获取题目数据，exam_id:", examId);
        const questionsResponse = await fetch(`/api/exams/${examId}/questions`);
        const questionsData = await questionsResponse.json();

        if (!questionsResponse.ok) {
          console.error("加载题目数据出错:", questionsData.error);
          throw new Error(questionsData.error.message || "获取题目数据失败");
        }

        const questions = questionsData.questions;
        console.log("题目查询结果:", {
          hasData: !!questions,
          length: questions?.length || 0,
          data: questions
        });

        // 验证questions数组
        if (!questions) {
          console.warn("题目数据为null");
        } else if (questions.length === 0) {
          console.warn("题目数组为空");
        } else {
          console.log("获取到题目数据:", questions);
        }

        if (exam) {
          setFormData({
            name: exam.name,
            subject_id: exam.subject_id,
            description: exam.description || "",
            grade: exam.grade || "",
            class: exam.class || "",
            total_score: exam.total_score || 100,
            exam_date: exam.exam_date || new Date().toISOString().split("T")[0],
            status: exam.status || "draft",
          });
          
          // 设置题目数据,添加类型映射
          if (questions.length > 0) {
            console.log("原始题目数据:", questions);
            const formattedQuestions = questions.map((q: any) => {
              const mappedType = mapQuestionType(q.type);
              console.log(`题目 ${q.number} 类型映射: ${q.type} -> ${mappedType}`);
              return {
                id: q.id,
                number: q.number,
                content: q.content,
                type: mappedType,
                standard_answer: q.standard_answer || "",
                score: q.score
              };
            });
            console.log("格式化后的题目数据:", formattedQuestions);
            setQuestions(formattedQuestions);
          } else {
            console.log("试卷没有题目");
          }
        }
      } catch (error: any) {
        console.error("完整错误信息:", error);
        toast({
          title: "加载试卷数据失败",
          description: error.message,
          variant: "destructive",
        });
      }
    }

    fetchExamData();
  }, [examId, toast]);

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

  const handleSubmit = async () => {
    if (!formData.name || !formData.subject_id) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 准备基本信息数据
      const examData = {
        ...formData,
        total_score: formData.total_score ? parseFloat(String(formData.total_score)) : null
      };

      // 准备题目数据
      const questionsData = questions.map(q => ({
        ...q,
        exam_id: examId, // 确保每个题目都关联到当前试卷
        type: reverseMapQuestionType(q.type)
      }));

      // 调用更新 API
      const response = await fetch(`/api/exams/${examId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examData,
          questions: questionsData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '更新考试失败');
      }

      toast({
        title: "更新成功",
        description: "试卷已成功更新",
      });

      // 跳转到试卷详情页
      router.push(`/exams/${examId}`);
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message || "无法更新试卷",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加题目类型映射函数
  const mapQuestionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'objective': 'choice',        // 客观题 -> 单选题
      'subjective': 'short_answer', // 主观题 -> 简答题
      'calculation': 'short_answer',// 计算题 -> 简答题
      'essay': 'essay',            // 论述题 -> 论述题
      'choice': 'choice',          // 单选题 -> 单选题
      'multi_choice': 'multi_choice', // 多选题 -> 多选题
      'fill': 'fill',              // 填空题 -> 填空题
      'short_answer': 'short_answer'  // 简答题 -> 简答题
    };
    return typeMap[type] || 'choice';
  };

  // 反向映射函数,用于保存时转换回数据库类型
  const reverseMapQuestionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'choice': 'objective',        // 单选题 -> 客观题
      'multi_choice': 'objective',  // 多选题 -> 客观题
      'fill': 'objective',          // 填空题 -> 客观题
      'short_answer': 'subjective', // 简答题 -> 主观题
      'essay': 'essay'              // 论述题 -> 论述题
    };
    return typeMap[type] || 'objective';
  };

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center space-x-1 mb-4">
        <Link href={`/exams/${examId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回试卷详情
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">编辑试卷</h2>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存更改
              </>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="questions">题目管理</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>填写试卷的基本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">试卷名称</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
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
                    <Input
                      id="grade"
                      value={formData.grade}
                      onChange={(e) => handleChange("grade", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">班级</Label>
                    <Input
                      id="class"
                      value={formData.class}
                      onChange={(e) => handleChange("class", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_score">总分</Label>
                    <Input
                      id="total_score"
                      type="number"
                      value={formData.total_score}
                      onChange={(e) => handleChange("total_score", parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam_date">考试日期</Label>
                    <Input
                      id="exam_date"
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) => handleChange("exam_date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>题目管理</CardTitle>
                <CardDescription>管理试卷的题目</CardDescription>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">题目 {index + 1}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuestions(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label>题目内容</Label>
                            <Textarea
                              value={question.content}
                              onChange={(e) => {
                                const newQuestions = [...questions];
                                newQuestions[index].content = e.target.value;
                                setQuestions(newQuestions);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>题目类型</Label>
                              <Select
                                value={question.type}
                                onValueChange={(value) => {
                                  const newQuestions = [...questions];
                                  newQuestions[index].type = value;
                                  setQuestions(newQuestions);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="choice">单选题</SelectItem>
                                  <SelectItem value="multi_choice">多选题</SelectItem>
                                  <SelectItem value="fill">填空题</SelectItem>
                                  <SelectItem value="short_answer">简答题</SelectItem>
                                  <SelectItem value="essay">论述题</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>分值</Label>
                              <Input
                                type="number"
                                value={question.score}
                                onChange={(e) => {
                                  const newQuestions = [...questions];
                                  newQuestions[index].score = parseFloat(e.target.value);
                                  setQuestions(newQuestions);
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>标准答案</Label>
                            <Textarea
                              value={question.standard_answer}
                              onChange={(e) => {
                                const newQuestions = [...questions];
                                newQuestions[index].standard_answer = e.target.value;
                                setQuestions(newQuestions);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">暂无题目</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuestions([...questions, {
                          content: "",
                          type: "choice",
                          standard_answer: "",
                          score: 0
                        }]);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      添加题目
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 