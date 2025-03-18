-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-secret-key';

-- Create users table extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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