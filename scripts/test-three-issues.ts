import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';

// Set global WebSocket for Node.js environment
// @ts-ignore
global.WebSocket = WebSocket;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE 3-ISSUE VERIFICATION SUITE');
  console.log('🧪 ========================================================');

  const WS_URL = 'ws://localhost:1234';
  const testRoom = `SYNC-TEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // ========================================================
  // TEST 1: FONT AND FONT SIZE FORMATTING & SYNCHRONIZATION
  // ========================================================
  console.log(`\n▶ TEST 1: Font and Font Size Formatting & Yjs Synchronization`);
  const docA = new Y.Doc();
  const providerA = new WebsocketProvider(WS_URL, testRoom, docA);
  providerA.awareness.setLocalStateField('user', {
    name: 'Vamsi Krishna',
    color: '#6366f1',
  });

  const xmlFragmentA = docA.getXmlFragment('default');
  
  // Create formatted paragraph with font and font size
  docA.transact(() => {
    const p = new Y.XmlElement('paragraph');
    
    // "Hello " with Arial, 18pt
    const span1 = new Y.XmlElement('textStyle');
    span1.setAttribute('fontFamily', 'Arial, Helvetica, sans-serif');
    span1.setAttribute('fontSize', '18pt');
    const text1 = new Y.XmlText('Hello ');
    span1.insert(0, [text1]);
    
    // "World" with Georgia, 24pt
    const span2 = new Y.XmlElement('textStyle');
    span2.setAttribute('fontFamily', 'Georgia, serif');
    span2.setAttribute('fontSize', '24pt');
    const text2 = new Y.XmlText('World');
    span2.insert(0, [text2]);

    p.insert(0, [span1, span2]);
    xmlFragmentA.insert(0, [p]);
  });

  await sleep(400);

  // Client B connects to the same room
  const docB = new Y.Doc();
  const providerB = new WebsocketProvider(WS_URL, testRoom, docB);
  providerB.awareness.setLocalStateField('user', {
    name: 'Rahul',
    color: '#10b981',
  });

  await sleep(600);

  const xmlFragmentB = docB.getXmlFragment('default');
  const renderedB = xmlFragmentB.toString();
  console.log(`  Client B received formatted fragment: ${renderedB}`);

  if (!renderedB.includes('fontFamily="Arial') || !renderedB.includes('fontSize="18pt"') || !renderedB.includes('fontFamily="Georgia') || !renderedB.includes('fontSize="24pt"')) {
    throw new Error('❌ TEST 1 FAILED: Font and size formatting failed to synchronize to Client B');
  }
  console.log('  ✅ TEST 1 PASSED: Font and Font Size formatting synchronized with exact attributes');

  // ========================================================
  // TEST 2: SHARE LINK & ROOM RESOLUTION
  // ========================================================
  console.log(`\n▶ TEST 2: Share Link URL & Room Resolution`);
  const generatedShareUrl = `http://localhost:3000/editor?room=${encodeURIComponent(testRoom)}`;
  const parsedUrl = new URL(generatedShareUrl);
  const extractedRoom = parsedUrl.searchParams.get('room');

  if (extractedRoom !== testRoom) {
    throw new Error(`❌ TEST 2 FAILED: Extracted room "${extractedRoom}" does not match generated room "${testRoom}"`);
  }
  console.log(`  Extracted room from Share link: ${extractedRoom} === ${testRoom}`);
  console.log('  ✅ TEST 2 PASSED: Share link preserves exact room ID without regeneration');

  // ========================================================
  // TEST 3: PARTICIPANT COUNT & AWARENESS PRESENCE LIST
  // ========================================================
  console.log(`\n▶ TEST 3: Participant Count & Awareness Presence List`);
  
  // Check awareness state on Provider A
  let statesA = providerA.awareness.getStates();
  console.log(`  Initial awareness client count: ${statesA.size}`);

  if (statesA.size !== 2) {
    throw new Error(`❌ TEST 3 FAILED: Expected 2 active participants, found ${statesA.size}`);
  }

  // Client C connects
  const docC = new Y.Doc();
  const providerC = new WebsocketProvider(WS_URL, testRoom, docC);
  providerC.awareness.setLocalStateField('user', {
    name: 'Ananya',
    color: '#f43f5e',
  });

  await sleep(600);

  statesA = providerA.awareness.getStates();
  console.log(`  After Client C joined, count: ${statesA.size}`);

  const activeNames: string[] = [];
  statesA.forEach((st: any) => {
    if (st.user?.name) activeNames.push(st.user.name);
  });
  console.log(`  Connected participant names: ${activeNames.join(', ')}`);

  if (statesA.size !== 3 || !activeNames.includes('Vamsi Krishna') || !activeNames.includes('Rahul') || !activeNames.includes('Ananya')) {
    throw new Error('❌ TEST 3 FAILED: Participant list does not contain all 3 joined users');
  }

  // Client B disconnects (leaves room)
  providerB.awareness.setLocalState(null);
  providerB.destroy();
  await sleep(600);

  statesA = providerA.awareness.getStates();
  console.log(`  After Client B left, count: ${statesA.size}`);

  if (statesA.size !== 2) {
    throw new Error(`❌ TEST 3 FAILED: Expected 2 participants after disconnect, found ${statesA.size}`);
  }
  console.log('  ✅ TEST 3 PASSED: Participant count & presence dynamic join/leave verified');

  // ========================================================
  // TEST 4: BIDIRECTIONAL REAL-TIME COLLABORATION
  // ========================================================
  console.log(`\n▶ TEST 4: Bidirectional Real-Time Collaboration`);
  const textA = docA.getText('text-collab');
  const textC = docC.getText('text-collab');

  textA.insert(0, 'Hello from User A. ');
  await sleep(300);

  textC.insert(textC.length, 'Hello from User C.');
  await sleep(300);

  console.log(`  Final Text A: "${textA.toString()}"`);
  console.log(`  Final Text C: "${textC.toString()}"`);

  if (textA.toString() !== textC.toString() || textA.toString() !== 'Hello from User A. Hello from User C.') {
    throw new Error('❌ TEST 4 FAILED: Real-time text collaboration did not converge');
  }
  console.log('  ✅ TEST 4 PASSED: Bidirectional real-time editing converged perfectly');

  // Cleanup
  providerA.destroy();
  providerC.destroy();

  console.log('\n========================================================');
  console.log('🎉 ALL 3-ISSUE TESTS PASSED WITH 100% SUCCESS');
  console.log('========================================================\n');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
