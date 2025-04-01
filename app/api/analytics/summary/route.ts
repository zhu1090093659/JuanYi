import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取总考试数量
    const { data: totalExams, error: examError } = await supabase
      .from("exams")
      .select("count");

    if (examError) {
      console.error("Error fetching total exams:", examError);
      return NextResponse.json({ error: examError.message }, { status: 500 });
    }

    // 获取总学生数量
    const { data: totalStudents, error: studentError } = await supabase
      .from("users")
      .select("count")
      .eq("role", "student");

    if (studentError) {
      console.error("Error fetching total students:", studentError);
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    // 获取总班级数量 - 使用学校字段的唯一值数量作为班级数量
    const { data: schoolData, error: classError } = await supabase
      .from("users")
      .select("school")
      .eq("role", "student")
      .not("school", "is", null);

    if (classError) {
      console.error("Error fetching schools:", classError);
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }
    
    // 计算唯一学校/班级的数量
    const uniqueSchools = new Set(schoolData?.map(s => s.school) || []);
    const totalClasses = uniqueSchools.size;

    // 获取平均分
    const { data: scores, error: scoreError } = await supabase
      .from("grades")
      .select("score");

    if (scoreError) {
      console.error("Error fetching scores:", scoreError);
      return NextResponse.json({ error: scoreError.message }, { status: 500 });
    }

    // 计算平均分
    let averageScore = 0;
    if (scores && scores.length > 0) {
      const sum = scores.reduce((acc, curr) => acc + (curr.score || 0), 0);
      averageScore = sum / scores.length;
    }

    // 获取及格率 - 使用grades表
    const { data: passingResults, error: passingError } = await supabase
      .from("grades")
      .select("count")
      .gte("score", 60); // 假设及格分数为60分

    if (passingError) {
      console.error("Error fetching passing results:", passingError);
      return NextResponse.json({ error: passingError.message }, { status: 500 });
    }

    const passingRate = scores && scores.length > 0
      ? (passingResults?.[0]?.count || 0) / scores.length * 100
      : 0;

    return NextResponse.json({
      data: {
        totalExams: totalExams?.[0]?.count || 0,
        totalStudents: totalStudents?.[0]?.count || 0,
        totalClasses: totalClasses || 0,
        averageScore: parseFloat(averageScore.toFixed(1)),
        passingRate: parseFloat(passingRate.toFixed(1)),
        // 不使用模拟数据，返回空对象
        highestScore: {
          score: null,
          student: null,
          class: null
        },
        lowestScore: {
          score: null,
          student: null,
          class: null
        }
      }
    });
  } catch (error) {
    console.error("Error in analytics summary API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
