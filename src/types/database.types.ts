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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          value: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          value: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          value?: Json
        }
        Relationships: []
      }
      alert_prefs: {
        Row: {
          frost_enabled: boolean
          frost_threshold_c: number
          locale: string
          updated_at: string
          user_id: string
          water_dry_days: number
          water_enabled: boolean
        }
        Insert: {
          frost_enabled?: boolean
          frost_threshold_c?: number
          locale?: string
          updated_at?: string
          user_id: string
          water_dry_days?: number
          water_enabled?: boolean
        }
        Update: {
          frost_enabled?: boolean
          frost_threshold_c?: number
          locale?: string
          updated_at?: string
          user_id?: string
          water_dry_days?: number
          water_enabled?: boolean
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          condition: Json
          created_at: string
          garden_id: string | null
          id: string
          is_enabled: boolean
          last_fired_at: string | null
          name: string
          profile_id: string | null
        }
        Insert: {
          condition: Json
          created_at?: string
          garden_id?: string | null
          id?: string
          is_enabled?: boolean
          last_fired_at?: string | null
          name?: string
          profile_id?: string | null
        }
        Update: {
          condition?: Json
          created_at?: string
          garden_id?: string | null
          id?: string
          is_enabled?: boolean
          last_fired_at?: string | null
          name?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_garden_fk"
            columns: ["garden_id"]
            isOneToOne: false
            referencedRelation: "gardens"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          created_at: string | null
          hazard_id: string | null
          id: string
          message: string | null
          severity: number | null
          type: string | null
          user_id: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          hazard_id?: string | null
          id?: string
          message?: string | null
          severity?: number | null
          type?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          hazard_id?: string | null
          id?: string
          message?: string | null
          severity?: number | null
          type?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          id: number
          key_id: string
          route: string
          ts: string
        }
        Insert: {
          id?: number
          key_id: string
          route: string
          ts?: string
        }
        Update: {
          id?: number
          key_id?: string
          route?: string
          ts?: string
        }
        Relationships: []
      }
      crop_task_templates: {
        Row: {
          created_at: string | null
          crop_id: string | null
          id: string
          notes: string | null
          offset_days: number
          repeat_count: number | null
          repeat_every_days: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          crop_id?: string | null
          id?: string
          notes?: string | null
          offset_days?: number
          repeat_count?: number | null
          repeat_every_days?: number | null
          type: string
        }
        Update: {
          created_at?: string | null
          crop_id?: string | null
          id?: string
          notes?: string | null
          offset_days?: number
          repeat_count?: number | null
          repeat_every_days?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_task_templates_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          care: Json | null
          category: string | null
          created_at: string | null
          description: string | null
          frost_sensitive: boolean | null
          harvest: unknown
          id: string
          name: string
          scientific_name: string | null
          sowing: unknown
        }
        Insert: {
          care?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          frost_sensitive?: boolean | null
          harvest?: unknown
          id?: string
          name: string
          scientific_name?: string | null
          sowing?: unknown
        }
        Update: {
          care?: Json | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          frost_sensitive?: boolean | null
          harvest?: unknown
          id?: string
          name?: string
          scientific_name?: string | null
          sowing?: unknown
        }
        Relationships: []
      }
      gardens: {
        Row: {
          created_at: string | null
          id: string
          lat: number
          lon: number
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lat: number
          lon: number
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number
          lon?: number
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hazard_calendar: {
        Row: {
          hazard_id: string | null
          id: string
          month: number
          risk_level: number
        }
        Insert: {
          hazard_id?: string | null
          id?: string
          month: number
          risk_level: number
        }
        Update: {
          hazard_id?: string | null
          id?: string
          month?: number
          risk_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "hazard_calendar_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
        ]
      }
      hazard_hosts: {
        Row: {
          crop_id: string
          hazard_id: string
        }
        Insert: {
          crop_id: string
          hazard_id: string
        }
        Update: {
          crop_id?: string
          hazard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazard_hosts_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_hosts_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
        ]
      }
      hazard_reports: {
        Row: {
          created_at: string | null
          crop_id: string | null
          flagged_at: string | null
          flagged_by: string | null
          flagged_reason: string | null
          geom: unknown
          hazard_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          message: string | null
          note: string | null
          photo_url: string | null
          report_date: string | null
          severity: number | null
          status: string
          threat_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_reason?: string | null
          geom?: unknown
          hazard_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          note?: string | null
          photo_url?: string | null
          report_date?: string | null
          severity?: number | null
          status?: string
          threat_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          flagged_reason?: string | null
          geom?: unknown
          hazard_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          message?: string | null
          note?: string | null
          photo_url?: string | null
          report_date?: string | null
          severity?: number | null
          status?: string
          threat_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hazard_reports_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_reports_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_reports_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "threats"
            referencedColumns: ["id"]
          },
        ]
      }
      hazards: {
        Row: {
          common_name: string
          control: string | null
          created_at: string | null
          diagnosis: string | null
          id: string
          images: Json | null
          monitoring: string | null
          scientific_name: string | null
          summary: string | null
          type: string
        }
        Insert: {
          common_name: string
          control?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          images?: Json | null
          monitoring?: string | null
          scientific_name?: string | null
          summary?: string | null
          type: string
        }
        Update: {
          common_name?: string
          control?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          images?: Json | null
          monitoring?: string | null
          scientific_name?: string | null
          summary?: string | null
          type?: string
        }
        Relationships: []
      }
      insight_subscriptions: {
        Row: {
          active: boolean
          bbox_max_lat: number
          bbox_max_lng: number
          bbox_min_lat: number
          bbox_min_lng: number
          created_at: string | null
          days: number
          hazards: string[] | null
          id: string
          min_recent: number
          threshold_pct: number
          user_id: string
        }
        Insert: {
          active?: boolean
          bbox_max_lat: number
          bbox_max_lng: number
          bbox_min_lat: number
          bbox_min_lng: number
          created_at?: string | null
          days?: number
          hazards?: string[] | null
          id?: string
          min_recent?: number
          threshold_pct?: number
          user_id: string
        }
        Update: {
          active?: boolean
          bbox_max_lat?: number
          bbox_max_lng?: number
          bbox_min_lat?: number
          bbox_min_lng?: number
          created_at?: string | null
          days?: number
          hazards?: string[] | null
          id?: string
          min_recent?: number
          threshold_pct?: number
          user_id?: string
        }
        Relationships: []
      }
      library_item_embeddings: {
        Row: {
          embedding: string | null
          item_id: string
          updated_at: string
        }
        Insert: {
          embedding?: string | null
          item_id: string
          updated_at?: string
        }
        Update: {
          embedding?: string | null
          item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_item_embeddings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          content: string | null
          created_at: string
          id: string
          published: boolean | null
          slug: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          slug?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          published?: boolean | null
          slug?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_reindex_queue: {
        Row: {
          item_id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          item_id: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          item_id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          crop_id: string | null
          entry_date: string | null
          id: string
          photo_url: string | null
          text: string | null
          user_id: string | null
        }
        Insert: {
          crop_id?: string | null
          entry_date?: string | null
          id?: string
          photo_url?: string | null
          text?: string | null
          user_id?: string | null
        }
        Update: {
          crop_id?: string | null
          entry_date?: string | null
          id?: string
          photo_url?: string | null
          text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          created_at: string
          dedup_key: string
          id: number
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dedup_key: string
          id?: number
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          dedup_key?: string
          id?: number
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      observations: {
        Row: {
          created_at: string | null
          description: string | null
          diagnosis: string | null
          disease_id: string | null
          garden_id: string | null
          id: string
          lat: number
          lng: number
          pest_id: string | null
          photo_url: string | null
          plant: string | null
          status: string | null
          symptoms_text: string
          taken_at: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          diagnosis?: string | null
          disease_id?: string | null
          garden_id?: string | null
          id?: string
          lat: number
          lng: number
          pest_id?: string | null
          photo_url?: string | null
          plant?: string | null
          status?: string | null
          symptoms_text?: string
          taken_at?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          diagnosis?: string | null
          disease_id?: string | null
          garden_id?: string | null
          id?: string
          lat?: number
          lng?: number
          pest_id?: string | null
          photo_url?: string | null
          plant?: string | null
          status?: string | null
          symptoms_text?: string
          taken_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_garden_id_fkey"
            columns: ["garden_id"]
            isOneToOne: false
            referencedRelation: "gardens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_pest_id_fkey"
            columns: ["pest_id"]
            isOneToOne: false
            referencedRelation: "pests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pest_images: {
        Row: {
          alt: string | null
          created_at: string | null
          id: string
          path: string
          pest_id: string | null
        }
        Insert: {
          alt?: string | null
          created_at?: string | null
          id?: string
          path: string
          pest_id?: string | null
        }
        Update: {
          alt?: string | null
          created_at?: string | null
          id?: string
          path?: string
          pest_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pest_images_pest_id_fkey"
            columns: ["pest_id"]
            isOneToOne: false
            referencedRelation: "pests"
            referencedColumns: ["id"]
          },
        ]
      }
      pests: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          host_plants: string[] | null
          id: string
          latin_name: string | null
          name: string
          severity: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          host_plants?: string[] | null
          id?: string
          latin_name?: string | null
          name: string
          severity?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          host_plants?: string[] | null
          id?: string
          latin_name?: string | null
          name?: string
          severity?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          language: string | null
          latitude: number | null
          longitude: number | null
          subscription_plan: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          language?: string | null
          latitude?: number | null
          longitude?: number | null
          subscription_plan?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          language?: string | null
          latitude?: number | null
          longitude?: number | null
          subscription_plan?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          crop_id: string | null
          due_date: string
          id: string
          notes: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id?: string | null
          due_date: string
          id?: string
          notes?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_crops: {
        Row: {
          crop_id: string
          impact_notes: string | null
          threat_id: string
        }
        Insert: {
          crop_id: string
          impact_notes?: string | null
          threat_id: string
        }
        Update: {
          crop_id?: string
          impact_notes?: string | null
          threat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_crops_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "threats"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          path: string
          source_url: string | null
          threat_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          path: string
          source_url?: string | null
          threat_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          path?: string
          source_url?: string | null
          threat_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_images_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "threats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_symptoms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          severity: number | null
          stage: string | null
          threat_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          severity?: number | null
          stage?: string | null
          threat_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          severity?: number | null
          stage?: string | null
          threat_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_symptoms_threat_id_fkey"
            columns: ["threat_id"]
            isOneToOne: false
            referencedRelation: "threats"
            referencedColumns: ["id"]
          },
        ]
      }
      threats: {
        Row: {
          category: Database["public"]["Enums"]["threat_category"]
          created_at: string
          created_by: string | null
          description_md: string | null
          id: string
          life_cycle_md: string | null
          management_md: string | null
          name_common: string
          name_latin: string | null
          severity_max: number | null
          severity_min: number | null
          slug: string | null
          summary: string | null
          type: Database["public"]["Enums"]["threat_type"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["threat_category"]
          created_at?: string
          created_by?: string | null
          description_md?: string | null
          id?: string
          life_cycle_md?: string | null
          management_md?: string | null
          name_common: string
          name_latin?: string | null
          severity_max?: number | null
          severity_min?: number | null
          slug?: string | null
          summary?: string | null
          type: Database["public"]["Enums"]["threat_type"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["threat_category"]
          created_at?: string
          created_by?: string | null
          description_md?: string | null
          id?: string
          life_cycle_md?: string | null
          management_md?: string | null
          name_common?: string
          name_latin?: string | null
          severity_max?: number | null
          severity_min?: number | null
          slug?: string | null
          summary?: string | null
          type?: Database["public"]["Enums"]["threat_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_crops: {
        Row: {
          created_at: string | null
          crop_id: string | null
          id: string
          location_note: string | null
          notes: string | null
          planted_on: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          crop_id?: string | null
          id?: string
          location_note?: string | null
          notes?: string | null
          planted_on?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          crop_id?: string | null
          id?: string
          location_note?: string | null
          notes?: string | null
          planted_on?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          et0_threshold_mm: number | null
          hot_day_c: number | null
          rain_skip_mm: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          et0_threshold_mm?: number | null
          hot_day_c?: number | null
          rain_skip_mm?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          et0_threshold_mm?: number | null
          hot_day_c?: number | null
          rain_skip_mm?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string | null
          hazard_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hazard_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hazard_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_history: {
        Row: {
          created_at: string | null
          date: string
          et0_mm: number | null
          id: string
          latitude: number | null
          longitude: number | null
          precipitation_mm: number | null
          should_water: boolean | null
          source: string | null
          tmax_c: number | null
          tmin_c: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          et0_mm?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          precipitation_mm?: number | null
          should_water?: boolean | null
          source?: string | null
          tmax_c?: number | null
          tmin_c?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          et0_mm?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          precipitation_mm?: number | null
          should_water?: boolean | null
          source?: string | null
          tmax_c?: number | null
          tmin_c?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      weather_hourly: {
        Row: {
          created_at: string | null
          garden_id: string | null
          id: string
          precipitation_mm: number | null
          temperature_c: number | null
          time: string
          wind_ms: number | null
        }
        Insert: {
          created_at?: string | null
          garden_id?: string | null
          id?: string
          precipitation_mm?: number | null
          temperature_c?: number | null
          time: string
          wind_ms?: number | null
        }
        Update: {
          created_at?: string | null
          garden_id?: string | null
          id?: string
          precipitation_mm?: number | null
          temperature_c?: number | null
          time?: string
          wind_ms?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      analytics_daily_counts: {
        Row: {
          count: number | null
          observed_date: string | null
          type: string | null
        }
        Relationships: []
      }
      analytics_observations: {
        Row: {
          created_at: string | null
          crop: string | null
          id: string | null
          observed_date: string | null
          observed_month: string | null
          observed_week: string | null
          severity: number | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          crop?: never
          id?: string | null
          observed_date?: never
          observed_month?: never
          observed_week?: never
          severity?: never
          type?: never
        }
        Update: {
          created_at?: string | null
          crop?: never
          id?: string | null
          observed_date?: never
          observed_month?: never
          observed_week?: never
          severity?: never
          type?: never
        }
        Relationships: []
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      ai_cache_get: { Args: { p_key: string }; Returns: Json }
      ai_cache_set: {
        Args: { p_key: string; p_ttl_seconds: number; p_value: Json }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_key_id: string
          p_limit: number
          p_route: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
        }[]
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      insert_pest_image: {
        Args: { alt: string; path: string; pest_id: string }
        Returns: undefined
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      match_library_items: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          item_id: string
          similarity: number
        }[]
      }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      rpc_analytics_breakdown: {
        Args: { dim: string; end_date: string; start_date: string }
        Returns: {
          count: number
          label: string
        }[]
      }
      rpc_analytics_kpis: {
        Args: { end_date: string; start_date: string }
        Returns: {
          last24h: number
          total: number
          unique_crops: number
          unique_types: number
        }[]
      }
      rpc_analytics_refresh: { Args: never; Returns: undefined }
      rpc_analytics_timeseries: {
        Args: {
          crop_filter?: string
          end_date: string
          start_date: string
          type_filter?: string
        }
        Returns: {
          count: number
          observed_date: string
        }[]
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      threat_category:
        | "insect"
        | "mite"
        | "nematode"
        | "weed"
        | "fungus"
        | "bacteria"
        | "virus"
        | "physiological"
        | "other"
      threat_type: "pest" | "disease"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      threat_category: [
        "insect",
        "mite",
        "nematode",
        "weed",
        "fungus",
        "bacteria",
        "virus",
        "physiological",
        "other",
      ],
      threat_type: ["pest", "disease"],
    },
  },
} as const
