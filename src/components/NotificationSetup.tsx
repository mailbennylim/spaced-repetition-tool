'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission, checkAndNotifyForReviews } from '@/lib/notifications';

export function NotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dueReviewsCount, setDueReviewsCount] = useState(0);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    checkDueReviews();
  }, []);

  async function checkDueReviews() {
    try {
      const response = await fetch('/api/review?limit=100');
      const reviews = await response.json();
      setDueReviewsCount(reviews.length);

      if (reviews.length > 0 && Notification.permission === 'granted') {
        checkAndNotifyForReviews(reviews.length);
      }
    } catch (error) {
      console.error('Failed to check due reviews:', error);
    }
  }

  async function handleRequestPermission() {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === 'granted' && dueReviewsCount > 0) {
      checkAndNotifyForReviews(dueReviewsCount);
    }
  }

  if (permission === 'granted' || permission === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 z-50">
      <h3 className="font-semibold mb-2">Enable Notifications</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Get reminders when it's time to review your highlights
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleRequestPermission}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Enable
        </button>
        <button
          onClick={() => setPermission('denied')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
