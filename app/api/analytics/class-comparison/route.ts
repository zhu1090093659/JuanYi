import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取所有学生的学校数据
    const { data: schools, error: schoolError } = await supabase
      .from("users")
      .select("school")
      .eq("role", "student")
      .not("school", "is", null);

    if (schoolError) {
      console.error("Error fetching schools:", schoolError);
      return NextResponse.json({ error: schoolError.message }, { status: 500 });
    }

    // 如果没有学校数据，返回空数组
    if (!schools || schools.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 获取唯一的学校列表
    const uniqueSchools = Array.from(new Set(schools.map(s => s.school)));

    // 获取所有成绩数据
    const { data: scoreData, error: scoreError } = await supabase
      .from("grades")
      .select("score, students:users!inner(school)")
      .eq("users.role", "student");

    if (scoreError) {
      console.error("Error fetching scores:", scoreError);
      return NextResponse.json({ error: scoreError.message }, { status: 500 });
    }

    // 按学校计算平均分
    const schoolScores = uniqueSchools.map(school => {
      // 过滤出该学校的成绩
      const schoolScores = scoreData?.filter(item => item.students[0]?.school === school) || [];
      
      // 计算平均分
      let averageScore = null;
      if (schoolScores.length > 0) {
        const sum = schoolScores.reduce((acc, curr) => acc + (curr.score || 0), 0);
        averageScore = parseFloat((sum / schoolScores.length).toFixed(1));
      }
      
      return {
        class: school, // 使用学校名称作为班级名称
        averageScore
      };
    });

    return NextResponse.json({ data: schoolScores });
  } catch (error) {
    console.error("Error in class comparison API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
