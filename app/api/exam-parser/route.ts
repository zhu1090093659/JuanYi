import { NextRequest, NextResponse } from "next/server";
import { parseExamWithAI } from "@/lib/file-parser";

/**
 * 处理试卷文件解析的API路由
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求中的JSON数据
    const data = await req.json();
    const { fileContent, apiKey, model } = data;
    
    if (!fileContent) {
      return NextResponse.json(
        { error: "缺少文件内容" },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "缺少API密钥" },
        { status: 400 }
      );
    }
    
    // 使用AI解析试卷内容，传递API密钥和模型名称
    const parsedExam = await parseExamWithAI(fileContent, apiKey, model);
    
    if (!parsedExam.success) {
      return NextResponse.json(
        { error: parsedExam.error || "试卷解析失败" },
        { status: 500 }
      );
    }
    
    // 返回解析结果
    return NextResponse.json(parsedExam);
  } catch (error: any) {
    console.error("试卷解析API错误:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}
