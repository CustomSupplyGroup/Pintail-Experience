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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["announcement_channel"]
          created_at: string
          created_by: string | null
          id: string
          sent_at: string | null
          title: string
          trip_id: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["announcement_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string | null
          title: string
          trip_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["announcement_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          sent_at?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      content_entries: {
        Row: {
          audio_mux_id: string | null
          body_md: string | null
          created_at: string
          day_offset: number | null
          discussion_questions: Json
          id: string
          published: boolean
          scripture_reference: string | null
          series_id: string
          sort: number
          title: string
          video_mux_id: string | null
        }
        Insert: {
          audio_mux_id?: string | null
          body_md?: string | null
          created_at?: string
          day_offset?: number | null
          discussion_questions?: Json
          id?: string
          published?: boolean
          scripture_reference?: string | null
          series_id: string
          sort?: number
          title: string
          video_mux_id?: string | null
        }
        Update: {
          audio_mux_id?: string | null
          body_md?: string | null
          created_at?: string
          day_offset?: number | null
          discussion_questions?: Json
          id?: string
          published?: boolean
          scripture_reference?: string | null
          series_id?: string
          sort?: number
          title?: string
          video_mux_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_entries_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "content_series"
            referencedColumns: ["id"]
          },
        ]
      }
      content_series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["content_kind"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["content_kind"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["content_kind"]
          title?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          trip_interest: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          trip_interest?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          trip_interest?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string
          featured: boolean
          id: string
          public_visible: boolean
          storage_path: string
          taken_at: string | null
          thumbnail_path: string | null
          trip_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          public_visible?: boolean
          storage_path: string
          taken_at?: string | null
          thumbnail_path?: string | null
          trip_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          public_visible?: boolean
          storage_path?: string
          taken_at?: string | null
          thumbnail_path?: string | null
          trip_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          category: Database["public"]["Enums"]["schedule_category"]
          created_at: string
          day_number: number
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          start_time: string | null
          title: string
          trip_id: string
          visible_to_attendees: boolean
        }
        Insert: {
          category?: Database["public"]["Enums"]["schedule_category"]
          created_at?: string
          day_number: number
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          start_time?: string | null
          title: string
          trip_id: string
          visible_to_attendees?: boolean
        }
        Update: {
          category?: Database["public"]["Enums"]["schedule_category"]
          created_at?: string
          day_number?: number
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          start_time?: string | null
          title?: string
          trip_id?: string
          visible_to_attendees?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_attendees: {
        Row: {
          amount_paid_cents: number
          arrival_info: string | null
          balance_paid_at: string | null
          boot_size: string | null
          created_at: string
          departure_info: string | null
          deposit_paid_at: string | null
          dietary_notes: string | null
          glove_size: string | null
          hat_size: string | null
          jacket_size: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          prayer_request: string | null
          room_assignment: string | null
          room_preference: string | null
          roster_visible: boolean
          shirt_size: string | null
          trip_id: string
          user_id: string
          waiver_image_url: string | null
          waiver_signed_at: string | null
        }
        Insert: {
          amount_paid_cents?: number
          arrival_info?: string | null
          balance_paid_at?: string | null
          boot_size?: string | null
          created_at?: string
          departure_info?: string | null
          deposit_paid_at?: string | null
          dietary_notes?: string | null
          glove_size?: string | null
          hat_size?: string | null
          jacket_size?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          prayer_request?: string | null
          room_assignment?: string | null
          room_preference?: string | null
          roster_visible?: boolean
          shirt_size?: string | null
          trip_id: string
          user_id: string
          waiver_image_url?: string | null
          waiver_signed_at?: string | null
        }
        Update: {
          amount_paid_cents?: number
          arrival_info?: string | null
          balance_paid_at?: string | null
          boot_size?: string | null
          created_at?: string
          departure_info?: string | null
          deposit_paid_at?: string | null
          dietary_notes?: string | null
          glove_size?: string | null
          hat_size?: string | null
          jacket_size?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          prayer_request?: string | null
          room_assignment?: string | null
          room_preference?: string | null
          roster_visible?: boolean
          shirt_size?: string | null
          trip_id?: string
          user_id?: string
          waiver_image_url?: string | null
          waiver_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_attendees_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_content: {
        Row: {
          series_id: string
          trip_id: string
        }
        Insert: {
          series_id: string
          trip_id: string
        }
        Update: {
          series_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_content_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "content_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_content_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          slug: string
          sort_order: number
          title: string
          trip_id: string
          visible: boolean
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          slug: string
          sort_order?: number
          title: string
          trip_id: string
          visible?: boolean
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          trip_id?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trip_pages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_vendors: {
        Row: {
          created_at: string
          role_on_trip: string | null
          trip_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          role_on_trip?: string | null
          trip_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          role_on_trip?: string | null
          trip_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_vendors_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          brand_film_mux_id: string | null
          capacity: number | null
          created_at: string
          deposit_cents: number | null
          description: string | null
          end_date: string | null
          experience_type: string | null
          payment_url: string | null
          price_cents: number | null
          hero_image_url: string | null
          id: string
          location: string | null
          lodge_id: string | null
          name: string
          planning_owner_id: string | null
          planning_status: Database["public"]["Enums"]["planning_status"]
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["trip_status"]
          subtitle: string | null
          tagline: string | null
        }
        Insert: {
          brand_film_mux_id?: string | null
          capacity?: number | null
          created_at?: string
          deposit_cents?: number | null
          description?: string | null
          end_date?: string | null
          experience_type?: string | null
          payment_url?: string | null
          price_cents?: number | null
          hero_image_url?: string | null
          id?: string
          location?: string | null
          lodge_id?: string | null
          name: string
          planning_owner_id?: string | null
          planning_status?: Database["public"]["Enums"]["planning_status"]
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          subtitle?: string | null
          tagline?: string | null
        }
        Update: {
          brand_film_mux_id?: string | null
          capacity?: number | null
          created_at?: string
          deposit_cents?: number | null
          description?: string | null
          end_date?: string | null
          experience_type?: string | null
          payment_url?: string | null
          price_cents?: number | null
          hero_image_url?: string | null
          id?: string
          location?: string | null
          lodge_id?: string | null
          name?: string
          planning_owner_id?: string | null
          planning_status?: Database["public"]["Enums"]["planning_status"]
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          subtitle?: string | null
          tagline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_lodge_id_fkey"
            columns: ["lodge_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_planning_owner_id_fkey"
            columns: ["planning_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          intro_note: string | null
          last_active_at: string | null
          member_since: string
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          intro_note?: string | null
          last_active_at?: string | null
          member_since?: string
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          intro_note?: string | null
          last_active_at?: string | null
          member_since?: string
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      vendor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          featured: boolean
          featured_photo_url: string | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          photos: Json
          role: Database["public"]["Enums"]["vendor_role"]
          slug: string
          website_url: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          featured_photo_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          photos?: Json
          role?: Database["public"]["Enums"]["vendor_role"]
          slug: string
          website_url?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          featured_photo_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          photos?: Json
          role?: Database["public"]["Enums"]["vendor_role"]
          slug?: string
          website_url?: string | null
        }
        Relationships: []
      }
      waivers: {
        Row: {
          document_version: string | null
          id: string
          ip_address: string | null
          signature_image_path: string | null
          signed_at: string
          trip_id: string
          user_id: string
        }
        Insert: {
          document_version?: string | null
          id?: string
          ip_address?: string | null
          signature_image_path?: string | null
          signed_at?: string
          trip_id: string
          user_id: string
        }
        Update: {
          document_version?: string | null
          id?: string
          ip_address?: string | null
          signature_image_path?: string | null
          signed_at?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waivers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_trip_enrollment: { Args: never; Returns: string }
      get_trip_roster: {
        Args: { p_trip: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          intro_note: string
          user_id: string
        }[]
      }
      has_content_access: { Args: never; Returns: boolean }
      has_staff_access: { Args: never; Returns: boolean }
      trip_seat_counts: {
        Args: never
        Returns: {
          seats_taken: number
          trip_id: string
        }[]
      }
    }
    Enums: {
      announcement_channel: "in_app" | "push" | "email" | "all"
      content_kind: "devotional" | "curriculum"
      inquiry_status: "new" | "contacted" | "qualified" | "closed"
      payment_status: "unpaid" | "deposit" | "paid_in_full" | "refunded"
      planning_status:
        | "scoping"
        | "booked"
        | "prepping"
        | "ready"
        | "live"
        | "wrapped"
      schedule_category:
        | "hunt"
        | "meal"
        | "teaching"
        | "rest"
        | "travel"
        | "special"
      trip_status: "draft" | "live" | "past"
      user_role: "attendee" | "staff" | "founder" | "admin"
      vendor_role:
        | "lodge"
        | "dog_handler"
        | "photographer"
        | "leather_goods"
        | "speaker"
        | "other"
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
      announcement_channel: ["in_app", "push", "email", "all"],
      content_kind: ["devotional", "curriculum"],
      inquiry_status: ["new", "contacted", "qualified", "closed"],
      payment_status: ["unpaid", "deposit", "paid_in_full", "refunded"],
      planning_status: [
        "scoping",
        "booked",
        "prepping",
        "ready",
        "live",
        "wrapped",
      ],
      schedule_category: [
        "hunt",
        "meal",
        "teaching",
        "rest",
        "travel",
        "special",
      ],
      trip_status: ["draft", "live", "past"],
      user_role: ["attendee", "staff", "founder", "admin"],
      vendor_role: [
        "lodge",
        "dog_handler",
        "photographer",
        "leather_goods",
        "speaker",
        "other",
      ],
    },
  },
} as const
