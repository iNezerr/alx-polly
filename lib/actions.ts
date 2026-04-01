/**
 * Database Utilities and Server Actions
 * 
 * This module contains shared database operations and Server Actions for the ALX Polly app.
 * Server Actions provide a secure way to handle database mutations from client components.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutators
 */

'use server';

import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { Poll, PollOption, CreatePollFormData, EditPollFormData, ApiResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create Poll
 * 
 * Creates a new poll with associated options. The authenticated user is derived
 * from the request session; no `userId` is accepted from the client.
 * If creating the options fails, the poll row is deleted to keep the data consistent.
 * 
 * @param formData - Poll creation form data
 * @returns Promise resolving to API response with poll data or error
 */
export async function createPoll(
  formData: CreatePollFormData
): Promise<ApiResponse<Poll>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be signed in to create a poll' };
    }

    // Validate input data
    if (!formData.title.trim() || !formData.question.trim()) {
      return {
        success: false,
        error: 'Title and question are required'
      };
    }

    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      return {
        success: false,
        error: 'At least 2 options are required'
      };
    }

    // Create the poll record
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: formData.title.trim(),
        question: formData.question.trim(),
        user_id: user.id
      })
      .select()
      .single();

    if (pollError) {
      console.error('Error creating poll:', pollError);
      return {
        success: false,
        error: 'Failed to create poll'
      };
    }

    // Create poll options
    const optionsData = validOptions.map(option => ({
      poll_id: pollData.id,
      option_text: option.trim()
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      // Compensating delete: remove the poll so no orphaned poll rows remain
      await supabase.from('polls').delete().eq('id', pollData.id);
      return {
        success: false,
        error: 'Failed to create poll options'
      };
    }

    // Revalidate the polls page to show the new poll
    revalidatePath('/polls');

    return {
      success: true,
      data: pollData
    };
  } catch (error) {
    console.error('Unexpected error creating poll:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Server Action: Update Poll
 * 
 * Updates an existing poll with new title, question, and options.
 * Handles complex option management including additions, updates, and deletions.
 * Options removed from `formData.options` are deleted from the database (and their
 * votes cascade-deleted per the schema's ON DELETE CASCADE constraint).
 * The authenticated user is derived from the request session.
 * 
 * @param pollId - ID of the poll to update
 * @param formData - Updated poll form data
 * @returns Promise resolving to API response
 */
export async function updatePoll(
  pollId: string,
  formData: EditPollFormData
): Promise<ApiResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be signed in to update a poll' };
    }

    // Validate input data
    if (!formData.title.trim() || !formData.question.trim()) {
      return {
        success: false,
        error: 'Title and question are required'
      };
    }

    const validOptions = formData.options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      return {
        success: false,
        error: 'At least 2 options are required'
      };
    }

    // Verify user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll || poll.user_id !== user.id) {
      return {
        success: false,
        error: 'Poll not found or access denied'
      };
    }

    // Update poll basic information
    const { error: updateError } = await supabase
      .from('polls')
      .update({
        title: formData.title.trim(),
        question: formData.question.trim()
      })
      .eq('id', pollId);

    if (updateError) {
      console.error('Error updating poll:', updateError);
      return {
        success: false,
        error: 'Failed to update poll'
      };
    }

    // Fetch current option IDs from the database
    const { data: currentOptions, error: fetchOptionsError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId);

    if (fetchOptionsError) {
      return { success: false, error: 'Failed to fetch poll options' };
    }

    // Determine which options have been removed
    const incomingOptionIds = new Set(
      formData.options.filter(o => o.id).map(o => o.id as string)
    );
    const optionIdsToDelete = (currentOptions ?? [])
      .map(o => o.id)
      .filter(id => !incomingOptionIds.has(id));

    // Delete removed options (votes cascade-delete per schema ON DELETE CASCADE)
    if (optionIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('poll_options')
        .delete()
        .in('id', optionIdsToDelete);

      if (deleteError) {
        console.error('Error deleting removed options:', deleteError);
        return { success: false, error: 'Failed to delete removed options' };
      }
    }

    // Handle poll options updates
    const existingOptions = formData.options.filter(option => option.id);
    const newOptions = formData.options.filter(option => option.isNew && option.text.trim());

    // Update existing options
    for (const option of existingOptions) {
      if (option.id) {
        const { error } = await supabase
          .from('poll_options')
          .update({ option_text: option.text.trim() })
          .eq('id', option.id);
        
        if (error) {
          console.error('Error updating option:', error);
          return {
            success: false,
            error: 'Failed to update poll options'
          };
        }
      }
    }

    // Add new options
    if (newOptions.length > 0) {
      const optionsData = newOptions.map(option => ({
        poll_id: pollId,
        option_text: option.text.trim()
      }));

      const { error } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (error) {
        console.error('Error adding new options:', error);
        return {
          success: false,
          error: 'Failed to add new options'
        };
      }
    }

    // Revalidate relevant pages
    revalidatePath('/polls');
    revalidatePath(`/polls/${pollId}`);

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error updating poll:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Server Action: Delete Poll
 * 
 * Deletes a poll and all associated data (options, votes).
 * The authenticated user is derived from the request session.
 * 
 * @param pollId - ID of the poll to delete
 * @returns Promise resolving to API response
 */
export async function deletePoll(
  pollId: string
): Promise<ApiResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be signed in to delete a poll' };
    }

    // Verify user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll || poll.user_id !== user.id) {
      return {
        success: false,
        error: 'Poll not found or access denied'
      };
    }

    // Delete the poll (CASCADE will handle options and votes)
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) {
      console.error('Error deleting poll:', error);
      return {
        success: false,
        error: 'Failed to delete poll'
      };
    }

    // Revalidate the polls page
    revalidatePath('/polls');

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error deleting poll:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Server Action: Submit Vote
 * 
 * Records a user's vote for a specific poll option.
 * The authenticated user is derived from the request session.
 * 
 * @param pollId - ID of the poll being voted on
 * @param optionId - ID of the selected option
 * @returns Promise resolving to API response
 */
export async function submitVote(
  pollId: string,
  optionId: string
): Promise<ApiResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be signed in to vote' };
    }

    // Verify the poll and option exist
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return {
        success: false,
        error: 'Poll not found'
      };
    }

    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id, poll_id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .single();

    if (optionError || !option) {
      return {
        success: false,
        error: 'Invalid option selected'
      };
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      return {
        success: false,
        error: 'You have already voted on this poll'
      };
    }

    // Submit the vote
    const { error } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id
      });

    if (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        error: 'Failed to submit vote'
      };
    }

    // Revalidate poll pages to show updated results
    revalidatePath(`/polls/${pollId}`);
    revalidatePath(`/polls/${pollId}/results`);

    return {
      success: true
    };
  } catch (error) {
    console.error('Unexpected error submitting vote:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Database Query: Fetch Poll with Options
 * 
 * Retrieves a complete poll with options and vote counts.
 * Returns a typed ApiResponse so callers can distinguish "not found" from
 * "request failed" and render the appropriate UI state.
 * 
 * @param pollId - ID of the poll to fetch
 * @returns Promise resolving to ApiResponse containing poll data or an error message
 */
export async function fetchPollWithOptions(pollId: string): Promise<ApiResponse<Poll>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        question,
        created_at,
        user_id,
        poll_options (
          id,
          option_text,
          votes (count)
        )
      `)
      .eq('id', pollId)
      .single();

    if (error) {
      console.error('Error fetching poll:', error);
      return { success: false, error: 'Failed to fetch poll' };
    }

    if (!data) {
      return { success: false, error: 'Poll not found' };
    }

    // Transform the data to match our Poll interface
    const formattedPoll: Poll = {
      ...data,
      poll_options: data.poll_options?.map((option: any) => ({
        id: option.id,
        option_text: option.option_text,
        votes_count: option.votes?.[0]?.count || 0
      })) || [],
      total_votes: data.poll_options?.reduce((total: number, option: any) => 
        total + (option.votes?.[0]?.count || 0), 0) || 0
    };

    return { success: true, data: formattedPoll };
  } catch (error) {
    console.error('Unexpected error fetching poll:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Database Query: Fetch User Polls
 * 
 * Retrieves all polls created by the currently authenticated user with vote statistics.
 * Returns a typed ApiResponse so callers can distinguish an empty list from a
 * network/server error and render the appropriate UI state.
 * 
 * @returns Promise resolving to ApiResponse containing the user's polls or an error message
 */
export async function fetchUserPolls(): Promise<ApiResponse<{
  id: string;
  title: string;
  question: string;
  created_at: string;
  options: { id: string; text: string; votes: number }[];
  total_votes: number;
}[]>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be signed in to view your polls' };
    }

    const { data, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        question,
        created_at,
        poll_options (
          id,
          option_text,
          votes (count)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user polls:', error);
      return { success: false, error: 'Failed to fetch your polls' };
    }

    // Transform data for dashboard display
    const polls = (data ?? []).map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      question: poll.question,
      created_at: poll.created_at,
      options: poll.poll_options?.map((option: any) => ({
        id: option.id,
        text: option.option_text,
        votes: option.votes?.[0]?.count || 0
      })) || [],
      total_votes: poll.poll_options?.reduce((total: number, option: any) => 
        total + (option.votes?.[0]?.count || 0), 0) || 0
    }));

    return { success: true, data: polls };
  } catch (error) {
    console.error('Unexpected error fetching user polls:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Database Query: Check User Vote Status
 * 
 * Determines if the authenticated user has already voted on a specific poll.
 * 
 * @param pollId - ID of the poll
 * @returns Promise resolving to boolean indicating if the current user has voted
 */
export async function checkUserVoteStatus(pollId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    return !!data;
  } catch {
    // User hasn't voted yet – this is expected for new users
    return false;
  }
}
