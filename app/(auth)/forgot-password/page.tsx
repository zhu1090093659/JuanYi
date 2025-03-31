"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { resetPassword } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await resetPassword(email)
      setIsSubmitted(true)
      toast({
        title: "重置链接已发送",
        description: "请检查您的邮箱以重置密码",
      })
    } catch (error: any) {
      toast({
        title: "发送失败",
        description: error.message || "请检查您的邮箱地址",
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
          <CardTitle>忘记密码</CardTitle>
          <CardDescription>输入您的邮箱地址以重置密码</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <div className="grid w-full items-center gap-4">
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
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="mb-4">重置链接已发送到您的邮箱</p>
              <p className="text-sm text-muted-foreground">请检查您的邮箱 {email} 并点击重置链接</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          {!isSubmitted ? (
            <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "发送中..." : "发送重置链接"}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" onClick={() => setIsSubmitted(false)}>
              重新发送
            </Button>
          )}
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              返回登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

