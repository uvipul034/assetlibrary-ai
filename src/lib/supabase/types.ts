// =============================================================================
// Supabase Database Types (manually defined to match 001_initial_schema.sql)
// =============================================================================
// These types mirror the exact schema from our migration file.
// In production, you'd generate these with `supabase gen types typescript`.
// We define them manually here for zero external dependency during build.
// =============================================================================

export type UserRole = "admin" | "manager" | "editor";
export type AssetStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          title: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          status: AssetStatus;
          alt_text: string | null;
          uploaded_by: string;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          status?: AssetStatus;
          alt_text?: string | null;
          uploaded_by: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          status?: AssetStatus;
          alt_text?: string | null;
          uploaded_by?: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      asset_tags: {
        Row: {
          id: string;
          asset_id: string;
          tag_name: string;
          confidence_score: number;
          is_ai_generated: boolean;
        };
        Insert: {
          id?: string;
          asset_id: string;
          tag_name: string;
          confidence_score: number;
          is_ai_generated?: boolean;
        };
        Update: {
          id?: string;
          asset_id?: string;
          tag_name?: string;
          confidence_score?: number;
          is_ai_generated?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "asset_tags_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      approval_logs: {
        Row: {
          id: string;
          asset_id: string;
          actioned_by: string;
          status_to: AssetStatus;
          comments: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          actioned_by: string;
          status_to: AssetStatus;
          comments?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          actioned_by?: string;
          status_to?: AssetStatus;
          comments?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approval_logs_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approval_logs_actioned_by_fkey";
            columns: ["actioned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      asset_status: AssetStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
