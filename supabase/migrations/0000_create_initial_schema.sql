-- supabase/migrations/0000_create_initial_schema.sql

-- 1. PROFILES TABLE
-- Stores public user data.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  status_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Add comments on columns
COMMENT ON TABLE public.profiles IS 'Public user profile information, linked to auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'Links to auth.users.id. ON DELETE CASCADE ensures profile is deleted when user is.';
COMMENT ON COLUMN public.profiles.display_name IS 'The user''s public display name.';
COMMENT ON COLUMN public.profiles.avatar_color IS 'The user''s chosen avatar color theme.';
COMMENT ON COLUMN public.profiles.status_message IS 'A short, optional status message.';

-- 2. ROOMS TABLE
-- Stores information about collaborative rooms.
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.rooms IS 'Collaborative spaces for users to join.';
COMMENT ON COLUMN public.rooms.owner_id IS 'The user who created and owns the room. If owner is deleted, room is kept but ownerless.';

-- 3. ROOM_PARTICIPANTS TABLE
-- Many-to-many relationship between rooms and users.
CREATE TABLE public.room_participants (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
COMMENT ON TABLE public.room_participants IS 'Tracks which users are members of which rooms.';

-- 4. FOCUS_SESSIONS TABLE
-- For analytics on user focus sessions.
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'focus' | 'break'
  duration_ms INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.focus_sessions IS 'Records completed focus or break sessions for analytics.';
COMMENT ON COLUMN public.focus_sessions.session_type IS 'The type of session, e.g., ''focus'' or ''break''.';
COMMENT ON COLUMN public.focus_sessions.duration_ms IS 'The duration of the session in milliseconds.';

-- 5. TRIGGER FOR NEW USER PROFILE CREATION
-- This function and trigger automatically create a profile for a new user upon signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_color)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      'Sailor'
    ),
    -- Set a random default color from a predefined palette
    (ARRAY['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'])[floor(random() * 11 + 1)]
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a public.profile for a new user in auth.users.';

-- 6. ROW LEVEL SECURITY (RLS)
-- Enable RLS for all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables for authenticated users.
-- More specific policies will restrict write access.
CREATE POLICY "Allow public read access"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access"
  ON public.rooms FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access"
  ON public.room_participants FOR SELECT
  USING (auth.role() = 'authenticated');

-- Specific Policies from Sprint Plan
-- PROFILES Policies
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ROOMS Policies
CREATE POLICY "Users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can update their rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Room owners can delete their rooms"
  ON public.rooms FOR DELETE
  USING (auth.uid() = owner_id);

-- ROOM_PARTICIPANTS Policies
CREATE POLICY "Users can join rooms"
  ON public.room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON public.room_participants FOR DELETE
  USING (auth.uid() = user_id);

-- FOCUS_SESSIONS Policies
CREATE POLICY "Users can insert their own sessions"
  ON public.focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- As per sprint plan: Allow viewing sessions in public rooms.
-- Note: This is less restrictive than the default read access above, but good to have for clarity.
CREATE POLICY "View sessions in public rooms"
  ON public.focus_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = focus_sessions.room_id
    AND rooms.is_public = true
  ));
