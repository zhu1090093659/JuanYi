"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle } from "lucide-react"

interface AIGradingProcessProps {
  examId: string
  questions: any[]
  students: any[]
  answers: any[]
  grades: any[]
  isGrading: boolean
}

export function AIGradingProcess({ examId, questions, students, answers, grades, isGrading }: AIGradingProcessProps) {
  const [gradingLogs, setGradingLogs] = useState<any[]>([])

  useEffect(() => {
    // Generate initial grading logs based on existing grades
    const logs = grades.map((grade) => ({
      id: `${grade.student_id}-${grade.question_id}`,
      studentId: grade.student_id,
      questionId: grade.question_id,
      timestamp: new Date(grade.graded_at).getTime(),
      status: "completed",
      score: grade.score,
      confidence: grade.ai_confidence || 0,
      message: `评分完成：${grade.score}分，置信度 ${grade.ai_confidence || 0}%`,
    }))

    setGradingLogs(logs.sort((a, b) => b.timestamp - a.timestamp))
  }, [grades])

  useEffect(() => {
    if (isGrading) {
      // 从API获取实时评分日志
      const fetchGradingLogs = async () => {
        try {
          const response = await fetch(`/api/exams/${examId}/grading-logs`);
          
          if (!response.ok) {
            console.error("获取评分日志失败:", response.statusText);
            return;
          }
          
          const data = await response.json();
          
          if (data && data.logs) {
            // 按时间戳排序，新的在前面
            const sortedLogs = data.logs.sort((a: any, b: any) => b.timestamp - a.timestamp);
            setGradingLogs(sortedLogs);
          }
        } catch (error) {
          console.error("获取评分日志出错:", error);
        }
      };
      
      // 首次获取
      fetchGradingLogs();
      
      // 设置定时获取
      const interval = setInterval(fetchGradingLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isGrading, examId]);

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    return student ? student.name : "未知学生"
  }

  const getQuestionNumber = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    return question ? question.number : "?"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 评分日志</CardTitle>
        <CardDescription>实时显示 AI 评分过程和结果</CardDescription>
      </CardHeader>
      <CardContent>
        {gradingLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">{isGrading ? "正在开始评分..." : "暂无评分记录"}</div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>题目</TableHead>
                  <TableHead>分数</TableHead>
                  <TableHead>置信度</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradingLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>{getStudentName(log.studentId)}</TableCell>
                    <TableCell>题目 {getQuestionNumber(log.questionId)}</TableCell>
                    <TableCell>{log.score}</TableCell>
                    <TableCell>
                      <Badge
                        variant={log.confidence >= 90 ? "default" : log.confidence >= 70 ? "secondary" : "outline"}
                      >
                        {log.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === "completed" ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs">完成</span>
                        </div>
                      ) : log.status === "warning" ? (
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-xs">需审核</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-xs">处理中</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

