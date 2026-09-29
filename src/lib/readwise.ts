import { z } from 'zod';

const ReadwiseHighlightSchema = z.object({
  id: z.string(),
  text: z.string(),
  note: z.string().nullable().optional(),
  location: z.number().optional(),
  location_type: z.string().optional(),
  highlighted_at: z.string().nullable(),
  url: z.string().nullable().optional(),
  color: z.string().optional(),
  updated: z.string(),
  book_id: z.string().optional(),
  tags: z.array(z.object({
    name: z.string(),
  })).optional(),
  document_note: z.string().nullable().optional(),
});

const ReadwiseBookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  num_highlights: z.number().optional(),
  last_highlight_at: z.string().nullable().optional(),
  updated: z.string(),
  cover_image_url: z.string().optional(),
  highlights_url: z.string().optional(),
  source_url: z.string().nullable().optional(),
  asin: z.string().nullable().optional(),
  tags: z.array(z.object({
    name: z.string(),
  })).optional(),
});

const ReadwiseResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(ReadwiseHighlightSchema),
});

const ReadwiseBooksResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(ReadwiseBookSchema),
});

export type ReadwiseHighlight = z.infer<typeof ReadwiseHighlightSchema>;
export type ReadwiseBook = z.infer<typeof ReadwiseBookSchema>;

export class ReadwiseClient {
  private accessToken: string;
  private baseUrl = 'https://readwise.io/api/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async fetchHighlights(limit = 100): Promise<ReadwiseHighlight[]> {
    try {
      const allHighlights: ReadwiseHighlight[] = [];
      let nextUrl: string | null = `${this.baseUrl}/highlights/?page_size=${limit}`;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Token ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Readwise API error: ${response.statusText}`);
        }

        const data = await response.json();
        const validated = ReadwiseResponseSchema.parse(data);
        allHighlights.push(...validated.results);

        nextUrl = validated.next;

        // Limit to prevent infinite loops
        if (allHighlights.length >= 1000) {
          break;
        }
      }

      return allHighlights;
    } catch (error) {
      console.error('Error fetching Readwise highlights:', error);
      throw error;
    }
  }

  async fetchBooks(): Promise<ReadwiseBook[]> {
    try {
      const allBooks: ReadwiseBook[] = [];
      let nextUrl: string | null = `${this.baseUrl}/books/`;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Token ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Readwise API error: ${response.statusText}`);
        }

        const data = await response.json();
        const validated = ReadwiseBooksResponseSchema.parse(data);
        allBooks.push(...validated.results);

        nextUrl = validated.next;

        // Limit to prevent infinite loops
        if (allBooks.length >= 500) {
          break;
        }
      }

      return allBooks;
    } catch (error) {
      console.error('Error fetching Readwise books:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/`, {
        headers: {
          'Authorization': `Token ${this.accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing Readwise connection:', error);
      return false;
    }
  }
}
