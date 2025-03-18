# Sprint 3: Post Management System Implementation (Revised)

## Introduction

This document outlines the technical implementation details for Sprint 3 of the roadmap application, focusing on Post Management. The implementation follows the technical design document and implements CRUD operations for posts, status management, tagging system, assignee management, and filtering functionality.

## Database Schema Implementation

### Posts Table

```sql
CREATE TABLE posts (
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

CREATE INDEX idx_posts_roadmap ON posts(roadmap_id);
CREATE INDEX idx_posts_status ON posts(status_id);
CREATE INDEX idx_posts_assignee ON posts(assignee_id);
CREATE INDEX idx_posts_priority ON posts(priority);
CREATE INDEX idx_posts_dates ON posts(start_date, end_date, eta);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
```

### Statuses Table

```sql
CREATE TABLE statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(roadmap_id, name)
);

CREATE INDEX idx_statuses_roadmap ON statuses(roadmap_id);
```

## Server Action Implementation

The server actions implement the business logic and handle database operations for the post management system.

### Post Management Actions

- `createPost`: Creates a new post with title, description, status, dates, tags, and assignee
- `updatePost`: Updates an existing post including all its attributes
- `deletePost`: Removes a post (soft delete by setting deleted_at)
- `updatePostStatus`: Updates the status of a post and its order in the status column

### Status Management Actions

- `createStatus`: Creates a custom status with name, description, and color
- `updateStatus`: Updates an existing status
- `deleteStatus`: Removes a status if no posts are associated with it
- `reorderStatuses`: Rearranges the order of statuses

## UI Components Implementation

### Post Management Components

- `PostForm`: Form for creating and editing posts with status, assignee, and tag selection
- `PostList`: Displays posts with filtering capabilities by text, status, and tags
- `DeletePostButton`: Confirmation dialog for post deletion

### Status Management Components

- `StatusFormDialog`: Dialog for creating and editing statuses with color selection

## Pages Implementation

- `app/roadmaps/[id]/posts/new/page.tsx`: Page for creating new posts
- `app/roadmaps/[id]/posts/[postId]/edit/page.tsx`: Page for editing existing posts
- `app/roadmaps/[id]/settings/page.tsx`: Settings page for managing statuses and tags

## Authentication and Authorization

All server actions include authentication checks and verify user permissions:
1. Verify the user is authenticated
2. Check if the user has permission to perform the operation (roadmap ownership)
3. Perform the requested operation only if authorized

## Error Handling

The implementation includes comprehensive error handling:
- Input validation before database operations
- Database error handling with informative error messages
- Toast notifications for success and error states
- Loading states for better UX during async operations

## Routing and Navigation

The implementation uses Next.js App Router for routing:
- Deep linking to post creation and editing forms
- Settings page for managing statuses
- Dynamic routing for roadmap-specific posts

## Data Flow

1. Server components fetch initial data from Supabase
2. Form components manage client-side state for inputs
3. Server actions perform database operations
4. Route is refreshed to reflect changes

## Performance Considerations

- Server components for initial data fetching
- Client components for interactive elements
- Form validation on both client and server sides
- Selective route revalidation for optimal performance

## Key Differences from Initial Implementation

1. **Posts Table Instead of Features**: Following the technical document design
2. **Tags as Array**: Using a TEXT[] column instead of a separate tags table
3. **Additional Fields**: Including priority, progress, parent_id, metadata, and deleted_at
4. **Stricter Status Relation**: Using ON DELETE RESTRICT for status_id reference
5. **More Comprehensive Indexes**: Creating indexes for efficient querying

## Migration Considerations

When migrating from the existing implementation:

1. Create the new posts table
2. Migrate data from features table to posts table
3. Update all component references from "feature" to "post"
4. Update URL paths from "/features/" to "/posts/"
5. Adjust server actions to work with the new schema 