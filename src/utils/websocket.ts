/**
 * Utility for resolving the WebSocket URL for SyncSpace real-time collaboration.
 * 
 * - LOCAL DEVELOPMENT:
 *   Defaults to ws://localhost:1234 (preserving full local dev behavior).
 * 
 * - PRODUCTION:
 *   Reads from NEXT_PUBLIC_WS_URL (e.g. wss://syncspace-ws.onrender.com).
 *   Safely normalizes protocols (https -> wss, http -> ws) and strips trailing slashes
 *   so y-websocket can cleanly append the room path: ${wsUrl}/${room}.
 */

export function getWebSocketBaseUrl(explicitUrl?: string): string {
  // 1. Check explicit URL parameter or NEXT_PUBLIC_WS_URL environment variable
  const rawUrl = (explicitUrl || process.env.NEXT_PUBLIC_WS_URL || '').trim();

  if (rawUrl) {
    let normalized = rawUrl;

    // Normalize protocol: convert http(s) to ws(s)
    if (normalized.startsWith('https://')) {
      normalized = normalized.replace(/^https:\/\//i, 'wss://');
    } else if (normalized.startsWith('http://')) {
      normalized = normalized.replace(/^http:\/\//i, 'ws://');
    } else if (!normalized.startsWith('ws://') && !normalized.startsWith('wss://')) {
      // Protocol omitted: default to wss:// on HTTPS, ws:// otherwise
      if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        normalized = `wss://${normalized}`;
      } else {
        normalized = `ws://${normalized}`;
      }
    }

    // Strip trailing slashes to ensure safe room concatenation by y-websocket
    return normalized.replace(/\/+$/, '');
  }

  // 2. Local development fallback
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local');

    if (isLocalhost) {
      return `ws://${hostname}:1234`;
    }

    // In a browser under HTTPS with no NEXT_PUBLIC_WS_URL configured:
    // Default to secure WebSocket on the current host to prevent Mixed Content blocking
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}`;
  }

  // Fallback for SSR / Node environment
  return 'ws://localhost:1234';
}

/**
 * Resolves the server WebSocket URL for a given room, safely handling
 * any edge cases where the base URL already included the room name.
 */
export function resolveRoomWebSocketUrl(room: string, explicitUrl?: string): string {
  let baseUrl = getWebSocketBaseUrl(explicitUrl);
  const cleanRoom = room.trim();

  // If baseUrl accidentally ends with /room, strip it so y-websocket doesn't double-append
  if (cleanRoom && baseUrl.endsWith(`/${cleanRoom}`)) {
    baseUrl = baseUrl.slice(0, -(cleanRoom.length + 1)).replace(/\/+$/, '');
  }

  return baseUrl;
}
