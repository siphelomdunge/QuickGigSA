export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: 'worker' | 'client' | 'admin';
          location: string | null;
          profile_photo_url: string | null;
          created_at: string;
          updated_at: string;
          accepted_terms_at: string | null;
          terms_version: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: 'worker' | 'client' | 'admin';
          location?: string | null;
          profile_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
          accepted_terms_at?: string | null;
          terms_version?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      worker_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string | null;
          skills: string[];
          experience: string | null;
          transport_available: boolean;
          preferred_categories: string[];
          rating: number;
          verification_status: 'unverified' | 'pending' | 'verified';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          skills?: string[];
          experience?: string | null;
          transport_available?: boolean;
          preferred_categories?: string[];
          rating?: number;
          verification_status?: 'unverified' | 'pending' | 'verified';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['worker_profiles']['Insert']>;
      };
      client_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string | null;
          business_type: string | null;
          description: string | null;
          rating: number;
          verification_status: 'unverified' | 'pending' | 'verified';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name?: string | null;
          business_type?: string | null;
          description?: string | null;
          rating?: number;
          verification_status?: 'unverified' | 'pending' | 'verified';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_profiles']['Insert']>;
      };
      gigs: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string;
          category: string;
          location_area: string;
          date: string;
          start_time: string;
          end_time: string;
          pay_amount: number;
          workers_needed: number;
          requirements: string | null;
          status: 'open' | 'closed' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description: string;
          category: string;
          location_area: string;
          date: string;
          start_time: string;
          end_time: string;
          pay_amount: number;
          workers_needed: number;
          requirements?: string | null;
          status?: 'open' | 'closed' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gigs']['Insert']>;
      };
      gig_private_details: {
        Row: {
          gig_id: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          gig_id: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gig_private_details']['Insert']>;
      };
      applications: {
        Row: {
          id: string;
          gig_id: string;
          worker_id: string;
          message: string;
          status: 'pending' | 'accepted' | 'rejected' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gig_id: string;
          worker_id: string;
          message: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          application_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          gig_id: string;
          reviewer_id: string;
          reviewed_user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gig_id: string;
          reviewer_id: string;
          reviewed_user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          reported_by: string;
          reported_user_id: string | null;
          gig_id: string | null;
          reason: string;
          description: string | null;
          status: 'open' | 'investigating' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          reported_by: string;
          reported_user_id?: string | null;
          gig_id?: string | null;
          reason: string;
          description?: string | null;
          status?: 'open' | 'investigating' | 'resolved';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          full_name: string;
          location: string | null;
          profile_photo_url: string | null;
          role: 'worker' | 'client' | 'admin';
          created_at: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: 'worker' | 'client' | 'admin';
      verification_status: 'unverified' | 'pending' | 'verified';
      gig_status: 'open' | 'closed' | 'completed' | 'cancelled';
      application_status: 'pending' | 'accepted' | 'rejected' | 'completed';
      report_status: 'open' | 'investigating' | 'resolved';
    };
  };
}
