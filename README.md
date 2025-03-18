# DX Roadmap Application

A comprehensive roadmap management application built with Next.js, React, and Supabase.

## Features

- Create and manage roadmaps with posts and statuses
- Kanban board for organizing posts by status
- User authentication and authorization
- Collaboration on public roadmaps

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Shadcn UI
- **Backend**: Supabase (Auth, Database, Storage)
- **Languages**: TypeScript, SQL
- **Deployment**: Vercel (or your preferred hosting)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dx-roadmap.git
   cd dx-roadmap
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Set up the database:
   - Create a new Supabase project
   - Run the SQL scripts in the `scripts` directory to set up tables and policies
   - Start with `scripts/db-schema.sql` to create the initial schema

### Development

Run the development server:
```
npm run dev
```

Visit http://localhost:3000 to see the application.

## Database Setup

The application requires specific tables and relationships in Supabase:

1. **Users**: Handled by Supabase Auth
2. **Roadmaps**: For storing roadmap information
3. **Statuses**: For organizing posts (e.g., To Do, In Progress, Done)
4. **Posts**: The main content items in roadmaps

To set up the database manually, run the SQL in `scripts/db-schema.sql` through the Supabase SQL editor.

## Comments Feature

The application includes a commenting system for posts, allowing users to discuss each post. To enable this feature, you need to run the database setup script.

### Database Setup for Comments

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Run the full `scripts/db-schema.sql` script

This will:
- Create the `comments` table for storing comments
- Create the `users` table to mirror data from `auth.users`
- Set up a trigger to automatically sync user data from auth to public schema
- Establish proper Row Level Security policies

### How the Comments System Works

- Users can add comments to any post they can view
- Comments support threaded replies (one level deep)
- Only the comment author can edit their comments
- Both the comment author and roadmap owner can delete comments
- Comments show user avatars and names from their profile

## Common Issues and Solutions

### Relationship Errors

If you encounter relationship errors like:
```
Could not find a relationship between 'posts' and 'assignee_id' in the schema cache
```

This indicates that your database schema doesn't have the necessary foreign key relationships defined. Run the database setup scripts to fix this.

### Authentication Issues

Make sure your Supabase authentication is set up correctly with the appropriate redirect URLs. The app uses email-based auth by default.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
