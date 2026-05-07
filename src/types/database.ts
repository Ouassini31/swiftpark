export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "driver" | "admin";
export type SpotStatus = "available" | "reserved" | "completed" | "cancelled" | "expired";
export type TransactionType = "earn" | "spend" | "commission" | "refund" | "bonus";
export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";
export type ValidationStatus = "pending" | "validated" | "failed" | "disputed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          coin_balance: number;
          coins_earned: number;
          coins_spent: number;
          spots_shared: number;
          spots_found: number;
          rating: number | null;
          rating_count: number;
          preferred_lat: number | null;
          preferred_lng: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          coin_balance?: number;
          coins_earned?: number;
          coins_spent?: number;
          spots_shared?: number;
          spots_found?: number;
          rating?: number | null;
          rating_count?: number;
          preferred_lat?: number | null;
          preferred_lng?: number | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          coin_balance?: number;
          coins_earned?: number;
          coins_spent?: number;
          spots_shared?: number;
          spots_found?: number;
          rating?: number | null;
          rating_count?: number;
          preferred_lat?: number | null;
          preferred_lng?: number | null;
          is_active?: boolean;
        };
      };
      parking_spots: {
        Row: {
          id: string;
          sharer_id: string;
          location: unknown;
          lat: number;
          lng: number;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          status: SpotStatus;
          coin_price: number;
          description: string | null;
          is_covered: boolean | null;
          is_handicap: boolean | null;
          vehicle_type: string | null;
          available_at: string;
          expires_at: string;
          validation_status: ValidationStatus;
          sharer_validated: boolean | null;
          finder_validated: boolean | null;
          sharer_gps_lat: number | null;
          sharer_gps_lng: number | null;
          finder_gps_lat: number | null;
          finder_gps_lng: number | null;
          validated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          sharer_id: string;
          location?: unknown;
          lat: number;
          lng: number;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          status?: SpotStatus;
          coin_price: number;
          description?: string | null;
          is_covered?: boolean | null;
          is_handicap?: boolean | null;
          vehicle_type?: string | null;
          available_at?: string;
          expires_at: string;
          validation_status?: ValidationStatus;
        };
        Update: {
          status?: SpotStatus;
          coin_price?: number;
          description?: string | null;
          is_covered?: boolean | null;
          is_handicap?: boolean | null;
          vehicle_type?: string | null;
          expires_at?: string;
          validation_status?: ValidationStatus;
          sharer_validated?: boolean | null;
          finder_validated?: boolean | null;
          sharer_gps_lat?: number | null;
          sharer_gps_lng?: number | null;
          finder_gps_lat?: number | null;
          finder_gps_lng?: number | null;
          validated_at?: string | null;
        };
      };
      reservations: {
        Row: {
          id: string;
          spot_id: string;
          finder_id: string;
          sharer_id: string;
          status: SpotStatus;
          coin_amount: number;
          commission: number;
          sharer_receive: number;
          reserved_at: string;
          confirmed_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          expires_at: string;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          spot_id: string;
          finder_id: string;
          sharer_id: string;
          status?: SpotStatus;
          coin_amount: number;
          commission: number;
          sharer_receive: number;
          expires_at: string;
          cancel_reason?: string | null;
        };
        Update: {
          status?: SpotStatus;
          confirmed_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
        };
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          reservation_id: string | null;
          type: TransactionType;
          status: TransactionStatus;
          amount: number;
          balance_after: number;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          reservation_id?: string | null;
          type: TransactionType;
          status?: TransactionStatus;
          amount: number;
          balance_after?: number;
          description: string;
          metadata?: Json;
        };
        Update: {
          status?: TransactionStatus;
        };
      };
      gps_validations: {
        Row: {
          id: string;
          reservation_id: string;
          user_id: string;
          role: "sharer" | "finder";
          lat: number;
          lng: number;
          accuracy: number | null;
          distance_to_spot: number | null;
          is_valid: boolean;
          validated_at: string;
        };
        Insert: {
          reservation_id: string;
          user_id: string;
          role: "sharer" | "finder";
          lat: number;
          lng: number;
          accuracy?: number | null;
          distance_to_spot?: number | null;
          is_valid: boolean;
        };
        Update: {
          is_valid?: boolean;
        };
      };
      ratings: {
        Row: {
          id: string;
          reservation_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          reservation_id: string;
          rater_id: string;
          rated_id: string;
          score: number;
          comment?: string | null;
        };
        Update: {
          comment?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          reservation_id: string | null;
          type: string;
          title: string;
          body: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          reservation_id?: string | null;
          type: string;
          title: string;
          body: string;
          data?: Json;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
    };
    Views: {
      daily_transactions: {
        Row: {
          day: string;
          volume_sc: number;
          commission_sc: number;
          purchases: number;
        };
      };
      daily_reservations: {
        Row: {
          day: string;
          completed: number;
          cancelled: number;
          active: number;
        };
      };
      admin_reservations: {
        Row: {
          id: string;
          finder_name: string | null;
          finder_username: string | null;
          sharer_name: string | null;
          sharer_username: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          status: string;
          coin_amount: number;
        };
      };
      active_spots_detail: {
        Row: {
          id: string;
          address: string | null;
          city: string | null;
          lat: number;
          lng: number;
          coin_price: number;
          vehicle_type: string | null;
          is_covered: boolean | null;
          is_handicap: boolean | null;
          expires_at: string;
          status: string;
          sharer_name: string | null;
          sharer_username: string | null;
          sharer_rating: number | null;
        };
      };
      top_sharers: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          spots_shared: number;
          coins_earned: number;
          rating: number | null;
        };
      };
      top_finders: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          spots_found: number;
          coins_spent: number;
          rating: number | null;
        };
      };
    };
    Functions: {
      process_coin_transaction: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: TransactionType;
          p_description: string;
          p_reservation_id?: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      admin_get_kpis: {
        Args: Record<string, never>;
        Returns: {
          users_total: number;
          users_today: number;
          spots_active: number;
          spots_today: number;
          reservations_total: number;
          reservations_today: number;
          completed_today: number;
          revenue_sc_today: number;
          revenue_sc_month: number;
          coins_circulating: number;
        };
      };
      expire_old_spots: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
