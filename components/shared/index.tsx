/**
 * Shared UI Components
 * 
 * This module contains reusable UI components that are used across multiple pages.
 * These components follow consistent patterns and provide better maintainability.
 */

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * Loading Spinner Component
 * 
 * A consistent loading indicator used throughout the application.
 * 
 * @param message - Optional loading message to display
 * @returns JSX element containing the loading spinner
 */
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-lg text-muted-foreground">{message}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Display Component
 * 
 * A consistent error message display component.
 * 
 * @param error - Error message to display
 * @param onRetry - Optional retry function
 * @returns JSX element containing the error message
 */
export function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void; 
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Error</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Not Found Display Component
 * 
 * A consistent "not found" message display component.
 * 
 * @param title - Title for the not found message
 * @param description - Description of what wasn't found
 * @param backUrl - URL to navigate back to
 * @param backText - Text for the back button
 * @returns JSX element containing the not found message
 */
export function NotFoundDisplay({ 
  title = 'Not Found',
  description = 'The requested resource could not be found.',
  backUrl = '/polls',
  backText = 'Back to Polls'
}: {
  title?: string;
  description?: string;
  backUrl?: string;
  backText?: string;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground mb-6">{description}</p>
        <Link href={backUrl}>
          <Button>{backText}</Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Page Header Component
 * 
 * A consistent page header with navigation and title.
 * 
 * @param title - Page title
 * @param description - Optional page description
 * @param backUrl - Optional back navigation URL
 * @param backText - Text for the back button
 * @param children - Optional additional content (like action buttons)
 * @returns JSX element containing the page header
 */
export function PageHeader({ 
  title, 
  description, 
  backUrl, 
  backText = 'Back',
  children 
}: {
  title: string;
  description?: string;
  backUrl?: string;
  backText?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {backUrl && (
        <Link 
          href={backUrl} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {backText}
        </Link>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {children && (
          <div className="flex gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Poll Statistics Component
 * 
 * Displays poll statistics in a consistent format.
 * 
 * @param totalVotes - Total number of votes
 * @param optionCount - Number of options
 * @param createdAt - Creation date
 * @returns JSX element containing poll statistics
 */
export function PollStatistics({ 
  totalVotes, 
  optionCount, 
  createdAt 
}: {
  totalVotes: number;
  optionCount: number;
  createdAt: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm text-muted-foreground">
      <div className="flex gap-4">
        <span>{optionCount} options</span>
        <span>{totalVotes} votes</span>
      </div>
      <span>Created {new Date(createdAt).toLocaleDateString()}</span>
    </div>
  );
}

/**
 * Poll Actions Component
 * 
 * Displays common poll action buttons in a consistent layout.
 * 
 * @param pollId - ID of the poll
 * @param isOwner - Whether the current user owns the poll
 * @param onDelete - Optional delete handler
 * @returns JSX element containing poll action buttons
 */
export function PollActions({ 
  pollId, 
  isOwner = false, 
  onDelete 
}: {
  pollId: string;
  isOwner?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/polls/${pollId}`}>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <span>Vote</span>
        </Button>
      </Link>
      
      <Link href={`/polls/${pollId}/results`}>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <span>Results</span>
        </Button>
      </Link>
      
      <Link href={`/polls/${pollId}/share`}>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <span>Share</span>
        </Button>
      </Link>
      
      {isOwner && (
        <>
          <Link href={`/polls/${pollId}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <span>Edit</span>
            </Button>
          </Link>
          
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              <span>Delete</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Empty State Component
 * 
 * Displays an empty state message with optional call-to-action.
 * 
 * @param icon - Icon component to display
 * @param title - Title for the empty state
 * @param description - Description text
 * @param actionText - Text for the action button
 * @param actionUrl - URL for the action button
 * @returns JSX element containing the empty state
 */
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  actionUrl 
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Link href={actionUrl}>
        <Button>{actionText}</Button>
      </Link>
    </div>
  );
}

/**
 * Warning Card Component
 * 
 * Displays a warning message in a consistent card format.
 * 
 * @param title - Warning title
 * @param description - Warning description
 * @returns JSX element containing the warning card
 */
export function WarningCard({ 
  title, 
  description 
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <CardHeader>
        <CardTitle className="text-yellow-800 dark:text-yellow-200">
          ⚠️ {title}
        </CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-300">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
