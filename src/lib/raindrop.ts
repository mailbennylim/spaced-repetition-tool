export type RaindropHighlight = {
  _id: string;
  text: string;
  note: string | null;
  color: string | null;
  created: string;
  raindropRef: number;
  raindropTitle: string;
  raindropLink: string;
  tags: string[];
};

export class RaindropClient {
  private accessToken: string;
  private baseUrl = 'https://api.raindrop.io/rest/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapHighlight(item: any, raindrop?: any): RaindropHighlight {
    return {
      _id: String(item._id ?? ''),
      text: String(item.text ?? ''),
      note: item.note ? String(item.note) : null,
      color: item.color ? String(item.color) : null,
      created: String(item.created ?? new Date().toISOString()),
      raindropRef: Number(item.raindropRef ?? raindrop?._id ?? 0),
      raindropTitle: String(raindrop?.title ?? item.title ?? ''),
      raindropLink: String(raindrop?.link ?? item.link ?? ''),
      tags: Array.isArray(raindrop?.tags) ? raindrop.tags.map(String) : [],
    };
  }

  async fetchHighlights(limit = 50): Promise<RaindropHighlight[]> {
    try {
      // Fetch all highlights directly from the highlights endpoint
      const response = await fetch(`${this.baseUrl}/highlights?perpage=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Raindrop API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raindrop highlights count:', data?.items?.length ?? 0);

      if (!data || !Array.isArray(data.items)) {
        console.error('Unexpected Raindrop highlights format. Keys:', Object.keys(data ?? {}));
        throw new Error('Unexpected response format from Raindrop highlights API');
      }

      if (data.items.length === 0) {
        console.log('No highlights found - falling back to bookmarks');
        return this.fetchBookmarksAsFallback(limit);
      }

      // Fetch bookmark details to get titles and links
      const raindropIds = [...new Set(data.items.map((h: any) => h.raindropRef).filter(Boolean))];
      const raindropMap = await this.fetchRaindropsByIds(raindropIds as number[]);

      return data.items
        .filter((item: any) => item.text && item.text.trim().length > 0)
        .map((item: any) => this.mapHighlight(item, raindropMap.get(item.raindropRef)));
    } catch (error) {
      console.error('Error fetching Raindrop highlights:', error);
      throw error;
    }
  }

  private async fetchRaindropsByIds(ids: number[]): Promise<Map<number, any>> {
    const map = new Map<number, any>();
    // Fetch in batches to avoid too many requests
    const batchSize = 10;
    for (let i = 0; i < Math.min(ids.length, 50); i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (id) => {
          try {
            const res = await fetch(`${this.baseUrl}/raindrop/${id}`, {
              headers: { 'Authorization': `Bearer ${this.accessToken}` },
            });
            if (res.ok) {
              const d = await res.json();
              if (d?.item) map.set(id, d.item);
            }
          } catch {
            // Skip failed lookups
          }
        })
      );
    }
    return map;
  }

  // Fallback: use bookmarks if no highlights exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchBookmarksAsFallback(limit: number): Promise<RaindropHighlight[]> {
    const response = await fetch(`${this.baseUrl}/raindrops/0?perpage=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Raindrop API error: ${response.statusText}`);

    const data = await response.json();
    if (!data || !Array.isArray(data.items)) return [];

    return data.items
      .filter((item: any) => item.excerpt && item.excerpt.trim().length > 0)
      .map((item: any) => ({
        _id: String(item._id),
        text: String(item.excerpt),
        note: item.note ? String(item.note) : null,
        color: null,
        created: String(item.created ?? new Date().toISOString()),
        raindropRef: Number(item._id),
        raindropTitle: String(item.title ?? ''),
        raindropLink: String(item.link ?? ''),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      }));
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
