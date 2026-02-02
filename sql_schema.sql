
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'pending',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teachers Table (Updated)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT,
  department TEXT DEFAULT 'Geography and Environment',
  degree TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  photo_url TEXT,
  priority INTEGER DEFAULT 0,
  teacher_type TEXT DEFAULT 'Major',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  roll_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  session TEXT,
  department TEXT DEFAULT 'Geography and Environment',
  gender TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id),
  room_number TEXT,
  session TEXT,
  course_type TEXT DEFAULT 'Major',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notices Table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID REFERENCES public.profiles(id),
  is_published BOOLEAN DEFAULT TRUE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Results Table
DROP TABLE IF EXISTS public.results;
CREATE TABLE public.results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_roll TEXT NOT NULL,
  student_name TEXT,
  subject_name TEXT NOT NULL,
  subject_code TEXT,
  marks INTEGER NOT NULL DEFAULT 0,
  semester TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Settings
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Simple Global Policy
CREATE POLICY "Public Read All" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON public.results FOR SELECT USING (true);
CREATE POLICY "Public Read All" ON public.gallery FOR SELECT USING (true);

-- Full Access
CREATE POLICY "Full Access" ON public.teachers FOR ALL USING (true);
CREATE POLICY "Full Access" ON public.students FOR ALL USING (true);
CREATE POLICY "Full Access" ON public.routines FOR ALL USING (true);
CREATE POLICY "Full Access" ON public.notices FOR ALL USING (true);
CREATE POLICY "Full Access" ON public.results FOR ALL USING (true);
CREATE POLICY "Full Access" ON public.gallery FOR ALL USING (true);
CREATE POLICY "Full Access" ON public.profiles FOR ALL USING (true);
