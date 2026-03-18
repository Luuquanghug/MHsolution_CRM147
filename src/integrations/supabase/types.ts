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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          address: string | null
          commission_rate: number | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_history: {
        Row: {
          contact_date: string
          contact_method: Database["public"]["Enums"]["contact_method"]
          created_at: string | null
          created_by: string | null
          details: string | null
          id: string
          next_action: string | null
          outcome: string | null
          personnel_id: string | null
          sales_opportunity_id: string | null
          summary: string
        }
        Insert: {
          contact_date: string
          contact_method: Database["public"]["Enums"]["contact_method"]
          created_at?: string | null
          created_by?: string | null
          details?: string | null
          id?: string
          next_action?: string | null
          outcome?: string | null
          personnel_id?: string | null
          sales_opportunity_id?: string | null
          summary: string
        }
        Update: {
          contact_date?: string
          contact_method?: Database["public"]["Enums"]["contact_method"]
          created_at?: string | null
          created_by?: string | null
          details?: string | null
          id?: string
          next_action?: string | null
          outcome?: string | null
          personnel_id?: string | null
          sales_opportunity_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "key_personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_history_sales_opportunity_id_fkey"
            columns: ["sales_opportunity_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_history_participants: {
        Row: {
          contact_history_id: string
          created_at: string
          id: string
          sales_person_id: string
        }
        Insert: {
          contact_history_id: string
          created_at?: string
          id?: string
          sales_person_id: string
        }
        Update: {
          contact_history_id?: string
          created_at?: string
          id?: string
          sales_person_id?: string
        }
        Relationships: []
      }
      field_definitions: {
        Row: {
          created_at: string
          display_order: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          field_config: Json | null
          field_group_id: string | null
          field_key: string
          field_label: string
          field_type: Database["public"]["Enums"]["field_data_type"]
          id: string
          is_active: boolean
          is_required: boolean
          max_length: number | null
          max_value: number | null
          min_length: number | null
          min_value: number | null
          regex_pattern: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          field_config?: Json | null
          field_group_id?: string | null
          field_key: string
          field_label: string
          field_type: Database["public"]["Enums"]["field_data_type"]
          id?: string
          is_active?: boolean
          is_required?: boolean
          max_length?: number | null
          max_value?: number | null
          min_length?: number | null
          min_value?: number | null
          regex_pattern?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          field_config?: Json | null
          field_group_id?: string | null
          field_key?: string
          field_label?: string
          field_type?: Database["public"]["Enums"]["field_data_type"]
          id?: string
          is_active?: boolean
          is_required?: boolean
          max_length?: number | null
          max_value?: number | null
          min_length?: number | null
          min_value?: number | null
          regex_pattern?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_definitions_field_group_id_fkey"
            columns: ["field_group_id"]
            isOneToOne: false
            referencedRelation: "field_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      field_groups: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      key_personnel: {
        Row: {
          assigned_sales_person_id: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_sales_person_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_sales_person_id?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_personnel_assigned_sales_person_id_fkey"
            columns: ["assigned_sales_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_personnel_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_group_memberships: {
        Row: {
          created_at: string
          group_id: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization_group_memberships_group_id"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "organization_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organization_group_memberships_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_relationships: {
        Row: {
          child_organization_id: string
          created_at: string
          id: string
          parent_organization_id: string
          relationship_type: string
          updated_at: string
        }
        Insert: {
          child_organization_id: string
          created_at?: string
          id?: string
          parent_organization_id: string
          relationship_type: string
          updated_at?: string
        }
        Update: {
          child_organization_id?: string
          created_at?: string
          id?: string
          parent_organization_id?: string
          relationship_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_child_organization"
            columns: ["child_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_parent_organization"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          assigned_sales_person_id: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          organization_chart_url: string | null
          phone: string | null
          sales_stage: Database["public"]["Enums"]["sales_stage"] | null
          tax_code: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_sales_person_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          organization_chart_url?: string | null
          phone?: string | null
          sales_stage?: Database["public"]["Enums"]["sales_stage"] | null
          tax_code?: string | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_sales_person_id?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          organization_chart_url?: string | null
          phone?: string | null
          sales_stage?: Database["public"]["Enums"]["sales_stage"] | null
          tax_code?: string | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_assigned_sales_person_id_fkey"
            columns: ["assigned_sales_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel_field_values: {
        Row: {
          boolean_value: boolean | null
          created_at: string
          date_value: string | null
          field_definition_id: string | null
          id: string
          json_value: Json | null
          number_value: number | null
          personnel_id: string | null
          text_value: string | null
          updated_at: string
        }
        Insert: {
          boolean_value?: boolean | null
          created_at?: string
          date_value?: string | null
          field_definition_id?: string | null
          id?: string
          json_value?: Json | null
          number_value?: number | null
          personnel_id?: string | null
          text_value?: string | null
          updated_at?: string
        }
        Update: {
          boolean_value?: boolean | null
          created_at?: string
          date_value?: string | null
          field_definition_id?: string | null
          id?: string
          json_value?: Json | null
          number_value?: number | null
          personnel_id?: string | null
          text_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personnel_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_field_values_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "key_personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel_product_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_level: number | null
          notes: string | null
          personnel_id: string | null
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_level?: number | null
          notes?: string | null
          personnel_id?: string | null
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_level?: number | null
          notes?: string | null
          personnel_id?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personnel_product_interests_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "key_personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personnel_product_interests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          position: string | null
          updated_at: string | null
          user_roles: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_roles?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
          user_roles?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      sales_funnel: {
        Row: {
          assigned_sales_person_id: string | null
          created_at: string
          expected_acceptance_date: string | null
          expected_implementation_date: string | null
          id: string
          is_deleted: boolean
          negotiated_price: number | null
          notes: string | null
          organization_id: string
          product_id: string
          stage: string
          updated_at: string
        }
        Insert: {
          assigned_sales_person_id?: string | null
          created_at?: string
          expected_acceptance_date?: string | null
          expected_implementation_date?: string | null
          id?: string
          is_deleted?: boolean
          negotiated_price?: number | null
          notes?: string | null
          organization_id: string
          product_id: string
          stage?: string
          updated_at?: string
        }
        Update: {
          assigned_sales_person_id?: string | null
          created_at?: string
          expected_acceptance_date?: string | null
          expected_implementation_date?: string | null
          id?: string
          is_deleted?: boolean
          negotiated_price?: number | null
          notes?: string | null
          organization_id?: string
          product_id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_funnel_stage"
            columns: ["stage"]
            isOneToOne: false
            referencedRelation: "sales_funnel_stages"
            referencedColumns: ["stage_key"]
          },
          {
            foreignKeyName: "sales_funnel_assigned_sales_person_id_fkey"
            columns: ["assigned_sales_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_funnel_stages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          stage_color: string
          stage_description: string | null
          stage_key: string
          stage_label: string
          stage_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          stage_color?: string
          stage_description?: string | null
          stage_key: string
          stage_label: string
          stage_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          stage_color?: string
          stage_description?: string | null
          stage_key?: string
          stage_label?: string
          stage_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_funnel_updates: {
        Row: {
          created_at: string
          id: string
          new_assigned_sales_person_id: string | null
          new_expected_acceptance_date: string | null
          new_expected_implementation_date: string | null
          new_negotiated_price: number | null
          new_notes: string | null
          new_stage: string | null
          old_assigned_sales_person_id: string | null
          old_expected_acceptance_date: string | null
          old_expected_implementation_date: string | null
          old_negotiated_price: number | null
          old_notes: string | null
          old_stage: string | null
          sales_funnel_id: string
          update_reason: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_assigned_sales_person_id?: string | null
          new_expected_acceptance_date?: string | null
          new_expected_implementation_date?: string | null
          new_negotiated_price?: number | null
          new_notes?: string | null
          new_stage?: string | null
          old_assigned_sales_person_id?: string | null
          old_expected_acceptance_date?: string | null
          old_expected_implementation_date?: string | null
          old_negotiated_price?: number | null
          old_notes?: string | null
          old_stage?: string | null
          sales_funnel_id: string
          update_reason?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          new_assigned_sales_person_id?: string | null
          new_expected_acceptance_date?: string | null
          new_expected_implementation_date?: string | null
          new_negotiated_price?: number | null
          new_notes?: string | null
          new_stage?: string | null
          old_assigned_sales_person_id?: string | null
          old_expected_acceptance_date?: string | null
          old_expected_implementation_date?: string | null
          old_negotiated_price?: number | null
          old_notes?: string | null
          old_stage?: string | null
          sales_funnel_id?: string
          update_reason?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_funnel_updates_sales_funnel_id_fkey"
            columns: ["sales_funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_funnel_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_update_reason: { Args: { reason: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "sales_person"
      contact_method:
        | "phone"
        | "email"
        | "meeting"
        | "social_media"
        | "other"
        | "online_meeting"
        | "direct_meeting"
      entity_type: "personnel" | "organization"
      field_data_type:
        | "text"
        | "number"
        | "date"
        | "boolean"
        | "select_single"
        | "select_multiple"
        | "textarea"
        | "email"
        | "phone"
        | "url"
      organization_type: "b2b" | "b2g"
      sales_stage:
        | "prospect"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
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
    Enums: {
      app_role: ["admin", "sales_person"],
      contact_method: [
        "phone",
        "email",
        "meeting",
        "social_media",
        "other",
        "online_meeting",
        "direct_meeting",
      ],
      entity_type: ["personnel", "organization"],
      field_data_type: [
        "text",
        "number",
        "date",
        "boolean",
        "select_single",
        "select_multiple",
        "textarea",
        "email",
        "phone",
        "url",
      ],
      organization_type: ["b2b", "b2g"],
      sales_stage: [
        "prospect",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
    },
  },
} as const
