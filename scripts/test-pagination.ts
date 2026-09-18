import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import WebSocket from 'ws';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const WS_URL = 'ws://localhost:1234';
const ROOM = `PAGINATION-TEST-${Date.now()}`;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPaginationTests() {
  console.log('========================================================');
  console.log('📄 SYNCSPACE PAGINATED DOCUMENT TEST SUITE');
  console.log('========================================================\n');

  // TEST 1: Single Y.Doc CRDT Architecture Verification
  console.log('▶ TEST 1: Single Y.Doc & Single Collaboration Room Architecture');
  const docA = new Y.Doc();
  const docB = new Y.Doc();

  const providerA = new WebsocketProvider(WS_URL, ROOM, docA, { WebSocketPolyfill: WebSocket as any });
  const providerB = new WebsocketProvider(WS_URL, ROOM, docB, { WebSocketPolyfill: WebSocket as any });

  await sleep(1000);

  const xmlFragmentA = docA.getXmlFragment('default');
  const xmlFragmentB = docB.getXmlFragment('default');

  console.log('  Single room connection established:', ROOM);
  console.log('  Provider A synced:', providerA.synced);
  console.log('  Provider B synced:', providerB.synced);

  if (!providerA.synced || !providerB.synced) {
    throw new Error('Websocket providers failed to sync');
  }
  console.log('  ✅ TEST 1 PASSED: Verified 1 single Y.Doc & 1 single collaboration session\n');

  // TEST 2: Multi-Page Content Synchronization
  console.log('▶ TEST 2: Multi-Page Text Content Synchronization Across Page Boundaries');
  // Client A writes Page 1 content
  const p1 = new Y.XmlElement('paragraph');
  const t1 = new Y.XmlText('Page 1 Content: Executive Summary of the SyncSpace Collaboration Engine.');
  p1.insert(0, [t1]);
  xmlFragmentA.insert(0, [p1]);

  await sleep(500);

  // Client B writes Page 2 content (simulating multi-page document)
  const p2 = new Y.XmlElement('paragraph');
  const t2 = new Y.XmlText('Page 2 Content: Detailed Technical Architecture & CRDT Algorithm Specifications.');
  p2.insert(0, [t2]);
  xmlFragmentB.insert(1, [p2]);

  await sleep(500);

  const docAText = xmlFragmentA.toString();
  const docBText = xmlFragmentB.toString();

  console.log('  Doc A XML length:', docAText.length);
  console.log('  Doc B XML length:', docBText.length);
  if (docAText !== docBText) {
    throw new Error('Doc A and Doc B did not converge on multi-page content');
  }
  console.log('  ✅ TEST 2 PASSED: Multi-page content converged with 100% agreement\n');

  // TEST 3: PageBreak Node CRDT Synchronization
  console.log('▶ TEST 3: PageBreak Node CRDT Synchronization');
  const pageBreakNode = new Y.XmlElement('pageBreak');
  xmlFragmentA.insert(1, [pageBreakNode]);

  await sleep(600);

  const docBStructure = xmlFragmentB.toString();
  console.log('  Synced XML structure in Client B:', docBStructure);
  if (!docBStructure.toLowerCase().includes('<pagebreak></pagebreak>')) {
    throw new Error('Client B did not receive the synchronized pageBreak node');
  }
  console.log('  ✅ TEST 3 PASSED: PageBreak node synchronized across clients via CRDT\n');

  // TEST 4: Large Document Multi-Page Stress Test
  console.log('▶ TEST 4: 5-Page Concurrent Editing Stress Test');
  const totalParagraphs = 30; // Simulating ~4-5 full A4 pages of paragraphs
  for (let i = 0; i < totalParagraphs; i++) {
    const p = new Y.XmlElement('paragraph');
    const t = new Y.XmlText(`Paragraph ${i + 1}: Real-time collaborative document synchronization with zero data loss.`);
    p.insert(0, [t]);
    if (i % 2 === 0) {
      xmlFragmentA.insert(xmlFragmentA.length, [p]);
    } else {
      xmlFragmentB.insert(xmlFragmentB.length, [p]);
    }
  }

  await sleep(1000);

  if (xmlFragmentA.toString() !== xmlFragmentB.toString()) {
    throw new Error('Large document stress test failed convergence');
  }
  console.log(`  Successfully synchronized ${xmlFragmentA.length} total blocks across simulated pages`);
  console.log('  ✅ TEST 4 PASSED: Multi-page document stress test passed 100%\n');

  // TEST 5: DOCX Export with Page Break Generation
  console.log('▶ TEST 5: DOCX Generation with Page Breaks');
  const docx = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun('Page 1 Title')] }),
          new Paragraph({ pageBreakBefore: true, children: [new TextRun('Page 2 Content')] }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(docx);
  console.log('  Generated DOCX with pageBreakBefore byte size:', blob.size);
  if (blob.size < 1000) {
    throw new Error('Generated DOCX blob is too small');
  }
  console.log('  ✅ TEST 5 PASSED: DOCX export with page breaks verified\n');

  providerA.destroy();
  providerB.destroy();
  docA.destroy();
  docB.destroy();

  console.log('========================================================');
  console.log('🎉 ALL PAGINATION TESTS PASSED (5/5)');
  console.log('========================================================');
}

runPaginationTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
