export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          university: string;
          bio: string | null;
          instagram_handle: string | null;
          avatar_url: string | null;
          profile_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          university?: string;
          bio?: string | null;
          instagram_handle?: string | null;
          avatar_url?: string | null;
          profile_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_dining_preferences: {
        Row: {
          user_id: string;
          dietary_restrictions: string[];
          allergies: string[];
          favorite_cuisines: string[];
          typical_meal_times: string[];
          social_preference: "open_to_invites" | "friends_only" | "private";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          dietary_restrictions?: string[];
          allergies?: string[];
          favorite_cuisines?: string[];
          typical_meal_times?: string[];
          social_preference?: "open_to_invites" | "friends_only" | "private";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_dining_preferences"]["Insert"]>;
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          cuisine: string | null;
          address: string;
          latitude: number;
          longitude: number;
          price_level: number | null;
          photo_url: string | null;
          google_maps_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cuisine?: string | null;
          address: string;
          latitude: number;
          longitude: number;
          price_level?: number | null;
          photo_url?: string | null;
          google_maps_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>;
        Relationships: [];
      };
      dining_invites: {
        Row: {
          id: string;
          host_id: string;
          restaurant_id: string;
          start_at: string;
          expires_at: string;
          max_participants: number;
          message: string | null;
          visibility: "campus_public";
          status: "open" | "full" | "canceled" | "completed" | "expired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          restaurant_id: string;
          start_at: string;
          expires_at: string;
          max_participants: number;
          message?: string | null;
          visibility?: "campus_public";
          status?: "open" | "full" | "canceled" | "completed" | "expired";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dining_invites"]["Insert"]>;
        Relationships: [];
      };
      dining_invite_participants: {
        Row: {
          id: string;
          invite_id: string;
          user_id: string;
          role: "host" | "participant";
          status: "joined" | "left";
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          invite_id: string;
          user_id: string;
          role?: "host" | "participant";
          status?: "joined" | "left";
          joined_at?: string;
          left_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dining_invite_participants"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DiningPreference = Database["public"]["Tables"]["user_dining_preferences"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type DiningInvite = Database["public"]["Tables"]["dining_invites"]["Row"];
export type DiningInviteParticipant =
  Database["public"]["Tables"]["dining_invite_participants"]["Row"];
