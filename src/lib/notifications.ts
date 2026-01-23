export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export function sendNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  }
}

export function scheduleReviewReminder() {
  sendNotification('Time to Review!', {
    body: 'Your daily highlights are ready for review.',
    tag: 'daily-review',
    requireInteraction: true,
  });
}

export function checkAndNotifyForReviews(dueCount: number) {
  if (dueCount > 0) {
    sendNotification('Reviews Due', {
      body: `You have ${dueCount} highlight${dueCount !== 1 ? 's' : ''} to review today.`,
      tag: 'reviews-due',
    });
  }
}
