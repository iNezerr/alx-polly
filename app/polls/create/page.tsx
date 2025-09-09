'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Create Poll Page Component
 * 
 * Provides a comprehensive interface for authenticated users to create new polls.
 * Handles poll creation with title, question, and multiple options, including
 * dynamic option management and form validation.
 * 
 * Features:
 * - Poll title and question input
 * - Dynamic option management (add/remove options)
 * - Option limit enforcement (2-10 options)
 * - Form validation and error handling
 * - Loading states during submission
 * - Automatic redirection to created poll
 * - Authentication requirement enforcement
 * 
 * @example
 * ```tsx
 * // Access via /polls/create route
 * <CreatePollPage />
 * ```
 */

/**
 * Create Poll Page Component
 * 
 * Renders a form for creating new polls with comprehensive validation,
 * dynamic option management, and seamless integration with the database.
 * 
 * @returns JSX element containing the poll creation form
 */
export default function CreatePollPage() {
  // Authentication and navigation
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Form state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    question: '',
    options: ['', ''] // Start with 2 empty options as minimum requirement
  });

  /**
   * Add Poll Option
   * 
   * Adds a new empty option to the poll form.
   * Enforces maximum limit of 10 options to prevent form bloat.
   */
  const addOption = () => {
    if (formData.options.length < 10) { // Limit to 10 options for UX
      setFormData({
        ...formData,
        options: [...formData.options, '']
      });
    }
  };

  /**
   * Remove Poll Option
   * 
   * Removes an option from the poll form by index.
   * Maintains minimum of 2 options as required for a valid poll.
   * 
   * @param index - Index of the option to remove
   */
  const removeOption = (index: number) => {
    if (formData.options.length > 2) { // Keep minimum 2 options
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions
      });
    }
  };

  /**
   * Update Poll Option
   * 
   * Updates the text content of a specific poll option.
   * 
   * @param index - Index of the option to update
   * @param value - New text value for the option
   */
  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  /**
   * Handle Form Submission
   * 
   * Processes the poll creation form with comprehensive validation and database operations.
   * Creates both the poll record and associated options in a transactional manner.
   * 
   * @param e - React form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure user is authenticated
    if (!user) {
      alert('Please sign in to create a poll');
      return;
    }

    // Validate required fields
    if (!formData.title.trim() || !formData.question.trim()) {
      alert('Please fill in the title and question');
      return;
    }

    // Filter out empty options and validate minimum count
    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    setIsSubmitting(true);

    try {
      /**
       * Create Poll Record
       * 
       * First, create the main poll record with title, question, and user association.
       * Uses Supabase's insert with select to get the created record's ID.
       */
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: formData.title.trim(),
          question: formData.question.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (pollError) throw pollError;

      /**
       * Create Poll Options
       * 
       * Create all poll options in a single batch operation for efficiency.
       * Each option is linked to the poll via poll_id foreign key.
       */
      const optionsData = validOptions.map(option => ({
        poll_id: pollData.id,
        option_text: option.trim()
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsData);

      if (optionsError) throw optionsError;

      // Redirect to the newly created poll
      router.push(`/polls/${pollData.id}`);
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to create a poll</h1>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page header with navigation */}
      <div className="mb-6">
        <Link href="/polls" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Polls
        </Link>
        <h1 className="text-3xl font-bold">Create New Poll</h1>
        <p className="text-muted-foreground">Create a poll and share it with others</p>
      </div>

      {/* Poll creation form */}
      <Card>
        <CardHeader>
          <CardTitle>Poll Details</CardTitle>
          <CardDescription>
            Fill in the details for your poll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Poll title input */}
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input
                id="title"
                placeholder="Enter a catchy title for your poll"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Poll question input */}
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="What question do you want to ask?"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </div>

            {/* Dynamic options management */}
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

              {/* Options list with add/remove functionality */}
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        required
                      />
                    </div>
                    {/* Show remove button only if more than 2 options */}
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
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Add 2-10 options for your poll
              </p>
            </div>

            {/* Form action buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Poll'}
              </Button>
              
              <Link href="/polls">
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
