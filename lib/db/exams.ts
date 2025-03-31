import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getExams() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("exams")
    .select(`
      *,
      subjects(name),
      created_by:users(name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching exams:", error)
    throw new Error("Failed to fetch exams")
  }

  return data
}

export async function getExamById(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("exams")
    .select(`
      *,
      subjects(name),
      created_by:users(name),
      questions(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching exam:", error)
    throw new Error("Failed to fetch exam")
  }

  return data
}

export async function createExam(examData: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("exams").insert(examData).select().single()

  if (error) {
    console.error("Error creating exam:", error)
    throw new Error("Failed to create exam")
  }

  revalidatePath("/exams")
  revalidatePath("/dashboard")

  return data
}

export async function updateExam(id: string, examData: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("exams").update(examData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating exam:", error)
    throw new Error("Failed to update exam")
  }

  revalidatePath(`/exams/${id}`)
  revalidatePath("/exams")
  revalidatePath("/dashboard")

  return data
}

export async function deleteExam(id: string) {
  const supabase = createClient()

  const { error } = await supabase.from("exams").delete().eq("id", id)

  if (error) {
    console.error("Error deleting exam:", error)
    throw new Error("Failed to delete exam")
  }

  revalidatePath("/exams")
  revalidatePath("/dashboard")
}

