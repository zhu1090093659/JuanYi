"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    // 检查URL参数中是否包含重置令牌
    const hasParams = searchParams.has("type") && searchParams.has("token")
    
    if (!hasParams) {
      setError("无效的重置链接。请重新请求重置密码链接。")
    }
  }, [searchParams])

  const validatePasswords = () => {
    // 检查密码长度
    if (password.length < 8) {
      setError("密码长度必须至少为8个字符")
      return false
    }
    
    // 检查密码是否匹配
    if (password !== confirmPassword) {
      setError("两次输入的密码不匹配")
      return false
    }
    
    setError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证密码
    if (!validatePasswords()) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 从URL获取重置令牌
      const type = searchParams.get("type") || ""
      const token = searchParams.get("token") || ""
      
      // 更新密码
      const { error } = await supabase.auth.updateUser({
        password,
      })
      
      if (error) {
        throw error
      }
      
      // 设置成功状态
      setIsSuccess(true)
      
      toast({
        title: "密码已重置",
        description: "您的密码已成功更新，请使用新密码登录",
      })
      
      // 延迟后跳转到登录页面
      setTimeout(() => {
        router.push("/login")
      }, 3000)
      
    } catch (error: any) {
      console.error("密码重置错误:", error)
      setError(error.message || "重置密码时出错，请重试")
      toast({
        title: "重置失败",
        description: error.message || "重置密码时出错，请重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>重置密码</CardTitle>
          <CardDescription>
            {isSuccess 
              ? "您的密码已成功重置" 
              : "请设置您的新密码"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-800">
              {error}
            </div>
          )}
          
          {!isSuccess && (
            <form onSubmit={handleSubmit}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">新密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="您的新密码"
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
                    placeholder="再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </form>
          )}
          
          {isSuccess && (
            <div className="py-4 text-center">
              <p className="mb-2">密码重置成功！</p>
              <p className="text-sm text-muted-foreground">
                您将在3秒后被重定向到登录页面...
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          {!isSuccess && (
            <Button 
              className="w-full" 
              onClick={handleSubmit} 
              disabled={isLoading || !!error}
            >
              {isLoading ? "重置中..." : "重置密码"}
            </Button>
          )}
          <div className="mt-4 text-center text-sm">
            <Button 
              variant="link" 
              className="p-0 text-primary hover:underline"
              onClick={() => router.push("/login")}
            >
              返回登录
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 