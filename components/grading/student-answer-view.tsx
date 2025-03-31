"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface StudentAnswerViewProps {
  answer: any
}

export function StudentAnswerView({ answer }: StudentAnswerViewProps) {
  if (!answer) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>未找到答案</AlertTitle>
        <AlertDescription>该学生尚未提交此题目的答案</AlertDescription>
      </Alert>
    )
  }

  return <div className="whitespace-pre-wrap border rounded-md p-4 bg-muted/30">{answer.content}</div>
}

