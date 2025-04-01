import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取学生数据
    const { data: students, error: studentError } = await supabase
      .from("users")
      .select("id, name")
      .eq("role", "student")
      .limit(10);

    if (studentError) {
      console.error("Error fetching students:", studentError);
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 获取所有学生的成绩数据
    const studentProgress = await Promise.all(
      students.map(async (student) => {
        // 获取学生的考试成绩
        const { data: grades, error: gradesError } = await supabase
          .from("grades")
          .select(`
            score,
            questions!inner(score),
            exams!inner(name, exam_date)
          `)
          .eq("student_id", student.id)
          .order("created_at", { ascending: true });

        if (gradesError) {
          console.error(`Error fetching grades for student ${student.id}:`, gradesError);
          return {
            student: student.name,
            progress: []
          };
        }

        // 处理成绩数据为进度数据
        const progress = grades ? grades.map((grade) => {
          const exam = grade.exams[0];
          const question = grade.questions[0];
          const scorePercentage = question.score > 0 
            ? Math.round((grade.score / question.score) * 100) 
            : 0;
          
          return {
            date: new Date(exam.exam_date).toISOString().split('T')[0],
            score: scorePercentage
          };
        }) : [];

        return {
          student: student.name,
          progress: progress
        };
      })
    );

    return NextResponse.json({ data: studentProgress });
  } catch (error) {
    console.error("Error in student progress API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
