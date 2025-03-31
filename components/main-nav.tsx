"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BookOpen, BarChart, Settings, Users, FileText } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
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
      href: "/analytics",
      label: "数据分析",
      icon: <BarChart className="mr-2 h-4 w-4" />,
      active: pathname === "/analytics",
    },
    {
      href: "/users",
      label: "用户管理",
      icon: <Users className="mr-2 h-4 w-4" />,
      active: pathname === "/users",
    },
    {
      href: "/settings",
      label: "设置",
      icon: <Settings className="mr-2 h-4 w-4" />,
      active: pathname === "/settings",
    },
  ]

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

