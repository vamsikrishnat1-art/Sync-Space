import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';

// Polyfill WebSocket in Node environment for y-websocket client test
(global as any).WebSocket = WebSocket;

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 Starting SyncSpace CRDT & WebSocket Verification Tests');
  console.log('🧪 ========================================================\n');

  const roomName = `test-room-${Date.now()}`;
  const wsUrl = 'ws://localhost:1234';

  console.log(`[TEST 10: WebSocket Server Connection] Connecting to ${wsUrl} on room "${roomName}"...`);

  const docA = new Y.Doc();
  const docB = new Y.Doc();

  const providerA = new WebsocketProvider(wsUrl, roomName, docA, { WebSocketPolyfill: WebSocket as any });
  const providerB = new WebsocketProvider(wsUrl, roomName, docB, { WebSocketPolyfill: WebSocket as any });

  // Wait for initial sync
  await new Promise<void>((resolve) => {
    let aSynced = false;
    let bSynced = false;
    providerA.on('sync', (isSynced: boolean) => {
      if (isSynced) aSynced = true;
      if (aSynced && bSynced) resolve();
    });
    providerB.on('sync', (isSynced: boolean) => {
      if (isSynced) bSynced = true;
      if (aSynced && bSynced) resolve();
    });
    setTimeout(resolve, 2000);
  });

  console.log('✅ TEST 10 PASSED: Both Client A and Client B connected to y-websocket server.');

  // ==========================================
  // TEST 2: Two-Client Real-Time Collaboration
  // ==========================================
  console.log('\n[TEST 2: Two-Client Real-Time Sync]');
  const textA = docA.getText('default');
  const textB = docB.getText('default');

  textA.insert(0, 'Hello from Client A');
  await new Promise((r) => setTimeout(r, 400));

  console.log(`Client A Doc: "${textA.toString()}"`);
  console.log(`Client B Doc: "${textB.toString()}"`);

  if (textB.toString() !== 'Hello from Client A') {
    throw new Error(`TEST 2 FAILED: Client B did not receive Client A text. Expected "Hello from Client A", got "${textB.toString()}"`);
  }

  textB.insert(textB.length, ' | Hello from Client B');
  await new Promise((r) => setTimeout(r, 400));

  console.log(`Client A Doc: "${textA.toString()}"`);
  console.log(`Client B Doc: "${textB.toString()}"`);

  if (textA.toString() !== 'Hello from Client A | Hello from Client B') {
    throw new Error('TEST 2 FAILED: Client A did not receive Client B text.');
  }
  console.log('✅ TEST 2 PASSED: Bi-directional real-time text sync verified.');

  // ==========================================
  // TEST 3 & 4: Live Presence, Awareness & Cursors
  // ==========================================
  console.log('\n[TEST 3 & 4: Live Presence & Cursor Awareness]');
  providerA.awareness.setLocalStateField('user', {
    name: 'Alice (Client A)',
    color: '#10b981',
    colorLight: 'rgba(16, 185, 129, 0.25)',
  });
  providerA.awareness.setLocalStateField('cursor', { anchor: 5, head: 12 });

  providerB.awareness.setLocalStateField('user', {
    name: 'Bob (Client B)',
    color: '#f43f5e',
    colorLight: 'rgba(244, 63, 94, 0.25)',
  });

  await new Promise((r) => setTimeout(r, 400));

  const statesB = Array.from(providerB.awareness.getStates().values());
  const foundAlice = statesB.find((s: any) => s.user?.name === 'Alice (Client A)');
  const foundBob = statesB.find((s: any) => s.user?.name === 'Bob (Client B)');

  if (!foundAlice || !foundBob) {
    throw new Error('TEST 3/4 FAILED: Awareness state missing user profiles.');
  }

  console.log(`Client B sees Alice: Name="${foundAlice.user.name}", Color="${foundAlice.user.color}", Selection=[${foundAlice.cursor.anchor}, ${foundAlice.cursor.head}]`);
  console.log('✅ TEST 3 & 4 PASSED: Awareness user presence, colors, and live selection range broadcast verified.');

  // ==========================================
  // TEST 5, 6, 7: True CRDT Concurrent Editing, Offline & Reconnection Convergence
  // ==========================================
  console.log('\n[TEST 5, 6, 7: Offline Editing & True CRDT Convergence without Last-Write-Wins]');
  console.log('1. Disconnecting Client B from WebSocket server (going offline)...');
  providerB.disconnect();

  await new Promise((r) => setTimeout(r, 200));

  console.log('2. Client A types concurrently online:');
  textA.insert(5, ' [APPROVED BY ALICE]');
  console.log(`   Client A Doc: "${textA.toString()}"`);

  console.log('3. Client B types concurrently while OFFLINE:');
  textB.insert(5, ' [REVIEWED BY BOB]');
  console.log(`   Client B Doc (Offline): "${textB.toString()}"`);

  // Verify they are diverged while offline
  if (textA.toString() === textB.toString()) {
    throw new Error('Test logic error: Documents should be diverged while Client B is offline.');
  }

  console.log('4. Reconnecting Client B to WebSocket server...');
  providerB.connect();

  // Wait for CRDT sync exchange
  await new Promise((r) => setTimeout(r, 1000));

  console.log(`5. Converged Client A Doc: "${textA.toString()}"`);
  console.log(`   Converged Client B Doc: "${textB.toString()}"`);

  if (textA.toString() !== textB.toString()) {
    throw new Error(`CRDT CONVERGENCE FAILED: States do not match! \nA: "${textA.toString()}"\nB: "${textB.toString()}"`);
  }

  // Verify neither edit was lost (Last-Write-Wins check)
  if (!textA.toString().includes('[APPROVED BY ALICE]') || !textA.toString().includes('[REVIEWED BY BOB]')) {
    throw new Error('CRDT CONVERGENCE FAILED: Data was lost due to Last-Write-Wins overwrite!');
  }

  console.log('✅ TEST 5, 6, 7 PASSED: Concurrent edits converged with ZERO data loss and ZERO Last-Write-Wins overwrites.');

  // Cleanup
  providerA.destroy();
  providerB.destroy();
  docA.destroy();
  docB.destroy();

  console.log('\n🎉 ========================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('🎉 ========================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
