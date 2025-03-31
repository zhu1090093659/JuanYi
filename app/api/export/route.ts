import { type NextRequest, NextResponse } from "next/server"
import { handleExport } from "@/lib/export/export-service"

export async function POST(req: NextRequest) {
  try {
    const { examId, format, options } = await req.json()

    if (!examId || !format) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    const result = await handleExport(examId, format, options)

    // 设置响应头
    const headers = new Headers()
    headers.set("Content-Type", result.contentType)
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(result.filename)}"`)

    // 返回文件
    return new NextResponse(result.buffer, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error("导出错误:", error)
    return NextResponse.json({ error: error.message || "导出失败" }, { status: 500 })
  }
}

