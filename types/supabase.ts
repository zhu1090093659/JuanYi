export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: "teacher" | "student" | "admin"
          school: string | null
          class: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: "teacher" | "student" | "admin"
          school?: string | null
          class?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: "teacher" | "student" | "admin"
          school?: string | null
          class?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          name: string
          description: string | null
          subject_id: string
          grade: string
          class: string | null
          total_score: number
          exam_date: string
          created_by: string
          created_at: string
          updated_at: string
          status: "draft" | "published" | "grading" | "completed"
          graded_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          subject_id: string
          grade: string
          class?: string | null
          total_score: number
          exam_date: string
          created_by: string
          created_at?: string
          updated_at?: string
          status?: "draft" | "published" | "grading" | "completed"
          graded_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          subject_id?: string
          grade?: string
          class?: string | null
          total_score?: number
          exam_date?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          status?: "draft" | "published" | "grading" | "completed"
          graded_at?: string | null
        }
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          number: number
          content: string
          type: "objective" | "subjective" | "calculation" | "essay"
          standard_answer: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          number: number
          content: string
          type: "objective" | "subjective" | "calculation" | "essay"
          standard_answer: string
          score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          number?: number
          content?: string
          type?: "objective" | "subjective" | "calculation" | "essay"
          standard_answer?: string
          score?: number
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          student_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_id: string
          student_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_id?: string
          student_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          student_id: string
          score: number
          ai_score: number | null
          ai_confidence: number | null
          feedback: string | null
          scoring_points: Json | null
          graded_by: string
          graded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_id: string
          student_id: string
          score: number
          ai_score?: number | null
          ai_confidence?: number | null
          feedback?: string | null
          scoring_points?: Json | null
          graded_by: string
          graded_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_id?: string
          student_id?: string
          score?: number
          ai_score?: number | null
          ai_confidence?: number | null
          feedback?: string | null
          scoring_points?: Json | null
          graded_by?: string
          graded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          student_id: string
          exam_id: string
          content: string
          strengths: string[] | null
          weaknesses: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          exam_id: string
          content: string
          strengths?: string[] | null
          weaknesses?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          exam_id?: string
          content?: string
          strengths?: string[] | null
          weaknesses?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      collaborations: {
        Row: {
          id: string
          exam_id: string
          user_id: string
          role: "owner" | "editor" | "viewer"
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          user_id: string
          role: "owner" | "editor" | "viewer"
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          user_id?: string
          role?: "owner" | "editor" | "viewer"
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

