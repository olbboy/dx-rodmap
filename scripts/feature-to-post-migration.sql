-- Migration script to transition from features to posts

-- Check if features table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'features') THEN
        -- Create posts table if it doesn't exist
        CREATE TABLE IF NOT EXISTS posts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status_id UUID REFERENCES statuses(id) ON DELETE SET NULL,
            assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            order INTEGER DEFAULT 0,
            start_date TIMESTAMP WITH TIME ZONE,
            end_date TIMESTAMP WITH TIME ZONE,
            eta TIMESTAMP WITH TIME ZONE,
            priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            deleted_at TIMESTAMP WITH TIME ZONE
        );

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_posts_roadmap_id ON posts(roadmap_id);
        CREATE INDEX IF NOT EXISTS idx_posts_status_id ON posts(status_id);
        CREATE INDEX IF NOT EXISTS idx_posts_assignee_id ON posts(assignee_id);

        -- Migrate data from features to posts
        INSERT INTO posts (
            id, 
            roadmap_id, 
            title, 
            description, 
            status_id, 
            assignee_id, 
            order, 
            start_date, 
            end_date, 
            eta, 
            priority, 
            progress, 
            created_at, 
            updated_at
        )
        SELECT 
            id, 
            roadmap_id, 
            title, 
            description, 
            status_id, 
            assignee_id, 
            COALESCE("order", 0) as order, 
            start_date, 
            end_date, 
            eta, 
            priority, 
            progress, 
            created_at, 
            updated_at
        FROM features
        WHERE deleted_at IS NULL;

        -- Migrate tags from feature_tags to posts tags array
        -- This requires a more complex approach since we're moving from a relational model to an array
        -- First, create a temporary function to gather tags for each feature
        CREATE OR REPLACE FUNCTION temp_migrate_feature_tags() RETURNS VOID AS $$
        DECLARE
            feature_id UUID;
            feature_tags TEXT[];
        BEGIN
            -- For each feature, gather tags
            FOR feature_id IN (SELECT id FROM features WHERE deleted_at IS NULL) LOOP
                -- Get tags for this feature
                SELECT array_agg(tags.name) INTO feature_tags
                FROM feature_tags
                JOIN tags ON feature_tags.tag_id = tags.id
                WHERE feature_tags.feature_id = feature_id;
                
                -- Update the post with gathered tags
                IF feature_tags IS NOT NULL THEN
                    UPDATE posts
                    SET tags = feature_tags
                    WHERE id = feature_id;
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;

        -- Execute the function
        SELECT temp_migrate_feature_tags();

        -- Drop the temporary function
        DROP FUNCTION temp_migrate_feature_tags();

        -- Rename original tables for backup (optional)
        ALTER TABLE features RENAME TO features_backup;
        ALTER TABLE feature_tags RENAME TO feature_tags_backup;
        ALTER TABLE tags RENAME TO tags_backup;
        
        -- Set RLS policies for posts table
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for select
        CREATE POLICY "Allow users to view their own roadmap posts or public roadmap posts" 
        ON posts
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM roadmaps 
                WHERE roadmaps.id = posts.roadmap_id 
                AND (roadmaps.user_id = auth.uid() OR roadmaps.is_public = true)
            )
        );
        
        -- Create policy for insert, update, delete
        CREATE POLICY "Allow users to manage their own roadmap posts" 
        ON posts
        FOR ALL 
        USING (
            EXISTS (
                SELECT 1 FROM roadmaps 
                WHERE roadmaps.id = posts.roadmap_id 
                AND roadmaps.user_id = auth.uid()
            )
        );
        
        -- Enable Supabase's realtime features for posts
        ALTER PUBLICATION supabase_realtime ADD TABLE posts;
        
        RAISE NOTICE 'Migration from features to posts completed successfully';
    ELSE
        RAISE NOTICE 'Features table does not exist, no migration needed';
    END IF;
END
$$; 