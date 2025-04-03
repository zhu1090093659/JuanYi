import type React from "react"
import { Inter } from "next/font/google"
import { ClientProviders } from "@/components/client-providers"
import { EnvChecker } from "@/components/env-checker"
import { cn } from "@/lib/utils"
import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "卷知 - 智能阅卷平台",
  description: "卷知 - 面向中学和大学教师的智能阅卷辅助平台",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased", inter.className)}>
        <ClientProviders>
          <EnvChecker />
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}