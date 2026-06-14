import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MikuBlob',
    short_name: 'MikuBlob',
    description: 'Track learning, one Blob at a time.',
    start_url: '/dashboard?tab=calendar',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#08111a',
    theme_color: '#39c5bb',
    icons: [
      {
        src: '/pwa-icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
