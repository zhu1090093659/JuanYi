import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取问题数据
    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select("id, number, content, score, exam_id")
      .limit(10);

    if (questionError) {
      console.error("Error fetching questions:", questionError);
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    // 返回问题数据，添加默认的难度指标
    const questionDifficulty = questions ? questions.map(question => {
      // 为前端提供预期的数据结构和格式
      return {
        id: question.id,
        number: question.number || 0,
        content: question.content?.substring(0, 50) + "..." || `问题 ${question.id}`,
        correctRate: 0, // 默认值，确保不是null
        discrimination: 0, // 默认值，确保不是null
        score: question.score || 0,
        exam_id: question.exam_id
      };
    }) : [];

    return NextResponse.json({ data: questionDifficulty });
  } catch (error) {
    console.error("Error in question difficulty API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
