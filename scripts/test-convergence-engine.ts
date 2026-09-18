import * as Y from 'yjs';

function runMultiClientConvergenceTest(numClients: number, opsPerClient: number) {
  console.log(`\n🔬 Testing CRDT Convergence with ${numClients} clients, ${opsPerClient} ops/client (${numClients * opsPerClient} total ops)...`);
  const startTime = Date.now();

  // 1. Create isolated docs
  const docs: Y.Doc[] = Array.from({ length: numClients }, () => new Y.Doc());
  const expectedTokens: string[] = [];

  // 2. Generate concurrent operations under simulated partition
  for (let c = 0; c < numClients; c++) {
    const doc = docs[c];
    const ytext = doc.getText('crdt-stress');

    for (let op = 0; op < opsPerClient; op++) {
      const token = `[Client-${c + 1}:Op-${op + 1}]`;
      expectedTokens.push(token);

      // Append or insert at document boundaries to simulate user paragraphs
      ytext.insert(ytext.length, `\n${token} Concurrent edit from client ${c + 1}`);
    }
  }

  // 3. Extract and cross-apply all binary state updates
  const updates = docs.map((doc) => Y.encodeStateAsUpdate(doc));
  for (let i = 0; i < docs.length; i++) {
    for (let j = 0; j < updates.length; j++) {
      if (i !== j) {
        Y.applyUpdate(docs[i], updates[j]);
      }
    }
  }

  // 4. Validate convergence
  const finalOutputs = docs.map((doc) => doc.getText('crdt-stress').toString());
  const reference = finalOutputs[0];

  for (let i = 1; i < finalOutputs.length; i++) {
    if (finalOutputs[i] !== reference) {
      throw new Error(`Convergence failed: Doc ${i} does not match reference Doc 0`);
    }
  }

  let preserved = 0;
  for (const token of expectedTokens) {
    if (reference.includes(token)) {
      preserved++;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✅ ${numClients} Clients CONVERGED in ${duration}ms`);
  console.log(`✅ Ops Generated: ${expectedTokens.length}, Ops Preserved: ${preserved}, Data Loss: ${expectedTokens.length - preserved}`);
  console.log(`✅ State Agreement: 100% IDENTICAL across all ${numClients} clients`);
  console.log(`✅ Sample: "${reference.slice(0, 80)}..."`);

  if (preserved !== expectedTokens.length) {
    throw new Error(`Data loss detected! Preserved: ${preserved}/${expectedTokens.length}`);
  }

  docs.forEach((d) => d.destroy());
}

try {
  runMultiClientConvergenceTest(5, 20); // 100 ops
  runMultiClientConvergenceTest(10, 50); // 500 ops
  console.log('\n🎉 ALL CONVERGENCE ENGINE TESTS PASSED WITH ZERO DATA LOSS!\n');
} catch (err) {
  console.error('❌ Test failed:', err);
  process.exit(1);
}
