-- Fix the user trigger function to handle Google OAuth properly
-- Run this in your Supabase SQL Editor

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust function that handles Google OAuth users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile with proper error handling
  INSERT INTO user_profiles (id, username, role, credits)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ), 
    'free', 
    10
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also handle the case where username might conflict
-- Make username column nullable to handle conflicts
ALTER TABLE user_profiles ALTER COLUMN username DROP NOT NULL;

-- Add a function to generate unique usernames
CREATE OR REPLACE FUNCTION generate_unique_username(base_username text, user_id uuid)
RETURNS text AS $$
DECLARE
  counter int := 0;
  new_username text;
  username_exists boolean;
BEGIN
  new_username := base_username;
  
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_profiles 
      WHERE username = new_username AND id != user_id
    ) INTO username_exists;
    
    IF NOT username_exists THEN
      RETURN new_username;
    END IF;
    
    counter := counter + 1;
    new_username := base_username || counter::text;
    
    -- Safety check to prevent infinite loops
    IF counter > 1000 THEN
      RETURN base_username || user_id::text;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function to use unique username generation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
BEGIN
  -- Get base username from various sources
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'user'
  );
  
  -- Clean the username (remove spaces, special chars)
  base_username := regexp_replace(lower(trim(base_username)), '[^a-z0-9]', '', 'g');
  
  -- Ensure minimum length
  IF length(base_username) < 3 THEN
    base_username := 'user';
  END IF;
  
  -- Generate unique username
  final_username := generate_unique_username(base_username, NEW.id);
  
  -- Insert user profile
  INSERT INTO user_profiles (id, username, role, credits)
  VALUES (NEW.id, final_username, 'free', 10)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;