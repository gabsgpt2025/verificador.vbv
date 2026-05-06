-- Triggers and Functions for VeriFiBIN

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'user',
    100
  )
  ON CONFLICT (id) DO NOTHING;

  -- Log user creation
  INSERT INTO public.user_activity_logs (user_id, activity_type, activity_description)
  VALUES (
    NEW.id,
    'account_created',
    'New user account created'
  );

  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update user credits
CREATE OR REPLACE FUNCTION public.update_user_credits(
  p_user_id UUID,
  p_credits_used INTEGER,
  p_operation_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.users
  WHERE id = p_user_id;

  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF current_credits < p_credits_used THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Calculate new credits
  new_credits := current_credits - p_credits_used;

  -- Update user credits
  UPDATE public.users
  SET credits = new_credits, updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the credit usage
  INSERT INTO public.user_credits_log (
    user_id, credits_before, credits_after, credits_used, operation_type, description
  )
  VALUES (
    p_user_id, current_credits, new_credits, p_credits_used, p_operation_type, p_description
  );

  RETURN TRUE;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_description TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_activity_logs (
    user_id, activity_type, activity_description, ip_address, user_agent, metadata
  )
  VALUES (
    p_user_id, p_activity_type, p_activity_description, p_ip_address, p_user_agent, p_metadata
  );
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
