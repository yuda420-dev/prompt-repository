-- HiPeR Gallery Database Schema for Supabase
-- Run this in your Supabase SQL Editor (supabase.com -> Your Project -> SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Unknown Artist',
  description TEXT,
  category TEXT DEFAULT 'Mixed Media',
  image_url TEXT NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 299,
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_is_public ON artworks(is_public);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Artist'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Artworks: Everyone can read public artworks, users can CRUD own
CREATE POLICY "Public artworks are viewable by everyone" ON artworks FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create artworks" ON artworks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artworks" ON artworks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artworks" ON artworks FOR DELETE USING (auth.uid() = user_id);

-- Insert default gallery artworks (visible to everyone)
INSERT INTO artworks (id, title, artist, description, category, image_url, base_price, is_default, is_public) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ethereal Dreams', 'HiPeR Gallery', 'A mesmerizing blend of colors that captures the essence of dreams', 'Abstract', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop', 299, true, true),
  ('00000000-0000-0000-0000-000000000002', 'Urban Rhythm', 'HiPeR Gallery', 'The pulse of city life captured in bold strokes', 'Contemporary', 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&h=600&fit=crop', 449, true, true),
  ('00000000-0000-0000-0000-000000000003', 'Nature''s Whisper', 'HiPeR Gallery', 'Organic forms dancing in harmony with nature', 'Landscape', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop', 379, true, true),
  ('00000000-0000-0000-0000-000000000004', 'Digital Horizons', 'HiPeR Gallery', 'Where technology meets artistic expression', 'Digital Art', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop', 529, true, true),
  ('00000000-0000-0000-0000-000000000005', 'Serene Moments', 'HiPeR Gallery', 'A peaceful contemplation of life''s quiet beauty', 'Minimalist', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop', 349, true, true),
  ('00000000-0000-0000-0000-000000000006', 'Abstract Motion', 'HiPeR Gallery', 'Energy and movement frozen in time', 'Abstract', 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&h=600&fit=crop', 429, true, true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for artwork images
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for artwork images
CREATE POLICY "Anyone can view artwork images"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');

CREATE POLICY "Authenticated users can upload artwork images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own artwork images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own artwork images"
ON storage.objects FOR DELETE
USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);
