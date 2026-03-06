export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          ai_prompt_template: string | null
          assets: string | null
          checklist_steps: string[]
          created_at: string
          description: string | null
          id: string
          name: string
          risk_rules: string[]
          screenshot_requirements: string[]
          timeframe: string | null
          updated_at: string
        }
        Insert: {
          ai_prompt_template?: string | null
          assets?: string | null
          checklist_steps?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          risk_rules?: string[]
          screenshot_requirements?: string[]
          timeframe?: string | null
          updated_at?: string
        }
        Update: {
          ai_prompt_template?: string | null
          assets?: string | null
          checklist_steps?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          risk_rules?: string[]
          screenshot_requirements?: string[]
          timeframe?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          asset: string
          close_date: string | null
          created_at: string
          direction: string
          entry_price: number
          exit_price: number | null
          id: string
          lot_size: number | null
          new_balance: number | null
          notes: string | null
          outcome: string | null
          profit_loss: number | null
          risk_percent: number | null
          screenshot_url: string | null
          stop_loss: number | null
          strategy_used: string | null
          take_profit: number | null
          trade_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset: string
          close_date?: string | null
          created_at?: string
          direction: string
          entry_price: number
          exit_price?: number | null
          id?: string
          lot_size?: number | null
          new_balance?: number | null
          notes?: string | null
          outcome?: string | null
          profit_loss?: number | null
          risk_percent?: number | null
          screenshot_url?: string | null
          stop_loss?: number | null
          strategy_used?: string | null
          take_profit?: number | null
          trade_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: string
          close_date?: string | null
          created_at?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          lot_size?: number | null
          new_balance?: number | null
          notes?: string | null
          outcome?: string | null
          profit_loss?: number | null
          risk_percent?: number | null
          screenshot_url?: string | null
          stop_loss?: number | null
          strategy_used?: string | null
          take_profit?: number | null
          trade_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_icon: string
          course_id: string
          course_name: string
          created_at: string
          enrolled_at: string
          id: string
          last_activity_at: string
          level: string
          overall_progress: number
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          completed_at?: string | null
          course_icon?: string
          course_id: string
          course_name: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_activity_at?: string
          level?: string
          overall_progress?: number
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          completed_at?: string | null
          course_icon?: string
          course_id?: string
          course_name?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          last_activity_at?: string
          level?: string
          overall_progress?: number
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_module_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          focus_area: string
          id: string
          level: string
          module_name: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          focus_area?: string
          id?: string
          level?: string
          module_name: string
          progress?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          focus_area?: string
          id?: string
          level?: string
          module_name?: string
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
