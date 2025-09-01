-- Production Database Setup Script (FIXED)
-- Run this in your Supabase SQL Editor after creating your production project

-- 1. Create all tables
-- User profiles extending Supabase auth
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('admin', 'premium', 'free')),
  credits INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features/Services configuration
CREATE TABLE features (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  required_role TEXT DEFAULT 'free',
  credit_cost INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'usage', 'adjustment', 'refund')),
  feature_used TEXT,
  admin_notes TEXT,
  granted_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users
CREATE TABLE admin_users (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  permissions TEXT[] DEFAULT ARRAY['manage_credits', 'manage_users'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User feature unlocks for one-time purchases
CREATE TABLE user_feature_unlocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_name)
);

-- 2. Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_unlocks ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON user_profiles 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 4. Create RLS Policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON credit_transactions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert transactions" ON credit_transactions 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update transactions" ON credit_transactions 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete transactions" ON credit_transactions 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 5. Create RLS Policies for admin_users
CREATE POLICY "Admins can view admin_users" ON admin_users 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage admin_users" ON admin_users 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 6. Create RLS Policies for user_feature_unlocks
CREATE POLICY "Users can view own unlocks" ON user_feature_unlocks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocks" ON user_feature_unlocks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all unlocks" ON user_feature_unlocks 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage unlocks" ON user_feature_unlocks 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 7. Create Storage bucket for logo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-logos', 
  'temp-logos', 
  true, 
  5242880, -- 5MB limit
  '["image/png","image/jpeg","image/jpg","image/gif","image/svg+xml","image/webp"]'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage RLS policies
CREATE POLICY "Users can upload their own logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'temp-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'temp-logos');

CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'temp-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. Insert sample features
INSERT INTO features (name, description, required_role, credit_cost, is_active) VALUES
('Simple QR Generator', 'Generate basic black and white QR codes - always free', 'free', 0, true),
('Custom QR Studio', 'Advanced QR styling with gradients, logos, and custom shapes - one-time unlock', 'free', 1, true),
('Premium Analytics', 'Advanced usage analytics and reporting', 'premium', 0, true),
('Bulk Operations', 'Process multiple items at once', 'premium', 2, true),
('Admin Dashboard', 'Full administrative access', 'admin', 0, true);

-- 10. Create functions for common operations
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, role, credits)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 'free', 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Production setup complete!
-- Next steps:
-- 1. Create your admin user account through the app
-- 2. Find your user ID in auth.users table  
-- 3. Run: INSERT INTO admin_users (user_id) VALUES ('your-user-id');
-- 4. Run: UPDATE user_profiles SET role = 'admin', credits = 1000 WHERE id = 'your-user-id';