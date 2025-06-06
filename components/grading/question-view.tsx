"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { AlertCircle } from "lucide-react"

interface QuestionViewProps {
  question: any
}

export function QuestionView({ question }: QuestionViewProps) {
  if (!question) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">未找到题目</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">请选择一个题目进行评阅</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap">{question.content}</div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-medium">标准答案</h4>
        <div className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-muted/30">{question.standard_answer}</div>
      </div>
    </div>
  )
}
