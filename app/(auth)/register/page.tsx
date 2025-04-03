"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"teacher" | "student" | "admin">("teacher")
  const [school, setSchool] = useState("")
  const [classGroup, setClassGroup] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [teachers, setTeachers] = useState<{id: string, name: string}[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const { signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // 创建 Supabase 客户端
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 当角色更改为学生时，清空教师和班级选择
  useEffect(() => {
    if (role === "student") {
      setTeacherId("")
      setClassGroup("")
      setClasses([])
      // 如果学校已填写，获取教师列表
      if (school) {
        fetchTeachers()
      }
    }
  }, [role])

  // 当学校变化且角色是学生时，获取教师列表
  useEffect(() => {
    if (role === "student" && school) {
      setTeacherId("")
      setClassGroup("")
      setClasses([])
      fetchTeachers()
    }
  }, [school, role])

  // 当选择教师变化时，获取班级列表
  useEffect(() => {
    if (teacherId && role === "student") {
      fetchClasses()
    }
  }, [teacherId])

  // 获取教师列表 - 根据学校筛选
  const fetchTeachers = async () => {
    setIsLoadingData(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name")
        .eq("role", "teacher")
        .eq("school", school)
      
      if (error) {
        console.error("获取教师列表失败:", error)
        toast({
          title: "获取教师列表失败",
          description: error.message || "发生未知错误",
          variant: "destructive",
        })
        return
      }
      
      // 按ID对教师列表进行去重
      const uniqueTeachers = data ? Array.from(
        new Map(data.map(item => [item.id, item])).values()
      ) : [];
      
      console.log("获取到的教师列表:", uniqueTeachers)
      setTeachers(uniqueTeachers)
    } catch (error: any) {
      console.error("获取教师列表错误:", error)
      toast({
        title: "获取教师列表错误",
        description: error.message || "发生未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // 获取班级列表 - 根据教师ID查询
  const fetchClasses = async () => {
    setIsLoadingData(true)
    try {
      // 简化查询，只根据学校筛选，不使用teacher_id字段
      const { data, error } = await supabase
        .from("users")
        .select("class")
        .eq("role", "student")
        .eq("school", school)
        .not("class", "is", null)

      if (error) {
        console.error("获取班级列表失败:", error)
        toast({
          title: "获取班级列表失败",
          description: "无法从数据库获取班级信息",
          variant: "destructive",
        })
        return
      }

      // 提取唯一的班级名称
      const uniqueClasses = Array.from(new Set(data?.filter(item => item.class).map(item => item.class) || []))
      console.log("获取到的班级列表:", uniqueClasses)
      setClasses(uniqueClasses)
    } catch (error: any) {
      console.error("获取班级列表错误:", error)
      toast({
        title: "获取班级列表错误",
        description: error.message || "发生未知错误",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "请确保两次输入的密码相同",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const userData = {
        name,
        role,
        school,
        class: classGroup,
        teacher_id: role === "student" ? teacherId : null,
      }

      await signUp(email, password, userData)

      toast({
        title: "注册成功",
        description: "请查看您的邮箱以验证账号",
      })

      router.push("/login?registered=true")
    } catch (error: any) {
      console.error("注册失败:", error);
      toast({
        title: "注册失败",
        description: error.message || "请检查您的输入信息",
        variant: "destructive",
      })
      
      if (error.message.includes("验证邮件发送失败") || error.message.includes("confirmation email")) {
        console.error("注册时邮件发送失败:", error);
        setTimeout(() => {
          toast({
            title: "技术提示",
            description: "此错误通常是因为Supabase邮件服务配置问题。请联系网站管理员。",
          });
        }, 1000);
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>注册</CardTitle>
          <CardDescription>创建您的卷知账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  placeholder="您的真实姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="您的邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="设置密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-password">确认密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="role">角色</Label>
                <Select value={role} onValueChange={(value: "teacher" | "student" | "admin") => setRole(value)}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="选择您的角色" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="teacher">教师</SelectItem>
                    <SelectItem value="student">学生</SelectItem>
                    <SelectItem value="admin">教务管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="school">学校</Label>
                <Input
                  id="school"
                  placeholder="您所在的学校"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  required
                />
              </div>
              {role === "student" && (
                <>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="teacher">选择教师</Label>
                    <Select value={teacherId} onValueChange={setTeacherId} disabled={!school || teachers.length === 0}>
                      <SelectTrigger id="teacher" className="w-full">
                        <SelectValue placeholder={school ? (teachers.length > 0 ? "选择您的老师" : "没有找到老师") : "请先输入学校"} />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[100]">
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="class">班级</Label>
                    {classes.length > 0 ? (
                      <Select value={classGroup} onValueChange={setClassGroup}>
                        <SelectTrigger id="class" className="w-full">
                          <SelectValue placeholder="选择您的班级" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="z-[100]">
                          {classes.map((cls) => (
                            <SelectItem key={cls} value={cls}>
                              {cls}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="class"
                        placeholder={teacherId ? "请输入新班级" : "请先选择教师"}
                        value={classGroup}
                        onChange={(e) => setClassGroup(e.target.value)}
                        disabled={!teacherId}
                        required
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "注册中..." : "注册"}
          </Button>
          <div className="mt-4 text-center text-sm">
            已有账号?{" "}
            <Link href="/login" className="text-primary hover:underline">
              登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

