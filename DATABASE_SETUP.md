# Database Setup Instructions

## The Issue
Your polls page is stuck on "Loading your polls..." because the required database tables don't exist yet in your Supabase database.

## Solution

### Step 1: Access Your Supabase Dashboard
1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your project: `https://gdrnsffgqepckcidkpvx.supabase.co`

### Step 2: Set Up Database Schema
1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `database_schema.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** to execute the SQL

### Step 3: Verify Setup
1. Go to your app and navigate to `/test-db`
2. Click **"Run Database Test"** to verify all tables are created correctly
3. You should see green checkmarks (✅) for all table tests

### Step 4: Test Your App
1. Go back to `/polls` 
2. The "Loading your polls..." should now resolve
3. You can create your first poll!

## What the Database Schema Creates

The SQL script creates three main tables:

- **`polls`**: Stores poll information (title, question, creator)
- **`poll_options`**: Stores the answer options for each poll  
- **`votes`**: Stores user votes on poll options

It also sets up:
- Row Level Security (RLS) policies for data protection
- Proper foreign key relationships
- Indexes for better performance
- Unique constraints to prevent duplicate votes

## Troubleshooting

If you still see issues after setting up the database:

1. **Check the browser console** (F12) for any error messages
2. **Verify your .env file** has the correct Supabase credentials
3. **Make sure you're logged in** - polls are user-specific
4. **Check the database test page** (`/test-db`) for specific error details

## Need Help?

If you're still having issues, check:
- Supabase project is active (not paused)
- Your API keys are correct in the .env file
- You have the right permissions in Supabase
- The SQL executed without errors
