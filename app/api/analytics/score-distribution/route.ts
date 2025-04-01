import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取成绩分布数据
    const { data: scores, error } = await supabase
      .from("grades")
      .select("score");

    if (error) {
      console.error("Error fetching score distribution:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 定义分数区间
    const ranges = [
      { min: 0, max: 59, label: "不及格" },
      { min: 60, max: 69, label: "及格" },
      { min: 70, max: 79, label: "良好" },
      { min: 80, max: 89, label: "优秀" },
      { min: 90, max: 100, label: "优异" }
    ];

    // 初始化分数分布数据
    const distribution = ranges.map(range => ({
      range: range.label,
      count: 0
    }));

    // 统计各分数区间的学生数量
    if (scores) {
      scores.forEach(score => {
        const studentScore = score.score || 0;
        for (let i = 0; i < ranges.length; i++) {
          if (studentScore >= ranges[i].min && studentScore <= ranges[i].max) {
            distribution[i].count++;
            break;
          }
        }
      });
    }

    return NextResponse.json({ data: distribution });
  } catch (error) {
    console.error("Error in score distribution API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
