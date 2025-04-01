"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase/client"
import { StudentProgressChart } from "@/components/charts/student-progress-chart"
import { Eye, FileText, Download } from "lucide-react"

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
  })

  const [progressData, setProgressData] = useState<any[]>([])

  useEffect(() => {
    async function fetchStudentData() {
      if (!user) return

      try {
        // 获取学生的考试成绩
        const { data: grades, error: gradesError } = await supabase
          .from("grades")
          .select(`
            *,
            exams(id, name, exam_date, total_score, subjects(name)),
            questions(score)
          `)
          .eq("student_id", user.id)

        if (gradesError) throw gradesError

        // 处理考试数据
        const examMap = new Map()
        let totalScore = 0
        let examCount = 0
        let highest = 0
        let lowest = 100

        grades?.forEach((grade) => {
          const examId = grade.exams.id

          if (!examMap.has(examId)) {
            examMap.set(examId, {
              id: examId,
              name: grade.exams.name,
              date: grade.exams.exam_date,
              subject: grade.exams.subjects.name,
              totalScore: grade.exams.total_score,
              score: 0,
              maxScore: grade.exams.total_score,
              percentage: 0,
            })
          }

          const exam = examMap.get(examId)
          exam.score += grade.score
        })

        // 计算统计数据
        const processedExams = Array.from(examMap.values()).map((exam) => {
          const percentage = (exam.score / exam.maxScore) * 100
          exam.percentage = Math.round(percentage * 10) / 10

          totalScore += exam.percentage
          examCount++
          highest = Math.max(highest, exam.percentage)
          lowest = Math.min(lowest, exam.percentage)

          return exam
        })

        setExams(processedExams)
        setStats({
          totalExams: examCount,
          averageScore: examCount > 0 ? Math.round((totalScore / examCount) * 10) / 10 : 0,
          highestScore: highest,
          lowestScore: lowest === 100 && examCount === 0 ? 0 : lowest,
        })

        // 准备图表数据
        const chartData = processedExams.map((exam) => ({
          examName: exam.name,
          date: new Date(exam.date).toLocaleDateString(),
          score: exam.percentage,
          classAvg: exam.classAvg || 0, // 使用真实数据，如果没有则默认为0
        }))

        setProgressData(chartData)
      } catch (error) {
        console.error("Error fetching student data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [user])

  if (loading) {
    return <div className="flex-1 p-8 pt-6">加载中...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">学生仪表盘</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">参加考试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">总共参加的考试数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">所有考试的平均得分率</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highestScore}%</div>
            <p className="text-xs text-muted-foreground">最高得分率</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最低分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowestScore}%</div>
            <p className="text-xs text-muted-foreground">最低得分率</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>成绩进度</CardTitle>
            <CardDescription>您在各次考试中的成绩变化</CardDescription>
          </CardHeader>
          <CardContent>
            {progressData.length > 0 ? (
              <StudentProgressChart data={progressData} />
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">暂无考试数据</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近考试</CardTitle>
            <CardDescription>您最近参加的考试</CardDescription>
          </CardHeader>
          <CardContent>
            {exams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>考试名称</TableHead>
                    <TableHead>得分率</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.slice(0, 5).map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            exam.percentage >= 80
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : exam.percentage >= 60
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {exam.percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/student/exams/${exam.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">暂无考试数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>学习报告</CardTitle>
          <CardDescription>您的个性化学习报告和反馈</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>报告名称</TableHead>
                <TableHead>科目</TableHead>
                <TableHead>日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <TableRow key={`report-${exam.id}`}>
                    <TableCell className="font-medium">{exam.name} 学习报告</TableCell>
                    <TableCell>{exam.subject}</TableCell>
                    <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    暂无学习报告
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

