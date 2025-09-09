import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Configuration and Client Setup
 * 
 * This module initializes the Supabase client for database operations and authentication.
 * It validates required environment variables and exports a configured client instance.
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 * 
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

// Extract Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate required environment variables at startup
// This prevents runtime errors and provides clear error messages
if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Supabase Client Instance
 * 
 * Configured client for all database operations, authentication, and real-time subscriptions.
 * Uses the anonymous key for client-side operations, which respects Row Level Security (RLS) policies.
 * 
 * @example
 * ```typescript
 * // Authentication
 * const { data, error } = await supabase.auth.signInWithPassword({ email, password })
 * 
 * // Database queries
 * const { data, error } = await supabase.from('polls').select('*')
 * 
 * // Real-time subscriptions
 * const subscription = supabase.channel('poll_votes').on('postgres_changes', ...)
 * ```
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Database Type Definitions
 * 
 * TypeScript interface for database schema types.
 * This provides type safety for database operations and helps with IDE autocompletion.
 * 
 * TODO: Add proper database types when schema is finalized
 * Example:
 * ```typescript
 * export type Database = {
 *   public: {
 *     Tables: {
 *       polls: {
 *         Row: { id: string; title: string; question: string; ... }
 *         Insert: { title: string; question: string; ... }
 *         Update: { title?: string; question?: string; ... }
 *       }
 *     }
 *   }
 * }
 * ```
 */
export type Database = {
  // Add your database types here when you create tables
}
