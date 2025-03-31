import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getGradesByExamId(examId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("grades")
    .select(`
      *,
      students:users(id, name, class),
      questions(id, number, content, score)
    `)
    .eq("exam_id", examId)

  if (error) {
    console.error("Error fetching grades:", error)
    throw new Error("Failed to fetch grades")
  }

  return data
}

export async function getGradesByStudentId(studentId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("grades")
    .select(`
      *,
      exams(id, name, subject_id, subjects(name)),
      questions(id, number, content, score)
    `)
    .eq("student_id", studentId)

  if (error) {
    console.error("Error fetching student grades:", error)
    throw new Error("Failed to fetch student grades")
  }

  return data
}

export async function getGradesByQuestionId(questionId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("grades")
    .select(`
      *,
      students:users(id, name, class)
    `)
    .eq("question_id", questionId)

  if (error) {
    console.error("Error fetching question grades:", error)
    throw new Error("Failed to fetch question grades")
  }

  return data
}

export async function createGrade(gradeData: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("grades").insert(gradeData).select().single()

  if (error) {
    console.error("Error creating grade:", error)
    throw new Error("Failed to create grade")
  }

  revalidatePath(`/exams/${gradeData.exam_id}`)

  return data
}

export async function updateGrade(id: string, gradeData: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("grades").update(gradeData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating grade:", error)
    throw new Error("Failed to update grade")
  }

  revalidatePath(`/exams/${gradeData.exam_id}`)

  return data
}

