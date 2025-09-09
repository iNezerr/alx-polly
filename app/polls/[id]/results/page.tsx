'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'next/navigation';
import { ArrowLeft, Share2, QrCode, Trophy, Users } from 'lucide-react';
import Link from 'next/link';

interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

interface Poll {
  id: string;
  title: string;
  question: string;
  created_at: string;
  poll_options: PollOption[];
  total_votes: number;
}

export default function PollResultsPage() {
  const params = useParams();
  const pollId = params.id as string;
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pollId) {
      fetchPollResults();
      
      // Set up real-time subscription for vote updates
      const subscription = supabase
        .channel('poll_votes')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'votes',
            filter: `poll_id=eq.${pollId}`
          }, 
          () => {
            fetchPollResults();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [pollId]);

  const fetchPollResults = async () => {
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
        .eq('id', pollId)
        .single();

      if (error) throw error;

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

      // Sort options by vote count (highest first)
      formattedPoll.poll_options.sort((a, b) => b.votes_count - a.votes_count);

      setPoll(formattedPoll);
    } catch (error) {
      console.error('Error fetching poll results:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/polls/${pollId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading results...</div>
        </div>
      </div>
    );
  }

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

  const winningOption = poll.poll_options[0];
  const maxVotes = Math.max(...poll.poll_options.map(option => option.votes_count));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href={`/polls/${pollId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Poll
        </Link>
      </div>

      {/* Poll Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{poll.title}</CardTitle>
          <CardDescription className="text-lg">
            {poll.question}
          </CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {poll.total_votes} total votes
            </div>
            <span>Created {new Date(poll.created_at).toLocaleDateString()}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Results Summary */}
      {poll.total_votes > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Leading Option
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-muted/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{winningOption.option_text}</h3>
              <div className="text-3xl font-bold text-primary mb-1">
                {Math.round((winningOption.votes_count / poll.total_votes) * 100)}%
              </div>
              <p className="text-muted-foreground">
                {winningOption.votes_count} out of {poll.total_votes} votes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
          <CardDescription>
            Vote distribution for all options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {poll.total_votes === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No votes yet. Share this poll to start collecting responses!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {poll.poll_options.map((option, index) => {
                const percentage = Math.round((option.votes_count / poll.total_votes) * 100);
                const isWinning = option.votes_count === maxVotes && option.votes_count > 0;
                
                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          #{index + 1} {option.option_text}
                        </span>
                        {isWinning && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold">{percentage}%</div>
                        <div className="text-muted-foreground">
                          {option.votes_count} votes
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-muted rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-500 ${
                            isWinning ? 'bg-yellow-500' : 'bg-primary'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Share This Poll</CardTitle>
          <CardDescription>
            Get more votes by sharing with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={copyShareLink}
            >
              <Share2 className="h-4 w-4" />
              Copy Share Link
            </Button>
            
            <Link href={`/polls/${poll.id}/share`}>
              <Button variant="outline" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Generate QR Code
              </Button>
            </Link>
            
            <Link href={`/polls/${poll.id}`}>
              <Button variant="outline">
                Vote on This Poll
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
