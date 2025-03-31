"use client"

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// 动态导入mammoth，确保只在客户端加载
const initMammoth = async () => {
  if (typeof window === 'undefined') return null
  
  try {
    return await import('mammoth').catch(err => {
      console.error('Mammoth.js导入错误:', err)
      return null
    })
  } catch (error) {
    console.error('Mammoth.js初始化失败:', error)
    return null
  }
}

interface DocxViewerProps {
  file: File | null
  className?: string
}

export default function DocxViewer({ file, className = '' }: DocxViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // 初始化Mammoth
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return
    
    const init = async () => {
      const mammoth = await initMammoth()
      if (mammoth) {
        setIsInitialized(true)
      } else {
        setError('DOCX查看器初始化失败')
      }
    }
    
    init()
  }, [])

  // 处理文件转换为HTML
  useEffect(() => {
    // 重置状态
    if (!file) {
      setHtmlContent('')
      setLoading(false)
      setError(null)
      return
    }

    // 确保Mammoth已初始化
    if (!isInitialized) return

    const convertDocx = async () => {
      setLoading(true)
      setError(null)

      try {
        const mammoth = await initMammoth()
        if (!mammoth) {
          throw new Error('DOCX解析库未能加载')
        }

        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        
        setHtmlContent(result.value)
      } catch (err: any) {
        console.error('处理DOCX文件错误:', err)
        setError(`无法处理DOCX文件: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    convertDocx()
  }, [file, isInitialized])

  // 如果没有文件，显示空状态
  if (!file) {
    return <div className="p-4 text-center text-muted-foreground">无DOCX文件可显示</div>
  }

  // 如果Mammoth尚未初始化，显示加载状态
  if (!isInitialized) {
    return <Skeleton className="w-full h-[600px]" />
  }

  return (
    <div className={`overflow-auto border rounded-md shadow-sm ${className}`}>
      {error ? (
        <div className="p-4 bg-red-50 text-red-500 rounded-md">{error}</div>
      ) : loading ? (
        <Skeleton className="w-full h-[600px]" />
      ) : (
        <div 
          className="p-4 max-h-[600px] overflow-auto" 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  )
}
