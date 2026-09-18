/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
