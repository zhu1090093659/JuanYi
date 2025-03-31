"use server"

import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"
import { PDFDocument, StandardFonts } from "pdf-lib"

// 定义问题类型接口
interface Question {
  id: string;
  number: number;
  score: number;
  content?: string;
  [key: string]: any;
}

// 定义问题统计数据类型接口
interface QuestionStat {
  number: number;
  content: string;
  maxScore: number;
  scores: number[];
  [key: string]: any;
}

// 定义问题统计对象类型
interface QuestionStats {
  [questionId: string]: QuestionStat;
}

// 导出为 Excel
export async function exportToExcel(examId: string, options: any) {
  const supabase = await createClient()

  // 获取考试信息
  const { data: exam } = await supabase
    .from("exams")
    .select(`
      *,
      subjects(name),
      questions(*)
    `)
    .eq("id", examId)
    .single()

  if (!exam) {
    throw new Error("考试不存在")
  }

  // 获取学生成绩
  const { data: grades } = await supabase
    .from("grades")
    .select(`
      *,
      students:users(id, name, class),
      questions(id, number, content, score)
    `)
    .eq("exam_id", examId)

  if (!grades) {
    throw new Error("成绩数据不存在")
  }

  // 获取学生答案
  const { data: answers } = await supabase
    .from("answers")
    .select(`
      *,
      students:users(id, name, class),
      questions(id, number, content)
    `)
    .eq("exam_id", examId)

  // 处理数据
  const students = new Map()

  // 按学生组织数据
  grades.forEach((grade: any) => {
    const studentId = grade.student_id

    if (!students.has(studentId)) {
      students.set(studentId, {
        id: studentId,
        name: grade.students?.name || "未知学生",
        class: grade.students?.class || "未知班级",
        scores: {},
        totalScore: 0,
      })
    }

    const student = students.get(studentId)
    student.scores[grade.question_id] = {
      score: grade.score,
      maxScore: grade.questions.score,
      feedback: grade.feedback,
    }
    student.totalScore += grade.score
  })

  // 添加答案数据
  if (options.includeAnswers && answers) {
    answers.forEach((answer: any) => {
      const studentId = answer.student_id

      if (students.has(studentId)) {
        const student = students.get(studentId)

        if (!student.answers) {
          student.answers = {}
        }

        student.answers[answer.question_id] = answer.content
      }
    })
  }

  // 创建工作簿
  const wb = XLSX.utils.book_new()

  // 创建成绩表
  const scoresData = Array.from(students.values()).map((student: any) => {
    const row: any = {
      学生ID: student.id,
      姓名: student.name,
      班级: student.class,
      总分: student.totalScore,
    }

    exam.questions.forEach((question: Question) => {
      const scoreInfo = student.scores[question.id]
      if (scoreInfo) {
        row[`题目${question.number}(${question.score}分)`] = scoreInfo.score
      } else {
        row[`题目${question.number}(${question.score}分)`] = 0
      }
    })

    return row
  })

  const scoresWs = XLSX.utils.json_to_sheet(scoresData)
  XLSX.utils.book_append_sheet(wb, scoresWs, "成绩表")

  // 如果包含题目和答案
  if (options.includeQuestions) {
    const questionsData = exam.questions.map((question: Question) => ({
      题号: question.number,
      题目类型:
        question.type === "objective"
          ? "客观题"
          : question.type === "subjective"
            ? "主观题"
            : question.type === "calculation"
              ? "计算题"
              : "论述题",
      分值: question.score,
      题目内容: question.content || "",
      标准答案: question.standard_answer,
    }))

    const questionsWs = XLSX.utils.json_to_sheet(questionsData)
    XLSX.utils.book_append_sheet(wb, questionsWs, "题目")
  }

  // 如果包含学生答案
  if (options.includeAnswers && answers) {
    const answersData: any[] = []

    Array.from(students.values()).forEach((student: any) => {
      exam.questions.forEach((question: Question) => {
        if (student.answers && student.answers[question.id]) {
          answersData.push({
            学生ID: student.id,
            姓名: student.name,
            班级: student.class,
            题号: question.number,
            题目内容: question.content || "",
            学生答案: student.answers[question.id],
            得分: student.scores[question.id]?.score || 0,
            满分: question.score,
          })
        }
      })
    })

    const answersWs = XLSX.utils.json_to_sheet(answersData)
    XLSX.utils.book_append_sheet(wb, answersWs, "学生答案")
  }

  // 如果包含统计数据
  if (options.includeStatistics) {
    // 计算每道题的平均分、最高分、最低分、正确率
    const questionStats: QuestionStats = {}

    exam.questions.forEach((question: Question) => {
      questionStats[question.id] = {
        number: question.number,
        content: question.content || "",
        maxScore: question.score,
        scores: [],
      }
    })

    Array.from(students.values()).forEach((student: any) => {
      Object.entries(student.scores).forEach(([questionId, scoreInfo]: [string, any]) => {
        if (questionStats[questionId]) {
          questionStats[questionId].scores.push(scoreInfo.score)
        }
      })
    })

    const statsData = Object.values(questionStats).map((stat: any) => {
      const scores = stat.scores
      const avgScore = scores.length > 0 ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length : 0
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0
      const minScore = scores.length > 0 ? Math.min(...scores) : 0
      const correctRate = (avgScore / stat.maxScore) * 100

      return {
        题号: stat.number,
        题目内容: stat.content,
        满分: stat.maxScore,
        平均分: avgScore.toFixed(2),
        最高分: maxScore,
        最低分: minScore,
        正确率: `${correctRate.toFixed(2)}%`,
        作答人数: scores.length,
      }
    })

    const statsWs = XLSX.utils.json_to_sheet(statsData)
    XLSX.utils.book_append_sheet(wb, statsWs, "统计数据")
  }

  // 生成 Excel 二进制数据
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

  return {
    buffer: excelBuffer,
    filename: `${exam.name}_成绩表.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }
}

// 导出为 PDF
export async function exportToPdf(examId: string, options: any) {
  const supabase = await createClient()

  // 获取考试信息
  const { data: exam } = await supabase
    .from("exams")
    .select(`
      *,
      subjects(name),
      questions(*)
    `)
    .eq("id", examId)
    .single()

  if (!exam) {
    throw new Error("考试不存在")
  }

  // 获取学生成绩
  const { data: grades } = await supabase
    .from("grades")
    .select(`
      *,
      students:users(id, name, class),
      questions(id, number, content, score)
    `)
    .eq("exam_id", examId)

  if (!grades) {
    throw new Error("成绩数据不存在")
  }

  // 创建 PDF 文档
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // 添加封面页
  const coverPage = pdfDoc.addPage()
  const { width, height } = coverPage.getSize()

  coverPage.drawText(exam.name, {
    x: 50,
    y: height - 100,
    size: 24,
    font: boldFont,
  })

  coverPage.drawText(`科目: ${exam.subjects.name}`, {
    x: 50,
    y: height - 150,
    size: 14,
    font,
  })

  coverPage.drawText(`考试日期: ${new Date(exam.exam_date).toLocaleDateString()}`, {
    x: 50,
    y: height - 180,
    size: 14,
    font,
  })

  coverPage.drawText(`总分: ${exam.total_score}`, {
    x: 50,
    y: height - 210,
    size: 14,
    font,
  })

  coverPage.drawText(`年级: ${exam.grade}`, {
    x: 50,
    y: height - 240,
    size: 14,
    font,
  })

  coverPage.drawText(`班级: ${exam.class || "全部班级"}`, {
    x: 50,
    y: height - 270,
    size: 14,
    font,
  })

  coverPage.drawText(`导出日期: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: height - 300,
    size: 14,
    font,
  })

  // 添加成绩页
  const scoresPage = pdfDoc.addPage()

  scoresPage.drawText("成绩表", {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
  })

  // 表头
  const headerY = height - 100
  const colWidths = [100, 80, 80, 80]
  let currentX = 50
  ;["学生姓名", "班级", "得分", "得分率"].forEach((header, i) => {
    scoresPage.drawText(header, {
      x: currentX,
      y: headerY,
      size: 12,
      font: boldFont,
    })
    currentX += colWidths[i]
  })

  // 处理学生数据
  const students = new Map()

  grades.forEach((grade: any) => {
    const studentId = grade.student_id

    if (!students.has(studentId)) {
      students.set(studentId, {
        id: studentId,
        name: grade.students?.name || "未知学生",
        class: grade.students?.class || "未知班级",
        scores: {},
        totalScore: 0,
      })
    }

    const student = students.get(studentId)
    student.scores[grade.question_id] = {
      score: grade.score,
      maxScore: grade.questions.score,
      feedback: grade.feedback,
    }
    student.totalScore += grade.score
  })

  // 填充学生成绩
  let rowY = headerY - 30
  Array.from(students.values()).forEach((student: any, index) => {
    if (index > 0 && index % 20 === 0) {
      // 每页显示 20 名学生，添加新页
      const scoresPage = pdfDoc.addPage()
      rowY = height - 100

      // 重新绘制表头
      currentX = 50
      ;["学生姓名", "班级", "得分", "得分率"].forEach((header, i) => {
        scoresPage.drawText(header, {
          x: currentX,
          y: rowY,
          size: 12,
          font: boldFont,
        })
        currentX += colWidths[i]
      })

      rowY -= 30
    }

    currentX = 50

    // 学生姓名
    scoresPage.drawText(student.name, {
      x: currentX,
      y: rowY,
      size: 10,
      font,
    })
    currentX += colWidths[0]

    // 班级
    scoresPage.drawText(student.class, {
      x: currentX,
      y: rowY,
      size: 10,
      font,
    })
    currentX += colWidths[1]

    // 得分
    scoresPage.drawText(`${student.totalScore}/${exam.total_score}`, {
      x: currentX,
      y: rowY,
      size: 10,
      font,
    })
    currentX += colWidths[2]

    // 得分率
    const percentage = (student.totalScore / exam.total_score) * 100
    scoresPage.drawText(`${percentage.toFixed(1)}%`, {
      x: currentX,
      y: rowY,
      size: 10,
      font,
    })

    rowY -= 20
  })

  // 如果包含题目统计
  if (options.includeStatistics) {
    const statsPage = pdfDoc.addPage()

    statsPage.drawText("题目统计", {
      x: 50,
      y: height - 50,
      size: 18,
      font: boldFont,
    })

    // 计算每道题的统计数据
    const questionStats: QuestionStats = {}

    exam.questions.forEach((question: Question) => {
      questionStats[question.id] = {
        number: question.number,
        content: question.content || "",
        maxScore: question.score,
        scores: [],
      }
    })

    Array.from(students.values()).forEach((student: any) => {
      Object.entries(student.scores).forEach(([questionId, scoreInfo]: [string, any]) => {
        if (questionStats[questionId]) {
          questionStats[questionId].scores.push(scoreInfo.score)
        }
      })
    })

    // 绘制题目统计数据
    let statRowY = height - 100
    let questionIndex = 0

    Object.values(questionStats).forEach((stat: any) => {
      if (questionIndex > 0 && questionIndex % 10 === 0) {
        // 每页显示 10 道题的统计，添加新页
        const newStatsPage = pdfDoc.addPage()
        statRowY = height - 50

        newStatsPage.drawText("题目统计（续）", {
          x: 50,
          y: statRowY,
          size: 18,
          font: boldFont,
        })

        statRowY -= 50
      }

      const scores = stat.scores
      const avgScore = scores.length > 0 ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length : 0
      const correctRate = (avgScore / stat.maxScore) * 100

      statsPage.drawText(`题目 ${stat.number}:`, {
        x: 50,
        y: statRowY,
        size: 12,
        font: boldFont,
      })

      statRowY -= 20

      statsPage.drawText(`平均分: ${avgScore.toFixed(2)}/${stat.maxScore} (${correctRate.toFixed(1)}%)`, {
        x: 70,
        y: statRowY,
        size: 10,
        font,
      })

      statRowY -= 20
      questionIndex++
    })
  }

  // 生成 PDF 二进制数据
  const pdfBytes = await pdfDoc.save()

  return {
    buffer: Buffer.from(pdfBytes),
    filename: `${exam.name}_成绩报告.pdf`,
    contentType: "application/pdf",
  }
}

// 导出为 CSV
export async function exportToCsv(examId: string, options: any) {
  const supabase = await createClient()

  // 获取考试信息
  const { data: exam } = await supabase
    .from("exams")
    .select(`
      *,
      subjects(name),
      questions(*)
    `)
    .eq("id", examId)
    .single()

  if (!exam) {
    throw new Error("考试不存在")
  }

  // 获取学生成绩
  const { data: grades } = await supabase
    .from("grades")
    .select(`
      *,
      students:users(id, name, class),
      questions(id, number, content, score)
    `)
    .eq("exam_id", examId)

  if (!grades) {
    throw new Error("成绩数据不存在")
  }

  // 处理数据
  const students = new Map()

  // 按学生组织数据
  grades.forEach((grade: any) => {
    const studentId = grade.student_id

    if (!students.has(studentId)) {
      students.set(studentId, {
        id: studentId,
        name: grade.students?.name || "未知学生",
        class: grade.students?.class || "未知班级",
        scores: {},
        totalScore: 0,
      })
    }

    const student = students.get(studentId)
    student.scores[grade.question_id] = {
      score: grade.score,
      maxScore: grade.questions.score,
      feedback: grade.feedback,
    }
    student.totalScore += grade.score
  })

  // 创建 CSV 内容
  let csvContent = "学生ID,姓名,班级,总分"

  // 添加题目列
  exam.questions.forEach((question: Question) => {
    csvContent += `,题目${question.number}(${question.score}分)`
  })

  csvContent += "\n"

  // 添加学生数据
  Array.from(students.values()).forEach((student: any) => {
    csvContent += `${student.id},${student.name},${student.class},${student.totalScore}`

    exam.questions.forEach((question: Question) => {
      const scoreInfo = student.scores[question.id]
      csvContent += `,${scoreInfo ? scoreInfo.score : 0}`
    })

    csvContent += "\n"
  })

  return {
    buffer: Buffer.from(csvContent),
    filename: `${exam.name}_成绩表.csv`,
    contentType: "text/csv",
  }
}

// 导出处理函数
export async function handleExport(examId: string, format: string, options: any) {
  try {
    let result

    switch (format) {
      case "excel":
        result = await exportToExcel(examId, options)
        break
      case "pdf":
        result = await exportToPdf(examId, options)
        break
      case "csv":
        result = await exportToCsv(examId, options)
        break
      default:
        throw new Error("不支持的导出格式")
    }

    return result
  } catch (error) {
    console.error("导出错误:", error)
    throw error
  }
}
