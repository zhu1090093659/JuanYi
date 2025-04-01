"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">加载中...</span>
          </div>
        }
      >
        <main className="flex-1">{children}</main>
      </Suspense>
    </div>
  )
}

