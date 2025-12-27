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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_holder_id: string | null
          account_limit: number | null
          account_name: string | null
          account_number: string
          account_type: string
          available_balance: number
          balance: number
          balance_brought_forward: number
          bank_name: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          power_of_attorney: boolean | null
          status: string
          uncleared: number | null
          uncleared_effects_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_holder_id?: string | null
          account_limit?: number | null
          account_name?: string | null
          account_number: string
          account_type: string
          available_balance: number
          balance: number
          balance_brought_forward: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          power_of_attorney?: boolean | null
          status: string
          uncleared?: number | null
          uncleared_effects_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder_id?: string | null
          account_limit?: number | null
          account_name?: string | null
          account_number?: string
          account_type?: string
          available_balance?: number
          balance?: number
          balance_brought_forward?: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          power_of_attorney?: boolean | null
          status?: string
          uncleared?: number | null
          uncleared_effects_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          amount: number
          amount_spent: number | null
          created_at: string
          days_per_week: number | null
          frequency: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_spent?: number | null
          created_at?: string
          days_per_week?: number | null
          frequency: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_spent?: number | null
          created_at?: string
          days_per_week?: number | null
          frequency?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          actual_amount: number | null
          budgeted_amount: number
          category: string | null
          created_at: string | null
          event_date: string
          event_description: string | null
          event_name: string
          event_time: string | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          location: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder_days_before: number | null
          reminder_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_amount?: number | null
          budgeted_amount: number
          category?: string | null
          created_at?: string | null
          event_date: string
          event_description?: string | null
          event_name: string
          event_time?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_amount?: number | null
          budgeted_amount?: number
          category?: string | null
          created_at?: string | null
          event_date?: string
          event_description?: string | null
          event_name?: string
          event_time?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_days_before?: number | null
          reminder_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          budget_amount: number | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget_amount?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_amount?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_category"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_saved: number | null
          due_date: string | null
          id: string
          monthly_allocation: number | null
          months_left: number
          name: string
          priority: number | null
          target: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_saved?: number | null
          due_date?: string | null
          id?: string
          monthly_allocation?: number | null
          months_left: number
          name: string
          priority?: number | null
          target: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_saved?: number | null
          due_date?: string | null
          id?: string
          monthly_allocation?: number | null
          months_left?: number
          name?: string
          priority?: number | null
          target?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          frequency: number | null
          id: string
          merchant_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          frequency?: number | null
          id?: string
          merchant_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          frequency?: number | null
          id?: string
          merchant_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          auto_categorized: boolean | null
          balance: number
          categorization_confidence: number | null
          category_id: string | null
          cleared: boolean | null
          created_at: string | null
          description: string | null
          display_merchant_name: string | null
          id: string
          is_categorized: boolean
          merchant_id: string | null
          raw_description: string | null
          reference: string | null
          subcategory_id: string | null
          transaction_code: string | null
          transaction_date: string
          updated_at: string | null
          user_id: string | null
          user_verified: boolean | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_categorized?: boolean | null
          balance: number
          categorization_confidence?: number | null
          category_id?: string | null
          cleared?: boolean | null
          created_at?: string | null
          description?: string | null
          display_merchant_name?: string | null
          id?: string
          is_categorized?: boolean
          merchant_id?: string | null
          raw_description?: string | null
          reference?: string | null
          subcategory_id?: string | null
          transaction_code?: string | null
          transaction_date: string
          updated_at?: string | null
          user_id?: string | null
          user_verified?: boolean | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_categorized?: boolean | null
          balance?: number
          categorization_confidence?: number | null
          category_id?: string | null
          cleared?: boolean | null
          created_at?: string | null
          description?: string | null
          display_merchant_name?: string | null
          id?: string
          is_categorized?: boolean
          merchant_id?: string | null
          raw_description?: string | null
          reference?: string | null
          subcategory_id?: string | null
          transaction_code?: string | null
          transaction_date?: string
          updated_at?: string | null
          user_id?: string | null
          user_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_category_id: string
          replaces_category_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_category_id: string
          replaces_category_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_category_id?: string
          replaces_category_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_categories_parent_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_custom_categories_replaces_fkey"
            columns: ["replaces_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_merchant_mappings: {
        Row: {
          category_id: string
          created_at: string
          custom_subcategory_id: string | null
          display_name: string | null
          id: string
          is_active: boolean
          merchant_name: string
          merchant_pattern: string | null
          notes: string | null
          subcategory_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          custom_subcategory_id?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          merchant_name: string
          merchant_pattern?: string | null
          notes?: string | null
          subcategory_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          custom_subcategory_id?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          merchant_name?: string
          merchant_pattern?: string | null
          notes?: string | null
          subcategory_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_merchant_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_merchant_mappings_custom_subcategory_fkey"
            columns: ["custom_subcategory_id"]
            isOneToOne: false
            referencedRelation: "user_custom_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_merchant_mappings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          color_palette: string
          country: string | null
          created_at: string | null
          currency: string | null
          date_of_birth: string | null
          default_account_id: string | null
          display_name: string | null
          email_notifications: boolean | null
          email_verified: boolean | null
          financial_year_start: number | null
          first_name: string | null
          gender: string | null
          id: string
          language: string | null
          last_active_at: string | null
          last_name: string | null
          marketing_consent: boolean | null
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          phone_number: string | null
          phone_verified: boolean | null
          privacy_accepted_at: string | null
          profile_completed: boolean | null
          province: string | null
          push_notifications: boolean | null
          savings_adjustment_strategy: string
          terms_accepted_at: string | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          week_start_day: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          color_palette?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          default_account_id?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          financial_year_start?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone_number?: string | null
          phone_verified?: boolean | null
          privacy_accepted_at?: string | null
          profile_completed?: boolean | null
          province?: string | null
          push_notifications?: boolean | null
          savings_adjustment_strategy?: string
          terms_accepted_at?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          week_start_day?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          color_palette?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          default_account_id?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          financial_year_start?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          last_active_at?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          phone_number?: string | null
          phone_verified?: boolean | null
          privacy_accepted_at?: string | null
          profile_completed?: boolean | null
          province?: string | null
          push_notifications?: boolean | null
          savings_adjustment_strategy?: string
          terms_accepted_at?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          week_start_day?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      upcoming_events_summary: {
        Row: {
          event_count: number | null
          total_budget_next_30_days: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_transactions_with_details: {
        Row: {
          account_id: string | null
          amount: number | null
          auto_categorized: boolean | null
          balance: number | null
          categorization_confidence: number | null
          category_id: string | null
          cleared: boolean | null
          created_at: string | null
          description: string | null
          display_merchant_name: string | null
          display_subcategory_color: string | null
          display_subcategory_name: string | null
          id: string | null
          is_categorized: boolean | null
          merchant_id: string | null
          merchant_name: string | null
          parent_category_color: string | null
          parent_category_name: string | null
          raw_description: string | null
          reference: string | null
          subcategory_color: string | null
          subcategory_id: string | null
          subcategory_name: string | null
          transaction_code: string | null
          transaction_date: string | null
          updated_at: string | null
          user_id: string | null
          user_verified: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
            foreignKeyName: "transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_available_subcategories: {
        Row: {
          color: string | null
          custom_category_id: string | null
          id: string | null
          name: string | null
          parent_category_id: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_merchant_mappings: {
        Row: {
          category_color: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          custom_subcategory_id: string | null
          id: string | null
          is_active: boolean | null
          merchant_name: string | null
          notes: string | null
          subcategory_color: string | null
          subcategory_id: string | null
          subcategory_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_merchant_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_merchant_mappings_custom_subcategory_fkey"
            columns: ["custom_subcategory_id"]
            isOneToOne: false
            referencedRelation: "user_custom_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_merchant_mappings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      allocate_monthly_savings: {
        Args: { monthly_savings: number; user_uuid: string }
        Returns: {
          formula_check: string
          goal_name: string
          monthly_allocation: number
          priority_percentage: number
          priority_weight: number
        }[]
      }
      delete_user_account: { Args: never; Returns: undefined }
      extract_merchant_core: { Args: { description: string }; Returns: string }
      fuzzy_match_merchant: {
        Args: { merchant_name: string; pattern: string }
        Returns: boolean
      }
      get_profile_by_username: {
        Args: { lookup_username: string }
        Returns: {
          avatar_url: string
          bio: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      insert_transaction: {
        Args: {
          p_account_id: string
          p_amount: number
          p_category_id?: string
          p_date: string
          p_description: string
        }
        Returns: string
      }
      is_username_available: {
        Args: { check_username: string }
        Returns: boolean
      }
      normalize_merchant_name: {
        Args: { description: string }
        Returns: string
      }
      recalculate_goal_priorities: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      recalculate_goal_priorities_and_dates: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      redistribute_priorities_for_user: {
        Args: { manually_set_goal_id: string; new_priority_percentage: number }
        Returns: undefined
      }
      update_goal_current_allocation: {
        Args: { goal_id: string; new_allocation: number }
        Returns: {
          months_difference: number
          new_allocation_val: number
          new_timeline: string
          old_allocation: number
          old_timeline: string
        }[]
      }
      update_last_active: { Args: never; Returns: undefined }
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
