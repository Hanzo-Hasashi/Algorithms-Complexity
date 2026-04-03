-- ============================================================
-- CSC 3011 Study Companion — Supabase Setup SQL
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  has_access BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 4. RLS Policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow users to insert their own profile row (fallback if trigger is slow)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Auto-create profile on Google sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, has_access, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable Realtime on profiles so access grants propagate instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ============================================================
-- AFTER running this SQL:
--
-- 1. Enable Google OAuth in Supabase:
--    Dashboard → Authentication → Providers → Google → Enable
--    Paste your Google Client ID and Secret
--    (Get these from console.cloud.google.com → Credentials)
--
-- 2. Add your site URL to Supabase:
--    Dashboard → Authentication → URL Configuration
--    Site URL: https://your-vercel-app.vercel.app
--    Redirect URLs: https://your-vercel-app.vercel.app/**
--
-- 3. Grant yourself admin access:
--    First sign in with Google so your profile is created,
--    then run this (replace with your actual Google email):
--
--    UPDATE public.profiles
--    SET is_admin = TRUE
--    WHERE email = 'your-admin-email@gmail.com';
-- ============================================================
