import Link from 'next/link';
import { NotificationSetup } from '@/components/NotificationSetup';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <NotificationSetup />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Spaced Repetition Tool
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Reinforce knowledge through spaced repetition of your reading highlights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/review" className="group">
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                Daily Review
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review your scheduled highlights for today
              </p>
            </div>
          </Link>

<Link href="/highlights" className="group">
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-green-600 transition-colors">
                All Highlights
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Browse and manage your highlights
              </p>
            </div>
          </Link>

          <Link href="/settings" className="group">
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-orange-600 transition-colors">
                Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Configure notifications and integrations
              </p>
            </div>
          </Link>

          <Link href="/add" className="group">
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                Add Highlight
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manually add a highlight for review
              </p>
            </div>
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/sync"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
          >
            Sync Highlights
          </Link>
        </div>
      </div>
    </main>
  );
}
