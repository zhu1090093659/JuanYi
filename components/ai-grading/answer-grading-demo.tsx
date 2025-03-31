"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bot, CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react"

interface ScoringPoint {
  point: string
  status: "correct" | "partially" | "incorrect"
  comment: string
}

export function AnswerGradingDemo() {
  const [question, setQuestion] = useState("What is the main idea of the passage about climate change?")
  const [standardAnswer, setStandardAnswer] = useState(
    "The main idea is about the urgent need for global action to address climate change and its impacts on the environment and society.",
  )
  const [studentAnswer, setStudentAnswer] = useState(
    "The passage talks about how climate change is affecting our planet and that we need to do something about it quickly.",
  )
  const [maxScore, setMaxScore] = useState(10)

  const [isGrading, setIsGrading] = useState(false)
  const [gradingResult, setGradingResult] = useState<{
    score: number
    confidence: number
    feedback: string
    scoringPoints: ScoringPoint[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGrade = async () => {
    try {
      setIsGrading(true)
      setError(null)

      // In a real application, you would call your server action here
      // For demo purposes, we'll simulate the AI grading

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create a mock result (in a real app, this would come from the AI)
      const mockResult = {
        score: 7.5,
        confidence: 85,
        feedback:
          "Your answer captures the general idea about climate change and the need for action, but lacks specificity about the global nature of the required response and doesn't mention the specific impacts discussed in the passage.",
        scoringPoints: [
          {
            point: "Main topic identification",
            status: "correct" as const,
            comment: "Correctly identified climate change as the main topic",
          },
          {
            point: "Urgency recognition",
            status: "partially" as const,
            comment: "Mentioned the need for quick action but didn't emphasize the urgency as strongly as the passage",
          },
          {
            point: "Impact comprehension",
            status: "partially" as const,
            comment: "Mentioned effects on the planet but didn't specify environmental and societal impacts",
          },
          {
            point: "Global perspective",
            status: "incorrect" as const,
            comment: "Did not mention the global nature of the required action",
          },
        ],
      }

      setGradingResult(mockResult)
    } catch (err: any) {
      console.error("Grading error:", err)
      setError(err.message || "An error occurred during grading")
    } finally {
      setIsGrading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "correct":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "partially":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "incorrect":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge variant="default">高置信度 {confidence}%</Badge>
    } else if (confidence >= 70) {
      return <Badge variant="secondary">中等置信度 {confidence}%</Badge>
    } else {
      return <Badge variant="outline">低置信度 {confidence}%</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI 评分演示</CardTitle>
          <CardDescription>体验 AI 如何评分学生答案</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="input" className="space-y-4">
            <TabsList>
              <TabsTrigger value="input">输入</TabsTrigger>
              <TabsTrigger value="result" disabled={!gradingResult}>
                结果
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">题目</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="输入题目内容..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="standardAnswer">标准答案</Label>
                <Textarea
                  id="standardAnswer"
                  value={standardAnswer}
                  onChange={(e) => setStandardAnswer(e.target.value)}
                  placeholder="输入标准答案..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentAnswer">学生答案</Label>
                <Textarea
                  id="studentAnswer"
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="输入学生答案..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxScore">满分值</Label>
                <input
                  id="maxScore"
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number.parseInt(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </TabsContent>

            <TabsContent value="result">
              {gradingResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">得分</h3>
                      <div className="text-3xl font-bold">
                        {gradingResult.score} / {maxScore}
                      </div>
                    </div>
                    <div>{getConfidenceBadge(gradingResult.confidence)}</div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">反馈</h3>
                    <div className="p-3 bg-muted rounded-md">{gradingResult.feedback}</div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">评分点</h3>
                    <div className="space-y-2">
                      {gradingResult.scoringPoints.map((point, index) => (
                        <div key={index} className={`p-3 rounded-md ${getStatusColor(point.status)}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{point.point}</span>
                            <span>
                              {point.status === "correct" ? (
                                <ThumbsUp className="h-4 w-4" />
                              ) : point.status === "partially" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <ThumbsDown className="h-4 w-4" />
                              )}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{point.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>评分错误</span>
                  </div>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGrade}
            disabled={isGrading || !question || !standardAnswer || !studentAnswer}
            className="w-full"
          >
            {isGrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI 评分中...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                开始 AI 评分
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI 评分工作原理</CardTitle>
          <CardDescription>了解 AI 如何评估学生答案</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">1. 理解题目和标准答案</h3>
              <p className="text-muted-foreground">AI 首先分析题目内容和标准答案，理解评分的关键点和要求。</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">2. 分析学生答案</h3>
              <p className="text-muted-foreground">AI 将学生答案与标准答案进行比较，识别正确点、部分正确点和错误点。</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">3. 评分和反馈</h3>
              <p className="text-muted-foreground">
                基于分析结果，AI 给出分数、详细反馈和评分点，并提供置信度指标表明评分的可靠性。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">4. 教师审核</h3>
              <p className="text-muted-foreground">
                教师可以审核 AI 评分结果，特别是对于置信度较低的评分，并在必要时进行调整。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

