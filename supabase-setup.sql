-- Create tables
CREATE TABLE "Users" (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  profile_picture TEXT,
  bio TEXT,
  age INTEGER,
  interest_genre TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "Novels" (
  novel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  leading_character TEXT CHECK (leading_character IN ('male', 'female')),
  upload_by UUID REFERENCES "Users"(user_id),
  genre TEXT[] NOT NULL,
  story TEXT NOT NULL,
  novel_coverpage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "Chapters" (
  chapter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "Library" (
  library_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, novel_id)
);

CREATE TABLE "Reading_Progress" (
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES "Chapters"(chapter_id) ON DELETE CASCADE,
  lastread_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, novel_id, chapter_id)
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name) VALUES ('profile_pictures', 'Profile Pictures') ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name) VALUES ('novel_covers', 'Novel Covers') ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Novels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chapters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Library" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reading_Progress" ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Public profiles are viewable by everyone" ON "Users"
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON "Users"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Create profile on signup" ON "Users"
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Novels Policies
CREATE POLICY "Novels are viewable by everyone" ON "Novels"
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create novels" ON "Novels"
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = upload_by);

CREATE POLICY "Authors can update own novels" ON "Novels"
FOR UPDATE USING (auth.uid() = upload_by);

CREATE POLICY "Authors can delete own novels" ON "Novels"
FOR DELETE USING (auth.uid() = upload_by);

-- Chapters Policies
CREATE POLICY "Chapters are viewable by everyone" ON "Chapters"
FOR SELECT USING (true);

CREATE POLICY "Authors can create chapters" ON "Chapters"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Novels"
    WHERE novel_id = "Chapters".novel_id
    AND upload_by = auth.uid()
  )
);

CREATE POLICY "Authors can update own chapters" ON "Chapters"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "Novels"
    WHERE novel_id = "Chapters".novel_id
    AND upload_by = auth.uid()
  )
);

CREATE POLICY "Authors can delete own chapters" ON "Chapters"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "Novels"
    WHERE novel_id = "Chapters".novel_id
    AND upload_by = auth.uid()
  )
);

-- Library Policies
CREATE POLICY "Users can view own library" ON "Library"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to library" ON "Library"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from library" ON "Library"
FOR DELETE USING (auth.uid() = user_id);

-- Reading Progress Policies
CREATE POLICY "Users can view own reading progress" ON "Reading_Progress"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create/update reading progress" ON "Reading_Progress"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reading progress" ON "Reading_Progress"
FOR UPDATE USING (auth.uid() = user_id);

-- Storage Policies
CREATE POLICY "Public profile pictures are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pictures');

CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Public novel covers are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'novel_covers');

CREATE POLICY "Authors can upload novel covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authors can update their novel covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

-- Functions
CREATE OR REPLACE FUNCTION increment_novel_views(novel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Novels"
  SET views = views + 1
  WHERE novel_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_chapter_views(chapter_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Chapters"
  SET views = COALESCE(views, 0) + 1
  WHERE chapter_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."Users" (user_id, email, username, created_at)
  VALUES (new.id, new.email, new.email, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();