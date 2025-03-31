import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ScoreDistributionChart } from "@/components/charts/score-distribution-chart"
import { ClassComparisonChart } from "@/components/charts/class-comparison-chart"
import { QuestionDifficultyChart } from "@/components/charts/question-difficulty-chart"
import { StudentProgressChart } from "@/components/charts/student-progress-chart"
import { Skeleton } from "@/components/ui/skeleton"

// 模拟数据 - 实际应用中应从数据库获取
const scoreDistributionData = [
  { range: "0-10", count: 0 },
  { range: "11-20", count: 1 },
  { range: "21-30", count: 2 },
  { range: "31-40", count: 3 },
  { range: "41-50", count: 5 },
  { range: "51-60", count: 8 },
  { range: "61-70", count: 12 },
  { range: "71-80", count: 15 },
  { range: "81-90", count: 10 },
  { range: "91-100", count: 4 },
]

const classComparisonData = [
  { class: "高二(1)班", avgScore: 82.5, maxScore: 98, minScore: 65 },
  { class: "高二(2)班", avgScore: 78.3, maxScore: 95, minScore: 60 },
  { class: "高二(3)班", avgScore: 75.8, maxScore: 92, minScore: 55 },
  { class: "高二(4)班", avgScore: 80.1, maxScore: 96, minScore: 62 },
]

const questionDifficultyData = [
  { id: "q1", number: 1, correctRate: 85, discrimination: 0.3, score: 5 },
  { id: "q2", number: 2, correctRate: 72, discrimination: 0.5, score: 10 },
  { id: "q3", number: 3, correctRate: 65, discrimination: 0.7, score: 15 },
  { id: "q4", number: 4, correctRate: 45, discrimination: 0.8, score: 20 },
  { id: "q5", number: 5, correctRate: 30, discrimination: 0.9, score: 25 },
  { id: "q6", number: 6, correctRate: 25, discrimination: 0.6, score: 15 },
  { id: "q7", number: 7, correctRate: 55, discrimination: 0.4, score: 10 },
]

const studentProgressData = [
  { examName: "第一次月考", date: "2024-02-15", score: 75, classAvg: 72 },
  { examName: "期中考试", date: "2024-03-20", score: 82, classAvg: 76 },
  { examName: "第二次月考", date: "2024-04-18", score: 78, classAvg: 74 },
  { examName: "期末考试", date: "2024-06-25", score: 85, classAvg: 78 },
]

function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <Skeleton className="w-full h-full" />
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">数据分析</h2>
        <div className="flex items-center space-x-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="exam-select">试卷:</Label>
              <Select defaultValue="all">
                <SelectTrigger id="exam-select" className="w-[180px]">
                  <SelectValue placeholder="选择试卷" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部试卷</SelectItem>
                  <SelectItem value="1">期中考试 - 高二数学</SelectItem>
                  <SelectItem value="2">单元测试 - 初三物理</SelectItem>
                  <SelectItem value="3">月考 - 高一英语</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="class-select">班级:</Label>
              <Select defaultValue="all">
                <SelectTrigger id="class-select" className="w-[180px]">
                  <SelectValue placeholder="选择班级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部班级</SelectItem>
                  <SelectItem value="class1">高二(1)班</SelectItem>
                  <SelectItem value="class2">高二(2)班</SelectItem>
                  <SelectItem value="class3">高二(3)班</SelectItem>
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
                <div className="text-2xl font-bold">78.5</div>
                <p className="text-xs text-muted-foreground">较上次提高 2.5 分</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最高分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98</div>
                <p className="text-xs text-muted-foreground">李明 - 高二(1)班</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最低分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">张华 - 高二(3)班</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">标准差</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.3</div>
                <p className="text-xs text-muted-foreground">成绩分布较为集中</p>
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
                <Suspense fallback={<ChartSkeleton />}>
                  <ScoreDistributionChart data={scoreDistributionData} />
                </Suspense>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>班级对比</CardTitle>
                <CardDescription>各班级平均分对比</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChartSkeleton />}>
                  <ClassComparisonChart data={classComparisonData} />
                </Suspense>
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
              <Suspense fallback={<ChartSkeleton />}>
                <QuestionDifficultyChart data={questionDifficultyData} />
              </Suspense>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>常见错误分析</CardTitle>
              <CardDescription>学生在各题目中的常见错误</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">题目 {i}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>错误类型 1</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>错误类型 2</span>
                        <span>30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: "30%" }}></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>错误类型 3</span>
                        <span>15%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>学生能力诊断</CardTitle>
              <CardDescription>学生在各知识点的掌握情况</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">知识点掌握情况</h3>
                  {["函数与导数", "三角函数", "概率统计", "立体几何", "数列"].map((topic, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{topic}</span>
                        <span>{Math.floor(Math.random() * 40) + 60}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">能力雷达图</h3>
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center text-muted-foreground">能力雷达图将在这里显示</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>学生进步情况</CardTitle>
              <CardDescription>学生成绩变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ChartSkeleton />}>
                <StudentProgressChart data={studentProgressData} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>历史成绩趋势</CardTitle>
              <CardDescription>班级历次考试成绩变化</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="text-center text-muted-foreground">历史成绩趋势图表将在这里显示</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>知识点掌握趋势</CardTitle>
              <CardDescription>各知识点掌握情况变化</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="text-center text-muted-foreground">知识点掌握趋势图表将在这里显示</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

