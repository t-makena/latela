export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          Acc_no: number
          Acc_type: string | null
          Bank: string
          user: string
        }
        Insert: {
          Acc_no: number
          Acc_type?: string | null
          Bank: string
          user: string
        }
        Update: {
          Acc_no?: number
          Acc_type?: string | null
          Bank?: string
          user?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          Name: string
        }
        Insert: {
          created_at: string
          email: string
          id?: string
          is_active?: boolean
          Name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          Name?: string
        }
        Relationships: []
      }
      source_list: {
        Row: {
          category: string | null
          entity: string
          total: number
        }
        Insert: {
          category?: string | null
          entity: string
          total: number
        }
        Update: {
          category?: string | null
          entity?: string
          total?: number
        }
        Relationships: []
      }
      transaction_history: {
        Row: {
          balance_amount: number
          created_at: string | null
          id: string
          line_number: number
          request_id: string | null
          transaction_amount: number
          transaction_category: number | null
          transaction_date: string
          transaction_description: string
          transaction_fee: number | null
        }
        Insert: {
          balance_amount: number
          created_at?: string | null
          id?: string
          line_number: number
          request_id?: string | null
          transaction_amount: number
          transaction_category?: number | null
          transaction_date: string
          transaction_description: string
          transaction_fee?: number | null
        }
        Update: {
          balance_amount?: number
          created_at?: string | null
          id?: string
          line_number?: number
          request_id?: string | null
          transaction_amount?: number
          transaction_category?: number | null
          transaction_date?: string
          transaction_description?: string
          transaction_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "transaction_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      transaction_requests: {
        Row: {
          account_number: string
          created_at: string | null
          document_format: string
          file_content: string | null
          from_date: string
          id: string
          purpose_code: string
          request_id: string
          requesting_org_id: string
          requesting_org_name: string
          result_code: number | null
          result_description: string | null
          result_message: string | null
          status: string | null
          to_date: string
          transaction_history: Json | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number: string
          created_at?: string | null
          document_format: string
          file_content?: string | null
          from_date: string
          id?: string
          purpose_code: string
          request_id: string
          requesting_org_id: string
          requesting_org_name: string
          result_code?: number | null
          result_description?: string | null
          result_message?: string | null
          status?: string | null
          to_date: string
          transaction_history?: Json | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string
          created_at?: string | null
          document_format?: string
          file_content?: string | null
          from_date?: string
          id?: string
          purpose_code?: string
          request_id?: string
          requesting_org_id?: string
          requesting_org_name?: string
          result_code?: number | null
          result_description?: string | null
          result_message?: string | null
          status?: string | null
          to_date?: string
          transaction_history?: Json | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          acc_no: number
          created_at: string
          source: string
          value: number
        }
        Insert: {
          acc_no: number
          created_at?: string
          source: string
          value: number
        }
        Update: {
          acc_no?: number
          created_at?: string
          source?: string
          value?: number
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
