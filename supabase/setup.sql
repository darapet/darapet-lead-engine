-- =====================================================
-- DARAPET LEAD ENGINE — Supabase Setup SQL
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE darapet_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES table policies
-- =====================================================
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'Daramolapeter98@gmail.com'
  );

-- =====================================================
-- 3. APP_USERS table policies
-- =====================================================
CREATE POLICY "Users can view own app_user" ON app_users
  FOR SELECT USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can insert own app_user" ON app_users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can update own app_user" ON app_users
  FOR UPDATE USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Admin can manage all app_users" ON app_users
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'Daramolapeter98@gmail.com'
  );

-- =====================================================
-- 4. LEAD_BATCHES table policies
-- =====================================================
CREATE POLICY "Users can manage own batches" ON lead_batches
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Admin can view all batches" ON lead_batches
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'Daramolapeter98@gmail.com'
  );

-- =====================================================
-- 5. DARAPET_LEADS table policies
-- =====================================================
CREATE POLICY "Users can view their leads" ON darapet_leads
  FOR SELECT USING (
    batch_id IN (SELECT id FROM lead_batches WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert leads" ON darapet_leads
  FOR INSERT WITH CHECK (
    batch_id IN (SELECT id FROM lead_batches WHERE user_id = auth.uid()::text)
  );

-- =====================================================
-- 6. EMAIL_SENDS table policies
-- =====================================================
CREATE POLICY "Users can manage own sends" ON email_sends
  FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 7. SCHEDULED_SENDS table policies
-- =====================================================
CREATE POLICY "Users can manage own scheduled sends" ON scheduled_sends
  FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 8. ACTIVITY_LOGS table policies
-- =====================================================
CREATE POLICY "Users can view own activity" ON activity_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own activity" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admin can view all activity" ON activity_logs
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'Daramolapeter98@gmail.com'
  );

-- =====================================================
-- 9. SETTINGS table policies (admin write, all read for scraping config)
-- =====================================================
CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage settings" ON settings
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'Daramolapeter98@gmail.com'
  );

-- =====================================================
-- 10. APP_SETTINGS policies
-- =====================================================
CREATE POLICY "Anyone can read app_settings" ON app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage app_settings" ON app_settings
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'Daramolapeter98@gmail.com'
  );

-- =====================================================
-- 11. EMAIL_TEMPLATES policies
-- =====================================================
CREATE POLICY "Users can manage own templates" ON email_templates
  FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 12. CAMPAIGNS policies
-- =====================================================
CREATE POLICY "Users can manage own campaigns" ON campaigns
  FOR ALL USING (auth.uid()::text = user_id);

-- =====================================================
-- 13. Initialize settings row (if not exists)
-- =====================================================
INSERT INTO settings (id, brand_name, website_url, updated_at)
VALUES (1, 'Darapet Lead Engine', 'https://darapet.com', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_settings (id, default_daily_email_limit, updated_at)
VALUES (1, 50, NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 14. Storage buckets (run in Supabase dashboard > Storage)
-- Create: 'avatars' (public) and 'documents' (private)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for avatars bucket:
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
