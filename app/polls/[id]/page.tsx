'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePoll, useVoting } from '@/hooks/usePoll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, LoadingSpinner, NotFoundDisplay, PollStatistics, PollActions } from '@/components/shared';
import { useParams, useRouter } from 'next/navigation';
import { Vote } from 'lucide-react';
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
  
  // Poll data and operations
  const { poll, loading, error, refetch } = usePoll(pollId);
  
  // Voting state and operations
  const { hasVoted, voting, submitVote } = useVoting(pollId);
  
  // Local state for selected option
  const [selectedOption, setSelectedOption] = useState<string>('');

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

    const result = await submitVote(selectedOption);
    if (!result.success) {
      alert(result.error || 'Failed to submit vote');
    } else {
      // Refresh poll data to show updated vote counts
      await refetch();
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
    return <LoadingSpinner message="Loading poll..." />;
  }

  // Handle poll not found case
  if (!poll) {
    return (
      <NotFoundDisplay
        title="Poll not found"
        description="The poll you're looking for doesn't exist or has been removed."
        backUrl="/polls"
        backText="Back to Polls"
      />
    );
  }

  // Determine if current user is the poll owner
  const isOwner = user?.id === poll.user_id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Navigation header */}
      <PageHeader
        title={poll.title}
        description={poll.question}
        backUrl="/polls"
        backText="Back to Polls"
      />

      {/* Poll information card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription className="text-lg">
            {poll.question}
          </CardDescription>
          <PollStatistics
            totalVotes={poll.total_votes}
            optionCount={poll.poll_options.length}
            createdAt={poll.created_at}
          />
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
                disabled={!selectedOption || voting}
                className="w-full flex items-center gap-2"
              >
                <Vote className="h-4 w-4" />
                {voting ? 'Submitting...' : 'Submit Vote'}
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
            <PollActions
              pollId={poll.id}
              isOwner={isOwner}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={copyShareLink}
            >
              <span>Copy Link</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
