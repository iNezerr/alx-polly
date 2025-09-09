'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Vote, BarChart3, QrCode, Edit, Trash2 } from 'lucide-react';

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
 * Poll Interface for Dashboard
 * 
 * Represents a poll in the dashboard context with aggregated statistics.
 * Includes vote counts and option information for display purposes.
 */
interface Poll {
  id: string;
  title: string;
  question: string;
  created_at: string;
  options: { id: string; text: string; votes: number }[];
  total_votes: number;
}

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
  
  // Component state management
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPolls();
    } else if (!loading) {
      // If we're not loading and there's no user, stop loading polls
      setLoadingPolls(false);
    }
  }, [user, loading]);

  /**
   * Fetch User's Polls
   * 
   * Retrieves all polls created by the current authenticated user.
   * Includes poll options and vote counts through relational queries.
   * Transforms data for dashboard display with aggregated statistics.
   */
  const fetchPolls = async () => {
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
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false }); // Show newest polls first
      
      if (error) throw error;

      /**
       * Transform Poll Data for Dashboard
       * 
       * Processes raw database response to create dashboard-friendly poll objects.
       * Calculates vote counts and formats option data for display.
       */
      const formattedPolls = data?.map(poll => ({
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

      setPolls(formattedPolls);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoadingPolls(false);
    }
  };

  /**
   * Delete Poll
   * 
   * Removes a poll from the database after user confirmation.
   * Updates local state to reflect the deletion immediately.
   * 
   * @param pollId - ID of the poll to delete
   */
  const deletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;

      // Update local state to remove deleted poll
      setPolls(polls.filter(poll => poll.id !== pollId));
    } catch (error) {
      console.error('Error deleting poll:', error);
    }
  };

  // Show loading state while checking authentication and fetching polls
  if (loading || loadingPolls) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading your polls...</div>
        </div>
      </div>
    );
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard header with create poll action */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Polls</h1>
          <p className="text-muted-foreground">Create and manage your polls</p>
        </div>
        <Link href="/polls/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Poll
          </Button>
        </Link>
      </div>

      {polls.length === 0 ? (
        /**
         * Empty State
         * 
         * Displays when user has no polls yet, encouraging them to create their first poll.
         * Provides clear call-to-action and helpful messaging.
         */
        <div className="text-center py-12">
          <Vote className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No polls yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first poll to get started
          </p>
          <Link href="/polls/create">
            <Button>Create Your First Poll</Button>
          </Link>
        </div>
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
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{poll.options.length} options</span>
                    <span>{poll.total_votes} votes</span>
                  </div>
                  
                  {/* Poll management actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/polls/${poll.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Vote className="h-3 w-3" />
                        Vote
                      </Button>
                    </Link>
                    
                    <Link href={`/polls/${poll.id}/results`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Results
                      </Button>
                    </Link>
                    
                    <Link href={`/polls/${poll.id}/share`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        Share
                      </Button>
                    </Link>
                    
                    <Link href={`/polls/${poll.id}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      onClick={() => deletePoll(poll.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                  
                  {/* Poll creation date */}
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(poll.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
