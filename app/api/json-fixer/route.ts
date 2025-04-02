import { NextRequest, NextResponse } from "next/server";
import { fixJsonWithAI } from "@/lib/file-parser";

/**
 * 处理JSON格式修复的API路由
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求中的JSON数据
    const data = await req.json();
    const { brokenJson, errorMessage, apiKey, model } = data;
    
    if (!brokenJson) {
      return NextResponse.json(
        { error: "缺少需要修复的JSON" },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "缺少API密钥" },
        { status: 400 }
      );
    }
    
    // 使用AI修复JSON格式
    const fixedJson = await fixJsonWithAI(brokenJson, errorMessage || "JSON解析失败", apiKey, model);
    
    // 返回修复结果
    return NextResponse.json({
      success: true,
      fixedJson
    });
  } catch (error: any) {
    console.error("JSON修复API错误:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "修复JSON时发生错误" 
      },
      { status: 500 }
    );
  }
} 