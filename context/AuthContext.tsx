'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  fullName?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Check for existing session when Supabase is integrated
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Placeholder implementation
    console.log('AuthContext signIn:', { email })
    // TODO: Implement Supabase signInWithPassword
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    // Placeholder implementation
    console.log('AuthContext signUp:', { email, fullName })
    // TODO: Implement Supabase signUp
  }

  const signOut = async () => {
    // Placeholder implementation
    console.log('AuthContext signOut')
    setUser(null)
    // TODO: Implement Supabase signOut
  }

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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
