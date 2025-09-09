/**
 * Custom Hooks for Poll Operations
 * 
 * This module contains custom React hooks that encapsulate common poll-related
 * operations and state management. These hooks provide reusable logic and
 * consistent error handling across components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchPollWithOptions, fetchUserPolls, checkUserVoteStatus } from '@/lib/actions';
import { createPoll, updatePoll, deletePoll, submitVote } from '@/lib/actions';
import { Poll, PollSummary, CreatePollFormData, EditPollFormData, ApiResponse } from '@/lib/types';

/**
 * Hook for managing poll data fetching and operations
 * 
 * Provides a comprehensive interface for poll-related operations including
 * fetching, creating, updating, and deleting polls.
 * 
 * @param pollId - Optional poll ID for single poll operations
 * @returns Object containing poll data, loading states, and operations
 */
export function usePoll(pollId?: string) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoll = useCallback(async () => {
    if (!pollId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const pollData = await fetchPollWithOptions(pollId);
      setPoll(pollData);
    } catch (err) {
      setError('Failed to fetch poll');
      console.error('Error fetching poll:', err);
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const createPollAction = useCallback(async (formData: CreatePollFormData): Promise<ApiResponse<Poll>> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const result = await createPoll(formData, user.id);
    if (result.success) {
      setPoll(result.data || null);
    }
    return result;
  }, [user]);

  const updatePollAction = useCallback(async (formData: EditPollFormData): Promise<ApiResponse> => {
    if (!user || !pollId) {
      return { success: false, error: 'User not authenticated or poll ID missing' };
    }
    
    const result = await updatePoll(pollId, formData, user.id);
    if (result.success) {
      await fetchPoll(); // Refresh poll data
    }
    return result;
  }, [user, pollId, fetchPoll]);

  const deletePollAction = useCallback(async (): Promise<ApiResponse> => {
    if (!user || !pollId) {
      return { success: false, error: 'User not authenticated or poll ID missing' };
    }
    
    return await deletePoll(pollId, user.id);
  }, [user, pollId]);

  return {
    poll,
    loading,
    error,
    refetch: fetchPoll,
    createPoll: createPollAction,
    updatePoll: updatePollAction,
    deletePoll: deletePollAction
  };
}

/**
 * Hook for managing user's polls (dashboard)
 * 
 * Provides functionality for fetching and managing all polls created by the current user.
 * 
 * @returns Object containing user polls, loading state, and operations
 */
export function useUserPolls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const pollsData = await fetchUserPolls(user.id);
      setPolls(pollsData);
    } catch (err) {
      setError('Failed to fetch polls');
      console.error('Error fetching user polls:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const deletePollAction = useCallback(async (pollId: string): Promise<ApiResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const result = await deletePoll(pollId, user.id);
    if (result.success) {
      // Remove poll from local state
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
    }
    return result;
  }, [user]);

  return {
    polls,
    loading,
    error,
    refetch: fetchPolls,
    deletePoll: deletePollAction
  };
}

/**
 * Hook for managing voting operations
 * 
 * Provides functionality for checking vote status and submitting votes.
 * 
 * @param pollId - ID of the poll
 * @returns Object containing vote status, loading state, and voting operations
 */
export function useVoting(pollId: string) {
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkVoteStatus = useCallback(async () => {
    if (!user || !pollId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const voted = await checkUserVoteStatus(pollId, user.id);
      setHasVoted(voted);
    } catch (err) {
      setError('Failed to check vote status');
      console.error('Error checking vote status:', err);
    } finally {
      setLoading(false);
    }
  }, [user, pollId]);

  useEffect(() => {
    checkVoteStatus();
  }, [checkVoteStatus]);

  const submitVoteAction = useCallback(async (optionId: string): Promise<ApiResponse> => {
    if (!user || !pollId) {
      return { success: false, error: 'User not authenticated or poll ID missing' };
    }
    
    setVoting(true);
    setError(null);
    
    try {
      const result = await submitVote(pollId, optionId, user.id);
      if (result.success) {
        setHasVoted(true);
      }
      return result;
    } catch (err) {
      const errorMsg = 'Failed to submit vote';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setVoting(false);
    }
  }, [user, pollId]);

  return {
    hasVoted,
    loading,
    voting,
    error,
    checkVoteStatus,
    submitVote: submitVoteAction
  };
}

/**
 * Hook for managing form state with validation
 * 
 * Provides a generic form state management hook with validation capabilities.
 * 
 * @param initialData - Initial form data
 * @param validator - Optional validation function
 * @returns Object containing form state and operations
 */
export function useFormState<T extends Record<string, any>>(
  initialData: T,
  validator?: (data: T) => { isValid: boolean; errors: Record<string, string> }
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  }, [errors]);

  const updateFormData = useCallback((newData: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  const validate = useCallback(() => {
    if (!validator) return { isValid: true, errors: {} };
    
    const validation = validator(formData);
    setErrors(validation.errors);
    return validation;
  }, [formData, validator]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateField,
    updateFormData,
    validate,
    reset
  };
}

/**
 * Hook for managing async operations with loading and error states
 * 
 * Provides a generic hook for handling async operations with consistent
 * loading and error state management.
 * 
 * @param operation - Async function to execute
 * @returns Object containing operation state and execute function
 */
export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation(...args);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      console.error('Async operation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [operation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
}
