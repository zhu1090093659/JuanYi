"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, Trash, AlertCircle, Database } from "lucide-react"
import Link from "next/link"
import { AddUserDialog } from "@/components/users/add-user-dialog"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

        if (error) {
          // 检查是否是表不存在的错误
          if (error.message.includes("relation") && error.message.includes("does not exist")) {
            setError("数据库表 'users' 不存在。请先创建必要的数据库表。")
          } else {
            setError(error.message)
          }
          return
        }

        setUsers(data || [])
      } catch (error: any) {
        console.error("Error fetching users:", error)
        setError(error.message || "加载用户数据时出错")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // 显示数据库初始化指导
  const renderDatabaseSetupGuide = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          数据库设置指南
        </CardTitle>
        <CardDescription>您需要在 Supabase 中创建必要的数据库表</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>数据库表不存在</AlertTitle>
          <AlertDescription>系统检测到 'users' 表不存在。请按照以下步骤设置数据库。</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h3 className="font-medium">步骤 1: 登录 Supabase 控制台</h3>
          <p className="text-sm text-muted-foreground">
            访问{" "}
            <a
              href="https://app.supabase.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Supabase 控制台
            </a>{" "}
            并登录您的账户。
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">步骤 2: 打开 SQL 编辑器</h3>
          <p className="text-sm text-muted-foreground">在项目中，点击左侧导航栏中的 "SQL 编辑器"。</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">步骤 3: 执行以下 SQL 脚本</h3>
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-80">
            <pre className="text-xs">
              {`-- 启用 UUID 扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
  school TEXT,
  class TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建科目表
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建考试表
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id),
  grade TEXT NOT NULL,
  class TEXT,
  total_score NUMERIC NOT NULL,
  exam_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'grading', 'completed')),
  graded_at TIMESTAMP WITH TIME ZONE
);

-- 创建题目表
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('objective', 'subjective', 'calculation', 'essay')),
  standard_answer TEXT NOT NULL,
  score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建答案表
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建评分表
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id),
  score NUMERIC NOT NULL,
  ai_score NUMERIC,
  ai_confidence NUMERIC,
  feedback TEXT,
  scoring_points JSONB,
  graded_by TEXT NOT NULL,
  graded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建报告表
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.users(id),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建协作表
CREATE TABLE public.collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建活跃评分者表（用于实时协作）
CREATE TABLE public.active_graders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.users(id),
  user_id UUID REFERENCES public.users(id),
  active_since TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入一些初始数据
INSERT INTO public.subjects (name) VALUES 
  ('数学'), 
  ('语文'), 
  ('英语'), 
  ('物理'), 
  ('化学'), 
  ('生物'),
  ('历史'),
  ('地理'),
  ('政治');

-- 启用行级安全策略
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_graders ENABLE ROW LEVEL SECURITY;

-- 创建基本的行级安全策略
CREATE POLICY "允许所有用户查看科目" ON public.subjects FOR SELECT USING (true);

-- 注意：要启用 Realtime 功能，请在 Supabase 控制台中手动配置
-- 1. 转到 Database > Replication
-- 2. 在 "Realtime" 部分，添加您想要实时监控的表
`}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">步骤 4: 启用 Realtime 功能（可选）</h3>
          <p className="text-sm text-muted-foreground">如果您需要实时协作功能，请在 Supabase 控制台中手动配置：</p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-2">
            <li>转到 Database &gt; Replication</li>
            <li>在 "Realtime" 部分，添加您想要实时监控的表（如 active_graders 和 grades）</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">步骤 5: 添加测试用户（可选）</h3>
          <p className="text-sm text-muted-foreground">您可以执行以下 SQL 来添加一个测试用户：</p>
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-xs">
              {`-- 添加测试用户
INSERT INTO public.users (email, name, role, school) 
VALUES ('teacher@example.com', '张老师', 'teacher', '示范中学');`}
            </pre>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/dashboard">返回仪表盘</Link>
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
        <AddUserDialog />
      </div>

      {error && error.includes("数据库表") ? (
        renderDatabaseSetupGuide()
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
            <CardDescription>管理系统中的所有用户账号</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">加载中...</div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>学校/班级</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role === "teacher"
                            ? "教师"
                            : user.role === "student"
                              ? "学生"
                              : user.role === "admin"
                                ? "管理员"
                                : "未知"}
                        </TableCell>
                        <TableCell>
                          {user.school}
                          {user.class && ` / ${user.class}`}
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        暂无用户数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

