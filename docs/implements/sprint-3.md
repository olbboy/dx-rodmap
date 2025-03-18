# Sprint 3 Implementation: Posts Management

This document outlines the implementation of posts management functionality in the roadmap application. Posts are the core content elements within a roadmap, representing features, ideas, tasks, or any item that needs to be tracked.

## Table Schema

The posts are stored in the `posts` table with the following schema:

```sql
CREATE TABLE posts (
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
```

## Key Features

### 1. Post Management
- Create, read, update, and delete posts within a roadmap
- Support for rich metadata including:
  - Title and description
  - Status assignment
  - User assignment
  - Date tracking (start, end, ETA)
  - Priority levels
  - Progress tracking
  - Tagging

### 2. Status-based Organization
- Posts can be assigned to different statuses
- Statuses are created and managed by the roadmap owner
- Drag-and-drop interface for moving posts between statuses

### 3. Visual Views
- List view for browsing all posts with filtering and sorting
- Kanban board view for visualizing posts by status

## User Flows

### Creating a Post
1. User navigates to a roadmap
2. User clicks "New Post" button
3. User fills out the post form with required details
4. On submission, post is created and user is redirected to the roadmap view

### Updating a Post
1. User selects a post to edit
2. User modifies the post details
3. On submission, post is updated and user is redirected to the post view

### Moving Posts (Kanban View)
1. User navigates to the Kanban view
2. User drags a post from one status column to another
3. The post's status is automatically updated in the database

## Implementation Components

### Data Types
- `Post` interface in `types/index.ts`
- `PostFormData` interface for form handling

### Server Actions
- `getPostsByRoadmapId`: Fetches all posts for a given roadmap
- `getPostById`: Retrieves a specific post by ID
- `createPost`: Creates a new post
- `updatePost`: Updates an existing post
- `deletePost`: Soft-deletes a post
- `updatePostStatus`: Updates a post's status (used for drag-and-drop)

### UI Components
- `PostForm`: Form component for creating and editing posts
- `PostCard`: Card component for displaying post information
- `PostsList`: List component for showing all posts with filtering
- `DeletePostButton`: Button component for post deletion
- `KanbanBoard`: Board component for the Kanban view

### Pages
- `/roadmaps/[id]`: Main roadmap page showing posts in list view
- `/roadmaps/[id]/posts/new`: Page for creating a new post
- `/roadmaps/[id]/posts/[postId]`: Page for viewing a post's details
- `/roadmaps/[id]/posts/[postId]/edit`: Page for editing a post
- `/roadmaps/[id]/kanban`: Kanban board view for organizing posts by status

## Feature Flags and Access Control

- Only roadmap owners can create, edit, and delete posts
- Public roadmaps allow any authenticated user to view posts
- Private roadmaps restrict post visibility to the owner

## Post Tags

Unlike the previous implementation with a relational tags system, this implementation uses a simpler approach with an array of text tags stored directly in the post record. This simplifies the data model while still providing tagging functionality.

## Migration Path

A migration script is provided in `scripts/feature-to-post-migration.sql` for transitioning from the previous "features" implementation to the new "posts" implementation. This script:

1. Creates the new posts table
2. Migrates data from features to posts
3. Converts relational tags to the array-based tags
4. Renames the old tables for backup
5. Sets up appropriate RLS policies for the posts table

## Testing Guidelines

When testing the posts functionality:
1. Verify that posts can be created with all metadata
2. Check that filtering and sorting works in the list view
3. Ensure drag-and-drop functionality updates post status correctly
4. Validate that access control prevents unauthorized access
5. Test that tag functionality works as expected 