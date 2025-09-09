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
 * Registration Form Component
 * 
 * Provides a user interface for creating new user accounts with email, password,
 * and full name. Includes comprehensive form validation and user feedback.
 * 
 * Features:
 * - Full name, email, and password fields
 * - Password confirmation validation
 * - Password strength requirements (minimum 6 characters)
 * - Real-time form validation
 * - Loading states during registration
 * - Success and error message display
 * - Automatic redirection to login after successful registration
 * 
 * @example
 * ```tsx
 * <RegisterForm />
 * ```
 */

/**
 * Form Data Interface
 * 
 * Defines the structure of the registration form data including all required fields
 * and password confirmation for validation.
 */
interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

/**
 * Registration Form Component
 * 
 * Renders a registration form with comprehensive validation, handles form submission,
 * manages loading and error states, and provides user feedback throughout the process.
 * 
 * @returns JSX element containing the registration form
 */
export default function RegisterForm() {
  // Form state management
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Authentication context and navigation
  const { signUp } = useAuth()
  const router = useRouter()

  /**
   * Handle Input Change
   * 
   * Updates form data when user types in input fields.
   * Clears any existing error messages when user starts typing.
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
   * Validate Form Data
   * 
   * Performs client-side validation on form data before submission.
   * Checks password match, minimum length, and required fields.
   * 
   * @returns boolean indicating if form is valid
   */
  const validateForm = (): boolean => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    // Check password minimum length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    
    // Check if full name is provided
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    
    return true
  }

  /**
   * Handle Form Submission
   * 
   * Processes the registration form submission with validation, calls the authentication
   * service, and manages success/error states with appropriate user feedback.
   * 
   * @param e - React form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Perform client-side validation first
    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      // Attempt to create new user account
      const { error } = await signUp(formData.email, formData.password, formData.fullName)
      
      if (error) {
        // Display registration error to user
        setError(error)
      } else {
        // Show success message and redirect to login
        setSuccess('Account created successfully! Please check your email to verify your account.')
        // Optional: redirect to login after a delay
        setTimeout(() => router.push('/auth/login'), 3000)
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
        <CardTitle className="text-2xl font-bold">Create account</CardTitle>
        <CardDescription>
          Enter your details to create your ALX Polly account
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
          
          {/* Success message display */}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
          
          {/* Full name input field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          </div>

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
          
          {/* Password input field with validation hint */}
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
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>

          {/* Password confirmation field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
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
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
          
          {/* Link to login page */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
