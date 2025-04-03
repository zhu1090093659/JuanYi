"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, BarChart2, Clock, Plus, ArrowUpRight, BookOpen, TrendingUp, Award } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export default function DashboardPage() {
  const { user } = useAuth()
  const userRole = user?.role || "student"
  
  // 教师/管理员仪表盘数据
  const [teacherDashboardData, setTeacherDashboardData] = useState({
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
  
  // 学生仪表盘数据
  const [studentDashboardData, setStudentDashboardData] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    highestScore: 0,
    recentExams: [] as Array<{
      id: string | number;
      name: string;
      exam_date: string;
      score: number;
      total_score: number;
    }>,
    subjectPerformance: [] as Array<{
      subject: string;
      score: number;
      average: number;
    }>
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === "student") {
      fetchStudentDashboardData();
    } else {
      fetchTeacherDashboardData();
    }
  }, [userRole]);

  // 获取教师仪表盘数据
  async function fetchTeacherDashboardData() {
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
      
      setTeacherDashboardData(result.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }
  
  // 获取学生仪表盘数据
  async function fetchStudentDashboardData() {
    try {
      setLoading(true);
      
      // 使用API路由获取学生仪表盘数据
      const response = await fetch(`/api/dashboard/student-data?studentId=${user?.id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching student dashboard data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Error fetching student dashboard data: ${result.error}`);
      }
      
      setStudentDashboardData(result.data || {
        totalExams: 0,
        completedExams: 0,
        averageScore: 0,
        highestScore: 0,
        recentExams: [],
        subjectPerformance: []
      });
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  // 教师/管理员仪表盘
  const renderTeacherDashboard = () => (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">教师仪表盘</h2>
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
            <div className="text-2xl font-bold">{loading ? "..." : teacherDashboardData.pendingExams}</div>
            <p className="text-xs text-muted-foreground">待批阅试卷总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已批阅学生</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : teacherDashboardData.gradedStudents}</div>
            <p className="text-xs text-muted-foreground">本月共批阅学生数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : teacherDashboardData.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">所有试卷的平均分</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均阅卷时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : teacherDashboardData.averageGradingTime ? `${teacherDashboardData.averageGradingTime.toFixed(1)} 分钟` : "暂无数据"}</div>
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
            ) : teacherDashboardData.recentExams.length > 0 ? (
              <div className="space-y-8">
                {teacherDashboardData.recentExams.map((exam) => (
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
            ) : teacherDashboardData.studentsToWatch.length > 0 ? (
              <div className="space-y-8">
                {teacherDashboardData.studentsToWatch.map((student) => (
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
  );
  
  // 学生仪表盘
  const renderStudentDashboard = () => (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">学生仪表盘</h2>
        <div className="flex items-center space-x-2">
          <Link href="/exams">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              查看所有考试
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总考试数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : studentDashboardData.totalExams}</div>
            <p className="text-xs text-muted-foreground">您参与的所有考试</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成考试</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : studentDashboardData.completedExams}</div>
            <p className="text-xs text-muted-foreground">已完成的考试数量</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均分</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : studentDashboardData.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">您的考试平均分</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最高分</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : studentDashboardData.highestScore}</div>
            <p className="text-xs text-muted-foreground">您的最高考试成绩</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>最近的考试</CardTitle>
            <CardDescription>查看您最近参加的考试和成绩</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-8">
                <p>加载中...</p>
              </div>
            ) : studentDashboardData.recentExams.length > 0 ? (
              <div className="space-y-8">
                {studentDashboardData.recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{exam.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exam.exam_date).toLocaleDateString()} · 得分: {exam.score}/{exam.total_score}
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
              <p className="text-muted-foreground">暂无考试记录</p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>学科表现</CardTitle>
            <CardDescription>各科目的成绩表现和平均分比较</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-8">
                <p>加载中...</p>
              </div>
            ) : studentDashboardData.subjectPerformance.length > 0 ? (
              <div className="space-y-8">
                {studentDashboardData.subjectPerformance.map((subject, index) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{subject.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        您的分数: {subject.score} · 班级平均: {subject.average}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {subject.score > subject.average ? (
                        <span className="text-green-500">+{(subject.score - subject.average).toFixed(1)}</span>
                      ) : (
                        <span className="text-red-500">{(subject.score - subject.average).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无学科表现数据</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return userRole === "student" ? renderStudentDashboard() : renderTeacherDashboard();
}
