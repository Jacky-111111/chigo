export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Update: Partial<
          Database["public"]["Tables"]["user_dining_preferences"]["Insert"]
        >;
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
        Update: Partial<
          Database["public"]["Tables"]["dining_invites"]["Insert"]
        >;
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
        Update: Partial<
          Database["public"]["Tables"]["dining_invite_participants"]["Insert"]
        >;
        Relationships: [];
      };
      menu_uploads: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string | null;
          image_url: string;
          status: "uploaded" | "processing" | "completed" | "failed";
          source_language: string | null;
          target_language: string;
          extracted_text: string | null;
          ai_provider: string | null;
          ai_model: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id?: string | null;
          image_url: string;
          status?: "uploaded" | "processing" | "completed" | "failed";
          source_language?: string | null;
          target_language?: string;
          extracted_text?: string | null;
          ai_provider?: string | null;
          ai_model?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_uploads"]["Insert"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          menu_upload_id: string;
          original_name: string;
          translated_name: string | null;
          description: string | null;
          ingredients: string[];
          cooking_method: string | null;
          cuisine_context: string | null;
          dietary_warnings: string[];
          recommendation_score: number | null;
          recommendation_reason: string | null;
          confidence: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_upload_id: string;
          original_name: string;
          translated_name?: string | null;
          description?: string | null;
          ingredients?: string[];
          cooking_method?: string | null;
          cuisine_context?: string | null;
          dietary_warnings?: string[];
          recommendation_score?: number | null;
          recommendation_reason?: string | null;
          confidence?: number | null;
          sort_order: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
        Relationships: [];
      };
      menu_feedback: {
        Row: {
          id: string;
          user_id: string;
          menu_item_id: string;
          feedback_type:
            | "incorrect_translation"
            | "wrong_ingredients"
            | "allergy_risk"
            | "other";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          menu_item_id: string;
          feedback_type:
            | "incorrect_translation"
            | "wrong_ingredients"
            | "allergy_risk"
            | "other";
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["menu_feedback"]["Insert"]
        >;
        Relationships: [];
      };
      nutrition_goals: {
        Row: {
          user_id: string;
          daily_calorie_target: number | null;
          daily_protein_target_g: number | null;
          goal_type:
            | "balanced"
            | "high_protein"
            | "weight_loss"
            | "maintenance"
            | "custom"
            | null;
          custom_goal_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          daily_calorie_target?: number | null;
          daily_protein_target_g?: number | null;
          goal_type?:
            | "balanced"
            | "high_protein"
            | "weight_loss"
            | "maintenance"
            | "custom"
            | null;
          custom_goal_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["nutrition_goals"]["Insert"]
        >;
        Relationships: [];
      };
      meal_logs: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string | null;
          menu_item_id: string | null;
          meal_name: string;
          photo_url: string | null;
          eaten_at: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id?: string | null;
          menu_item_id?: string | null;
          meal_name: string;
          photo_url?: string | null;
          eaten_at: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_logs"]["Insert"]>;
        Relationships: [];
      };
      meal_nutrition_estimates: {
        Row: {
          meal_log_id: string;
          calories: number | null;
          protein_g: number | null;
          fat_g: number | null;
          carbs_g: number | null;
          confidence: number | null;
          ai_provider: string | null;
          ai_model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          meal_log_id: string;
          calories?: number | null;
          protein_g?: number | null;
          fat_g?: number | null;
          carbs_g?: number | null;
          confidence?: number | null;
          ai_provider?: string | null;
          ai_model?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["meal_nutrition_estimates"]["Insert"]
        >;
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
export type DiningPreference =
  Database["public"]["Tables"]["user_dining_preferences"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type DiningInvite =
  Database["public"]["Tables"]["dining_invites"]["Row"];
export type DiningInviteParticipant =
  Database["public"]["Tables"]["dining_invite_participants"]["Row"];
export type MenuUpload = Database["public"]["Tables"]["menu_uploads"]["Row"];
export type MenuUploadStatus = MenuUpload["status"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type MenuFeedback = Database["public"]["Tables"]["menu_feedback"]["Row"];
export type MenuFeedbackType = MenuFeedback["feedback_type"];
export type NutritionGoal =
  Database["public"]["Tables"]["nutrition_goals"]["Row"];
export type NutritionGoalType = NonNullable<NutritionGoal["goal_type"]>;
export type MealLog = Database["public"]["Tables"]["meal_logs"]["Row"];
export type MealNutritionEstimate =
  Database["public"]["Tables"]["meal_nutrition_estimates"]["Row"];
