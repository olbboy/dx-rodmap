-- Migration script from features table to posts table
-- This script will create the posts table according to the technical document
-- and migrate data from the features table if it exists.

-- Create the posts table with the proper schema
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES statuses(id) ON DELETE RESTRICT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  eta TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for the posts table
CREATE INDEX IF NOT EXISTS idx_posts_roadmap ON posts(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status_id);
CREATE INDEX IF NOT EXISTS idx_posts_assignee ON posts(assignee_id);
CREATE INDEX IF NOT EXISTS idx_posts_priority ON posts(priority);
CREATE INDEX IF NOT EXISTS idx_posts_dates ON posts(start_date, end_date, eta);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING gin(tags);

-- Check if the features table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'features'
  ) THEN
    -- Migrate data from features table to posts table
    INSERT INTO posts (
      id, 
      roadmap_id, 
      title, 
      description, 
      status_id, 
      start_date, 
      end_date, 
      tags, 
      assignee_id, 
      created_at, 
      created_by, 
      updated_at, 
      updated_by, 
      order_index
    )
    SELECT 
      f.id, 
      f.roadmap_id, 
      f.title, 
      f.description, 
      f.status_id, 
      f.start_date, 
      f.due_date, 
      ARRAY(
        SELECT t.name 
        FROM tags t 
        INNER JOIN feature_tags ft ON t.id = ft.tag_id 
        WHERE ft.feature_id = f.id
      ) AS tags, 
      f.assignee_id, 
      f.created_at, 
      (SELECT owner_id FROM roadmaps WHERE id = f.roadmap_id) AS created_by, 
      f.updated_at, 
      (SELECT owner_id FROM roadmaps WHERE id = f.roadmap_id) AS updated_by, 
      f.order AS order_index
    FROM features f;
    
    RAISE NOTICE 'Data migrated from features table to posts table.';
    
    -- Rename the old features table for backup
    ALTER TABLE features RENAME TO features_old;
    RAISE NOTICE 'Features table renamed to features_old for backup.';
    
    -- Drop the feature_tags junction table if it exists
    DROP TABLE IF EXISTS feature_tags;
    RAISE NOTICE 'feature_tags table dropped.';
    
    -- Drop the tags table if it exists
    DROP TABLE IF EXISTS tags;
    RAISE NOTICE 'tags table dropped.';
  ELSE
    RAISE NOTICE 'Features table does not exist. No migration needed.';
  END IF;
END $$; 