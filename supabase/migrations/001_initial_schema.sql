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

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all transactions" ON credit_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Insert some default features
INSERT INTO features (name, description, required_role, credit_cost, is_active) VALUES
  ('Basic Feature', 'A basic feature available to all users', 'free', 0, true),
  ('Premium Feature', 'A feature for premium users only', 'premium', 1, true),
  ('Advanced Feature', 'An advanced feature requiring credits', 'free', 5, true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, role, credits)
  VALUES (new.id, new.raw_user_meta_data->>'username', 'free', 10);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();