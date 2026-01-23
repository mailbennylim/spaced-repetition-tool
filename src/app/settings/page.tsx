'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Settings {
  id: string;
  notificationTime: string;
  notificationsEnabled: boolean;
  dailyHighlightsCount: number;
  timezone: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="text-orange-600 hover:text-orange-700 mb-8 inline-block">
          ← Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your notifications and review preferences
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-6">Review Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Daily Highlights Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.dailyHighlightsCount}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      dailyHighlightsCount: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Number of highlights to review each day
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Review Time</label>
                <input
                  type="time"
                  value={settings.notificationTime}
                  onChange={e =>
                    setSettings({ ...settings, notificationTime: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Time when you'll be reminded to review
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-6">Notification Settings</h2>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive reminders when it's time to review
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    notificationsEnabled: !settings.notificationsEnabled,
                  })
                }
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Note: Browser notifications require permission. You may need to enable notifications
                  in your browser settings.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-semibold mb-6">API Integrations</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h3 className="font-medium">Raindrop.io</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {process.env.NEXT_PUBLIC_RAINDROP_CONFIGURED ? 'Connected' : 'Not configured'}
                  </p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    process.env.NEXT_PUBLIC_RAINDROP_CONFIGURED
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h3 className="font-medium">Readwise Reader</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {process.env.NEXT_PUBLIC_READWISE_CONFIGURED ? 'Connected' : 'Not configured'}
                  </p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    process.env.NEXT_PUBLIC_READWISE_CONFIGURED
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h3 className="font-medium">OpenAI (for question generation)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {process.env.NEXT_PUBLIC_OPENAI_CONFIGURED ? 'Connected' : 'Not configured'}
                  </p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    process.env.NEXT_PUBLIC_OPENAI_CONFIGURED
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Configure API keys in your .env file. See the documentation for details.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>

            {saved && (
              <div className="flex items-center px-6 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-xl">
                Saved!
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
