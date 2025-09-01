-- Production Database Data Setup
-- Run this SECOND (after 01-create-tables.sql) in your Supabase SQL Editor

-- Insert sample features
INSERT INTO features (name, description, required_role, credit_cost, is_active) VALUES
('Simple QR Generator', 'Generate basic black and white QR codes - always free', 'free', 0, true),
('Custom QR Studio', 'Advanced QR styling with gradients, logos, and custom shapes - one-time unlock', 'free', 1, true),
('Premium Analytics', 'Advanced usage analytics and reporting', 'premium', 0, true),
('Bulk Operations', 'Process multiple items at once', 'premium', 2, true),
('Admin Dashboard', 'Full administrative access', 'admin', 0, true);

-- Data insertion complete!
-- Next steps:
-- 1. Deploy your app to Vercel
-- 2. Create your admin user account through the app
-- 3. Find your user ID in auth.users table  
-- 4. Run 03-create-admin.sql with your user ID