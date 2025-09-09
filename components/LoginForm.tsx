'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Login Form Component
 * 
 * Provides a user interface for authenticating existing users with email and password.
 * Handles form validation, loading states, error display, and successful login redirection.
 * 
 * Features:
 * - Email and password validation
 * - Loading states during authentication
 * - Error message display
 * - Automatic redirection on successful login
 * - Link to registration page for new users
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */

/**
 * Form Data Interface
 * 
 * Defines the structure of the login form data with email and password fields.
 */
interface LoginFormData {
  email: string
  password: string
}

/**
 * Login Form Component
 * 
 * Renders a login form with email and password inputs, handles form submission,
 * manages loading and error states, and redirects users on successful authentication.
 * 
 * @returns JSX element containing the login form
 */
export default function LoginForm() {
  // Form state management
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Authentication context and navigation
  const { signIn } = useAuth()
  const router = useRouter()

  /**
   * Handle Input Change
   * 
   * Updates form data when user types in input fields.
   * Uses functional state update to ensure we get the latest state.
   * 
   * @param e - React change event from input element
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Handle Form Submission
   * 
   * Processes the login form submission by calling the authentication service.
   * Manages loading states, error handling, and successful login redirection.
   * 
   * @param e - React form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Attempt to sign in with provided credentials
      const { error } = await signIn(formData.email, formData.password)
      
      if (error) {
        // Display authentication error to user
        setError(error)
      } else {
        // Redirect to home page on successful login
        router.push('/')
      }
    } catch (err) {
      // Handle unexpected errors (network issues, etc.)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Error message display */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          
          {/* Email input field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
          
          {/* Password input field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {/* Submit button with loading state */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          
          {/* Link to registration page */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
