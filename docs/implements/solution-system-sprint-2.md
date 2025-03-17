# System Implementation - Sprint 2: Roadmap Management

## Overview

This document outlines the system implementation details for Sprint 2 of the Roadmap Application, focusing on roadmap management functionality. The implementation follows the architectural decisions outlined in the development plan and builds upon the foundation established in Sprint 1.

## Database Schema

### Roadmaps Table

```sql
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Owner can do anything
CREATE POLICY "Owners can do anything" ON roadmaps
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Public roadmaps can be viewed by anyone
CREATE POLICY "Public roadmaps can be viewed by anyone" ON roadmaps
  FOR SELECT
  USING (is_public = TRUE);
```

### Team Members Table

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (roadmap_id, user_id)
);

-- Row Level Security Policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Only roadmap owners can manage team members
CREATE POLICY "Only roadmap owners can manage team members" ON team_members
  USING (EXISTS (
    SELECT 1 FROM roadmaps
    WHERE roadmaps.id = team_members.roadmap_id
    AND roadmaps.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM roadmaps
    WHERE roadmaps.id = team_members.roadmap_id
    AND roadmaps.owner_id = auth.uid()
  ));

-- Team members can view their own records
CREATE POLICY "Team members can view their own records" ON team_members
  FOR SELECT
  USING (user_id = auth.uid());
```

## Server Actions

### Roadmap Management

The following server actions are implemented for roadmap management:

1. **createRoadmap**: Creates a new roadmap with the provided title, description, and visibility settings.
2. **updateRoadmap**: Updates an existing roadmap's details.
3. **deleteRoadmap**: Soft deletes a roadmap.
4. **getRoadmap**: Retrieves a roadmap by ID.
5. **listRoadmaps**: Lists all roadmaps owned by the current user.

### Team Management

The following server actions are implemented for team management:

1. **inviteTeamMember**: Invites a user to join a roadmap team.
2. **updateTeamMemberRole**: Updates a team member's role.
3. **removeTeamMember**: Removes a team member from a roadmap.
4. **listTeamMembers**: Lists all team members for a roadmap.

## Authentication & Authorization

### Route Protection

All roadmap-related routes are protected using middleware that checks for authentication. Additionally, specific routes have authorization checks to ensure users can only access roadmaps they own or are members of.

### Permission Checks

Permission checks are implemented at multiple levels:

1. **Database Level**: Row Level Security (RLS) policies ensure users can only access data they're authorized to see.
2. **Server Action Level**: Each server action verifies the user's permissions before performing operations.
3. **UI Level**: Components conditionally render based on the user's permissions.

## Data Flow

### Creating a Roadmap

1. User fills out the roadmap creation form.
2. Client submits the form data to the `createRoadmap` server action.
3. Server action verifies authentication and creates the roadmap in the database.
4. On success, the user is redirected to the new roadmap's page.
5. The dashboard is revalidated to show the new roadmap.

### Updating a Roadmap

1. User edits the roadmap details in the edit form.
2. Client submits the form data to the `updateRoadmap` server action.
3. Server action verifies authentication and ownership, then updates the roadmap.
4. On success, the user is redirected to the roadmap's page.
5. Both the dashboard and roadmap pages are revalidated.

### Deleting a Roadmap

1. User confirms deletion of a roadmap.
2. Client calls the `deleteRoadmap` server action.
3. Server action verifies authentication and ownership, then deletes the roadmap.
4. On success, the user is redirected to the dashboard.
5. The dashboard is revalidated to reflect the deletion.

## Error Handling

Error handling is implemented at multiple levels:

1. **Form Validation**: Client-side validation ensures required fields are filled.
2. **Server Action Errors**: Server actions return structured error objects that are handled by the client.
3. **Not Found Pages**: Custom 404 pages are shown when a roadmap doesn't exist or the user doesn't have access.

## Performance Considerations

1. **Selective Revalidation**: Only affected routes are revalidated when data changes.
2. **Optimistic Updates**: UI updates optimistically before server confirmation for a better user experience.
3. **Pagination**: Roadmap listings are paginated to handle large numbers of roadmaps.

## Security Considerations

1. **Row Level Security**: Database-level security ensures users can only access authorized data.
2. **Input Validation**: All user inputs are validated before processing.
3. **Authentication Checks**: Every server action verifies the user's authentication status.
4. **Authorization Checks**: Access to roadmaps is restricted based on ownership and team membership.

## Conclusion

The Sprint 2 implementation provides a robust foundation for roadmap management, with secure data access controls and efficient data flow. The system is designed to be scalable and maintainable, with clear separation of concerns and proper error handling.

The next sprint will build upon this foundation to implement post management functionality, allowing users to create and manage features and goals within their roadmaps. 