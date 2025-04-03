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
import { useAuth } from "@/components/auth/auth-provider"

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const userRole = user?.role || "student"
  
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
  
  // 学生个人数据分析状态
  const [studentAnalyticsData, setStudentAnalyticsData] = useState({
    personalProgress: [] as Array<{examName: string, date: string, score: number, classAvg: number}>,
    subjectPerformance: [] as Array<{subject: string, score: number, classAvg: number}>,
    strengthsWeaknesses: {
      strengths: [] as Array<string>,
      weaknesses: [] as Array<string>
    },
    recentExams: [] as Array<{
      id: string, 
      name: string, 
      date: string, 
      score: number, 
      totalScore: number,
      ranking: number,
      totalStudents: number
    }>
  });

  useEffect(() => {
    // 获取考试列表
    async function fetchExams() {
      try {
        let query = supabase
          .from("exams")
          .select("id, name")
          .order("created_at", { ascending: false });
          
        // 学生只能看到自己参与的考试
        if (userRole === "student" && user?.id) {
          query = query.eq("student_id", user.id);
        }
        
        const { data, error } = await query;
          
        if (error) {
          console.error("Error fetching exams:", error);
          return;
        }
        
        setExams(data || []);
      } catch (error) {
        console.error("Error in fetchExams:", error);
      }
    }
    
    // 获取班级列表 - 只有教师和管理员可以查看多个班级
    async function fetchClasses() {
      try {
        // 学生只能看到自己所在的班级
        if (userRole === "student") {
          if (user?.class) {
            setClasses([{ id: user.class, name: user.class }]);
            setSelectedClass(user.class);
          }
          return;
        }
        
        // 教师和管理员可以看到所有班级
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
  }, [user, userRole]);

  useEffect(() => {
    // 教师/管理员获取分析数据
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
    
    // 学生获取个人分析数据
    async function fetchStudentAnalyticsData() {
      try {
        setLoading(true);
        
        // 从API获取学生个人数据
        const response = await fetch(`/api/analytics/student-data?studentId=${user?.id}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching student analytics data: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(`Error fetching student analytics data: ${result.error}`);
        }
        
        setStudentAnalyticsData(result.data || {
          personalProgress: [],
          subjectPerformance: [],
          strengthsWeaknesses: {
            strengths: [],
            weaknesses: []
          },
          recentExams: []
        });
      } catch (error) {
        console.error("Error fetching student analytics data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // 根据用户角色获取不同的分析数据
    if (userRole === "student") {
      fetchStudentAnalyticsData();
    } else {
      fetchAnalyticsData();
    }
  }, [selectedExam, selectedClass, userRole, user?.id]);

  // 教师/管理员视图
  const renderTeacherAnalytics = () => (
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
  );
  
  // 学生视图
  const renderStudentAnalytics = () => (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">我的学习分析</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="exam-select">考试:</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger id="exam-select" className="w-[180px]">
                <SelectValue placeholder="选择考试" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部考试</SelectItem>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">学习进度</TabsTrigger>
          <TabsTrigger value="performance">学科表现</TabsTrigger>
          <TabsTrigger value="feedback">学习反馈</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>个人进步趋势</CardTitle>
                <CardDescription>查看您在各次考试中的表现趋势</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ChartSkeleton />
                ) : (
                  <div className="h-[300px]">
                    <StudentProgressChart data={studentAnalyticsData.personalProgress} />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>最近考试表现</CardTitle>
                <CardDescription>查看您最近的考试结果和排名</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentAnalyticsData.recentExams.map((exam) => (
                      <div key={exam.id} className="flex flex-col space-y-2 pb-4 border-b last:border-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{exam.name}</p>
                            <p className="text-sm text-muted-foreground">{exam.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{exam.score}/{exam.totalScore}</p>
                            <p className="text-sm text-muted-foreground">排名: {exam.ranking}/{exam.totalStudents}</p>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${(exam.score / exam.totalScore) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>学科表现分析</CardTitle>
                <CardDescription>各科目的表现对比</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                {loading ? (
                  <ChartSkeleton />
                ) : (
                  <div className="h-[300px]">
                    {/* 这里应该是学科表现图表 */}
                    {/* 实际项目中应该使用实际的图表组件 */}
                    <ClassComparisonChart data={studentAnalyticsData.subjectPerformance.map(item => ({
                      class: item.subject,
                      avgScore: item.score,
                      maxScore: item.score + 5,
                      minScore: item.score - 5
                    }))} />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>与班级平均分对比</CardTitle>
                <CardDescription>您的成绩与班级平均分的差距</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-6 mt-2">
                    {studentAnalyticsData.subjectPerformance.map((subject, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{subject.subject}</span>
                          <span className={subject.score >= subject.classAvg ? "text-green-500" : "text-red-500"}>
                            {subject.score >= subject.classAvg ? `+${(subject.score - subject.classAvg).toFixed(1)}` : (subject.score - subject.classAvg).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="w-16 text-muted-foreground">班级均分</span>
                          <div className="flex-1">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-muted-foreground h-2 rounded-full" 
                                style={{ width: `${(subject.classAvg / 100) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="w-10 text-right">{subject.classAvg}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="w-16 text-muted-foreground">我的分数</span>
                          <div className="flex-1">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(subject.score / 100) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="w-10 text-right">{subject.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="feedback" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>学习优势</CardTitle>
                <CardDescription>您表现较好的学习领域</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentAnalyticsData.strengthsWeaknesses.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="mt-0.5 text-green-500">✓</div>
                        <p>{strength}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>待提升领域</CardTitle>
                <CardDescription>需要加强的学习领域</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentAnalyticsData.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="mt-0.5 text-amber-500">!</div>
                        <p>{weakness}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return userRole === "student" ? renderStudentAnalytics() : renderTeacherAnalytics();
}
