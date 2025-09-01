-- Create Admin User
-- Run this THIRD (after deploying and signing up) in your Supabase SQL Editor
-- Replace 'your-user-id-here' with your actual user ID from auth.users table

-- STEP 1: Find your user ID
-- Go to Authentication > Users in Supabase dashboard
-- Or run: SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- STEP 2: Replace 'your-user-id-here' with your actual UUID and run these commands:

-- Make user an admin
INSERT INTO admin_users (user_id) VALUES ('your-user-id-here');

-- Give admin credits and update role
UPDATE user_profiles SET 
  role = 'admin', 
  credits = 1000 
WHERE id = 'your-user-id-here';

-- Verify admin setup
SELECT 
  u.email,
  p.role,
  p.credits,
  CASE WHEN a.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as is_admin
FROM auth.users u
JOIN user_profiles p ON u.id = p.id
LEFT JOIN admin_users a ON u.id = a.user_id
WHERE u.id = 'your-user-id-here';