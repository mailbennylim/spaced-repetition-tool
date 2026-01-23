'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Highlight {
  id: string;
  text: string;
  note?: string;
  title?: string;
  author?: string;
  source: {
    name: string;
  };
  testQuestions: TestQuestion[];
}

interface TestQuestion {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
}

export default function TestPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);

  useEffect(() => {
    fetchHighlights();
  }, []);

  useEffect(() => {
    if (highlights.length > 0 && currentIndex < highlights.length) {
      loadQuestionsForHighlight(highlights[currentIndex]);
    }
  }, [currentIndex, highlights]);

  async function fetchHighlights() {
    try {
      const response = await fetch('/api/test?limit=5');
      const data = await response.json();
      setHighlights(data);
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestionsForHighlight(highlight: Highlight) {
    if (highlight.testQuestions && highlight.testQuestions.length > 0) {
      setQuestions(highlight.testQuestions);
      setCurrentQuestionIndex(0);
      setShowAnswer(false);
      return;
    }

    // Generate questions if they don't exist
    setGenerating(true);
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlightId: highlight.id }),
      });

      const generatedQuestions = await response.json();
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setGenerating(false);
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else if (currentIndex < highlights.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setCurrentIndex(highlights.length);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading test questions...</p>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link href="/" className="text-purple-600 hover:text-purple-700 mb-8 inline-block">
            ← Back to Home
          </Link>

          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">No Highlights Available</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sync some highlights first to start testing your knowledge.
            </p>
            <Link
              href="/sync"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
            >
              Sync Highlights
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentIndex >= highlights.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎓</div>
            <h1 className="text-4xl font-bold mb-4">Test Complete!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              You've completed all the test questions. Great job!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentHighlight = highlights[currentIndex];
  const currentQuestion = questions[currentQuestionIndex];

  if (generating || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generating questions...</p>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            ← Back to Home
          </Link>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length} | Highlight {currentIndex + 1} of {highlights.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          {/* Difficulty badge */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                difficultyColors[currentQuestion.difficulty as keyof typeof difficultyColors] ||
                difficultyColors.medium
              }`}
            >
              {currentQuestion.difficulty}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentHighlight.source.name}
            </span>
          </div>

          {/* Context */}
          {currentHighlight.title && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                FROM
              </h3>
              <p className="font-semibold">{currentHighlight.title}</p>
              {currentHighlight.author && (
                <p className="text-sm text-gray-600 dark:text-gray-400">by {currentHighlight.author}</p>
              )}
            </div>
          )}

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
              >
                Show Answer
              </button>
            ) : (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 p-6 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                    ANSWER
                  </h3>
                  <p className="text-lg">{currentQuestion.answer}</p>
                </div>

                {/* Original highlight for reference */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg">
                  <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                    ORIGINAL HIGHLIGHT
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200">{currentHighlight.text}</p>
                  {currentHighlight.note && (
                    <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
                      <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                        YOUR NOTE
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">{currentHighlight.note}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  {currentQuestionIndex < questions.length - 1
                    ? 'Next Question'
                    : currentIndex < highlights.length - 1
                    ? 'Next Highlight'
                    : 'Finish Test'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
