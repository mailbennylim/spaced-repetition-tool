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
  source: { name: string };
}

interface Review {
  id: string;
  scheduledFor: string;
  interval: number;
  repetitions: number;
  highlight: Highlight;
}

const DEFAULT_INTERVAL = 30;
const MIN_INTERVAL = 1;
const MAX_INTERVAL = 365;
const STEP = 10;

export default function ReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Track the interval (days) per review card by review id
  const [intervals, setIntervals] = useState<Record<string, number>>({});

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    try {
      const response = await fetch('/api/review');
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  function getInterval(reviewId: string): number {
    return intervals[reviewId] ?? DEFAULT_INTERVAL;
  }

  function adjustInterval(reviewId: string, direction: 'more' | 'less') {
    setIntervals(prev => {
      const current = prev[reviewId] ?? DEFAULT_INTERVAL;
      const next = direction === 'more'
        ? Math.max(MIN_INTERVAL, current - STEP)
        : Math.min(MAX_INTERVAL, current + STEP);
      return { ...prev, [reviewId]: next };
    });
  }

  async function submitAndNavigate(direction: 'next' | 'prev') {
    const current = reviews[currentIndex];
    if (!current) return;

    const interval = getInterval(current.id);
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: current.id, interval }),
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
    }

    if (direction === 'next') {
      setCurrentIndex(i => i + 1);
    } else {
      setCurrentIndex(i => Math.max(0, i - 1));
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
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-8 inline-block">← Back to Home</Link>
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">No Reviews Due</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">You're all caught up! Check back later for more reviews.</p>
            <Link href="/sync" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors">
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
            <p className="text-gray-600 dark:text-gray-400 mb-8">You've completed all your reviews for today. Great work!</p>
            <Link href="/" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];
  const highlight = currentReview.highlight;
  const currentInterval = getInterval(currentReview.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">← Back to Home</Link>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} of {reviews.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-8">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / reviews.length) * 100}%` }}
          />
        </div>

        {/* Highlight card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 md:p-12 mb-8">

          {/* Source + tags */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              {highlight.source.name}
            </span>
            {highlight.tags && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{highlight.tags}</span>
            )}
          </div>

          {/* Title */}
          {highlight.title && (
            <h2 className="text-base text-gray-500 dark:text-gray-400 mb-8">{highlight.title}</h2>
          )}

          {/* Highlight text */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Highlight</p>
            <p className="text-2xl font-medium leading-relaxed text-gray-900 dark:text-gray-100">{highlight.text}</p>
          </div>

          {/* Note */}
          {highlight.note && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Notes</p>
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">{highlight.note}</p>
            </div>
          )}

          {/* Source link */}
          {highlight.url && (
            <a href={highlight.url} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700">
              View original source →
            </a>
          )}
        </div>

        {/* Frequency buttons (small) */}
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => adjustInterval(currentReview.id, 'more')}
            disabled={currentInterval <= MIN_INTERVAL}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Show more frequently
          </button>
          <button
            onClick={() => adjustInterval(currentReview.id, 'less')}
            disabled={currentInterval >= MAX_INTERVAL}
            className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Show less frequently
          </button>
        </div>

        {/* Frequency hint */}
        <p className={`text-center text-sm font-medium mb-6 ${
          currentInterval < DEFAULT_INTERVAL
            ? 'text-green-600 dark:text-green-400'
            : currentInterval > DEFAULT_INTERVAL
            ? 'text-orange-500 dark:text-orange-400'
            : 'text-gray-400 dark:text-gray-600'
        }`}>
          Next review in <span className="font-bold">{currentInterval} day{currentInterval !== 1 ? 's' : ''}</span>
          {currentInterval < DEFAULT_INTERVAL && ' · showing more often'}
          {currentInterval > DEFAULT_INTERVAL && ' · showing less often'}
          {currentInterval === DEFAULT_INTERVAL && ' · default'}
        </p>

        {/* Next / Previous buttons (big) */}
        <div className="flex gap-4">
          <button
            onClick={() => submitAndNavigate('prev')}
            disabled={currentIndex === 0}
            className="flex-1 py-4 rounded-2xl text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={() => submitAndNavigate('next')}
            className="flex-2 flex-grow-[2] py-4 rounded-2xl text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            {currentIndex === reviews.length - 1 ? 'Finish ✓' : 'Next →'}
          </button>
        </div>

      </div>
    </div>
  );
}
