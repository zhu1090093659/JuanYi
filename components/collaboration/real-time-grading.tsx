"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { Check, X, MessageSquare } from "lucide-react"

interface RealTimeGradingProps {
  examId: string
  questionId: string
  studentId: string
  maxScore: number
  initialScore?: number
  initialFeedback?: string
}

export function RealTimeGrading({
  examId,
  questionId,
  studentId,
  maxScore,
  initialScore = 0,
  initialFeedback = "",
}: RealTimeGradingProps) {
  const [score, setScore] = useState(initialScore)
  const [feedback, setFeedback] = useState(initialFeedback)
  const [isSaving, setIsSaving] = useState(false)
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // 创建唯一的频道名称
    const channelName = `grade:${examId}:${questionId}:${studentId}`
    const channel = supabase.channel(channelName)

    // 处理实时更新
    const handleGradeUpdate = (payload: any) => {
      const { score: newScore, feedback: newFeedback, user_id } = payload.new

      // 如果更新来自其他用户，则更新本地状态
      if (user_id !== user?.id) {
        setScore(newScore)
        setFeedback(newFeedback)

        toast({
          title: "评分已更新",
          description: "另一位教师更新了评分",
        })
      }
    }

    // 订阅实时更新
    channel.on("broadcast", { event: "grade_update" }, handleGradeUpdate).subscribe()

    // 获取当前正在评分的用户
    const getActiveGraders = async () => {
      const { data } = await supabase
        .from("active_graders")
        .select("user_id")
        .eq("exam_id", examId)
        .eq("question_id", questionId)
        .eq("student_id", studentId)

      if (data) {
        setActiveUsers(data.map((item) => item.user_id))
      }
    }

    // 标记当前用户正在评分
    const markActive = async () => {
      if (user) {
        await supabase.from("active_graders").upsert({
          exam_id: examId,
          question_id: questionId,
          student_id: studentId,
          user_id: user.id,
          active_since: new Date().toISOString(),
        })

        getActiveGraders()
      }
    }

    // 标记当前用户不再评分
    const markInactive = async () => {
      if (user) {
        await supabase
          .from("active_graders")
          .delete()
          .eq("exam_id", examId)
          .eq("question_id", questionId)
          .eq("student_id", studentId)
          .eq("user_id", user.id)
      }
    }

    markActive()

    return () => {
      markInactive()
      channel.unsubscribe()
    }
  }, [examId, questionId, studentId, user, toast])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      // 更新数据库
      const { error } = await supabase.from("grades").upsert({
        exam_id: examId,
        question_id: questionId,
        student_id: studentId,
        score,
        feedback,
        graded_by: user.id,
        graded_at: new Date().toISOString(),
      })

      if (error) throw error

      // 广播更新给其他用户
      const channelName = `grade:${examId}:${questionId}:${studentId}`
      await supabase.channel(channelName).send({
        type: "broadcast",
        event: "grade_update",
        payload: {
          new: {
            score,
            feedback,
            user_id: user.id,
          },
        },
      })

      toast({
        title: "保存成功",
        description: "评分已保存并同步",
      })
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="final-score">评分：{score} 分</Label>
          <span className="text-sm text-muted-foreground">满分 {maxScore} 分</span>
        </div>
        <Slider
          id="final-score"
          value={[score]}
          max={maxScore}
          step={0.5}
          onValueChange={(value) => setScore(value[0])}
        />
      </div>

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

      {activeUsers.length > 1 && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-400">
          <p>注意：当前有其他教师正在评阅此答案</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          添加批注
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setScore(initialScore)
              setFeedback(initialFeedback)
            }}
          >
            <X className="mr-2 h-4 w-4" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Check className="mr-2 h-4 w-4" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  )
}

