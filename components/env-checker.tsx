"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// 环境上下文
interface EnvContextType {
  isClient: boolean
  pdfJsReady: boolean
}

const EnvContext = createContext<EnvContextType>({
  isClient: false,
  pdfJsReady: false
})

// 环境提供者组件
export function EnvProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  const [pdfJsReady, setPdfJsReady] = useState(false)

  useEffect(() => {
    // 设置客户端环境标志
    setIsClient(true)

    // 尝试初始化PDF.js
    const initPdfJs = async () => {
      try {
        // 仅尝试导入PDF.js，不需要使用其结果
        await import('pdfjs-dist/legacy/build/pdf')
        setPdfJsReady(true)
      } catch (error) {
        console.error('PDF.js初始化失败:', error)
        setPdfJsReady(false)
      }
    }

    initPdfJs()
  }, [])

  return (
    <EnvContext.Provider value={{ isClient, pdfJsReady }}>
      {children}
    </EnvContext.Provider>
  )
}

// 自定义钩子
export function useEnv() {
  return useContext(EnvContext)
}

// PDF功能包装器 - 确保PDF相关组件只在客户端渲染
export function ClientOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const { isClient } = useEnv()
  
  if (!isClient) {
    return fallback || null
  }
  
  return <>{children}</>
}

// PDF功能特定包装器
export function PdfFeature({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const { isClient, pdfJsReady } = useEnv()
  
  if (!isClient || !pdfJsReady) {
    return fallback || <div className="p-4 text-center text-muted-foreground">PDF功能正在加载或不可用</div>
  }
  
  return <>{children}</>
}

export function EnvChecker() {
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    // 延迟检查环境变量，确保Next.js有足够时间加载它们
    const timer = setTimeout(() => {
      const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
      
      // 检查客户端可访问的环境变量（仅检查NEXT_PUBLIC_前缀的变量）
      const missing = requiredVars.filter((varName) => {
        // 使用window对象上的ENV获取环境变量
        const value = process.env[varName] || 
                     (typeof window !== 'undefined' && (window as any).__ENV && (window as any).__ENV[varName])
        return !value
      })

      setMissingVars(missing)
    }, 5000) // 给予5000ms的延迟等待环境变量加载
    
    return () => clearTimeout(timer)
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
