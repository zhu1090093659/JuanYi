import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 创建服务器端的 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 获取请求参数
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    console.log("Fetching data for student ID:", studentId);
    
    // 检查学生ID是否有效
    if (!studentId || studentId === "undefined" || studentId === "null") {
      console.log("Invalid student ID:", studentId);
      return NextResponse.json({
        data: {
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          highestScore: 0,
          recentExams: [],
          subjectPerformance: []
        }
      });
    }
    
    // 检查学生是否存在
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("*")
      .eq("id", studentId)
      .single();
      
    if (studentError) {
      console.error("Error fetching student:", studentError);
      
      // 返回默认数据而不是错误，这样仪表盘可以显示空状态
      return NextResponse.json({
        data: {
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          highestScore: 0,
          recentExams: [],
          subjectPerformance: []
        }
      });
    }
    
    // 获取学生参加的所有考试 - 尝试简化查询，避免嵌套查询可能导致的问题
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select(`
        id,
        name,
        subject_id,
        status,
        score,
        total_score,
        created_at
      `)
      .eq("student_id", studentId);
      
    if (examsError) {
      console.error("Error fetching student exams:", examsError);
      // 返回默认数据
      return NextResponse.json({
        data: {
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          highestScore: 0,
          recentExams: [],
          subjectPerformance: []
        }
      });
    }

    if (!exams || exams.length === 0) {
      console.log("No exams found for student:", studentId);
      // 学生没有考试数据，返回默认值
      return NextResponse.json({
        data: {
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          highestScore: 0,
          recentExams: [],
          subjectPerformance: []
        }
      });
    }
    
    // 计算统计数据
    const totalExams = exams.length;
    const completedExams = exams.filter(exam => exam.status === "completed").length;
    
    let averageScore = 0;
    let highestScore = 0;
    
    // 获取按科目分类的成绩
    const subjectMap = new Map();
    
    try {
      let totalScorePercentage = 0;
      let count = 0;
      
      exams.forEach(exam => {
        if (exam.status === "completed" && exam.score !== null && exam.total_score !== null && exam.total_score > 0) {
          const scorePercentage = (exam.score / exam.total_score) * 100;
          totalScorePercentage += scorePercentage;
          count += 1;
          
          if (scorePercentage > highestScore) {
            highestScore = scorePercentage;
          }
          
          // 按科目统计 - 暂时使用科目ID
          const subjectId = exam.subject_id || "未知科目";
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, { 
              totalScore: 0, 
              count: 0, 
              totalScorePercentage: 0 
            });
          }
          
          const subjectData = subjectMap.get(subjectId);
          subjectData.totalScorePercentage += scorePercentage;
          subjectData.count += 1;
        }
      });
      
      if (count > 0) {
        averageScore = totalScorePercentage / count;
      }
    } catch (e) {
      console.error("Error calculating exam statistics:", e);
      // 如果计算过程出错，提供默认值
      averageScore = 0;
      highestScore = 0;
    }
    
    // 转换科目数据为数组格式 - 简化处理
    const subjectPerformance = [];
    try {
      for (const [subject, data] of subjectMap.entries()) {
        if (data.count > 0) {
          subjectPerformance.push({
            subject,
            score: parseFloat((data.totalScorePercentage / data.count).toFixed(1)),
            average: 0 // 班级平均分，暂无数据
          });
        }
      }
    } catch (e) {
      console.error("Error processing subject performance:", e);
    }
    
    // 获取最近的考试（按创建时间排序）
    let recentExams = [];
    try {
      recentExams = exams
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(exam => ({
          id: exam.id,
          name: exam.name || "未命名试卷",
          exam_date: exam.created_at,
          score: exam.score || 0,
          total_score: exam.total_score || 100 // 提供默认值避免除零错误
        }));
    } catch (e) {
      console.error("Error processing recent exams:", e);
    }
    
    console.log("Successfully processed student dashboard data");
    
    return NextResponse.json({
      data: {
        totalExams,
        completedExams,
        averageScore: parseFloat(averageScore.toFixed(1)),
        highestScore: parseFloat(highestScore.toFixed(1)),
        recentExams,
        subjectPerformance
      }
    });
    
  } catch (error: any) {
    console.error("Error in student dashboard data API:", error);
    // 发生错误时返回默认数据而非错误，这样前端仍然可以正常渲染
    return NextResponse.json({
      data: {
        totalExams: 0,
        completedExams: 0,
        averageScore: 0,
        highestScore: 0,
        recentExams: [],
        subjectPerformance: []
      }
    });
  }
} 