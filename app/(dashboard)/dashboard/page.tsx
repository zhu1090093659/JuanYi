"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, BarChart2, Clock, Plus, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    pendingExams: 0,
    gradedStudents: 0,
    averageScore: 0,
    averageGradingTime: 0,
    recentExams: [] as Array<{
      id: string | number;
      name: string;
      exam_date: string;
    }>,
    studentsToWatch: [] as Array<{
      id: string | number;
      name: string;
      class: string;
      issue: string;
    }>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 使用API路由获取仪表盘数据
        const response = await fetch('/api/dashboard/data');
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(`Error fetching dashboard data: ${result.error}`);
        }
        
        setDashboardData(result.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <div className="flex items-center space-x-2">
          <Link href="/exams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建试卷
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待批阅试卷</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : dashboardData.pendingExams}</div>
            <p className="text-xs text-muted-foreground">待批阅试卷总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已批阅学生</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : dashboardData.gradedStudents}</div>
            <p className="text-xs text-muted-foreground">本月共批阅学生数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : dashboardData.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">所有试卷的平均分</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均阅卷时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : dashboardData.averageGradingTime ? `${dashboardData.averageGradingTime.toFixed(1)} 分钟` : "暂无数据"}</div>
            <p className="text-xs text-muted-foreground">每份试卷平均批阅时间</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近批阅的试卷</CardTitle>
            <CardDescription>查看最近批阅的试卷及其基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-8">
                <p>加载中...</p>
              </div>
            ) : dashboardData.recentExams.length > 0 ? (
              <div className="space-y-8">
                {dashboardData.recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{exam.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exam.exam_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Link href={`/exams/${exam.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无已批阅试卷</p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>需要关注的学生</CardTitle>
            <CardDescription>这些学生在最近的考试中表现异常</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-8">
                <p>加载中...</p>
              </div>
            ) : dashboardData.studentsToWatch.length > 0 ? (
              <div className="space-y-8">
                {dashboardData.studentsToWatch.map((student) => (
                  <div key={student.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.class} · {student.issue}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <Link href={`/students/${student.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无需要关注的学生</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
