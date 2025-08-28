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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          account_number_last4: string | null
          balance: number | null
          bank_name: string | null
          created_at: string | null
          currency: string | null
          id: string
          include_in_budget: boolean | null
          is_active: boolean | null
          name: string
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          account_number_last4?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          include_in_budget?: boolean | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          account_number_last4?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          include_in_budget?: boolean | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_connections: {
        Row: {
          account_type: string | null
          api_metadata: Json | null
          bank_account_id: string
          bank_account_name: string | null
          bank_code: string
          connection_status: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          sync_from_date: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: string | null
          api_metadata?: Json | null
          bank_account_id: string
          bank_account_name?: string | null
          bank_code: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          sync_from_date?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: string | null
          api_metadata?: Json | null
          bank_account_id?: string
          bank_account_name?: string | null
          bank_code?: string
          connection_status?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          sync_from_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          period: string
          start_date: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          period: string
          start_date: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          period?: string
          start_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_amount_spent: number | null
          category: string | null
          created_at: string | null
          description: string | null
          estimated_budget: number
          event_date: string
          id: string
          is_completed: boolean | null
          linked_transaction_ids: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_amount_spent?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_budget: number
          event_date: string
          id?: string
          is_completed?: boolean | null
          linked_transaction_ids?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_amount_spent?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          estimated_budget?: number
          event_date?: string
          id?: string
          is_completed?: boolean | null
          linked_transaction_ids?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_allocation: number | null
          estimated_completion_months: number | null
          id: string
          is_completed: boolean | null
          manual_priority_override: boolean | null
          manual_split_override: boolean | null
          monthly_allocation: number | null
          months_left: number | null
          name: string
          original_due_date: string
          percentage_achieved: number | null
          priority_percentage: number | null
          priority_weight: number | null
          remaining_needed: number | null
          split_percentage: number | null
          target: number
          timeline_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_allocation?: number | null
          estimated_completion_months?: number | null
          id?: string
          is_completed?: boolean | null
          manual_priority_override?: boolean | null
          manual_split_override?: boolean | null
          monthly_allocation?: number | null
          months_left?: number | null
          name: string
          original_due_date: string
          percentage_achieved?: number | null
          priority_percentage?: number | null
          priority_weight?: number | null
          remaining_needed?: number | null
          split_percentage?: number | null
          target: number
          timeline_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_allocation?: number | null
          estimated_completion_months?: number | null
          id?: string
          is_completed?: boolean | null
          manual_priority_override?: boolean | null
          manual_split_override?: boolean | null
          monthly_allocation?: number | null
          months_left?: number | null
          name?: string
          original_due_date?: string
          percentage_achieved?: number | null
          priority_percentage?: number | null
          priority_weight?: number | null
          remaining_needed?: number | null
          split_percentage?: number | null
          target?: number
          timeline_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      maintenance_log: {
        Row: {
          created_at: string | null
          goals_affected: number | null
          id: number
          maintenance_date: string
          maintenance_type: string
          users_affected: number | null
        }
        Insert: {
          created_at?: string | null
          goals_affected?: number | null
          id?: number
          maintenance_date: string
          maintenance_type: string
          users_affected?: number | null
        }
        Update: {
          created_at?: string | null
          goals_affected?: number | null
          id?: number
          maintenance_date?: string
          maintenance_type?: string
          users_affected?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          ai_categorized: boolean | null
          ai_confidence: number | null
          amount: number
          balance_after: number | null
          bank_category_code: string | null
          bank_category_name: string | null
          bank_connection_id: string | null
          bank_raw_data: Json | null
          bank_transaction_id: string | null
          booking_date: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          fee_amount: number | null
          id: string
          location: Json | null
          notes: string | null
          recurring_id: string | null
          status: string | null
          transaction_date: string
          transaction_reference: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          ai_categorized?: boolean | null
          ai_confidence?: number | null
          amount: number
          balance_after?: number | null
          bank_category_code?: string | null
          bank_category_name?: string | null
          bank_connection_id?: string | null
          bank_raw_data?: Json | null
          bank_transaction_id?: string | null
          booking_date?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          fee_amount?: number | null
          id?: string
          location?: Json | null
          notes?: string | null
          recurring_id?: string | null
          status?: string | null
          transaction_date: string
          transaction_reference?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          ai_categorized?: boolean | null
          ai_confidence?: number | null
          amount?: number
          balance_after?: number | null
          bank_category_code?: string | null
          bank_category_name?: string | null
          bank_connection_id?: string | null
          bank_raw_data?: Json | null
          bank_transaction_id?: string | null
          booking_date?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          fee_amount?: number | null
          id?: string
          location?: Json | null
          notes?: string | null
          recurring_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_reference?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balance_summary: {
        Row: {
          active_goals_count: number | null
          actual_monthly_savings: number | null
          available_budget_balance: number | null
          completed_goals_count: number | null
          created_at: string | null
          emergency_fund_months: number | null
          estimated_completion_months: number | null
          id: string
          last_calculated: string | null
          last_updated: string | null
          monthly_savings_budget: number | null
          next_event_amount: number | null
          next_event_date: string | null
          overall_savings_progress: number | null
          savings_rate_percentage: number | null
          total_allocated_to_goals: number | null
          total_bank_account_balance: number | null
          total_calendar_events: number | null
          total_goals_remaining: number | null
          total_goals_target: number | null
          upcoming_events_count: number | null
          user_id: string
        }
        Insert: {
          active_goals_count?: number | null
          actual_monthly_savings?: number | null
          available_budget_balance?: number | null
          completed_goals_count?: number | null
          created_at?: string | null
          emergency_fund_months?: number | null
          estimated_completion_months?: number | null
          id?: string
          last_calculated?: string | null
          last_updated?: string | null
          monthly_savings_budget?: number | null
          next_event_amount?: number | null
          next_event_date?: string | null
          overall_savings_progress?: number | null
          savings_rate_percentage?: number | null
          total_allocated_to_goals?: number | null
          total_bank_account_balance?: number | null
          total_calendar_events?: number | null
          total_goals_remaining?: number | null
          total_goals_target?: number | null
          upcoming_events_count?: number | null
          user_id: string
        }
        Update: {
          active_goals_count?: number | null
          actual_monthly_savings?: number | null
          available_budget_balance?: number | null
          completed_goals_count?: number | null
          created_at?: string | null
          emergency_fund_months?: number | null
          estimated_completion_months?: number | null
          id?: string
          last_calculated?: string | null
          last_updated?: string | null
          monthly_savings_budget?: number | null
          next_event_amount?: number | null
          next_event_date?: string | null
          overall_savings_progress?: number | null
          savings_rate_percentage?: number | null
          total_allocated_to_goals?: number | null
          total_bank_account_balance?: number | null
          total_calendar_events?: number | null
          total_goals_remaining?: number | null
          total_goals_target?: number | null
          upcoming_events_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          monthly_savings_budget: number | null
          total_current_savings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          monthly_savings_budget?: number | null
          total_current_savings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          monthly_savings_budget?: number | null
          total_current_savings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_goal_with_manual_priority: {
        Args: {
          goal_name: string
          manual_priority_percentage: number
          target_amount: number
          timeline_date: string
          user_uuid: string
        }
        Returns: string
      }
      calculate_estimated_completion_date: {
        Args: {
          current_allocation: number
          monthly_priority_percentage: number
          target_amount: number
          user_monthly_savings: number
        }
        Returns: string
      }
      calculate_priority_percentages: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      calculate_priority_weight: {
        Args: { months_remaining: number; remaining_amount: number }
        Returns: number
      }
      daily_goals_update: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_budget_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_goals_display: {
        Args: { user_uuid: string }
        Returns: {
          goal_name: string
          priority: string
          split: string
          timeline: string
        }[]
      }
      get_total_available_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_total_goals_target: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_upcoming_events_total: {
        Args: { p_date_range?: number; p_user_id: string }
        Returns: number
      }
      get_user_accounts_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_id: string
          account_name: string
          account_type: string
          balance_formatted: string
          bank_name: string
          currency: string
          include_in_budget: boolean
          is_active: boolean
        }[]
      }
      get_user_goals_display: {
        Args: { user_uuid?: string }
        Returns: {
          achieved: string
          current_allocation: number
          goal: string
          goal_id: string
          is_completed: boolean
          priority: string
          remaining_needed: number
          split: string
          target: number
          timeline: string
        }[]
      }
      monthly_priority_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          goals_updated: number
          maintenance_date: string
          users_updated: number
        }[]
      }
      preview_priority_redistribution: {
        Args: { new_manual_priority: number; user_uuid: string }
        Returns: {
          change_amount: number
          change_type: string
          current_priority: number
          goal_name: string
          new_priority: number
        }[]
      }
      redistribute_priorities_after_manual_set: {
        Args: {
          manually_set_goal_id: string
          new_priority_percentage: number
          user_uuid: string
        }
        Returns: {
          adjustment_type: string
          goal_id: string
          goal_name: string
          new_priority: number
          old_priority: number
        }[]
      }
      redistribute_priorities_for_user: {
        Args: { manually_set_goal_id: string; new_priority_percentage: number }
        Returns: {
          adjustment_type: string
          goal_id: string
          goal_name: string
          new_priority: number
          old_priority: number
        }[]
      }
      redistribute_priorities_with_due_dates: {
        Args: {
          manually_set_goal_id: string
          new_priority_percentage: number
          user_monthly_savings: number
          user_uuid: string
        }
        Returns: {
          adjustment_type: string
          goal_id: string
          goal_name: string
          new_estimated_date: string
          new_priority: number
          old_estimated_date: string
          old_priority: number
        }[]
      }
      test_with_first_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          accounts_balance: number
          available_budget: number
          found_user_id: string
          user_email: string
        }[]
      }
      update_account_balance: {
        Args: { account_id: string; new_balance: number }
        Returns: boolean
      }
      update_current_allocations_from_split: {
        Args: { total_current_savings: number; user_uuid: string }
        Returns: undefined
      }
      update_split_from_allocation: {
        Args: {
          goal_id: string
          new_allocation: number
          total_current_savings: number
        }
        Returns: undefined
      }
      update_user_balance_summary: {
        Args: { target_user_id?: string }
        Returns: {
          available_budget: number
          calendar_events: number
          goal_allocations: number
          progress: number
          total_accounts_balance: number
        }[]
      }
      user_update_split: {
        Args: { goal_id: string; new_split_percentage: number }
        Returns: undefined
      }
      user_update_split_with_due_date: {
        Args: {
          goal_id: string
          new_split_percentage: number
          user_monthly_savings: number
        }
        Returns: {
          new_date: string
          new_split: number
          old_date: string
          old_split: number
        }[]
      }
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
