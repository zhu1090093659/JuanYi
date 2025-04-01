"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [redirectChecked, setRedirectChecked] = useState(false)
  const [showVerifyAlert, setShowVerifyAlert] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<{
    checked: boolean;
    isVerified: boolean;
    email: string | null;
  }>({ checked: false, isVerified: false, email: null });
  const { signIn, session } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // 检查用户是否已登录
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 检查是否是通过登出操作跳转到登录页的
        const isFromLogout = sessionStorage.getItem('is_from_logout');
        if (isFromLogout) {
          // 清除标记
          sessionStorage.removeItem('is_from_logout');
          return; // 不要自动重定向
        }
        
        // 如果已经登录且存在会话，重定向到仪表盘
        if (session) {
          console.log("检测到已登录状态，准备重定向");
          // 使用setTimeout确保DOM已经完全加载
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
          return;
        }
        
        // 检查验证状态
        checkVerificationStatus();
      } catch (error) {
        console.error("会话检查错误:", error);
      }
    };
    
    if (!redirectChecked) {
      setRedirectChecked(true);
      checkSession();
    }
  }, [redirectChecked, session, router]);
  
  // 检查邮箱验证状态
  const checkVerificationStatus = () => {
    // 检查是否刚刚完成了邮箱验证
    const emailVerified = document.cookie.includes('email_verified=true');
    
    // 从cookie获取验证邮箱
    let verifiedEmail = null;
    const match = document.cookie.match(/verified_email=([^;]+)/);
    if (match) {
      verifiedEmail = decodeURIComponent(match[1]);
    }
    
    if (emailVerified) {
      // 清除验证状态cookie
      document.cookie = 'email_verified=; Max-Age=0; path=/;';
      if (verifiedEmail) {
        document.cookie = 'verified_email=; Max-Age=0; path=/;';
      }
      
      setVerificationStatus({
        checked: true,
        isVerified: true,
        email: verifiedEmail
      });
      
      // 显示验证成功提示
      toast({
        title: "邮箱验证成功",
        description: verifiedEmail 
          ? `邮箱 ${verifiedEmail} 已验证，请登录`
          : "您的邮箱已验证，现在可以登录了",
      });
      
      // 填充邮箱
      if (verifiedEmail) {
        setEmail(verifiedEmail);
      } else {
        // 使用localStorage中的邮箱
        const savedEmail = localStorage.getItem('lastEmail');
        if (savedEmail) {
          setEmail(savedEmail);
        }
      }
    } else {
      // 如果没有验证标记，使用localStorage中的邮箱
      const savedEmail = localStorage.getItem('lastEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  };
  
  // 处理登录表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 保存邮箱到本地存储，以便后续使用
      localStorage.setItem("lastEmail", email);
      
      console.log("尝试登录...", email);
      
      // 使用AuthContext的signIn方法
      await signIn(email, password);
      
      console.log("登录成功");
      toast({
        title: "登录成功",
        description: "欢迎回来！",
      });
      
      // 登录成功后重定向到仪表盘
      router.push("/dashboard");
      
    } catch (error: any) {
      console.error("登录失败:", error);
      
      // 处理邮箱未验证的错误
      if (error.message && error.message.includes("Email not confirmed")) {
        // 显示验证对话框
        setShowVerifyAlert(true);
      } else {
        toast({
          title: "登录失败",
          description: error.message || "请检查您的邮箱和密码",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  // 重新发送验证邮件
  const resendVerificationEmail = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast({
        title: "验证邮件已发送",
        description: "请查看您的邮箱并点击验证链接",
      });
      
      // 隐藏验证对话框
      setShowVerifyAlert(false);
    } catch (error: any) {
      console.error("重发验证邮件失败:", error);
      toast({
        title: "发送失败",
        description: error.message || "无法发送验证邮件，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };
  
  // 如果已验证，显示一个特殊样式
  const emailInputClass = verificationStatus.isVerified && email === verificationStatus.email
    ? "ring-2 ring-green-500"
    : "";

  return (
    <>
      <div className="flex h-screen w-full items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>登录您的 AI 阅卷平台账号</CardDescription>
            {verificationStatus.isVerified && (
              <div className="mt-2 rounded-md bg-green-50 p-2 text-sm text-green-800">
                邮箱验证成功！您现在可以登录了。
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form id="login-form" onSubmit={handleSubmit}>
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
                    className={emailInputClass}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="您的密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button 
              className="w-full" 
              type="submit" 
              form="login-form"
              disabled={isLoading}
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
            <div className="mt-4 flex w-full flex-col space-y-2">
              <div className="text-center text-sm">
                还没有账号?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  注册
                </Link>
              </div>
              <div className="text-center text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  忘记密码?
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* 邮箱验证提醒对话框 */}
      <AlertDialog open={showVerifyAlert} onOpenChange={setShowVerifyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>邮箱未验证</AlertDialogTitle>
            <AlertDialogDescription>
              您需要先验证邮箱才能登录。我们之前已经发送了一封包含验证链接的邮件至 {email}。
              请检查您的收件箱和垃圾邮件文件夹。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0">
            <AlertDialogAction
              onClick={resendVerificationEmail}
              disabled={resendLoading}
            >
              {resendLoading ? "发送中..." : "重新发送验证邮件"}
            </AlertDialogAction>
            <AlertDialogCancel>关闭</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

