export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Explicit Insert/Update types (no circular Partial<Database[...]>) ──────────

type SettingsRow = {
  id: number;
  brand_name: string | null;
  logo_url: string | null;
  brevo_api_key: string | null;
  google_search_api_key: string | null;
  google_search_engine_id: string | null;
  groq_api_key: string | null;
  signature_name: string | null;
  signature_title: string | null;
  signature_text: string | null;
  signature_image_url: string | null;
  website_url: string | null;
  updated_at: string | null;
};

type AppSettingsRow = {
  id: number;
  default_daily_email_limit: number | null;
  updated_at: string | null;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          company: string | null;
          phone: string | null;
          description: string | null;
          logo_url: string | null;
          default_logo_url: string | null;
          signature_url: string | null;
          brand_color: string | null;
          plan: string | null;
          is_admin: boolean | null;
          active_smtp: string | null;
          brevo_api_key: string | null;
          brevo_keys: Json | null;
          mailgun_api_key: string | null;
          mailgun_domain: string | null;
          sendgrid_api_key: string | null;
          smtp_host: string | null;
          smtp_port: number | null;
          smtp_user: string | null;
          smtp_pass: string | null;
          smtp_secure: boolean | null;
          email_daily_limit: number | null;
          emails_sent_today: number | null;
          last_send_reset: string | null;
          wa_session_dir: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string | null;
          company?: string | null;
          phone?: string | null;
          description?: string | null;
          logo_url?: string | null;
          default_logo_url?: string | null;
          signature_url?: string | null;
          brand_color?: string | null;
          plan?: string | null;
          is_admin?: boolean | null;
          active_smtp?: string | null;
          brevo_api_key?: string | null;
          brevo_keys?: Json | null;
          mailgun_api_key?: string | null;
          mailgun_domain?: string | null;
          sendgrid_api_key?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_pass?: string | null;
          smtp_secure?: boolean | null;
          email_daily_limit?: number | null;
          emails_sent_today?: number | null;
          last_send_reset?: string | null;
          wa_session_dir?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          company?: string | null;
          phone?: string | null;
          description?: string | null;
          logo_url?: string | null;
          default_logo_url?: string | null;
          signature_url?: string | null;
          brand_color?: string | null;
          plan?: string | null;
          is_admin?: boolean | null;
          active_smtp?: string | null;
          brevo_api_key?: string | null;
          brevo_keys?: Json | null;
          mailgun_api_key?: string | null;
          mailgun_domain?: string | null;
          sendgrid_api_key?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_pass?: string | null;
          smtp_secure?: boolean | null;
          email_daily_limit?: number | null;
          emails_sent_today?: number | null;
          last_send_reset?: string | null;
          wa_session_dir?: string | null;
          updated_at?: string | null;
        };
      };
      app_users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          brand_name: string | null;
          brand_logo_url: string | null;
          signature_image_url: string | null;
          signature_name: string | null;
          signature_text: string | null;
          signature_title: string | null;
          website_url: string | null;
          socials: Json | null;
          role: string | null;
          status: string | null;
          suspend_reason: string | null;
          suspend_requirements: string | null;
          review_request: string | null;
          daily_email_limit: number | null;
          brevo_api_key: string | null;
          google_search_api_key: string | null;
          google_search_engine_id: string | null;
          created_at: string | null;
        };
        Insert: {
          auth_user_id?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          brand_name?: string | null;
          brand_logo_url?: string | null;
          signature_image_url?: string | null;
          signature_name?: string | null;
          signature_text?: string | null;
          signature_title?: string | null;
          website_url?: string | null;
          socials?: Json | null;
          role?: string | null;
          status?: string | null;
          suspend_reason?: string | null;
          suspend_requirements?: string | null;
          review_request?: string | null;
          daily_email_limit?: number | null;
          brevo_api_key?: string | null;
          google_search_api_key?: string | null;
          google_search_engine_id?: string | null;
        };
        Update: {
          auth_user_id?: string | null;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          brand_name?: string | null;
          brand_logo_url?: string | null;
          signature_image_url?: string | null;
          signature_name?: string | null;
          signature_text?: string | null;
          signature_title?: string | null;
          website_url?: string | null;
          socials?: Json | null;
          role?: string | null;
          status?: string | null;
          suspend_reason?: string | null;
          suspend_requirements?: string | null;
          review_request?: string | null;
          daily_email_limit?: number | null;
          brevo_api_key?: string | null;
          google_search_api_key?: string | null;
          google_search_engine_id?: string | null;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string | null;
          campaign_id: string | null;
          business_name: string | null;
          email: string | null;
          phone: string | null;
          social_urls: Json | null;
          opted_out: boolean | null;
          whatsapp_valid: boolean | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          campaign_id?: string | null;
          business_name?: string | null;
          email?: string | null;
          phone?: string | null;
          social_urls?: Json | null;
          opted_out?: boolean | null;
          whatsapp_valid?: boolean | null;
        };
        Update: {
          user_id?: string | null;
          campaign_id?: string | null;
          business_name?: string | null;
          email?: string | null;
          phone?: string | null;
          social_urls?: Json | null;
          opted_out?: boolean | null;
          whatsapp_valid?: boolean | null;
        };
      };
      lead_batches: {
        Row: {
          id: number;
          user_id: string | null;
          darapet_id: string | null;
          niche: string | null;
          country: string | null;
          target_type: string | null;
          requested_count: number | null;
          found_count: number | null;
          source: string | null;
          status: string | null;
          error_message: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          darapet_id?: string | null;
          niche?: string | null;
          country?: string | null;
          target_type?: string | null;
          requested_count?: number | null;
          found_count?: number | null;
          source?: string | null;
          status?: string | null;
          error_message?: string | null;
        };
        Update: {
          user_id?: string | null;
          darapet_id?: string | null;
          niche?: string | null;
          country?: string | null;
          target_type?: string | null;
          requested_count?: number | null;
          found_count?: number | null;
          source?: string | null;
          status?: string | null;
          error_message?: string | null;
        };
      };
      darapet_leads: {
        Row: {
          id: number;
          batch_id: number | null;
          email: string | null;
          social_name: string | null;
          social_platform: string | null;
          social_url: string | null;
          source_url: string | null;
          created_at: string | null;
        };
        Insert: {
          batch_id?: number | null;
          email?: string | null;
          social_name?: string | null;
          social_platform?: string | null;
          social_url?: string | null;
          source_url?: string | null;
        };
        Update: {
          batch_id?: number | null;
          email?: string | null;
          social_name?: string | null;
          social_platform?: string | null;
          social_url?: string | null;
          source_url?: string | null;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          status: string | null;
          template_id: string | null;
          subject: string | null;
          body: string | null;
          schedule_at: string | null;
          sent_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          name?: string | null;
          status?: string | null;
          template_id?: string | null;
          subject?: string | null;
          body?: string | null;
          schedule_at?: string | null;
          sent_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          name?: string | null;
          status?: string | null;
          template_id?: string | null;
          subject?: string | null;
          body?: string | null;
          schedule_at?: string | null;
          sent_at?: string | null;
          updated_at?: string | null;
        };
      };
      email_sends: {
        Row: {
          id: string;
          user_id: string | null;
          campaign_id: string | null;
          lead_id: string | null;
          to_email: string | null;
          subject: string | null;
          template_id: string | null;
          provider: string | null;
          status: string | null;
          error_msg: string | null;
          sent_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          campaign_id?: string | null;
          lead_id?: string | null;
          to_email?: string | null;
          subject?: string | null;
          template_id?: string | null;
          provider?: string | null;
          status?: string | null;
          error_msg?: string | null;
          sent_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          campaign_id?: string | null;
          lead_id?: string | null;
          to_email?: string | null;
          subject?: string | null;
          template_id?: string | null;
          provider?: string | null;
          status?: string | null;
          error_msg?: string | null;
          sent_at?: string | null;
        };
      };
      email_templates: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          subject: string | null;
          body: string | null;
          logo_url: string | null;
          signature_url: string | null;
          is_default: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          name?: string | null;
          subject?: string | null;
          body?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          is_default?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          name?: string | null;
          subject?: string | null;
          body?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          is_default?: boolean | null;
          updated_at?: string | null;
        };
      };
      scheduled_sends: {
        Row: {
          id: string;
          user_id: string | null;
          campaign_id: string | null;
          template_id: string | null;
          lead_ids: Json | null;
          type: string | null;
          subject: string | null;
          body: string | null;
          provider: string | null;
          status: string | null;
          scheduled_at: string | null;
          sent_at: string | null;
          error_msg: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          campaign_id?: string | null;
          template_id?: string | null;
          lead_ids?: Json | null;
          type?: string | null;
          subject?: string | null;
          body?: string | null;
          provider?: string | null;
          status?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          error_msg?: string | null;
        };
        Update: {
          user_id?: string | null;
          campaign_id?: string | null;
          template_id?: string | null;
          lead_ids?: Json | null;
          type?: string | null;
          subject?: string | null;
          body?: string | null;
          provider?: string | null;
          status?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          error_msg?: string | null;
        };
      };
      settings: {
        Row: SettingsRow;
        Insert: Partial<SettingsRow>;
        Update: Partial<SettingsRow>;
      };
      app_settings: {
        Row: AppSettingsRow;
        Insert: Partial<AppSettingsRow>;
        Update: Partial<AppSettingsRow>;
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string | null;
          ip: string | null;
          meta: Json | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          action?: string | null;
          ip?: string | null;
          meta?: Json | null;
        };
        Update: {
          user_id?: string | null;
          action?: string | null;
          ip?: string | null;
          meta?: Json | null;
        };
      };
      whatsapp_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          phone_number: string | null;
          session_dir: string | null;
          is_active: boolean | null;
          connected_at: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id?: string | null;
          phone_number?: string | null;
          session_dir?: string | null;
          is_active?: boolean | null;
          connected_at?: string | null;
        };
        Update: {
          user_id?: string | null;
          phone_number?: string | null;
          session_dir?: string | null;
          is_active?: boolean | null;
          connected_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type AppUser = Database['public']['Tables']['app_users']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadBatch = Database['public']['Tables']['lead_batches']['Row'];
export type DarapetLead = Database['public']['Tables']['darapet_leads']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type EmailSend = Database['public']['Tables']['email_sends']['Row'];
export type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];
export type ScheduledSend = Database['public']['Tables']['scheduled_sends']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
export type AppSettings = Database['public']['Tables']['app_settings']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export type UserStatus = 'active' | 'suspended' | 'restricted' | 'banned';

export interface RestrictionField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'file';
  required: boolean;
}

export interface RestrictionRequirement {
  title: string;
  description: string;
  fields: RestrictionField[];
}
