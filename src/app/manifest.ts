import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Reader',
    short_name: 'Reader',
    description: 'Read, highlight and remember',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1116',
    theme_color: '#0d1116',
    orientation: 'portrait',
    // Android share sheet → /save (docs/ux-spec.md §3.10)
    share_target: { action: '/save', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } },
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
