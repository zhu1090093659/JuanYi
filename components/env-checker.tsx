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
  // 不再检查环境变量，直接返回null
  return null
}
