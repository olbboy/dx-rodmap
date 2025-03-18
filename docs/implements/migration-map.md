# Migration Map: Features to Posts

This document maps all files that need to be renamed or updated to migrate from the current `features` implementation to the `posts` implementation according to the technical document.

## Type Definitions

| Current File | New File | Description |
|--------------|----------|-------------|
| `types/index.ts` | - | Update to replace `Feature` interface with `Post` interface |

## Server Actions

| Current File | New File | Description |
|--------------|----------|-------------|
| `lib/actions/feature.ts` | `lib/actions/post.ts` | Rename and update methods to use posts table |
| `lib/actions/tag.ts` | - | Modify to work with posts' tags TEXT[] column |

## Components

| Current File | New File | Description |
|--------------|----------|-------------|
| `components/feature/feature-form.tsx` | `components/post/post-form.tsx` | Rename component and update to use posts |
| `components/feature/feature-list.tsx` | `components/post/post-list.tsx` | Rename component and update to use posts |
| `components/feature/delete-feature-button.tsx` | `components/post/delete-post-button.tsx` | Rename component and update to use posts |
| `components/feature/tag-form-dialog.tsx` | - | Update to work with posts' tags array |

## Pages

| Current File | New File | Description |
|--------------|----------|-------------|
| `app/roadmaps/[id]/features/new/page.tsx` | `app/roadmaps/[id]/posts/new/page.tsx` | Rename page and update to use posts |
| `app/roadmaps/[id]/features/[featureId]/edit/page.tsx` | `app/roadmaps/[id]/posts/[postId]/edit/page.tsx` | Rename page and update to use posts |
| `app/roadmaps/[id]/features/[featureId]/page.tsx` | `app/roadmaps/[id]/posts/[postId]/page.tsx` | Rename page and update to use posts |
| `app/roadmaps/[id]/page.tsx` | - | Update to fetch and display posts instead of features |
| `app/roadmaps/[id]/kanban/page.tsx` | - | Update to use posts for kanban board |
| `app/roadmaps/[id]/settings/page.tsx` | - | Update to work with statuses management |

## Project Structure Changes

1. Create the new directory structure:
   ```
   mkdir -p app/roadmaps/[id]/posts/new
   mkdir -p app/roadmaps/[id]/posts/[postId]/edit
   mkdir -p components/post
   ```

2. Create the new files based on the mapping

3. Update the imports in all files to reference the new components and types

## Database Schema Changes

1. Execute the migration script in `scripts/migrate-to-posts.sql` to:
   - Create the new `posts` table according to the technical document
   - Migrate data from `features` to `posts`
   - Remove the `tags` and `feature_tags` tables
   - Update statuses to use the new schema

## Implementation Notes

1. The `tags` field in `posts` will be a TEXT[] array instead of a separate table
2. Posts will have additional fields:
   - `eta`
   - `priority`
   - `progress`
   - `parent_id`
   - `metadata`
   - `deleted_at` (for soft deletes)
   - `created_by`
   - `updated_by`
3. Status references will use ON DELETE RESTRICT instead of CASCADE
4. All routes, server actions, and components must be updated to use "post" naming 