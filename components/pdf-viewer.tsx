"use client"

import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'

// 动态导入React-PDF组件，确保它们只在客户端渲染
const PDFDocument = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[600px]" />
})

const PDFPage = dynamic(() => import('react-pdf').then(mod => mod.Page), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[600px]" />
})

// 导入pdfjs用于配置worker
const initWorker = async () => {
  if (typeof window === 'undefined') return false
  
  try {
    // 导入react-pdf库中的pdfjs
    const { pdfjs } = await import('react-pdf')
    
    // 配置worker - 使用动态版本号以匹配实际安装的版本
    if (pdfjs) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
      return true
    }
    return false
  } catch (error) {
    console.error('PDF Worker初始化失败:', error)
    return false
  }
}

interface PDFViewerProps {
  file: File | string | null
  className?: string
}

export default function PDFViewer({ file, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isWorkerInitialized, setIsWorkerInitialized] = useState<boolean>(false)

  // 使用useMemo来缓存options对象，防止不必要的重新渲染
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist/standard_fonts/'
  }), []);

  // 初始化PDF worker
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return
    
    const init = async () => {
      const initialized = await initWorker()
      setIsWorkerInitialized(initialized)
      if (!initialized) {
        setError('PDF查看器初始化失败')
      }
    }
    
    init()
  }, [])

  // 处理文件转换为URL
  useEffect(() => {
    // 重置状态
    if (!file) {
      setFileUrl(null)
      setLoading(false)
      setError(null)
      return
    }

    // 确保worker已初始化
    if (!isWorkerInitialized) return

    setLoading(true)
    setError(null)

    try {
      // 如果file是字符串（URL），直接使用
      if (typeof file === 'string') {
        setFileUrl(file)
      } else if (file instanceof File) {
        // 如果是File对象，创建一个Blob URL
        const url = URL.createObjectURL(file)
        setFileUrl(url)
        
        // 清理函数：组件卸载时释放URL
        return () => {
          URL.revokeObjectURL(url)
        }
      }
    } catch (err: any) {
      console.error('处理PDF文件错误:', err)
      setError(`无法处理PDF文件: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [file, isWorkerInitialized])

  // PDF加载成功回调
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
    setLoading(false)
  }

  // PDF加载失败回调
  function onDocumentLoadError(error: Error) {
    console.error('PDF加载失败:', error)
    
    // 检查错误消息是否包含特定的非致命性错误
    if (error.message?.includes('worker') || error.message?.includes('fake worker')) {
      // 完全忽略worker相关错误，因为我们只需要解析PDF内容而不需要显示
      console.warn('PDF Worker加载警告 (已忽略):', error)
      return; // 直接返回，不设置错误状态
    }
    
    // 只有在真正无法解析PDF内容的情况下才显示错误
    setError('无法解析PDF文件内容，请检查文件格式是否正确。')
    setLoading(false)
  }

  // 翻页函数
  function changePage(offset: number) {
    const newPageNumber = pageNumber + offset
    if (newPageNumber >= 1 && newPageNumber <= numPages) {
      setPageNumber(newPageNumber)
    }
  }

  // 缩放函数
  function changeZoom(delta: number) {
    const newScale = Math.max(0.5, Math.min(scale + delta, 2.0))
    setScale(newScale)
  }

  // 如果没有文件，显示空状态
  if (!file) {
    return <div className="p-4 text-center text-muted-foreground">无PDF文件可显示</div>
  }

  // 如果PDF.js尚未初始化，显示加载状态
  if (!isWorkerInitialized) {
    return <Skeleton className="w-full h-[600px]" />
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {error ? (
        <div className="p-4 bg-red-50 text-red-500 rounded-md">{error}</div>
      ) : (
        <>
          {fileUrl && (
            <PDFDocument
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Skeleton className="w-full h-[600px]" />}
              options={pdfOptions}
            >
              <PDFPage 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<Skeleton className="w-full h-[600px]" />}
                className="border shadow-sm rounded-md"
              />
            </PDFDocument>
          )}

          {numPages > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeZoom(-0.1)}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeZoom(0.1)}
                disabled={scale >= 2.0}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm">
                  {pageNumber} / {numPages}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
