'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Highlight {
  id: string;
  text: string;
  note?: string;
  title?: string;
  author?: string;
  url?: string;
  tags?: string;
  source: {
    name: string;
  };
}

interface Review {
  id: string;
  scheduledFor: string;
  interval: number;
  repetitions: number;
  highlight: Highlight;
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const response = await fetch('/api/review?limit=5');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleQualityRating(quality: number) {
    if (currentIndex >= reviews.length) return;

    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: reviews[currentIndex].id,
          quality,
        }),
      });

      // Move to next review
      if (currentIndex < reviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        // All reviews completed
        setCurrentIndex(reviews.length);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">
            ← Back to Home
          </Link>

          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">No Reviews Due</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You're all caught up! Check back later for more reviews.
            </p>
            <Link
              href="/sync"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
            >
              Sync New Highlights
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= reviews.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-4">All Done!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You've completed all your reviews for today. Great work!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];
  const highlight = currentReview.highlight;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {reviews.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          {/* Source and metadata */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              {highlight.source.name}
            </span>
            {highlight.tags && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {highlight.tags}
              </span>
            )}
          </div>

          {/* Title and author */}
          {highlight.title && (
            <h2 className="text-2xl font-bold mb-2">{highlight.title}</h2>
          )}
          {highlight.author && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">by {highlight.author}</p>
          )}

          {/* Highlight text */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg mb-6">
            <p className="text-lg leading-relaxed">{highlight.text}</p>
          </div>

          {/* Note */}
          {highlight.note && (
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-8">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                YOUR NOTE
              </h3>
              <p className="text-gray-800 dark:text-gray-200">{highlight.note}</p>
            </div>
          )}

          {/* Quality ratings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">How well did you recall this?</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleQualityRating(5)}
                className="p-4 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-2 border-green-200 dark:border-green-800 transition-all hover:scale-105"
              >
                <div className="font-semibold text-green-800 dark:text-green-300">Perfect recall</div>
                <div className="text-sm text-green-600 dark:text-green-400">Easy to remember</div>
              </button>

              <button
                onClick={() => handleQualityRating(4)}
                className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 transition-all hover:scale-105"
              >
                <div className="font-semibold text-blue-800 dark:text-blue-300">After hesitation</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Correct but took a moment</div>
              </button>

              <button
                onClick={() => handleQualityRating(3)}
                className="p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-800 transition-all hover:scale-105"
              >
                <div className="font-semibold text-yellow-800 dark:text-yellow-300">With difficulty</div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Hard to recall</div>
              </button>

              <button
                onClick={() => handleQualityRating(2)}
                className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 transition-all hover:scale-105"
              >
                <div className="font-semibold text-orange-800 dark:text-orange-300">Incorrect but familiar</div>
                <div className="text-sm text-orange-600 dark:text-orange-400">Seemed easy to recall</div>
              </button>

              <button
                onClick={() => handleQualityRating(1)}
                className="p-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-2 border-red-200 dark:border-red-800 transition-all hover:scale-105"
              >
                <div className="font-semibold text-red-800 dark:text-red-300">Incorrect</div>
                <div className="text-sm text-red-600 dark:text-red-400">But remembered after seeing</div>
              </button>

              <button
                onClick={() => handleQualityRating(0)}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 transition-all hover:scale-105"
              >
                <div className="font-semibold text-gray-800 dark:text-gray-300">Complete blackout</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Don't remember at all</div>
              </button>
            </div>
          </div>

          {/* Link to source */}
          {highlight.url && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={highlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                View original source →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
