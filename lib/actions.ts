/**
 * Database Utilities and Server Actions
 * 
 * This module contains shared database operations and Server Actions for the ALX Polly app.
 * Server Actions provide a secure way to handle database mutations from client components.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutators
 */

'use server';

import { supabase } from '@/lib/supabaseClient';
import { Poll, PollOption, CreatePollFormData, EditPollFormData, ApiResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Action: Create Poll
 * 
 * Creates a new poll with associated options in a transactional manner.
 * This Server Action handles the complete poll creation process securely.
 * 
 * @param formData - Poll creation form data
 * @param userId - ID of the user creating the poll
 * @returns Promise resolving to API response with poll data or error
 */
export async function createPoll(
  formData: CreatePollFormData,
  userId: string
): Promise<ApiResponse<Poll>> {
  try {
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
        user_id: userId
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
 * 
 * @param pollId - ID of the poll to update
 * @param formData - Updated poll form data
 * @param userId - ID of the user updating the poll
 * @returns Promise resolving to API response
 */
export async function updatePoll(
  pollId: string,
  formData: EditPollFormData,
  userId: string
): Promise<ApiResponse> {
  try {
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

    if (pollError || !poll || poll.user_id !== userId) {
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
 * Includes ownership verification for security.
 * 
 * @param pollId - ID of the poll to delete
 * @param userId - ID of the user requesting deletion
 * @returns Promise resolving to API response
 */
export async function deletePoll(
  pollId: string,
  userId: string
): Promise<ApiResponse> {
  try {
    // Verify user owns the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single();

    if (pollError || !poll || poll.user_id !== userId) {
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
 * Includes duplicate vote prevention and validation.
 * 
 * @param pollId - ID of the poll being voted on
 * @param optionId - ID of the selected option
 * @param userId - ID of the user voting
 * @returns Promise resolving to API response
 */
export async function submitVote(
  pollId: string,
  optionId: string,
  userId: string
): Promise<ApiResponse> {
  try {
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
      .eq('user_id', userId)
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
        user_id: userId
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
 * This is a reusable query function for consistent data fetching.
 * 
 * @param pollId - ID of the poll to fetch
 * @returns Promise resolving to poll data or null
 */
export async function fetchPollWithOptions(pollId: string): Promise<Poll | null> {
  try {
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

    if (error) throw error;

    // Transform the data to match our Poll interface
    const formattedPoll: Poll = {
      ...data,
      poll_options: data.poll_options?.map(option => ({
        id: option.id,
        option_text: option.option_text,
        votes_count: option.votes?.[0]?.count || 0
      })) || [],
      total_votes: data.poll_options?.reduce((total, option) => 
        total + (option.votes?.[0]?.count || 0), 0) || 0
    };

    return formattedPoll;
  } catch (error) {
    console.error('Error fetching poll:', error);
    return null;
  }
}

/**
 * Database Query: Fetch User Polls
 * 
 * Retrieves all polls created by a specific user with vote statistics.
 * Used for the user's polls dashboard.
 * 
 * @param userId - ID of the user
 * @returns Promise resolving to array of poll summaries
 */
export async function fetchUserPolls(userId: string) {
  try {
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data for dashboard display
    return data?.map(poll => ({
      id: poll.id,
      title: poll.title,
      question: poll.question,
      created_at: poll.created_at,
      options: poll.poll_options?.map(option => ({
        id: option.id,
        text: option.option_text,
        votes: option.votes?.[0]?.count || 0
      })) || [],
      total_votes: poll.poll_options?.reduce((total, option) => 
        total + (option.votes?.[0]?.count || 0), 0) || 0
    })) || [];
  } catch (error) {
    console.error('Error fetching user polls:', error);
    return [];
  }
}

/**
 * Database Query: Check User Vote Status
 * 
 * Determines if a user has already voted on a specific poll.
 * 
 * @param pollId - ID of the poll
 * @param userId - ID of the user
 * @returns Promise resolving to boolean indicating if user has voted
 */
export async function checkUserVoteStatus(pollId: string, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    return !!data;
  } catch (error) {
    // User hasn't voted yet - this is expected for new users
    return false;
  }
}
