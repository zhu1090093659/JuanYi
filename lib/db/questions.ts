import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getQuestionsByExamId(examId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", examId)
    .order("number", { ascending: true })

  if (error) {
    console.error("Error fetching questions:", error)
    throw new Error("Failed to fetch questions")
  }

  return data
}

export async function createQuestion(questionData: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("questions").insert(questionData).select().single()

  if (error) {
    console.error("Error creating question:", error)
    throw new Error("Failed to create question")
  }

  revalidatePath(`/exams/${questionData.exam_id}`)

  return data
}

export async function updateQuestion(id: string, questionData: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("questions").update(questionData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating question:", error)
    throw new Error("Failed to update question")
  }

  revalidatePath(`/exams/${questionData.exam_id}`)

  return data
}

export async function deleteQuestion(id: string, examId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("questions").delete().eq("id", id)

  if (error) {
    console.error("Error deleting question:", error)
    throw new Error("Failed to delete question")
  }

  revalidatePath(`/exams/${examId}`)
}

