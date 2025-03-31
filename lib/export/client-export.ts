"use client"

import { useToast } from "@/components/ui/use-toast"

export function useExport() {
  const { toast } = useToast()

  const exportExam = async (examId: string, format: string, options: any) => {
    try {
      // 发送导出请求
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ examId, format, options }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "导出失败")
      }

      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "export"

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1])
        }
      }

      // 创建 Blob 并下载
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "导出成功",
        description: `文件 "${filename}" 已下载`,
      })
    } catch (error: any) {
      toast({
        title: "导出失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      })
      throw error
    }
  }

  return { exportExam }
}

