'use client';

import { useAuth } from '@/context/AuthContext';
import { useUserPolls } from '@/hooks/usePoll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, LoadingSpinner, EmptyState, PollStatistics, PollActions } from '@/components/shared';
import Link from 'next/link';
import { Plus, Vote } from 'lucide-react';

/**
 * User Polls Dashboard Component
 * 
 * Provides a comprehensive dashboard for authenticated users to view and manage their polls.
 * Displays all polls created by the current user with statistics and management actions.
 * 
 * Features:
 * - List of all user's polls with metadata (creation date, vote counts, option counts)
 * - Poll management actions (vote, view results, share, edit, delete)
 * - Empty state for new users with call-to-action
 * - Real-time poll statistics
 * - Responsive grid layout for poll cards
 * - Authentication requirement enforcement
 * - Poll deletion with confirmation
 * 
 * @example
 * ```tsx
 * // Access via /polls route
 * <PollsPage />
 * ```
 */

/**
 * User Polls Dashboard Component
 * 
 * Renders a dashboard showing all polls created by the authenticated user.
 * Provides management actions and statistics for each poll.
 * 
 * @returns JSX element containing the polls dashboard
 */
export default function PollsPage() {
  // Authentication state
  const { user, loading } = useAuth();
  
  // Poll data and operations
  const { polls, loading: loadingPolls, error, deletePoll } = useUserPolls();

  /**
   * Handle Poll Deletion
   * 
   * Deletes a poll after user confirmation and updates local state.
   * 
   * @param pollId - ID of the poll to delete
   */
  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    const result = await deletePoll(pollId);
    if (!result.success) {
      alert(result.error || 'Failed to delete poll');
    }
  };

  // Show loading state while checking authentication and fetching polls
  if (loading || loadingPolls) {
    return <LoadingSpinner message="Loading your polls..." />;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your polls</h1>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show error state if there's an error fetching polls
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading polls</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard header with create poll action */}
      <PageHeader
        title="My Polls"
        description="Create and manage your polls"
        backUrl="/"
        backText="Back to Home"
      >
        <Link href="/polls/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Poll
          </Button>
        </Link>
      </PageHeader>

      {polls.length === 0 ? (
        <EmptyState
          icon={Vote}
          title="No polls yet"
          description="Create your first poll to get started"
          actionText="Create Your First Poll"
          actionUrl="/polls/create"
        />
      ) : (
        /**
         * Polls Grid
         * 
         * Displays all user polls in a responsive grid layout.
         * Each poll card shows key information and management actions.
         */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <Card key={poll.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {poll.question}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Poll statistics */}
                  <PollStatistics
                    totalVotes={poll.total_votes}
                    optionCount={poll.options.length}
                    createdAt={poll.created_at}
                  />
                  
                  {/* Poll management actions */}
                  <PollActions
                    pollId={poll.id}
                    isOwner={true}
                    onDelete={() => handleDeletePoll(poll.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
