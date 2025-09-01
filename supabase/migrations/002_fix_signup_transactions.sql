-- Fix the handle_new_user function to create transaction records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert user profile with initial credits
  INSERT INTO public.user_profiles (id, username, role, credits)
  VALUES (new.id, new.raw_user_meta_data->>'username', 'free', 10);
  
  -- Create transaction record for initial credits
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, admin_notes)
  VALUES (new.id, 10, 'grant', 'Welcome bonus - initial credits for new user');
  
  RETURN new;
END;
$function$;