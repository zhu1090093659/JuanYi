"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { signIn, signOut as nextAuthSignOut, useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase/client"

type AuthContextType = {
  user: any | null
  session: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  getCurrentUser: () => Promise<any | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const user = session?.user || null

  // 直接通过NextAuth登录
  const handleSignIn = async (email: string, password: string) => {
    console.log("开始登录流程:", email)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("登录处理错误:", error)
      throw error
    }
  }

  // 使用Supabase注册（保留原有逻辑）
  const handleSignUp = async (email: string, password: string, userData: any) => {
    console.log("开始注册流程:", email)
    try {
      // 获取当前站点URL，优先使用环境变量中的站点URL
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;
      
      console.log("使用重定向URL:", redirectTo);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: redirectTo,
        },
      })
      
      console.log("注册响应:", data, error)

      // 保存邮箱到本地存储，方便后续验证失败时使用
      localStorage.setItem("lastEmail", email);

      if (error) {
        if (error.message.includes("sending confirmation email")) {
          console.error("邮件发送失败:", error)
          throw new Error("验证邮件发送失败。系统已创建您的账户，但无法发送验证邮件。请联系管理员或稍后再试。")
        }
        throw error
      }

      // 如果用户需要验证邮箱
      if (data.user && !data.user.email_confirmed_at) {
        console.log("用户已创建，等待邮箱验证");
      }
    } catch (error) {
      console.error("注册处理错误:", error)
      throw error
    }
  }

  // 使用NextAuth登出
  const handleSignOut = async () => {
    console.log("开始登出流程")
    try {
      await nextAuthSignOut({ redirect: false })
      
      // 设置标记表示是从登出操作来的
      sessionStorage.setItem('is_from_logout', 'true');
      
      // 登出后重定向到登录页
      window.location.href = "/login";
    } catch (error) {
      console.error("登出处理错误:", error)
      throw error
    }
  }

  // 密码重置（保留原有逻辑）
  const resetPassword = async (email: string) => {
    console.log("开始重置密码流程:", email)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      console.log("重置密码响应:", error ? "失败" : "成功")

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("重置密码处理错误:", error)
      throw error
    }
  }

  // 获取当前用户
  const getCurrentUser = async () => {
    if (session?.user) {
      return session.user;
    }
    return null;
  }

  const value = {
    user,
    session,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword,
    getCurrentUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

