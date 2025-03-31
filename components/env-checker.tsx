"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function EnvChecker() {
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

    // 检查客户端可访问的环境变量
    const missing = requiredVars.filter((varName) => {
      if (varName.startsWith("NEXT_PUBLIC_")) {
        return !process.env[varName]
      }
      // 服务端变量无法在客户端检查，所以我们只检查是否有相关错误提示
      return false
    })

    setMissingVars(missing)
  }, [])

  if (missingVars.length === 0) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>缺少环境变量</AlertTitle>
      <AlertDescription>
        <p>以下环境变量未正确配置：</p>
        <ul className="list-disc pl-5 mt-2">
          {missingVars.map((varName) => (
            <li key={varName}>{varName}</li>
          ))}
        </ul>
        <p className="mt-2">请确保这些变量已在 .env.local 文件中正确设置，并重启应用。</p>
      </AlertDescription>
    </Alert>
  )
}

