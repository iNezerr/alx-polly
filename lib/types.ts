/**
 * Shared Type Definitions for ALX Polly App
 * 
 * This module contains all shared TypeScript interfaces and types used throughout
 * the application. Centralizing these definitions ensures consistency and makes
 * maintenance easier.
 * 
 * @see https://www.typescriptlang.org/docs/handbook/interfaces.html
 */

/**
 * User Interface
 * 
 * Represents the authenticated user with essential profile information.
 * This interface abstracts the Supabase user object to provide only
 * the fields needed by the application.
 */
export interface User {
  id: string;
  email: string;
  fullName?: string;
}

/**
 * Poll Option Interface
 * 
 * Represents a single voting option within a poll with vote count information.
 * Used across voting, results, and management interfaces.
 */
export interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

/**
 * Poll Interface
 * 
 * Represents a complete poll with all associated data including options and vote counts.
 * This is the main interface used throughout the application for poll data.
 */
export interface Poll {
  id: string;
  title: string;
  question: string;
  created_at: string;
  user_id: string;
  poll_options: PollOption[];
  total_votes: number;
}

/**
 * Poll Summary Interface
 * 
 * Lightweight poll representation for dashboard and list views.
 * Contains essential information without full poll details.
 */
export interface PollSummary {
  id: string;
  title: string;
  question: string;
  created_at: string;
  options: { id: string; text: string; votes: number }[];
  total_votes: number;
}

/**
 * Create Poll Form Data Interface
 * 
 * Represents the form data structure for creating new polls.
 * Used in the create poll form component.
 */
export interface CreatePollFormData {
  title: string;
  question: string;
  options: string[];
}

/**
 * Edit Poll Form Data Interface
 * 
 * Represents the form data structure for editing existing polls.
 * Includes both existing options and new options to be added.
 */
export interface EditPollFormData {
  title: string;
  question: string;
  options: { id?: string; text: string; isNew?: boolean }[];
}

/**
 * Authentication Context Type
 * 
 * Defines the shape of the authentication context that will be provided
 * to all components in the application tree.
 */
export interface AuthContextType {
  /** Current authenticated user or null if not logged in */
  user: User | null;
  /** Loading state for initial auth check */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  /** Register new user with email, password, and full name */
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  /** Sign out current user */
  signOut: () => Promise<void>;
}

/**
 * API Response Types
 * 
 * Standard response types for API operations to ensure consistent error handling.
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Database Row Types
 * 
 * Raw database row types for Supabase operations.
 * These represent the exact structure returned from database queries.
 */
export interface PollRow {
  id: string;
  title: string;
  question: string;
  created_at: string;
  user_id: string;
}

export interface PollOptionRow {
  id: string;
  poll_id: string;
  option_text: string;
}

export interface VoteRow {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Form Validation Types
 * 
 * Types for form validation and error handling.
 */
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

/**
 * Component Props Types
 * 
 * Common prop types used across components.
 */
export interface LoadingProps {
  loading?: boolean;
}

export interface ErrorProps {
  error?: string | null;
}

export interface PollIdProps {
  pollId: string;
}

/**
 * Utility Types
 * 
 * Helper types for common operations.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
