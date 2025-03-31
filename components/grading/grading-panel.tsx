"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, X, AlertCircle, Loader2, Bot, User } from "lucide-react"
import { gradeStudentAnswer, updateGrade } from "@/app/actions/grading"
import { useToast } from "@/components/ui/use-toast"

interface GradingPanelProps {
  examId: string
  question: any
  student: any
  answer: any
  initialGrade: any
  onGraded: () => void
}

export function GradingPanel({ examId, question, student, answer, initialGrade, onGraded }: GradingPanelProps) {
  const [score, setScore] = useState(initialGrade?.score || 0)
  const [feedback, setFeedback] = useState(initialGrade?.feedback || "")
  const [scoringPoints, setScoringPoints] = useState<any[]>([])
  const [confidence, setConfidence] = useState(initialGrade?.ai_confidence || 0)
  const [isGrading, setIsGrading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Reset state when question or student changes
    setScore(initialGrade?.score || 0)
    setFeedback(initialGrade?.feedback || "")
    setScoringPoints(initialGrade?.scoring_points || [])
    setConfidence(initialGrade?.ai_confidence || 0)
  }, [question, student, initialGrade])

  const handleAIGrade = async () => {
    if (!question || !student || !answer) return

    try {
      setIsGrading(true)
      const result = await gradeStudentAnswer(question.id, student.id, examId)

      setScore(result.score)
      setFeedback(result.feedback)
      setScoringPoints(result.scoringPoints)
      setConfidence(result.confidence)

      toast({
        title: "AI 评分完成",
        description: `得分: ${result.score}/${question.score}`,
      })

      onGraded()
    } catch (error: any) {
      toast({
        title: "AI 评分失败",
        description: error.message || "无法完成 AI 评分",
        variant: "destructive",
      })
    } finally {
      setIsGrading(false)
    }
  }

  const handleSaveGrade = async () => {
    if (!initialGrade || !question || !student) return

    try {
      setIsSaving(true)
      await updateGrade(initialGrade.id, score, feedback, examId)

      toast({
        title: "评分已保存",
        description: "教师评分已成功保存",
      })

      onGraded()
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error.message || "无法保存评分",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!question || !student) {
    return <div className="text-center py-8 text-muted-foreground">请选择题目和学生</div>
  }

  if (!answer) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>未找到答案</AlertTitle>
        <AlertDescription>该学生尚未提交此题目的答案</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {!initialGrade && (
        <Button className="w-full" onClick={handleAIGrade} disabled={isGrading}>
          {isGrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI 评分中...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              AI 评分
            </>
          )}
        </Button>
      )}

      {initialGrade && (
        <div className="flex items-center justify-between">
          <Badge variant={initialGrade.graded_by === "ai" ? "secondary" : "default"}>
            {initialGrade.graded_by === "ai" ? (
              <>
                <Bot className="mr-1 h-3 w-3" />
                AI 评分
              </>
            ) : (
              <>
                <User className="mr-1 h-3 w-3" />
                教师评分
              </>
            )}
          </Badge>
          <span className="text-sm text-muted-foreground">
            评分时间: {new Date(initialGrade.graded_at).toLocaleString()}
          </span>
        </div>
      )}

      {confidence > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>AI 置信度</Label>
            <Badge variant={confidence >= 90 ? "default" : confidence >= 70 ? "secondary" : "outline"}>
              {confidence}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className={`h-2.5 rounded-full ${
                confidence >= 90 ? "bg-green-500" : confidence >= 70 ? "bg-blue-500" : "bg-yellow-500"
              }`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
          {confidence < 70 && (
            <p className="text-xs text-yellow-500 dark:text-yellow-400">AI 置信度较低，建议教师审核</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="score">评分：{score} 分</Label>
          <span className="text-sm text-muted-foreground">满分 {question.score} 分</span>
        </div>
        <Slider
          id="score"
          value={[score]}
          max={question.score}
          step={0.5}
          onValueChange={(value) => setScore(value[0])}
        />
      </div>

      {scoringPoints && scoringPoints.length > 0 && (
        <div className="space-y-2">
          <Label>评分点</Label>
          <div className="space-y-2">
            {scoringPoints.map((point, index) => (
              <div key={index} className="p-2 border rounded-md">
                <div className="flex items-center">
                  <Badge
                    variant={
                      point.status === "correct"
                        ? "default"
                        : point.status === "partially"
                          ? "secondary"
                          : "destructive"
                    }
                    className="mr-2"
                  >
                    {point.status === "correct" ? "正确" : point.status === "partially" ? "部分正确" : "错误"}
                  </Badge>
                  <span className="text-sm font-medium">{point.point}</span>
                </div>
                {point.comment && <p className="text-xs text-muted-foreground mt-1">{point.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="feedback">评语与反馈</Label>
        <Textarea
          id="feedback"
          placeholder="输入对学生的评语和反馈..."
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setScore(initialGrade?.score || 0)
            setFeedback(initialGrade?.feedback || "")
          }}
        >
          <X className="mr-2 h-4 w-4" />
          重置
        </Button>
        <Button onClick={handleSaveGrade} disabled={isSaving || !initialGrade}>
          <Check className="mr-2 h-4 w-4" />
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  )
}

