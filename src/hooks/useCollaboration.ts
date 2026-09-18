'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { UserPresence, ConnectionStatus, CollaborationState } from '../types/collaboration';
import { generateRandomUser } from '../utils/user';
import { resolveRoomWebSocketUrl } from '../utils/websocket';

interface UseCollaborationOptions {
  room: string;
  idbName?: string;
  wsUrl?: string;
  initialUser?: UserPresence;
  initialUserName?: string;
  initialTitle?: string;
  existingDoc?: Y.Doc;
}

const DEFAULT_USER: UserPresence = {
  id: 'user-default',
  name: 'Collaborator',
  color: '#6366f1',
  colorLight: 'rgba(99, 102, 241, 0.25)',
};

export function useCollaboration({
  room,
  idbName,
  wsUrl: customWsUrl,
  initialUser,
  initialUserName,
  initialTitle,
  existingDoc,
}: UseCollaborationOptions): CollaborationState & {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  indexeddbProvider: IndexeddbPersistence | null;
  isIndexedDbSynced: boolean;
  vectorStateSize: number;
  localClientId: number | null;
} {
  const [user, setUser] = useState<UserPresence>(() => {
    if (initialUser) return initialUser;
    if (initialUserName) {
      const generated = generateRandomUser();
      return { ...generated, name: initialUserName };
    }
    return DEFAULT_USER;
  });
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [synced, setSynced] = useState<boolean>(false);
  const [isIndexedDbSynced, setIsIndexedDbSynced] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [vectorStateSize, setVectorStateSize] = useState<number>(0);
  const [title, setTitle] = useState<string>(() => initialTitle || 'Untitled Document');

  // Maintain singleton Y.Doc reference per room
  const ydoc = useMemo(() => existingDoc || new Y.Doc(), [room, existingDoc]);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [indexeddbProvider, setIndexeddbProvider] = useState<IndexeddbPersistence | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const userRef = useRef<UserPresence>(user);

  // Safely resolve environment-aware WebSocket base URL
  const resolvedWsUrl = useMemo(() => {
    return resolveRoomWebSocketUrl(room, customWsUrl);
  }, [room, customWsUrl]);

  // Client-side user initialization to avoid SSR hydration mismatch
  useEffect(() => {
    if (!initialUser && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('syncspace_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          return;
        } catch {
          // fallback to generating random user
        }
      }
      const newUser = generateRandomUser();
      setUser(newUser);
      sessionStorage.setItem('syncspace_user', JSON.stringify(newUser));
    }
  }, [initialUser]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Shared metadata map for title sync
  useEffect(() => {
    const metaMap = ydoc.getMap<string>('metadata');

    const handleMetaChange = () => {
      const sharedTitle = metaMap.get('title');
      if (sharedTitle !== undefined && sharedTitle !== null) {
        setTitle(sharedTitle);
      }
    };

    // Initialize title if already in map, or set initial if provided
    const existing = metaMap.get('title');
    if (existing) {
      setTitle(existing);
    } else if (initialTitle) {
      metaMap.set('title', initialTitle);
    }

    metaMap.observe(handleMetaChange);
    return () => {
      metaMap.unobserve(handleMetaChange);
    };
  }, [ydoc, initialTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Setup IndexedDB Persistence for offline / local-first storage
    const storageKey = idbName || room;
    const idb = new IndexeddbPersistence(storageKey, ydoc);
    setIndexeddbProvider(idb);

    idb.on('synced', () => {
      setIsIndexedDbSynced(true);
      const stateVector = Y.encodeStateVector(ydoc);
      setVectorStateSize(stateVector.byteLength);

      // Check title from IDB
      const metaMap = ydoc.getMap<string>('metadata');
      const loadedTitle = metaMap.get('title');
      if (loadedTitle) {
        setTitle(loadedTitle);
      }
    });

    // 2. Setup WebSocket Provider
    const ws = new WebsocketProvider(resolvedWsUrl, room, ydoc, {
      connect: true,
      maxBackoffTime: 2500,
    });
    setProvider(ws);
    providerRef.current = ws;

    // Update awareness local user
    ws.awareness.setLocalStateField('user', {
      name: userRef.current.name,
      color: userRef.current.color,
      colorLight: userRef.current.colorLight,
    });

    const handleStatus = (event: { status: ConnectionStatus }) => {
      setStatus(event.status);
      if (event.status === 'connected') {
        handleAwarenessChange();
      }
    };

    const handleSync = (isSynced: boolean) => {
      setSynced(isSynced);
      const stateVector = Y.encodeStateVector(ydoc);
      setVectorStateSize(stateVector.byteLength);

      // Check title from remote sync
      const metaMap = ydoc.getMap<string>('metadata');
      const loadedTitle = metaMap.get('title');
      if (loadedTitle) {
        setTitle(loadedTitle);
      }
      handleAwarenessChange();
    };

    const handleAwarenessChange = () => {
      const states = ws.awareness.getStates();
      const users: UserPresence[] = [];
      states.forEach((state: any, clientID: number) => {
        if (state.user) {
          users.push({
            id: clientID,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#6366f1',
            colorLight: state.user.colorLight || 'rgba(99, 102, 241, 0.2)',
            cursor: state.cursor || null,
          });
        }
      });
      setActiveUsers(users);
    };

    const handleDocUpdate = () => {
      const stateVector = Y.encodeStateVector(ydoc);
      setVectorStateSize(stateVector.byteLength);
    };

    ws.on('status', handleStatus);
    ws.on('sync', handleSync);
    ws.awareness.on('change', handleAwarenessChange);
    ydoc.on('update', handleDocUpdate);

    // Initial awareness capture
    handleAwarenessChange();

    return () => {
      try {
        ws.awareness.setLocalState(null);
      } catch {}
      ws.off('status', handleStatus);
      ws.off('sync', handleSync);
      ws.awareness.off('change', handleAwarenessChange);
      ydoc.off('update', handleDocUpdate);
      ws.destroy();
      idb.destroy();
      providerRef.current = null;
    };
  }, [room, resolvedWsUrl, ydoc]);

  // Update awareness when user profile changes
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: user.name,
        color: user.color,
        colorLight: user.colorLight,
      });
      const states = providerRef.current.awareness.getStates();
      const users: UserPresence[] = [];
      states.forEach((state: any, clientID: number) => {
        if (state.user) {
          users.push({
            id: clientID,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#6366f1',
            colorLight: state.user.colorLight || 'rgba(99, 102, 241, 0.2)',
            cursor: state.cursor || null,
          });
        }
      });
      setActiveUsers(users);
    }
  }, [user]);

  const updateTitle = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      const metaMap = ydoc.getMap<string>('metadata');
      metaMap.set('title', newTitle);
    },
    [ydoc]
  );

  const disconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.disconnect();
      setStatus('disconnected');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (providerRef.current) {
      setStatus('connecting');
      providerRef.current.connect();
    }
  }, []);

  const toggleConnection = useCallback(() => {
    if (status === 'connected') {
      disconnect();
    } else {
      reconnect();
    }
  }, [status, disconnect, reconnect]);

  const updateUserName = useCallback((name: string) => {
    setUser((prev) => {
      const updated = { ...prev, name };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('syncspace_user', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const updateUserColor = useCallback((color: string) => {
    const light = color.startsWith('#')
      ? `${color}33`
      : color;
    setUser((prev) => {
      const updated = { ...prev, color, colorLight: light };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('syncspace_user', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  return {
    ydoc,
    provider,
    indexeddbProvider,
    isIndexedDbSynced,
    vectorStateSize,
    localClientId: providerRef.current ? providerRef.current.awareness.clientID : null,
    status,
    synced,
    activeUsers,
    currentUser: user,
    title,
    updateTitle,
    reconnect,
    disconnect,
    toggleConnection,
    updateUserName,
    updateUserColor,
  };
}
