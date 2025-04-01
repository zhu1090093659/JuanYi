import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 获取待批阅试卷数量
    const { data: pendingExams, error: pendingError } = await supabase
      .from("exams")
      .select("count")
      .eq("status", "pending");
      
    if (pendingError) {
      console.error("Error fetching pending exams:", pendingError);
      return NextResponse.json({ error: pendingError.message }, { status: 500 });
    }
      
    // 获取已批阅学生数量
    const { data: gradedStudents, error: studentsError } = await supabase
      .from("grades")
      .select("count")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
    if (studentsError) {
      console.error("Error fetching graded students:", studentsError);
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }
      
    // 获取成绩数据以计算平均分，从grades表直接获取
    const { data: scores, error: scoresError } = await supabase
      .from("grades")
      .select("score");
      
    if (scoresError) {
      console.error("Error fetching scores:", scoresError);
      return NextResponse.json({ error: scoresError.message }, { status: 500 });
    }
    
    // 计算平均分
    let averageScore = 0;
    if (scores && scores.length > 0) {
      const sum = scores.reduce((acc, curr) => acc + (curr.score || 0), 0);
      averageScore = sum / scores.length;
    }
      
    // 获取最近批阅的试卷
    const { data: recentExams, error: recentError } = await supabase
      .from("exams")
      .select(`
        id,
        name,
        exam_date
      `)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(4);
      
    if (recentError) {
      console.error("Error fetching recent exams:", recentError);
      return NextResponse.json({ error: recentError.message }, { status: 500 });
    }
      
    // 获取学生数据，从users表中获取学生角色用户
    const { data: studentsToWatch, error: watchError } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "student")
      .limit(4);
      
    if (watchError) {
      console.error("Error fetching students to watch:", watchError);
      return NextResponse.json({ error: watchError.message }, { status: 500 });
    }

    // 处理学生数据格式，但不添加模拟数据
    const formattedStudents = studentsToWatch ? studentsToWatch.map(student => ({
      id: student.id,
      name: student.name,
      class: null, // 从数据库获取班级信息
      issue: null  // 从数据库获取问题信息
    })) : [];
      
    return NextResponse.json({
      data: {
        pendingExams: pendingExams?.[0]?.count || 0,
        gradedStudents: gradedStudents?.[0]?.count || 0,
        averageScore: parseFloat(averageScore.toFixed(1)),
        averageGradingTime: null, // 待补充实际统计数据
        recentExams: recentExams || [],
        studentsToWatch: formattedStudents
      }
    });
  } catch (error) {
    console.error("Error in dashboard data API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
