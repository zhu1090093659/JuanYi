"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface GradingResultsProps {
  examId: string
  questions: any[]
  students: any[]
  grades: any[]
}

export function GradingResults({ examId, questions, students, grades }: GradingResultsProps) {
  const [studentScores, setStudentScores] = useState<any[]>([])
  const [questionStats, setQuestionStats] = useState<any[]>([])
  const [confidenceStats, setConfidenceStats] = useState<any[]>([])

  useEffect(() => {
    // Calculate student scores
    const scores = students.map((student) => {
      const studentGrades = grades.filter((g) => g.student_id === student.id)
      const totalScore = studentGrades.reduce((sum, g) => sum + g.score, 0)
      const maxPossibleScore = questions.reduce((sum, q) => sum + q.score, 0)
      const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

      return {
        id: student.id,
        name: student.name,
        class: student.class,
        totalScore,
        maxPossibleScore,
        percentage: Math.round(percentage * 10) / 10,
        completedQuestions: studentGrades.length,
        totalQuestions: questions.length,
      }
    })

    setStudentScores(scores.sort((a, b) => b.percentage - a.percentage))

    // Calculate question statistics
    const qStats = questions.map((question) => {
      const questionGrades = grades.filter((g) => g.question_id === question.id)
      const avgScore =
        questionGrades.length > 0 ? questionGrades.reduce((sum, g) => sum + g.score, 0) / questionGrades.length : 0
      const correctRate = question.score > 0 ? (avgScore / question.score) * 100 : 0
      const avgConfidence =
        questionGrades.length > 0
          ? questionGrades.reduce((sum, g) => sum + (g.ai_confidence || 0), 0) / questionGrades.length
          : 0

      return {
        id: question.id,
        number: question.number,
        type: question.type,
        maxScore: question.score,
        avgScore: Math.round(avgScore * 10) / 10,
        correctRate: Math.round(correctRate * 10) / 10,
        avgConfidence: Math.round(avgConfidence * 10) / 10,
        gradedCount: questionGrades.length,
        totalStudents: students.length,
      }
    })

    setQuestionStats(qStats.sort((a, b) => a.number - b.number))

    // Calculate confidence distribution
    const confidenceBuckets = [
      { range: "90-100%", count: 0 },
      { range: "80-89%", count: 0 },
      { range: "70-79%", count: 0 },
      { range: "60-69%", count: 0 },
      { range: "0-59%", count: 0 },
    ]

    grades.forEach((grade) => {
      const confidence = grade.ai_confidence || 0
      if (confidence >= 90) confidenceBuckets[0].count++
      else if (confidence >= 80) confidenceBuckets[1].count++
      else if (confidence >= 70) confidenceBuckets[2].count++
      else if (confidence >= 60) confidenceBuckets[3].count++
      else confidenceBuckets[4].count++
    })

    setConfidenceStats(confidenceBuckets)
  }, [questions, students, grades])

  return (
    <Tabs defaultValue="students" className="space-y-4">
      <TabsList>
        <TabsTrigger value="students">学生成绩</TabsTrigger>
        <TabsTrigger value="questions">题目分析</TabsTrigger>
        <TabsTrigger value="confidence">AI 置信度</TabsTrigger>
      </TabsList>

      <TabsContent value="students">
        <Card>
          <CardHeader>
            <CardTitle>学生成绩表</CardTitle>
            <CardDescription>所有学生的评分结果和完成情况</CardDescription>
          </CardHeader>
          <CardContent>
            {studentScores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无学生成绩数据</div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学生</TableHead>
                      <TableHead>班级</TableHead>
                      <TableHead>得分</TableHead>
                      <TableHead>得分率</TableHead>
                      <TableHead>完成题目</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentScores.map((score) => (
                      <TableRow key={score.id}>
                        <TableCell className="font-medium">{score.name}</TableCell>
                        <TableCell>{score.class}</TableCell>
                        <TableCell>
                          {score.totalScore}/{score.maxPossibleScore}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              score.percentage >= 80 ? "default" : score.percentage >= 60 ? "secondary" : "outline"
                            }
                          >
                            {score.percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {score.completedQuestions}/{score.totalQuestions}
                        </TableCell>
                        <TableCell>
                          {score.completedQuestions === score.totalQuestions ? (
                            <Badge variant="default">已完成</Badge>
                          ) : score.completedQuestions > 0 ? (
                            <Badge variant="secondary">部分完成</Badge>
                          ) : (
                            <Badge variant="outline">未开始</Badge>
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
      </TabsContent>

      <TabsContent value="questions">
        <Card>
          <CardHeader>
            <CardTitle>题目分析</CardTitle>
            <CardDescription>各题目的评分统计和正确率</CardDescription>
          </CardHeader>
          <CardContent>
            {questionStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无题目统计数据</div>
            ) : (
              <div className="space-y-6">
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>题号</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>平均分</TableHead>
                        <TableHead>正确率</TableHead>
                        <TableHead>AI 置信度</TableHead>
                        <TableHead>已评分/总数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questionStats.map((stat) => (
                        <TableRow key={stat.id}>
                          <TableCell>题目 {stat.number}</TableCell>
                          <TableCell>
                            {stat.type === "objective"
                              ? "客观题"
                              : stat.type === "subjective"
                                ? "主观题"
                                : stat.type === "calculation"
                                  ? "计算题"
                                  : "论述题"}
                          </TableCell>
                          <TableCell>
                            {stat.avgScore}/{stat.maxScore}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                stat.correctRate >= 80 ? "default" : stat.correctRate >= 60 ? "secondary" : "outline"
                              }
                            >
                              {stat.correctRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{stat.avgConfidence}%</TableCell>
                          <TableCell>
                            {stat.gradedCount}/{stat.totalStudents}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="h-80">
                  <h3 className="text-lg font-medium mb-2">题目正确率分布</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="number" label={{ value: "题号", position: "insideBottom", offset: -5 }} />
                      <YAxis label={{ value: "正确率 (%)", angle: -90, position: "insideLeft" }} />
                      <Tooltip formatter={(value) => [`${value}%`, "正确率"]} />
                      <Bar dataKey="correctRate" fill="#8884d8" name="正确率" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="confidence">
        <Card>
          <CardHeader>
            <CardTitle>AI 置信度分析</CardTitle>
            <CardDescription>AI 评分置信度的分布情况</CardDescription>
          </CardHeader>
          <CardContent>
            {confidenceStats.every((bucket) => bucket.count === 0) ? (
              <div className="text-center py-8 text-muted-foreground">暂无 AI 置信度数据</div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, "答案数量"]} />
                    <Bar dataKey="count" fill="#82ca9d" name="答案数量" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-medium">置信度说明</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <Badge variant="default" className="mr-2">
                        90-100%
                      </Badge>
                      <span>AI 高度确信评分准确，无需人工审核</span>
                    </li>
                    <li className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        70-89%
                      </Badge>
                      <span>AI 较为确信评分准确，可选择性人工审核</span>
                    </li>
                    <li className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        0-69%
                      </Badge>
                      <span>AI 置信度较低，建议进行人工审核</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

