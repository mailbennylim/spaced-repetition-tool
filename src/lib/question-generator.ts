import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface GeneratedQuestion {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function generateQuestionsFromHighlight(
  highlightText: string,
  note?: string,
  title?: string
): Promise<GeneratedQuestion[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const context = [
    title && `Title: ${title}`,
    `Highlight: ${highlightText}`,
    note && `Note: ${note}`,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `Based on the following highlight from a book or article, generate 3 questions that test comprehension and recall. Include one easy, one medium, and one hard question.

${context}

Generate questions in the following JSON format:
[
  {
    "question": "What is...",
    "answer": "The answer is...",
    "difficulty": "easy"
  },
  {
    "question": "How does...",
    "answer": "It works by...",
    "difficulty": "medium"
  },
  {
    "question": "Why might...",
    "answer": "This is because...",
    "difficulty": "hard"
  }
]

Rules:
- Easy questions should test basic recall
- Medium questions should test understanding
- Hard questions should test application or synthesis
- Keep questions concise and clear
- Answers should be 1-3 sentences`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates educational questions. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(response);

    // Handle both direct array and nested structure
    const questions = Array.isArray(parsed) ? parsed : parsed.questions || [];

    return questions.map((q: any) => ({
      question: q.question,
      answer: q.answer,
      difficulty: q.difficulty || 'medium',
    }));
  } catch (error) {
    console.error('Error generating questions:', error);

    // Fallback to simple questions if AI fails
    return [
      {
        question: `What is the main idea of this highlight: "${highlightText.substring(0, 100)}..."?`,
        answer: highlightText,
        difficulty: 'easy' as const,
      },
    ];
  }
}
