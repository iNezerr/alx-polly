'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User, AuthContextType } from '@/lib/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Authentication Context and Provider
 * 
 * This module provides centralized authentication state management for the entire application.
 * It handles user sessions, authentication methods, and provides a React context for
 * accessing auth state throughout the component tree.
 * 
 * Key Features:
 * - Automatic session restoration on app load
 * - Real-time auth state changes via Supabase listeners
 * - Type-safe authentication methods
 * - Error handling for auth operations
 * 
 * @see https://supabase.com/docs/guides/auth/auth-helpers/nextjs
 */

// Create the authentication context with undefined default value
// This ensures useAuth hook throws an error if used outside AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and methods to all child components.
 * Manages user session state, handles auth state changes, and provides authentication methods.
 * 
 * @param children - React components that will have access to auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /**
     * Initialize Authentication Session
     * 
     * Checks for existing session on app load and sets up real-time auth state listener.
     * This ensures users stay logged in across browser sessions and tabs.
     */
    const getInitialSession = async () => {
      try {
        // Get current session from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Extract user data from session and set in state
          setUser({
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name
          })
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    /**
     * Real-time Authentication State Listener
     * 
     * Listens for auth state changes (sign in, sign out, token refresh) and updates
     * the local state accordingly. This provides seamless auth experience across tabs.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // User signed in or session restored
          setUser({
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name
          })
        } else {
          // User signed out or session expired
          setUser(null)
        }
        setLoading(false)
      }
    )

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Sign In Method
   * 
   * Authenticates user with email and password using Supabase Auth.
   * Returns error object if authentication fails, empty object if successful.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to error object or empty object
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  /**
   * Sign Up Method
   * 
   * Registers a new user with email, password, and full name.
   * Includes user metadata for profile information.
   * 
   * @param email - User's email address
   * @param password - User's password (minimum 6 characters)
   * @param fullName - User's full name for profile
   * @returns Promise resolving to error object or empty object
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  /**
   * Sign Out Method
   * 
   * Signs out the current user and clears the session.
   * Handles errors gracefully to prevent app crashes.
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Context value containing all auth state and methods
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Authentication Hook
 * 
 * Custom hook to access authentication context throughout the application.
 * Provides type safety and ensures the hook is only used within AuthProvider.
 * 
 * @returns Authentication context with user state and methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth()
 *   
 *   if (!user) {
 *     return <LoginForm onSignIn={signIn} />
 *   }
 *   
 *   return <Dashboard user={user} onSignOut={signOut} />
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
