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
      accounts: {
        Row: {
          account_first_four: string | null
          account_holder_id: string | null
          account_holder_name: string | null
          account_last_four: string | null
          account_limit: number | null
          account_name: string | null
          account_number: string
          account_type: string
          available_balance: number | null
          balance_brought_forward: number
          bank_name: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          id: string
          is_active: boolean | null
          last_statement_date: string | null
          power_of_attorney: boolean | null
          statement_period_end: string | null
          statement_period_start: string | null
          status: string
          uncleared: number | null
          uncleared_effects_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_first_four?: string | null
          account_holder_id?: string | null
          account_holder_name?: string | null
          account_last_four?: string | null
          account_limit?: number | null
          account_name?: string | null
          account_number: string
          account_type: string
          available_balance?: number | null
          balance_brought_forward: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          last_statement_date?: string | null
          power_of_attorney?: boolean | null
          statement_period_end?: string | null
          statement_period_start?: string | null
          status: string
          uncleared?: number | null
          uncleared_effects_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_first_four?: string | null
          account_holder_id?: string | null
          account_holder_name?: string | null
          account_last_four?: string | null
          account_limit?: number | null
          account_name?: string | null
          account_number?: string
          account_type?: string
          available_balance?: number | null
          balance_brought_forward?: number
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          is_active?: boolean | null
          last_statement_date?: string | null
          power_of_attorney?: boolean | null
          statement_period_end?: string | null
          statement_period_start?: string | null
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
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          amount: number
          amount_spent: number | null
          auto_detected: boolean | null
          created_at: string
          days_per_week: number | null
          frequency: string
          id: string
          name: string
          parent_category_id: string | null
          source_merchant_pattern: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          amount_spent?: number | null
          auto_detected?: boolean | null
          created_at?: string
          days_per_week?: number | null
          frequency: string
          id?: string
          name: string
          parent_category_id?: string | null
          source_merchant_pattern?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          amount_spent?: number | null
          auto_detected?: boolean | null
          created_at?: string
          days_per_week?: number | null
          frequency?: string
          id?: string
          name?: string
          parent_category_id?: string | null
          source_merchant_pattern?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_scores: {
        Row: {
          account_id: string | null
          avg_daily_spend: number | null
          budget_compliance_score: number | null
          calculated_at: string | null
          cash_survival_risk_score: number | null
          created_at: string | null
          days_until_payday: number | null
          expected_spend_to_payday: number | null
          id: string
          remaining_balance: number | null
          risk_ratio: number | null
          savings_health_score: number | null
          spending_consistency_score: number | null
          total_score: number
          user_id: string
        }
        Insert: {
          account_id?: string | null
          avg_daily_spend?: number | null
          budget_compliance_score?: number | null
          calculated_at?: string | null
          cash_survival_risk_score?: number | null
          created_at?: string | null
          days_until_payday?: number | null
          expected_spend_to_payday?: number | null
          id?: string
          remaining_balance?: number | null
          risk_ratio?: number | null
          savings_health_score?: number | null
          spending_consistency_score?: number | null
          total_score: number
          user_id: string
        }
        Update: {
          account_id?: string | null
          avg_daily_spend?: number | null
          budget_compliance_score?: number | null
          calculated_at?: string | null
          cash_survival_risk_score?: number | null
          created_at?: string | null
          days_until_payday?: number | null
          expected_spend_to_payday?: number | null
          id?: string
          remaining_balance?: number | null
          risk_ratio?: number | null
          savings_health_score?: number | null
          spending_consistency_score?: number | null
          total_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_scores_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
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
      canonical_products: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          quantity_unit: string | null
          quantity_value: number | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          quantity_unit?: string | null
          quantity_value?: number | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          quantity_unit?: string | null
          quantity_value?: number | null
          updated_at?: string | null
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
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
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
      grocery_prices: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string
          created_at: string | null
          id: string
          image_url: string | null
          name: string
          on_sale: boolean | null
          original_price_cents: number | null
          price_cents: number
          product_url: string | null
          retailer: string
          scraped_at: string
          sku: string | null
          subcategory: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          on_sale?: boolean | null
          original_price_cents?: number | null
          price_cents: number
          product_url?: string | null
          retailer: string
          scraped_at: string
          sku?: string | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          on_sale?: boolean | null
          original_price_cents?: number | null
          price_cents?: number
          product_url?: string | null
          retailer?: string
          scraped_at?: string
          sku?: string | null
          subcategory?: string | null
          unit?: string | null
          updated_at?: string | null
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
      price_history: {
        Row: {
          canonical_product_id: string | null
          id: string
          on_sale: boolean | null
          original_price_cents: number | null
          price_cents: number
          recorded_at: string | null
          store: string
        }
        Insert: {
          canonical_product_id?: string | null
          id?: string
          on_sale?: boolean | null
          original_price_cents?: number | null
          price_cents: number
          recorded_at?: string | null
          store: string
        }
        Update: {
          canonical_product_id?: string | null
          id?: string
          on_sale?: boolean | null
          original_price_cents?: number | null
          price_cents?: number
          recorded_at?: string | null
          store?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_canonical_product_id_fkey"
            columns: ["canonical_product_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          brand: string | null
          canonical_product_id: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          last_seen_at: string | null
          on_sale: boolean | null
          original_price_cents: number | null
          price_cents: number
          product_name: string | null
          product_url: string | null
          promotion_text: string | null
          scraped_at: string | null
          store: string
          store_product_code: string | null
          subcategory: string | null
          unit_price_cents: number | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          canonical_product_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          last_seen_at?: string | null
          on_sale?: boolean | null
          original_price_cents?: number | null
          price_cents: number
          product_name?: string | null
          product_url?: string | null
          promotion_text?: string | null
          scraped_at?: string | null
          store: string
          store_product_code?: string | null
          subcategory?: string | null
          unit_price_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          canonical_product_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          last_seen_at?: string | null
          on_sale?: boolean | null
          original_price_cents?: number | null
          price_cents?: number
          product_name?: string | null
          product_url?: string | null
          promotion_text?: string | null
          scraped_at?: string | null
          store?: string
          store_product_code?: string | null
          subcategory?: string | null
          unit_price_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_canonical_product_id_fkey"
            columns: ["canonical_product_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
        ]
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
      user_grocery_budget: {
        Row: {
          alert_threshold_percent: number | null
          alerts_enabled: boolean | null
          budget_period_start: string | null
          created_at: string | null
          current_month_spent_cents: number | null
          current_month_transactions: number | null
          id: string
          monthly_budget_cents: number
          preferred_retailers: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold_percent?: number | null
          alerts_enabled?: boolean | null
          budget_period_start?: string | null
          created_at?: string | null
          current_month_spent_cents?: number | null
          current_month_transactions?: number | null
          id?: string
          monthly_budget_cents?: number
          preferred_retailers?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold_percent?: number | null
          alerts_enabled?: boolean | null
          budget_period_start?: string | null
          created_at?: string | null
          current_month_spent_cents?: number | null
          current_month_transactions?: number | null
          id?: string
          monthly_budget_cents?: number
          preferred_retailers?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_price_alerts: {
        Row: {
          created_at: string | null
          current_price_cents: number | null
          grocery_price_id: string | null
          id: string
          is_active: boolean | null
          product_name: string
          retailer: string | null
          target_price_cents: number
          triggered_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_price_cents?: number | null
          grocery_price_id?: string | null
          id?: string
          is_active?: boolean | null
          product_name: string
          retailer?: string | null
          target_price_cents: number
          triggered_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_price_cents?: number | null
          grocery_price_id?: string | null
          id?: string
          is_active?: boolean | null
          product_name?: string
          retailer?: string | null
          target_price_cents?: number
          triggered_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_price_alerts_grocery_price_id_fkey"
            columns: ["grocery_price_id"]
            isOneToOne: false
            referencedRelation: "cheapest_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_price_alerts_grocery_price_id_fkey"
            columns: ["grocery_price_id"]
            isOneToOne: false
            referencedRelation: "current_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_price_alerts_grocery_price_id_fkey"
            columns: ["grocery_price_id"]
            isOneToOne: false
            referencedRelation: "grocery_prices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          avatar_type: string | null
          avatar_url: string | null
          bio: string | null
          budget_method: string
          city: string | null
          color_palette: string
          country: string | null
          created_at: string | null
          currency: string | null
          date_of_birth: string | null
          default_account_id: string | null
          default_avatar_id: string | null
          display_name: string | null
          email: string | null
          email_notifications: boolean | null
          email_verified: boolean | null
          financial_year_start: number | null
          first_name: string | null
          gender: string | null
          id: string
          income_frequency: string | null
          language: string | null
          last_active_at: string | null
          last_name: string | null
          marketing_consent: boolean | null
          mobile: string | null
          needs_percentage: number
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          payday_date: number | null
          phone_number: string | null
          phone_verified: boolean | null
          privacy_accepted_at: string | null
          profile_completed: boolean | null
          province: string | null
          push_notifications: boolean | null
          savings_adjustment_strategy: string
          savings_percentage: number
          terms_accepted_at: string | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          wants_percentage: number
          week_start_day: number | null
        }
        Insert: {
          avatar_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          budget_method?: string
          city?: string | null
          color_palette?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          default_account_id?: string | null
          default_avatar_id?: string | null
          display_name?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          financial_year_start?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string
          income_frequency?: string | null
          language?: string | null
          last_active_at?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          mobile?: string | null
          needs_percentage?: number
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          payday_date?: number | null
          phone_number?: string | null
          phone_verified?: boolean | null
          privacy_accepted_at?: string | null
          profile_completed?: boolean | null
          province?: string | null
          push_notifications?: boolean | null
          savings_adjustment_strategy?: string
          savings_percentage?: number
          terms_accepted_at?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          wants_percentage?: number
          week_start_day?: number | null
        }
        Update: {
          avatar_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          budget_method?: string
          city?: string | null
          color_palette?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          default_account_id?: string | null
          default_avatar_id?: string | null
          display_name?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          financial_year_start?: number | null
          first_name?: string | null
          gender?: string | null
          id?: string
          income_frequency?: string | null
          language?: string | null
          last_active_at?: string | null
          last_name?: string | null
          marketing_consent?: boolean | null
          mobile?: string | null
          needs_percentage?: number
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          payday_date?: number | null
          phone_number?: string | null
          phone_verified?: boolean | null
          privacy_accepted_at?: string | null
          profile_completed?: boolean | null
          province?: string | null
          push_notifications?: boolean | null
          savings_adjustment_strategy?: string
          savings_percentage?: number
          terms_accepted_at?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          wants_percentage?: number
          week_start_day?: number | null
        }
        Relationships: []
      }
      user_shopping_list: {
        Row: {
          actual_price_cents: number | null
          category: string | null
          created_at: string | null
          estimated_price_cents: number | null
          grocery_price_id: string | null
          id: string
          is_purchased: boolean | null
          list_name: string | null
          name: string
          notes: string | null
          preferred_retailer: string | null
          purchased_at: string | null
          quantity: number | null
          sort_order: number | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_price_cents?: number | null
          category?: string | null
          created_at?: string | null
          estimated_price_cents?: number | null
          grocery_price_id?: string | null
          id?: string
          is_purchased?: boolean | null
          list_name?: string | null
          name: string
          notes?: string | null
          preferred_retailer?: string | null
          purchased_at?: string | null
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_price_cents?: number | null
          category?: string | null
          created_at?: string | null
          estimated_price_cents?: number | null
          grocery_price_id?: string | null
          id?: string
          is_purchased?: boolean | null
          list_name?: string | null
          name?: string
          notes?: string | null
          preferred_retailer?: string | null
          purchased_at?: string | null
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_shopping_list_grocery_price_id_fkey"
            columns: ["grocery_price_id"]
            isOneToOne: false
            referencedRelation: "cheapest_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shopping_list_grocery_price_id_fkey"
            columns: ["grocery_price_id"]
            isOneToOne: false
            referencedRelation: "current_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_shopping_list_grocery_price_id_fkey"
            columns: ["grocery_price_id"]
            isOneToOne: false
            referencedRelation: "grocery_prices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cheapest_products: {
        Row: {
          brand: string | null
          category: string | null
          id: string | null
          name: string | null
          on_sale: boolean | null
          original_price_cents: number | null
          price_cents: number | null
          product_url: string | null
          retailer: string | null
          scraped_at: string | null
        }
        Relationships: []
      }
      current_sales: {
        Row: {
          brand: string | null
          category: string | null
          discount_percent: number | null
          id: string | null
          name: string | null
          original_price_cents: number | null
          price_cents: number | null
          product_url: string | null
          retailer: string | null
          savings_cents: number | null
          scraped_at: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          discount_percent?: never
          id?: string | null
          name?: string | null
          original_price_cents?: number | null
          price_cents?: number | null
          product_url?: string | null
          retailer?: string | null
          savings_cents?: never
          scraped_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          discount_percent?: never
          id?: string | null
          name?: string | null
          original_price_cents?: number | null
          price_cents?: number | null
          product_url?: string | null
          retailer?: string | null
          savings_cents?: never
          scraped_at?: string | null
        }
        Relationships: []
      }
      upcoming_events_summary: {
        Row: {
          event_count: number | null
          total_budget_next_30_days: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_daily_account_balances: {
        Row: {
          account_id: string | null
          balance_date: string | null
          daily_net: number | null
          end_of_day_balance: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
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
      search_products: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          brand: string
          category: string
          id: string
          image_url: string
          name: string
          offers: Json
          quantity_unit: string
          quantity_value: number
        }[]
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
