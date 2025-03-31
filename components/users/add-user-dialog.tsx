"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { UserPlus } from "lucide-react"

export function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "teacher" as "teacher" | "student" | "admin",
    school: "",
    class: "",
  })
  const { toast } = useToast()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "表单不完整",
        description: "请填写必填字段",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            school: formData.school || null,
            class: formData.class || null,
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "添加成功",
        description: `用户 ${formData.name} 已成功添加`,
      })

      // 重置表单并关闭对话框
      setFormData({
        name: "",
        email: "",
        role: "teacher",
        school: "",
        class: "",
      })
      setOpen(false)

      // 刷新页面以显示新用户
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "添加失败",
        description: error.message || "无法添加用户",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          添加用户
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加新用户</DialogTitle>
          <DialogDescription>填写以下信息以创建新用户账号</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              姓名
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              角色
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: "teacher" | "student" | "admin") => handleChange("role", value)}
            >
              <SelectTrigger id="role" className="col-span-3">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="student">学生</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="school" className="text-right">
              学校
            </Label>
            <Input
              id="school"
              value={formData.school}
              onChange={(e) => handleChange("school", e.target.value)}
              className="col-span-3"
            />
          </div>
          {formData.role === "student" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="class" className="text-right">
                班级
              </Label>
              <Input
                id="class"
                value={formData.class}
                onChange={(e) => handleChange("class", e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "添加中..." : "添加用户"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

