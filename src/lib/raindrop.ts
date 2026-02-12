export type RaindropHighlight = {
  _id: number;
  title: string;
  excerpt: string | null;
  note: string | null;
  link: string;
  created: string;
  tags: string[];
  collection: { $id: number; title: string } | null;
};

export class RaindropClient {
  private accessToken: string;
  private baseUrl = 'https://api.raindrop.io/rest/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapItem(item: any): RaindropHighlight {
    return {
      _id: Number(item._id ?? item.id ?? 0),
      title: String(item.title ?? ''),
      excerpt: item.excerpt ? String(item.excerpt) : null,
      note: item.note ? String(item.note) : null,
      link: String(item.link ?? ''),
      created: String(item.created ?? new Date().toISOString()),
      tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      collection: item.collection ?? null,
    };
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
        throw new Error(`Raindrop API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raindrop response - item count:', data?.items?.length ?? 0);

      if (!data || !Array.isArray(data.items)) {
        console.error('Unexpected Raindrop format. Keys:', Object.keys(data ?? {}));
        throw new Error('Unexpected response format from Raindrop API');
      }

      return data.items.map((item: unknown) => this.mapItem(item));
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
      if (!data || !Array.isArray(data.items)) return [];
      return data.items.map((item: unknown) => this.mapItem(item));
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
