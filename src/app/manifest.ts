import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KonspecterAI - Smart Reading Assistant',
    short_name: 'KonspecterAI',
    description: 'Read smarter, not harder with AI-powered book analysis',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    "categories": ["productivity", "education"],
    "shortcuts": [
      {
        "name": "Home",
        "url": "/",
        "description": "Return to home page"
      }
    ]
  }
} 