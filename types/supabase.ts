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
          teacher_id: string | null
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
          teacher_id?: string | null
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
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
