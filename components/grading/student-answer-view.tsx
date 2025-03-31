"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface StudentAnswerViewProps {
  answer: any
}

export function StudentAnswerView({ answer }: StudentAnswerViewProps) {
  if (!answer) {
    return (
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-300">未找到答案</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">该学生尚未提交此题目的答案</AlertDescription>
      </Alert>
    )
  }

  return <div className="whitespace-pre-wrap border rounded-md p-4 bg-muted/30">{answer.content}</div>
}
