"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, FileText, Eye, Pencil, Trash, UploadCloud } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const userRole = user?.role || "student"

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from("exams")
        .select(`
          *,
          subjects(name),
          created_by:users(name)
        `)
        .order("created_at", { ascending: false })
      
      // 学生只能查看分配给他们的试卷
      if (userRole === "student" && user?.id) {
        query = query.eq("student_id", user.id)
      }

      const { data, error } = await query

      if (error) {
        setError(error.message)
        return
      }

      setExams(data || [])
    } catch (error: any) {
      console.error("Error fetching exams:", error)
      setError(error.message || "加载试卷数据时出错")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个试卷吗？此操作不可撤销。")) {
      return
    }

    try {
      const { error } = await supabase.from("exams").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "删除成功",
        description: "试卷已成功删除",
      })

      // 刷新试卷列表
      fetchExams()
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message || "无法删除试卷",
        variant: "destructive",
      })
    }
  }

  // 教师/管理员视图
  const renderTeacherView = () => (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">试卷管理</h2>
        <div className="flex items-center space-x-2">
          <Link href="/exams/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建试卷
            </Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>所有试卷</CardTitle>
          <CardDescription>管理您创建的所有试卷和批阅任务</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">加载中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>试卷名称</TableHead>
                  <TableHead>创建日期</TableHead>
                  <TableHead>学生数量</TableHead>
                  <TableHead>批阅状态</TableHead>
                  <TableHead>平均分</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{new Date(exam.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            exam.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : exam.status === "grading"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {exam.status === "completed"
                            ? "已完成"
                            : exam.status === "grading"
                              ? "批阅中"
                              : exam.status === "published"
                                ? "已发布"
                                : "草稿"}
                        </span>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">打开菜单</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/exams/${exam.id}/details`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/exams/${exam.id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              批阅试卷
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/exams/${exam.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(exam.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      暂无试卷数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 学生视图
  const renderStudentView = () => (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">我的试卷</h2>
        <div className="flex items-center space-x-2">
          <Link href="/student/upload-exam">
            <Button>
              <UploadCloud className="mr-2 h-4 w-4" />
              上传试卷
            </Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>我的试卷列表</CardTitle>
          <CardDescription>查看所有分配给您的试卷和已提交的答案</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">加载中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>试卷名称</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>创建日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>分数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subjects?.name}</TableCell>
                      <TableCell>{new Date(exam.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            exam.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : exam.status === "grading"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {exam.status === "completed"
                            ? "已批改"
                            : exam.status === "grading"
                              ? "批阅中"
                              : exam.status === "submitted"
                                ? "已提交"
                                : "未提交"}
                        </span>
                      </TableCell>
                      <TableCell>{exam.score || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">打开菜单</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/student/exams/${exam.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </DropdownMenuItem>
                            {exam.status !== "completed" && (
                              <DropdownMenuItem onClick={() => router.push(`/student/exams/${exam.id}/upload`)}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                上传答案
                              </DropdownMenuItem>
                            )}
                            {exam.status === "completed" && (
                              <DropdownMenuItem onClick={() => router.push(`/student/exams/${exam.id}/feedback`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                查看批改
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      暂无试卷数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 根据用户角色渲染不同视图
  return userRole === "student" ? renderStudentView() : renderTeacherView()
}

