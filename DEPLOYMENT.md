# Deployment Guide: SaaS Marketplace Starter Template

This guide covers deploying the Next.js 15 application to Vercel and setting up the production Supabase instance.

## 🗂️ Pre-Deployment Checklist

- [ ] Local development is working properly
- [ ] All features tested locally with Supabase local instance
- [ ] Environment variables documented
- [ ] Database schema and data ready for migration

## 🎯 Step 1: Create Production Supabase Project

### 1.1 Create New Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `smst-production` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project provisioning (3-5 minutes)

### 1.2 Get Production Credentials
Once your project is ready, go to **Settings → API**:

```bash
# Note these values - you'll need them for Vercel
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🗄️ Step 2: Set Up Production Database

### 2.1 Run Database Schema
Go to **SQL Editor** in your Supabase dashboard and run these commands:

```sql
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
```

### 2.2 Enable Row Level Security
```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_unlocks ENABLE ROW LEVEL SECURITY;
```

### 2.3 Create RLS Policies
```sql
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

-- Feature unlocks policies
CREATE POLICY "Users can view own unlocks" ON user_feature_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own unlocks" ON user_feature_unlocks FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all unlocks" ON user_feature_unlocks FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

### 2.4 Insert Sample Features Data
```sql
-- Insert sample features
INSERT INTO features (name, description, required_role, credit_cost, is_active) VALUES
('Simple QR Generator', 'Generate basic black and white QR codes', 'free', 0, true),
('Custom QR Studio', 'Advanced QR styling with gradients, logos, and custom shapes', 'free', 1, true),
('Premium Feature 1', 'Example premium feature', 'premium', 0, true),
('Admin Feature', 'Example admin-only feature', 'admin', 0, true);
```

## 🗂️ Step 3: Configure Supabase Storage

### 3.1 Create Storage Bucket
Go to **Storage** in your Supabase dashboard and run this SQL:

```sql
-- Create temp-logos bucket for QR code logo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-logos', 
  'temp-logos', 
  true, 
  5242880, -- 5MB limit
  '["image/png","image/jpeg","image/jpg","image/gif","image/svg+xml","image/webp"]'
)
ON CONFLICT (id) DO NOTHING;
```

### 3.2 Create Storage RLS Policies
```sql
-- Storage bucket RLS policies
CREATE POLICY "Users can upload their own logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'temp-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'temp-logos');

CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'temp-logos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🚀 Step 4: Deploy to Vercel

### 4.1 Prepare for Deployment
1. Make sure your code is pushed to GitHub
2. Update your `package.json` if needed:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "next lint"
  }
}
```

### 4.2 Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (unless your Next.js app is in a subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 4.3 Set Environment Variables
In Vercel project settings, add these environment variables:

```bash
# Supabase Production URLs (replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Set NODE_ENV if not automatically set
NODE_ENV=production
```

### 4.4 Deploy
1. Click "Deploy"
2. Wait for build and deployment (usually 2-3 minutes)
3. Your app will be available at `https://your-project-name.vercel.app`

## ✅ Step 5: Post-Deployment Setup

### 5.1 Create Admin User
1. Sign up for an account on your deployed app
2. Note your user ID from the Supabase Auth dashboard
3. In Supabase SQL Editor, run:

```sql
-- Replace 'your-user-id' with actual UUID from auth.users
INSERT INTO admin_users (user_id) VALUES ('your-user-id');
UPDATE user_profiles SET role = 'admin', credits = 1000 WHERE id = 'your-user-id';
```

### 5.2 Test Key Features
- [ ] User registration/login works
- [ ] Dashboard loads correctly
- [ ] Simple QR Generator works
- [ ] Custom QR Studio unlock system works
- [ ] Logo upload functionality works
- [ ] Admin panel is accessible

### 5.3 Configure Authentication (Optional)
In Supabase Dashboard → Authentication → Settings:
- **Site URL**: Add your Vercel domain
- **Redirect URLs**: Add your Vercel domain with auth callback paths

## 🔧 Environment Variables Reference

Create a `.env.production` file for reference (don't commit this):

```bash
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Production Database (if needed for external tools)
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
```

## 🚨 Security Checklist

- [ ] RLS policies are enabled on all tables
- [ ] Service role key is only in Vercel environment variables (not in code)
- [ ] Storage bucket has proper access policies
- [ ] Authentication settings are configured
- [ ] No sensitive data in public repository

## 🔍 Troubleshooting

### Common Issues:

1. **Build fails on Vercel**
   - Check build logs for TypeScript errors
   - Ensure all dependencies are in `package.json`
   - Verify environment variables are set

2. **Database connection issues**
   - Verify Supabase URL and keys
   - Check if RLS policies are too restrictive
   - Ensure tables exist with correct names

3. **Storage upload fails**
   - Verify bucket exists and is public
   - Check RLS policies on storage.objects
   - Ensure file types are in allowed_mime_types

4. **Authentication issues**
   - Add your Vercel domain to Supabase Auth settings
   - Check redirect URLs are configured
   - Verify JWT secret if using custom auth

## 📊 Monitoring & Analytics

Consider adding these for production:

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Analytics**: Monitor database performance
3. **Error Tracking**: Consider Sentry integration
4. **Uptime Monitoring**: Set up health checks

---

## 🎉 Deployment Complete!

Your SaaS Marketplace Starter Template is now live! 

**Next Steps:**
- Set up custom domain in Vercel (optional)
- Configure email templates in Supabase
- Set up monitoring and analytics
- Consider adding payment integration
- Scale database as needed

**Production URLs:**
- **App**: `https://your-project.vercel.app`
- **Supabase**: `https://your-project-id.supabase.co`
- **Admin Panel**: `https://your-project.vercel.app/admin`