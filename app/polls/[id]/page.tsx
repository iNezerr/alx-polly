'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, QrCode, Edit, Share2, Vote } from 'lucide-react';
import Link from 'next/link';

/**
 * Poll Display and Voting Page Component
 * 
 * Provides a comprehensive interface for viewing polls and casting votes.
 * Handles both voting functionality for authenticated users and results display
 * for users who have already voted or are poll owners.
 * 
 * Features:
 * - Poll information display (title, question, creation date, vote count)
 * - Interactive voting interface with radio button selection
 * - Real-time vote count updates
 * - Authentication requirement for voting
 * - Duplicate vote prevention
 * - Results visualization with progress bars
 * - Poll management actions (share, edit, view results)
 * - Owner-specific functionality
 * 
 * @example
 * ```tsx
 * // Access via /polls/[id] route
 * <PollPage />
 * ```
 */

/**
 * Poll Option Interface
 * 
 * Represents a single voting option within a poll with vote count information.
 */
interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

/**
 * Poll Interface
 * 
 * Represents a complete poll with all associated data including options and vote counts.
 */
interface Poll {
  id: string;
  title: string;
  question: string;
  created_at: string;
  user_id: string;
  poll_options: PollOption[];
  total_votes: number;
}

/**
 * Poll Page Component
 * 
 * Renders a poll with voting interface or results display based on user state.
 * Manages voting logic, authentication checks, and real-time data updates.
 * 
 * @returns JSX element containing the poll display and voting interface
 */
export default function PollPage() {
  // Authentication and routing
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  
  // Component state management
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
      checkIfUserVoted();
    }
  }, [pollId, user]);

  /**
   * Fetch Poll Data
   * 
   * Retrieves poll information including options and vote counts from the database.
   * Uses Supabase's relational queries to fetch poll options and aggregate vote counts.
   * Handles data transformation to create a complete poll object with vote statistics.
   */
  const fetchPoll = async () => {
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

      /**
       * Transform Poll Data
       * 
       * Processes the raw database response to create a structured poll object.
       * Extracts vote counts from nested vote aggregations and calculates total votes.
       */
      const formattedPoll = {
        ...data,
        poll_options: data.poll_options?.map(option => ({
          id: option.id,
          option_text: option.option_text,
          votes_count: option.votes?.[0]?.count || 0
        })) || [],
        total_votes: data.poll_options?.reduce((total, option) => 
          total + (option.votes?.[0]?.count || 0), 0) || 0
      };

      setPoll(formattedPoll);
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check User Vote Status
   * 
   * Determines if the current authenticated user has already voted on this poll.
   * This prevents duplicate voting and determines the UI state (voting vs results).
   */
  const checkIfUserVoted = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setHasVoted(true);
      }
    } catch (error) {
      // User hasn't voted yet - this is expected for new users
      // Error is caught silently as it's not an actual error condition
    }
  };

  /**
   * Handle Vote Submission
   * 
   * Processes user vote submission with comprehensive validation and error handling.
   * Ensures authentication, prevents duplicate voting, and updates poll data.
   */
  const handleVote = async () => {
    // Validate option selection
    if (!selectedOption) {
      alert('Please select an option to vote');
      return;
    }

    // Ensure user is authenticated
    if (!user) {
      alert('Please sign in to vote');
      router.push('/auth/login');
      return;
    }

    setIsVoting(true);

    try {
      /**
       * Submit Vote to Database
       * 
       * Creates a new vote record linking the user, poll, and selected option.
       * Database constraints prevent duplicate votes from the same user.
       */
      const { error } = await supabase
        .from('votes')
        .insert({
          poll_id: pollId,
          option_id: selectedOption,
          user_id: user.id
        });

      if (error) throw error;

      // Update local state to reflect successful vote
      setHasVoted(true);
      await fetchPoll(); // Refresh poll data to show updated vote counts
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to submit vote. You may have already voted on this poll.');
    } finally {
      setIsVoting(false);
    }
  };

  /**
   * Copy Share Link
   * 
   * Copies the current poll URL to the user's clipboard for easy sharing.
   * Provides user feedback through browser alert.
   */
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/polls/${pollId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  // Show loading state while fetching poll data
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading poll...</div>
        </div>
      </div>
    );
  }

  // Handle poll not found case
  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Poll not found</h1>
          <Link href="/polls">
            <Button>Back to Polls</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determine if current user is the poll owner
  const isOwner = user?.id === poll.user_id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Navigation header */}
      <div className="mb-6">
        <Link href="/polls" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Polls
        </Link>
      </div>

      {/* Poll information card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription className="text-lg">
            {poll.question}
          </CardDescription>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
            <span>{poll.total_votes} total votes</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!hasVoted && !isOwner ? (
            /**
             * Voting Interface
             * 
             * Displays interactive voting options for users who haven't voted yet.
             * Shows radio buttons for option selection and submit button.
             */
            <div className="space-y-4">
              <h3 className="font-semibold">Cast your vote:</h3>
              <div className="space-y-2">
                {poll.poll_options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="poll-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="text-primary"
                    />
                    <span className="flex-1">{option.option_text}</span>
                  </label>
                ))}
              </div>
              
              <Button
                onClick={handleVote}
                disabled={!selectedOption || isVoting}
                className="w-full flex items-center gap-2"
              >
                <Vote className="h-4 w-4" />
                {isVoting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            /**
             * Results Display
             * 
             * Shows poll results with vote counts and percentages for users who have voted
             * or are poll owners. Includes visual progress bars for easy interpretation.
             */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  {hasVoted ? 'Thank you for voting! Here are the current results:' : 'Current Results:'}
                </h3>
              </div>
              
              <div className="space-y-3">
                {poll.poll_options.map((option) => {
                  const percentage = poll.total_votes > 0 
                    ? Math.round((option.votes_count / poll.total_votes) * 100)
                    : 0;
                  
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{option.option_text}</span>
                        <span>{option.votes_count} votes ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action buttons for poll management */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Link href={`/polls/${poll.id}/results`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Detailed Results
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={copyShareLink}
            >
              <Share2 className="h-3 w-3" />
              Share Link
            </Button>
            
            <Link href={`/polls/${poll.id}/share`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <QrCode className="h-3 w-3" />
                QR Code
              </Button>
            </Link>
            
            {/* Show edit button only for poll owners */}
            {isOwner && (
              <Link href={`/polls/${poll.id}/edit`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Edit className="h-3 w-3" />
                  Edit Poll
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
