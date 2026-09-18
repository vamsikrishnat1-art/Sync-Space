# ⚡ SyncSpace — Real-Time Collaborative Document Editor

> **A CRDT-Powered, Offline-First, Multi-User Collaborative Editor built for Hackathon speed & mathematical convergence.**

---

## 🌟 Key Features

1. **Real-Time Multi-User Collaboration**: Sub-50ms synchronized rich-text editing powered by **Yjs** CRDTs and WebSockets.
2. **Conflict-Free Replicated Data Type (CRDT)**: Guaranteed deterministic convergence using Lamport vector clocks. **Zero Last-Write-Wins (LWW) data loss**.
3. **Live Remote Cursors & Active Selections**: Custom colored carets with collaborator name tags and real-time highlighted selections via Tiptap Collaboration Cursor.
4. **Presence & Collaborator Bar**: Live presence indicators with active user counters, connection health badges, and instant avatar color customization.
5. **Local-First & Offline Persistence**: Automatic indexed storage with `y-indexeddb`. Edit offline, refresh without internet, and sync seamlessly upon reconnect.
6. **Built-in Split-Screen Demo Sandbox**: Side-by-side dual client view in a single browser window for instant, frictionless judge demonstrations.
7. **Network Chaos Inspector**: Simulate instant network drops, inspect CRDT state vector sizes, and prove convergence under concurrent edits.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism, Dark UI, Custom Cursor animations)
- **Editor Engine**: [Tiptap](https://tiptap.dev/) + ProseMirror
- **CRDT Engine**: [Yjs](https://github.com/yjs/yjs) (`Y.Doc`, `Y.XmlFragment`)
- **Transport**: [y-websocket](https://github.com/yjs/y-websocket) + Node.js WebSocket Server
- **Local Persistence**: [y-indexeddb](https://github.com/yjs/y-indexeddb)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both WebSocket Server & Next.js App
```bash
npm run dev:all
```
*Or in two separate terminals:*
```bash
# Terminal 1: WebSocket Server (Port 1234)
npm run server

# Terminal 2: Next.js Frontend (Port 3000)
npm run dev
```

### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)**

---

## 🎯 5-Minute Judge Demo Flow

1. **Live Multi-User Typing**:
   - Click **"Split Demo"** in the top navigation bar to open Alice & Bob side-by-side.
   - Type in Alice's editor -> watch Bob's view update in sub-50ms with Alice's green cursor caret.
2. **Live Selection Presence**:
   - Highlight a line in Alice's editor -> Bob immediately sees green translucent text selection highlighting.
3. **Offline & Concurrent Convergence Proof**:
   - In Bob's panel, click **"Go Offline"** (WebSocket disconnected).
   - In Alice's panel, type: `[Approved by Engineering]`.
   - In Bob's panel (while offline), type: `[Approved by Design]`.
   - In Bob's panel, click **"Reconnect"**.
   - **Result**: Watch Yjs deterministically interleave both updates without either client losing data.
4. **Offline Persistence Proof**:
   - Disconnect the network or server.
   - Refresh the browser tab.
   - The entire document state restores instantly from local **IndexedDB** (`y-indexeddb`).

---

## 🏛️ Architecture & Interaction Flow

```
┌────────────────────────────────────────────────────────┐
│                      Tiptap Editor                     │
└───────────────────────────▲────────────────────────────┘
                            │ ProseMirror Bindings
┌───────────────────────────▼────────────────────────────┐
│                    Y.Doc CRDT Core                     │
│               Y.XmlFragment('default')                 │
└─────────────▲────────────────────────────▲─────────────┘
              │ Local Changes              │ Remote Deltas & Awareness
┌─────────────▼─────────────┐   ┌──────────▼─────────────┐
│    IndexeddbPersistence   │   │   WebsocketProvider    │
│       (y-indexeddb)       │   │     (y-websocket)      │
│     [Local Storage]       │   └──────────▲─────────────┘
└───────────────────────────┘              │
                                ┌──────────▼─────────────┐
                                │   Node.js WS Server    │
                                └────────────────────────┘
```
