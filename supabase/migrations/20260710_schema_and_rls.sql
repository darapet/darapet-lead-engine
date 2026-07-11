-- ============================================================
--  Darapet Lead Engine — Full Schema + RLS Policies
--  Paste this into Supabase Dashboard → SQL Editor and run.
-- ============================================================

-- Admin-check helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT coalesce((auth.jwt() ->> 'email')::text = 'Daramolapeter98@gmail.com', false);
$$;

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, name TEXT, company TEXT, phone TEXT, description TEXT,
  logo_url TEXT, default_logo_url TEXT, signature_url TEXT,
  brand_color TEXT DEFAULT '#3B82F6', plan TEXT DEFAULT 'free',
  is_admin BOOLEAN DEFAULT false, active_smtp TEXT,
  brevo_api_key TEXT, brevo_keys JSONB, mailgun_api_key TEXT, mailgun_domain TEXT,
  sendgrid_api_key TEXT, smtp_host TEXT, smtp_port INTEGER, smtp_user TEXT,
  smtp_pass TEXT, smtp_secure BOOLEAN DEFAULT false,
  email_daily_limit INTEGER DEFAULT 50, emails_sent_today INTEGER DEFAULT 0,
  last_send_reset TIMESTAMPTZ, wa_session_dir TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_self_or_admin" ON profiles;
CREATE POLICY "profiles_self_or_admin" ON profiles FOR ALL
  USING (id = auth.uid() OR is_admin()) WITH CHECK (id = auth.uid() OR is_admin());

-- APP_USERS
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, first_name TEXT, last_name TEXT, brand_name TEXT,
  brand_logo_url TEXT, signature_image_url TEXT, signature_name TEXT,
  signature_text TEXT, signature_title TEXT, website_url TEXT, socials JSONB,
  role TEXT DEFAULT 'free', status TEXT DEFAULT 'active',
  suspend_reason TEXT, suspend_requirements TEXT, review_request TEXT,
  daily_email_limit INTEGER DEFAULT 50, brevo_api_key TEXT,
  google_search_api_key TEXT, google_search_engine_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_users_self_or_admin" ON app_users;
CREATE POLICY "app_users_self_or_admin" ON app_users FOR ALL
  USING (auth_user_id = auth.uid() OR is_admin()) WITH CHECK (auth_user_id = auth.uid() OR is_admin());

-- LEAD_BATCHES
CREATE TABLE IF NOT EXISTS lead_batches (
  id BIGSERIAL PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  darapet_id TEXT, niche TEXT, country TEXT, target_type TEXT,
  requested_count INTEGER, found_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'bing', status TEXT DEFAULT 'complete',
  error_message TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lead_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_batches_self_or_admin" ON lead_batches;
CREATE POLICY "lead_batches_self_or_admin" ON lead_batches FOR ALL
  USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid() OR is_admin());

-- DARAPET_LEADS
CREATE TABLE IF NOT EXISTS darapet_leads (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT REFERENCES lead_batches(id) ON DELETE CASCADE,
  email TEXT, social_name TEXT, social_platform TEXT, social_url TEXT,
  source_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE darapet_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "darapet_leads_via_batch" ON darapet_leads;
CREATE POLICY "darapet_leads_via_batch" ON darapet_leads FOR ALL
  USING (is_admin() OR EXISTS (SELECT 1 FROM lead_batches lb WHERE lb.id = darapet_leads.batch_id AND lb.user_id = auth.uid()))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM lead_batches lb WHERE lb.id = darapet_leads.batch_id AND lb.user_id = auth.uid()));

-- EMAIL_SENDS
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_id TEXT, lead_id TEXT, to_email TEXT, subject TEXT,
  template_id TEXT, provider TEXT, status TEXT DEFAULT 'pending',
  error_msg TEXT, sent_at TIMESTAMPTZ
);
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_sends_self_or_admin" ON email_sends;
CREATE POLICY "email_sends_self_or_admin" ON email_sends FOR ALL
  USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid() OR is_admin());

-- ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT, ip TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_insert" ON activity_logs;
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "activity_logs_read" ON activity_logs;
CREATE POLICY "activity_logs_read" ON activity_logs FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT, status TEXT DEFAULT 'draft', template_id TEXT,
  subject TEXT, body TEXT, schedule_at TIMESTAMPTZ, sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaigns_self_or_admin" ON campaigns;
CREATE POLICY "campaigns_self_or_admin" ON campaigns FOR ALL
  USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid() OR is_admin());

-- SETTINGS (singleton id=1)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  brand_name TEXT DEFAULT 'Darapet Lead Engine', logo_url TEXT,
  brevo_api_key TEXT, google_search_api_key TEXT, google_search_engine_id TEXT,
  groq_api_key TEXT, support_email TEXT DEFAULT 'support@darapet.com',
  signature_name TEXT, signature_title TEXT, signature_text TEXT,
  signature_image_url TEXT, website_url TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'support@darapet.com';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS groq_api_key TEXT;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_admin_write" ON settings;
DROP POLICY IF EXISTS "settings_public_read"  ON settings;
CREATE POLICY "settings_admin_write" ON settings FOR ALL   USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "settings_public_read"  ON settings FOR SELECT USING (true);
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- APP_SETTINGS (singleton id=1)
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_daily_email_limit INTEGER DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT app_settings_single_row CHECK (id = 1)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_admin_write" ON app_settings;
DROP POLICY IF EXISTS "app_settings_public_read" ON app_settings;
CREATE POLICY "app_settings_admin_write" ON app_settings FOR ALL   USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "app_settings_public_read"  ON app_settings FOR SELECT USING (true);
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- SCHEDULED_SENDS (may already exist)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS scheduled_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    batch_id BIGINT, subject TEXT, body TEXT,
    scheduled_at TIMESTAMPTZ, status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE scheduled_sends ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "scheduled_sends_self_or_admin" ON scheduled_sends;
  CREATE POLICY "scheduled_sends_self_or_admin" ON scheduled_sends FOR ALL
    USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid() OR is_admin());
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT 'Darapet schema + RLS setup complete' AS result;
