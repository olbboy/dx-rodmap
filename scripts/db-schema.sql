-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-secret-key';

-- Create users table extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for users (mirror of auth.users with additional fields)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for users
CREATE INDEX idx_users_email ON users(email);

-- Create table for statuses
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Create table for posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status_id UUID,
  assignee_id UUID,
  order_index INT NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  eta TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INT CHECK (progress BETWEEN 0 AND 100),
  tags TEXT[] DEFAULT '{}',
  parent_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
  CONSTRAINT fk_status FOREIGN KEY (status_id) REFERENCES statuses(id) ON DELETE SET NULL,
  CONSTRAINT fk_assignee FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE SET NULL,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create table for tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_roadmap FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for posts for better performance
CREATE INDEX idx_posts_roadmap ON posts(roadmap_id);
CREATE INDEX idx_posts_status ON posts(status_id) WHERE status_id IS NOT NULL;
CREATE INDEX idx_posts_assignee ON posts(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;

-- Create indexes for tags
CREATE INDEX idx_tags_roadmap ON tags(roadmap_id);

-- Enable row level security
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Add policies for statuses
CREATE POLICY select_statuses ON statuses
  FOR SELECT 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY insert_statuses ON statuses
  FOR INSERT 
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY update_statuses ON statuses
  FOR UPDATE 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY delete_statuses ON statuses
  FOR DELETE 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

-- Add policies for posts
CREATE POLICY select_posts ON posts
  FOR SELECT 
  USING (
    (deleted_at IS NULL) AND
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY insert_posts ON posts
  FOR INSERT 
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY update_posts ON posts
  FOR UPDATE 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY delete_posts ON posts
  FOR DELETE 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE posts; 

-- Add policies for tags
CREATE POLICY select_tags ON tags
  FOR SELECT 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid() OR is_public = true
    )
  );

CREATE POLICY insert_tags ON tags
  FOR INSERT 
  WITH CHECK (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY update_tags ON tags
  FOR UPDATE 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY delete_tags ON tags
  FOR DELETE 
  USING (
    roadmap_id IN (
      SELECT id FROM roadmaps 
      WHERE owner_id = auth.uid()
    )
  );

-- Enable realtime for tags
ALTER PUBLICATION supabase_realtime ADD TABLE tags; 

-- Create table for comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_edited BOOLEAN DEFAULT false,
  mentioned_users UUID[] DEFAULT '{}',
  CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Create indexes for comments
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- Enable row level security for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Add policies for comments
CREATE POLICY select_comments ON comments
  FOR SELECT 
  USING (
    post_id IN (
      SELECT id FROM posts 
      WHERE roadmap_id IN (
        SELECT id FROM roadmaps 
        WHERE owner_id = auth.uid() OR is_public = true
      )
    )
  );

CREATE POLICY insert_comments ON comments
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    post_id IN (
      SELECT id FROM posts 
      WHERE roadmap_id IN (
        SELECT id FROM roadmaps 
        WHERE owner_id = auth.uid() OR is_public = true
      )
    )
  );

CREATE POLICY update_comments ON comments
  FOR UPDATE 
  USING (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts 
      WHERE roadmap_id IN (
        SELECT id FROM roadmaps 
        WHERE owner_id = auth.uid() OR is_public = true
      )
    )
  );

CREATE POLICY delete_comments ON comments
  FOR DELETE 
  USING (
    user_id = auth.uid() OR
    post_id IN (
      SELECT id FROM posts 
      WHERE roadmap_id IN (
        SELECT id FROM roadmaps 
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments; 

-- Create function to sync auth user data to public.users
CREATE OR REPLACE FUNCTION sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the user in public.users
  INSERT INTO public.users (id, email, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync new users
CREATE OR REPLACE TRIGGER sync_user_data_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_data();

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting users
CREATE POLICY select_users ON users
  FOR SELECT
  USING (true); -- Anyone can view user data 