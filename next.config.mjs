/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://sync-space-iddd.onrender.com',
  },
  transpilePackages: [
    'yjs',
    'y-websocket',
    'y-indexeddb',
    'y-prosemirror',
    '@tiptap/extension-collaboration',
    '@tiptap/extension-collaboration-cursor',
  ],
  async rewrites() {
    return [
      {
        source: '/room/:room',
        destination: '/editor?room=:room',
      },
    ];
  },
};

export default nextConfig;
