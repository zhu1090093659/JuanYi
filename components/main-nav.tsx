"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BookOpen, BarChart, Settings, Users, FileText } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export function MainNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  
  // 获取用户角色，默认为student
  const userRole = user?.role || "student"

  // 基础路由 - 所有角色都可以看到
  const baseRoutes = [
    {
      href: "/dashboard",
      label: "仪表盘",
      icon: <BookOpen className="mr-2 h-4 w-4" />,
      active: pathname === "/dashboard",
    },
    {
      href: "/exams",
      label: "试卷管理",
      icon: <FileText className="mr-2 h-4 w-4" />,
      active: pathname === "/exams" || pathname.startsWith("/exams/"),
    },
    {
      href: "/settings",
      label: "设置",
      icon: <Settings className="mr-2 h-4 w-4" />,
      active: pathname === "/settings",
    },
  ]
  
  // 教师和管理员专属路由
  const teacherAdminRoutes = [
    {
      href: "/analytics",
      label: "数据分析",
      icon: <BarChart className="mr-2 h-4 w-4" />,
      active: pathname === "/analytics",
    }
  ]
  
  // 仅管理员可见的路由
  const adminRoutes = [
    {
      href: "/users",
      label: "用户管理",
      icon: <Users className="mr-2 h-4 w-4" />,
      active: pathname === "/users",
    }
  ]
  
  // 根据角色确定可见路由
  let routes = [...baseRoutes]
  
  if (userRole === "teacher" || userRole === "admin") {
    routes = [...routes, ...teacherAdminRoutes]
  }
  
  if (userRole === "admin") {
    routes = [...routes, ...adminRoutes]
  }

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Button key={route.href} variant={route.active ? "default" : "ghost"} asChild className="justify-start">
          <Link
            href={route.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors",
              route.active ? "text-primary-foreground" : "text-muted-foreground hover:text-primary",
            )}
          >
            {route.icon}
            {route.label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}

