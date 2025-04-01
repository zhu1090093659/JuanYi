"use client"

import { Suspense, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScoreDistributionChart } from "@/components/charts/score-distribution-chart"
import { ClassComparisonChart } from "@/components/charts/class-comparison-chart"
import { QuestionDifficultyChart } from "@/components/charts/question-difficulty-chart"
import { StudentProgressChart } from "@/components/charts/student-progress-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  )
}

export default function AnalyticsPage() {
  const [selectedExam, setSelectedExam] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Array<{id: string, name: string}>>([]);
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([]);
  
  const [analyticsData, setAnalyticsData] = useState({
    scoreDistribution: [] as Array<{range: string, count: number}>,
    classComparison: [] as Array<{class: string, avgScore: number, maxScore: number, minScore: number}>,
    questionDifficulty: [] as Array<{id: string, number: number, correctRate: number, discrimination: number, score: number}>,
    studentProgress: [] as Array<{examName: string, date: string, score: number, classAvg: number}>,
    summary: {
      avgScore: 0,
      maxScore: 0,
      maxScoreStudent: "",
      maxScoreClass: "",
      minScore: 0,
      minScoreStudent: "",
      minScoreClass: "",
      stdDeviation: 0
    }
  });

  useEffect(() => {
    // 获取考试列表
    async function fetchExams() {
      try {
        const { data, error } = await supabase
          .from("exams")
          .select("id, name")
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching exams:", error);
          return;
        }
        
        setExams(data || []);
      } catch (error) {
        console.error("Error in fetchExams:", error);
      }
    }
    
    // 获取班级列表
    async function fetchClasses() {
      try {
        // 使用users表中的school字段替代classes表
        const { data, error } = await supabase
          .from("users")
          .select("school")
          .eq("role", "student")
          .not("school", "is", null);
          
        if (error) {
          console.error("Error fetching schools:", error);
          return;
        }
        
        // 提取唯一的学校名称并转换为所需格式
        const uniqueSchools = Array.from(new Set(data?.map(item => item.school) || []));
        const formattedClasses = uniqueSchools.map(school => ({
          id: school, // 使用学校名称作为ID
          name: school // 使用学校名称作为显示名称
        }));
        
        setClasses(formattedClasses);
      } catch (error) {
        console.error("Error in fetchClasses:", error);
      }
    }
    
    fetchExams();
    fetchClasses();
  }, []);

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true);
        
        // 构建查询参数
        const queryParams = new URLSearchParams();
        if (selectedExam !== "all") queryParams.append("examId", selectedExam);
        if (selectedClass !== "all") queryParams.append("classId", selectedClass);
        
        // 获取成绩分布数据
        const scoreDistResponse = await fetch(`/api/analytics/score-distribution?${queryParams.toString()}`);
        const scoreDistData = await scoreDistResponse.json();
        
        // 获取班级对比数据
        const classCompResponse = await fetch(`/api/analytics/class-comparison?${queryParams.toString()}`);
        const classCompData = await classCompResponse.json();
        
        // 获取题目难度数据
        const questionDiffResponse = await fetch(`/api/analytics/question-difficulty?${queryParams.toString()}`);
        const questionDiffData = await questionDiffResponse.json();
        
        // 获取学生进度数据
        const studentProgressResponse = await fetch(`/api/analytics/student-progress?${queryParams.toString()}`);
        const studentProgressData = await studentProgressResponse.json();
        
        // 获取摘要数据
        const summaryResponse = await fetch(`/api/analytics/summary?${queryParams.toString()}`);
        const summaryData = await summaryResponse.json();
        
        setAnalyticsData({
          scoreDistribution: scoreDistData.data || [],
          classComparison: classCompData.data || [],
          questionDifficulty: questionDiffData.data || [],
          studentProgress: studentProgressData.data || [],
          summary: summaryData.data || {
            avgScore: 0,
            maxScore: 0,
            maxScoreStudent: "",
            maxScoreClass: "",
            minScore: 0,
            minScoreStudent: "",
            minScoreClass: "",
            stdDeviation: 0
          }
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnalyticsData();
  }, [selectedExam, selectedClass]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">数据分析</h2>
        <div className="flex items-center space-x-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="exam-select">试卷:</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger id="exam-select" className="w-[180px]">
                  <SelectValue placeholder="选择试卷" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部试卷</SelectItem>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="class-select">班级:</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select" className="w-[180px]">
                  <SelectValue placeholder="选择班级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部班级</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">总体概览</TabsTrigger>
          <TabsTrigger value="questions">题目分析</TabsTrigger>
          <TabsTrigger value="students">学生分析</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : (
                    typeof analyticsData.summary.avgScore === 'number' 
                    ? analyticsData.summary.avgScore.toFixed(1) 
                    : "0.0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">所选范围的平均分</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最高分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : analyticsData.summary.maxScore}</div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "..." : `${analyticsData.summary.maxScoreStudent} - ${analyticsData.summary.maxScoreClass}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最低分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : analyticsData.summary.minScore}</div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "..." : `${analyticsData.summary.minScoreStudent} - ${analyticsData.summary.minScoreClass}`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">标准差</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : (
                    typeof analyticsData.summary.stdDeviation === 'number'
                    ? analyticsData.summary.stdDeviation.toFixed(1)
                    : "0.0"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {typeof analyticsData.summary.stdDeviation === 'number' && analyticsData.summary.stdDeviation < 10 
                    ? "成绩分布较为集中" 
                    : "成绩分布较为分散"}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>成绩分布</CardTitle>
                <CardDescription>学生成绩分布情况</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ChartSkeleton />
                ) : (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ScoreDistributionChart data={analyticsData.scoreDistribution} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>班级对比</CardTitle>
                <CardDescription>各班级平均分对比</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ChartSkeleton />
                ) : (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ClassComparisonChart data={analyticsData.classComparison} />
                  </Suspense>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>题目难度分析</CardTitle>
              <CardDescription>各题目的正确率和区分度</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <Suspense fallback={<ChartSkeleton />}>
                  <QuestionDifficultyChart data={analyticsData.questionDifficulty} />
                </Suspense>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>常见错误分析</CardTitle>
              <CardDescription>学生在各题目中的常见错误</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <p>加载中...</p>
                </div>
              ) : analyticsData.questionDifficulty.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyticsData.questionDifficulty.slice(0, 4).map((question) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">题目 {question.number}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>正确率</span>
                          <span>{question.correctRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${question.correctRate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>区分度</span>
                          <span>
                            {typeof question.discrimination === 'number' 
                              ? question.discrimination.toFixed(2) 
                              : "0.00"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${question.discrimination * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">暂无题目分析数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>学生进度</CardTitle>
              <CardDescription>学生在不同考试中的成绩变化</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <Suspense fallback={<ChartSkeleton />}>
                  <StudentProgressChart data={analyticsData.studentProgress} />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成绩趋势</CardTitle>
              <CardDescription>班级平均分随时间变化趋势</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <ChartSkeleton />
              ) : analyticsData.studentProgress.length > 0 ? (
                <div className="h-full">
                  <Suspense fallback={<ChartSkeleton />}>
                    <StudentProgressChart data={analyticsData.studentProgress} />
                  </Suspense>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">暂无趋势数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
