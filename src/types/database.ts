export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          show_idea: string;
          genre: string;
          format: "tv_series" | "feature_film" | "custom";
          status: "draft" | "active" | "archived";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          show_idea: string;
          genre: string;
          format: "tv_series" | "feature_film" | "custom";
          status?: "draft" | "active" | "archived";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          show_idea?: string;
          genre?: string;
          format?: "tv_series" | "feature_film" | "custom";
          status?: "draft" | "active" | "archived";
          created_by?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "editor" | "viewer";
        };
      };
      agents: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          role: string;
          expertise: string;
          personality_traits: string[];
          writing_style: string;
          avatar_color: string;
          model_override: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          role: string;
          expertise: string;
          personality_traits?: string[];
          writing_style?: string;
          avatar_color?: string;
          model_override?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          role?: string;
          expertise?: string;
          personality_traits?: string[];
          writing_style?: string;
          avatar_color?: string;
          model_override?: string | null;
          is_active?: boolean;
        };
      };
      characters: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          role: string;
          color_hex: string;
          bio: Json;
          motivations: string;
          flaws: string;
          arc: string;
          position_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          role?: string;
          color_hex?: string;
          bio?: Json;
          motivations?: string;
          flaws?: string;
          arc?: string;
          position_index?: number;
        };
        Update: {
          name?: string;
          role?: string;
          color_hex?: string;
          bio?: Json;
          motivations?: string;
          flaws?: string;
          arc?: string;
          position_index?: number;
        };
      };
      relationships: {
        Row: {
          id: string;
          project_id: string;
          character_a_id: string;
          character_b_id: string;
          label: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          character_a_id: string;
          character_b_id: string;
          label: string;
          description?: string;
        };
        Update: {
          label?: string;
          description?: string;
        };
      };
      episodes: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          episode_number: number;
          synopsis: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          episode_number: number;
          synopsis?: string;
          sort_order?: number;
        };
        Update: {
          title?: string;
          episode_number?: number;
          synopsis?: string;
          sort_order?: number;
        };
      };
      acts: {
        Row: {
          id: string;
          episode_id: string;
          title: string;
          act_number: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          title: string;
          act_number: number;
          sort_order?: number;
        };
        Update: {
          title?: string;
          act_number?: number;
          sort_order?: number;
        };
      };
      beats: {
        Row: {
          id: string;
          act_id: string;
          character_id: string;
          title: string;
          content: string;
          emotion_core: string | null;
          emotion_sub: string | null;
          position_index: number;
          type: "plot" | "emotion";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          act_id: string;
          character_id: string;
          title: string;
          content?: string;
          emotion_core?: string | null;
          emotion_sub?: string | null;
          position_index?: number;
          type?: "plot" | "emotion";
        };
        Update: {
          title?: string;
          content?: string;
          emotion_core?: string | null;
          emotion_sub?: string | null;
          position_index?: number;
          type?: "plot" | "emotion";
          character_id?: string;
          act_id?: string;
        };
      };
      discussions: {
        Row: {
          id: string;
          project_id: string;
          topic: string;
          max_rounds: number;
          current_round: number;
          status: "pending" | "running" | "paused" | "completed";
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          topic: string;
          max_rounds?: number;
          current_round?: number;
          status?: "pending" | "running" | "paused" | "completed";
          summary?: string | null;
        };
        Update: {
          topic?: string;
          max_rounds?: number;
          current_round?: number;
          status?: "pending" | "running" | "paused" | "completed";
          summary?: string | null;
        };
      };
      discussion_messages: {
        Row: {
          id: string;
          discussion_id: string;
          agent_id: string | null;
          round_number: number;
          turn_order: number;
          role: "agent" | "showrunner" | "system";
          content: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          agent_id?: string | null;
          round_number: number;
          turn_order: number;
          role: "agent" | "showrunner" | "system";
          content: string;
          metadata?: Json;
        };
        Update: {
          content?: string;
          metadata?: Json;
        };
      };
      proposals: {
        Row: {
          id: string;
          discussion_id: string;
          category: string;
          title: string;
          description: string;
          proposed_content: Json;
          status: "pending" | "approved" | "rejected" | "modified";
          user_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          category: string;
          title: string;
          description: string;
          proposed_content?: Json;
          status?: "pending" | "approved" | "rejected" | "modified";
          user_notes?: string | null;
        };
        Update: {
          status?: "pending" | "approved" | "rejected" | "modified";
          user_notes?: string | null;
          proposed_content?: Json;
        };
      };
      memory_index: {
        Row: {
          id: string;
          project_id: string;
          category: string;
          keywords: string[];
          summary: string;
          source_discussion_id: string | null;
          source_round: number | null;
          importance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: string;
          keywords?: string[];
          summary: string;
          source_discussion_id?: string | null;
          source_round?: number | null;
          importance?: number;
        };
        Update: {
          category?: string;
          keywords?: string[];
          summary?: string;
          importance?: number;
        };
      };
      show_bible_sections: {
        Row: {
          id: string;
          project_id: string;
          section_type: string;
          title: string;
          content: Json;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          section_type: string;
          title: string;
          content?: Json;
          sort_order?: number;
        };
        Update: {
          section_type?: string;
          title?: string;
          content?: Json;
          sort_order?: number;
        };
      };
      bible_versions: {
        Row: {
          id: string;
          bible_id: string;
          content: Json;
          changed_by_agent_id: string | null;
          change_summary: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bible_id: string;
          content: Json;
          changed_by_agent_id?: string | null;
          change_summary: string;
        };
        Update: {
          content?: Json;
          change_summary?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          model_config: Json;
          default_round_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          model_config?: Json;
          default_round_count?: number;
        };
        Update: {
          model_config?: Json;
          default_round_count?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
