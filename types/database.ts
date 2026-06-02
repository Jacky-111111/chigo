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
          username_changed_at: string | null;
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
          username_changed_at?: string | null;
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
          visibility: "campus_public" | "friends_only" | "private_link";
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
          visibility?: "campus_public" | "friends_only" | "private_link";
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
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "rejected" | "blocked";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "rejected" | "blocked";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      open_seat_posts: {
        Row: {
          id: string;
          host_id: string;
          restaurant_id: string | null;
          location_label: string;
          available_seats: number;
          strangers_welcome: boolean;
          status: "open" | "closed" | "expired";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          restaurant_id?: string | null;
          location_label: string;
          available_seats: number;
          strangers_welcome?: boolean;
          status?: "open" | "closed" | "expired";
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["open_seat_posts"]["Insert"]
        >;
        Relationships: [];
      };
      meal_plans: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          note: string | null;
          status: "collecting_availability" | "confirmed" | "canceled";
          confirmed_restaurant_id: string | null;
          confirmed_start_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          note?: string | null;
          status?: "collecting_availability" | "confirmed" | "canceled";
          confirmed_restaurant_id?: string | null;
          confirmed_start_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meal_plans"]["Insert"]>;
        Relationships: [];
      };
      meal_plan_participants: {
        Row: {
          plan_id: string;
          user_id: string;
          role: "creator" | "participant";
          status: "invited" | "joined" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan_id: string;
          user_id: string;
          role?: "creator" | "participant";
          status?: "invited" | "joined" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["meal_plan_participants"]["Insert"]
        >;
        Relationships: [];
      };
      meal_plan_restaurant_candidates: {
        Row: {
          plan_id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: {
          plan_id: string;
          restaurant_id: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["meal_plan_restaurant_candidates"]["Insert"]
        >;
        Relationships: [];
      };
      meal_plan_time_slots: {
        Row: {
          id: string;
          plan_id: string;
          start_at: string;
          end_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          start_at: string;
          end_at: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["meal_plan_time_slots"]["Insert"]
        >;
        Relationships: [];
      };
      meal_plan_availability: {
        Row: {
          id: string;
          plan_id: string;
          time_slot_id: string;
          user_id: string;
          availability: "yes" | "maybe" | "no";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          time_slot_id: string;
          user_id: string;
          availability: "yes" | "maybe" | "no";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["meal_plan_availability"]["Insert"]
        >;
        Relationships: [];
      };
      chat_threads: {
        Row: {
          id: string;
          thread_type: "friend_group" | "dining_invite" | "meal_plan";
          title: string | null;
          created_by: string;
          dining_invite_id: string | null;
          meal_plan_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_type: "friend_group" | "dining_invite" | "meal_plan";
          title?: string | null;
          created_by: string;
          dining_invite_id?: string | null;
          meal_plan_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_threads"]["Insert"]>;
        Relationships: [];
      };
      chat_thread_members: {
        Row: {
          thread_id: string;
          user_id: string;
          role: "owner" | "member";
          status: "active" | "left" | "removed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          role?: "owner" | "member";
          status?: "active" | "left" | "removed";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["chat_thread_members"]["Insert"]
        >;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          body: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["chat_messages"]["Insert"]
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
export type Friendship = Database["public"]["Tables"]["friendships"]["Row"];
export type OpenSeatPost =
  Database["public"]["Tables"]["open_seat_posts"]["Row"];
export type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"];
export type MealPlanParticipant =
  Database["public"]["Tables"]["meal_plan_participants"]["Row"];
export type MealPlanRestaurantCandidate =
  Database["public"]["Tables"]["meal_plan_restaurant_candidates"]["Row"];
export type MealPlanTimeSlot =
  Database["public"]["Tables"]["meal_plan_time_slots"]["Row"];
export type MealPlanAvailability =
  Database["public"]["Tables"]["meal_plan_availability"]["Row"];
export type ChatThread = Database["public"]["Tables"]["chat_threads"]["Row"];
export type ChatThreadMember =
  Database["public"]["Tables"]["chat_thread_members"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
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
