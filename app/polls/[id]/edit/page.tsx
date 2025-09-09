'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
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
  user_id: string;
  poll_options: PollOption[];
}

export default function EditPollPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    options: [] as { id?: string; text: string; isNew?: boolean }[]
  });

  useEffect(() => {
    if (pollId && user) {
      fetchPoll();
    }
  }, [pollId, user]);

  const fetchPoll = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          id,
          title,
          question,
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

      // Check if user owns this poll
      if (data.user_id !== user?.id) {
        router.push('/polls');
        return;
      }

      const formattedPoll = {
        ...data,
        poll_options: data.poll_options?.map(option => ({
          id: option.id,
          option_text: option.option_text,
          votes_count: option.votes?.[0]?.count || 0
        })) || []
      };

      setPoll(formattedPoll);
      setFormData({
        title: data.title,
        question: data.question,
        options: formattedPoll.poll_options.map(option => ({
          id: option.id,
          text: option.option_text
        }))
      });
    } catch (error) {
      console.error('Error fetching poll:', error);
      router.push('/polls');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, { text: '', isNew: true }]
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !poll) return;

    // Validate form
    if (!formData.title.trim() || !formData.question.trim()) {
      alert('Please fill in the title and question');
      return;
    }

    const validOptions = formData.options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the poll basic info
      const { error: pollError } = await supabase
        .from('polls')
        .update({
          title: formData.title.trim(),
          question: formData.question.trim()
        })
        .eq('id', pollId);

      if (pollError) throw pollError;

      // Handle poll options
      const existingOptions = formData.options.filter(option => option.id);
      const newOptions = formData.options.filter(option => option.isNew && option.text.trim());

      // Update existing options
      for (const option of existingOptions) {
        if (option.id) {
          const { error } = await supabase
            .from('poll_options')
            .update({ option_text: option.text.trim() })
            .eq('id', option.id);
          
          if (error) throw error;
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

        if (error) throw error;
      }

      // Delete removed options (options that were in the original poll but not in the current form)
      const currentOptionIds = existingOptions.map(option => option.id).filter(Boolean);
      const originalOptionIds = poll.poll_options.map(option => option.id);
      const deletedOptionIds = originalOptionIds.filter(id => !currentOptionIds.includes(id));

      if (deletedOptionIds.length > 0) {
        // Note: This will also delete associated votes due to CASCADE
        const { error } = await supabase
          .from('poll_options')
          .delete()
          .in('id', deletedOptionIds);

        if (error) throw error;
      }

      router.push(`/polls/${pollId}`);
    } catch (error) {
      console.error('Error updating poll:', error);
      alert('Failed to update poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to edit polls</h1>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Poll not found or you don't have permission to edit it</h1>
          <Link href="/polls">
            <Button>Back to Polls</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasVotes = poll.poll_options.some(option => option.votes_count > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/polls/${pollId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Poll
        </Link>
        <h1 className="text-3xl font-bold">Edit Poll</h1>
        <p className="text-muted-foreground">Make changes to your poll</p>
      </div>

      {hasVotes && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">⚠️ Warning</CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              This poll has already received votes. Editing options may affect the integrity of existing results.
              Deleted options will remove all associated votes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Poll Details</CardTitle>
          <CardDescription>
            Update your poll information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={formData.options.length >= 10}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {formData.options.map((option, index) => {
                  const originalOption = poll.poll_options.find(o => o.id === option.id);
                  const hasVotesForThisOption = originalOption?.votes_count > 0;
                  
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => updateOption(index, e.target.value)}
                          required
                        />
                        {hasVotesForThisOption && (
                          <p className="text-xs text-muted-foreground mt-1">
                            This option has {originalOption.votes_count} votes
                          </p>
                        )}
                      </div>
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground">
                You can have 2-10 options for your poll
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Link href={`/polls/${pollId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
