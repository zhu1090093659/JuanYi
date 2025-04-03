import type React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4">{children}</main>
        <footer className="py-6 text-center text-sm text-muted-foreground">© 2024 卷知. 保留所有权利.</footer>
      </div>
    </AuthProvider>
  )
}

