import { z } from 'zod';

const RaindropHighlightSchema = z.object({
  _id: z.number(),
  title: z.string(),
  excerpt: z.string(),
  note: z.string().optional(),
  link: z.string().url(),
  created: z.string(),
  tags: z.array(z.string()).optional(),
  collection: z.object({
    $id: z.number(),
    title: z.string(),
  }).optional(),
});

const RaindropResponseSchema = z.object({
  items: z.array(RaindropHighlightSchema),
  count: z.number(),
});

export type RaindropHighlight = z.infer<typeof RaindropHighlightSchema>;

export class RaindropClient {
  private accessToken: string;
  private baseUrl = 'https://api.raindrop.io/rest/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async fetchHighlights(limit = 50): Promise<RaindropHighlight[]> {
    try {
      const response = await fetch(`${this.baseUrl}/raindrops/0?perpage=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Raindrop API error: ${response.statusText}`);
      }

      const data = await response.json();
      const validated = RaindropResponseSchema.parse(data);
      return validated.items;
    } catch (error) {
      console.error('Error fetching Raindrop highlights:', error);
      throw error;
    }
  }

  async fetchHighlightsByCollection(collectionId: number, limit = 50): Promise<RaindropHighlight[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/raindrops/${collectionId}?perpage=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Raindrop API error: ${response.statusText}`);
      }

      const data = await response.json();
      const validated = RaindropResponseSchema.parse(data);
      return validated.items;
    } catch (error) {
      console.error('Error fetching Raindrop highlights:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing Raindrop connection:', error);
      return false;
    }
  }
}
