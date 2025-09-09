'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useParams } from 'next/navigation';
import { ArrowLeft, Share2, Copy, Download, QrCode } from 'lucide-react';
import Link from 'next/link';

/**
 * Poll Sharing Page Component
 * 
 * Provides comprehensive sharing functionality for polls including link sharing,
 * QR code generation, and web share API integration. Enables easy distribution
 * of polls across different platforms and devices.
 * 
 * Features:
 * - Shareable poll link generation
 * - QR code generation for mobile access
 * - Clipboard integration for easy copying
 * - Web Share API support for native sharing
 * - QR code download functionality
 * - Fallback clipboard methods for older browsers
 * - Poll information display for context
 * - Responsive design for all devices
 * 
 * @example
 * ```tsx
 * // Access via /polls/[id]/share route
 * <SharePollPage />
 * ```
 */

/**
 * Poll Interface for Sharing
 * 
 * Represents basic poll information needed for sharing context.
 */
interface Poll {
  id: string;
  title: string;
  question: string;
}

/**
 * Poll Sharing Page Component
 * 
 * Renders sharing interface with multiple sharing options including
 * link copying, QR code generation, and native web sharing.
 * 
 * @returns JSX element containing the poll sharing interface
 */
export default function SharePollPage() {
  // Routing and state management
  const params = useParams();
  const pollId = params.id as string;
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (pollId) {
      fetchPoll();
      generateShareUrl();
    }
  }, [pollId]);

  /**
   * Fetch Poll Information
   * 
   * Retrieves basic poll information for sharing context.
   * Only fetches essential fields needed for sharing display.
   */
  const fetchPoll = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('id, title, question')
        .eq('id', pollId)
        .single();

      if (error) throw error;
      setPoll(data);
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate Share URL and QR Code
   * 
   * Creates the shareable poll URL and generates a QR code for mobile access.
   * Uses QR Server API (free service) for QR code generation.
   */
  const generateShareUrl = () => {
    const url = `${window.location.origin}/polls/${pollId}`;
    setShareUrl(url);
    
    /**
     * QR Code Generation
     * 
     * Uses QR Server API to generate QR codes for easy mobile access.
     * The QR code contains the full poll URL for direct navigation.
     */
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    setQrCodeUrl(qrUrl);
  };

  /**
   * Copy Text to Clipboard
   * 
   * Copies provided text to the user's clipboard with fallback support.
   * Handles both modern clipboard API and legacy methods for older browsers.
   * 
   * @param text - Text to copy to clipboard
   */
  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  /**
   * Download QR Code
   * 
   * Triggers download of the generated QR code image.
   * Creates a temporary download link and simulates click.
   */
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `poll-${pollId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Share via Web Share API
   * 
   * Uses native Web Share API when available for better mobile experience.
   * Falls back to clipboard copying if Web Share API is not supported.
   */
  const shareViaWebShare = async () => {
    if (navigator.share && poll) {
      try {
        await navigator.share({
          title: poll.title,
          text: poll.question,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to clipboard if sharing is cancelled or fails
        copyToClipboard(shareUrl);
      }
    } else {
      // Fallback to clipboard for browsers without Web Share API
      copyToClipboard(shareUrl);
    }
  };

  // Show loading state while fetching poll data
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page header with navigation */}
      <div className="mb-6">
        <Link href={`/polls/${pollId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Poll
        </Link>
        <h1 className="text-3xl font-bold">Share Your Poll</h1>
        <p className="text-muted-foreground">Share your poll with others using the link or QR code</p>
      </div>

      {/* Poll information for context */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{poll.title}</CardTitle>
          <CardDescription>{poll.question}</CardDescription>
        </CardHeader>
      </Card>

      {/* Share link section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Link
          </CardTitle>
          <CardDescription>
            Copy this link to share your poll
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link input with copy button */}
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(shareUrl)}
              className="flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
          
          {/* Native share button */}
          <Button
            onClick={shareViaWebShare}
            className="w-full flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Poll
          </Button>
        </CardContent>
      </Card>

      {/* QR code section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </CardTitle>
          <CardDescription>
            Scan this QR code to access the poll quickly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR code display */}
          <div className="flex justify-center">
            {qrCodeUrl ? (
              <div className="p-4 bg-white rounded-lg border-2 border-dashed border-muted-foreground/25">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for poll"
                  className="w-64 h-64"
                  onError={() => setQrCodeUrl('')} // Handle QR code generation failure
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Failed to generate QR code</p>
              </div>
            )}
          </div>
          
          {/* QR code actions */}
          {qrCodeUrl && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadQRCode}
                className="flex-1 flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
              
              <Button
                variant="outline"
                onClick={() => copyToClipboard(shareUrl)}
                className="flex-1 flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          )}
          
          {/* QR code usage instructions */}
          <div className="text-sm text-muted-foreground text-center">
            <p>People can scan this QR code with their phone camera to quickly access your poll</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
