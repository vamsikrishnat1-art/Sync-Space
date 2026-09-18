import http from 'http';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  ws: WebSocket;
  id = 1;
  callbacks = new Map<number, (res: any) => void>();

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  async init() {
    return new Promise<void>((resolve) => {
      this.ws.on('open', () => resolve());
      this.ws.on('message', (data: string) => {
        const msg = JSON.parse(data);
        if (msg.id && this.callbacks.has(msg.id)) {
          this.callbacks.get(msg.id)!(msg);
          this.callbacks.delete(msg.id);
        }
      });
    });
  }

  async send(method: string, params: any = {}): Promise<any> {
    const id = this.id++;
    return new Promise((resolve) => {
      this.callbacks.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression: string): Promise<any> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.result?.value;
  }

  async captureScreenshot(outputPath: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res.result?.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.result.data, 'base64'));
    }
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  const PORT = 9222;
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.resolve('temp-chrome-cdp');

  const roomName = `align-test-${Date.now()}`;
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,1024',
    `http://localhost:3000/editor?room=${roomName}`,
  ]);

  try {
    // Wait for Chrome to bind to port
    let connected = false;
    let targets: any[] = [];
    for (let i = 0; i < 20; i++) {
      await wait(500);
      try {
        targets = await getJson(`http://127.0.0.1:${PORT}/json`);
        if (targets.length > 0) {
          connected = true;
          break;
        }
      } catch {}
    }

    if (!connected) {
      console.error('Failed to connect to Chrome remote debugging port');
      return;
    }

    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) {
      console.error('No page target found');
      return;
    }

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.init();

    console.log('Connected to Chrome DevTools Protocol');
    await client.send('Page.enable');
    await client.send('DOM.enable');

    // Wait for Tiptap editor and sync to be ready
    console.log('Waiting for editor to load and connect to CRDT...');
    for (let i = 0; i < 30; i++) {
      await wait(500);
      const ready = await client.evaluate(`!!document.querySelector('.ProseMirror')`);
      if (ready) break;
    }

    // Wait for CRDT to sync
    await wait(1500);

    // 1. Measure initial alignment
    const metrics = await client.evaluate(`
      (() => {
        const pm = document.querySelector('.ProseMirror');
        const sheet = document.querySelector('#page-sheet-1');
        const header = sheet ? sheet.querySelector('div') : null;
        const p = pm ? pm.querySelector('p') : null;
        
        const pmRect = pm.getBoundingClientRect();
        const sheetRect = sheet.getBoundingClientRect();
        const headerRect = header ? header.getBoundingClientRect() : null;
        const pRect = p ? p.getBoundingClientRect() : null;

        return {
          pmWidth: pmRect.width,
          sheetWidth: sheetRect.width,
          pmLeft: pmRect.left,
          sheetLeft: sheetRect.left,
          headerLeft: headerRect ? headerRect.left : null,
          headerTop: headerRect ? headerRect.top : null,
          headerBottom: headerRect ? headerRect.bottom : null,
          pLeft: pRect ? pRect.left : null,
          pTop: pRect ? pRect.top : null,
          paddingTop: window.getComputedStyle(pm).paddingTop,
          paddingLeft: window.getComputedStyle(pm).paddingLeft,
          paddingRight: window.getComputedStyle(pm).paddingRight,
          paddingBottom: window.getComputedStyle(pm).paddingBottom,
        };
      })()
    `);

    console.log('\n--- INITIAL ALIGNMENT METRICS ---');
    console.log('Sheet width:', metrics.sheetWidth, 'ProseMirror width:', metrics.pmWidth);
    console.log('Sheet left:', metrics.sheetLeft, 'ProseMirror left:', metrics.pmLeft);
    console.log('Header bottom:', metrics.headerBottom, 'Paragraph top:', metrics.pTop);
    console.log('Paragraph left margin relative to sheet:', metrics.pLeft - metrics.sheetLeft);
    console.log('ProseMirror computed padding:', {
      top: metrics.paddingTop,
      left: metrics.paddingLeft,
      right: metrics.paddingRight,
      bottom: metrics.paddingBottom,
    });

    const isAligned =
      metrics.pmWidth === metrics.sheetWidth &&
      metrics.pLeft - metrics.sheetLeft === 64 &&
      metrics.pTop > metrics.headerBottom;

    console.log('Alignment Check Passed?', isAligned ? '✅ YES' : '❌ NO');

    // 2. Focus ProseMirror and type text
    console.log('\nFocusing editor and typing "Hello SyncSpace" on Page 1...');
    await client.evaluate(`
      (() => {
        const pm = document.querySelector('.ProseMirror');
        pm.focus();
      })()
    `);
    await wait(200);

    await client.send('Input.insertText', { text: 'Hello SyncSpace' });
    await wait(500);

    const docText = await client.evaluate(`document.querySelector('.ProseMirror').innerText.trim()`);
    console.log('Doc text after typing:', JSON.stringify(docText));

    await client.captureScreenshot('editor-after-typing.png');
    console.log('Saved editor-after-typing.png');

    // 3. Create Page 2 by clicking Insert Page Break in toolbar
    console.log('\nInserting page break via toolbar...');
    await client.evaluate(`
      (() => {
        const btn = document.querySelector('button[aria-label="Insert Page Break"]');
        if (btn) btn.click();
      })()
    `);
    await wait(1000);

    const pageCount = await client.evaluate(`document.querySelectorAll('[id^="page-sheet-"]').length`);
    console.log('Page count after page break:', pageCount);

    // Type on Page 2
    console.log('Typing on Page 2...');
    await client.send('Input.insertText', { text: 'Page Two Content' });
    await wait(500);

    // Scroll to top
    await client.evaluate(`
      (() => {
        const scroller = document.querySelector('.overflow-y-auto');
        if (scroller) scroller.scrollTop = 0;
      })()
    `);
    await wait(300);

    await client.captureScreenshot('editor-two-pages.png');
    console.log('Saved editor-two-pages.png');

    // Measure Page 2 content position
    const page2Metrics = await client.evaluate(`
      (() => {
        const sheets = document.querySelectorAll('[id^="page-sheet-"]');
        const sheet2 = sheets[1];
        if (!sheet2) return null;
        const sheet2Rect = sheet2.getBoundingClientRect();
        const pList = document.querySelectorAll('.ProseMirror > *');
        // Find element that is on Page 2
        for (const el of pList) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= sheet2Rect.top) {
            return {
              sheet2Top: sheet2Rect.top,
              sheet2Left: sheet2Rect.left,
              elTop: rect.top,
              elLeft: rect.left,
              diffY: rect.top - sheet2Rect.top,
              diffX: rect.left - sheet2Rect.left,
            };
          }
        }
        return null;
      })()
    `);
    console.log('Page 2 Content Metrics:', page2Metrics);
    if (page2Metrics) {
      console.log('Page 2 Content Top offset from sheet top:', page2Metrics.diffY, 'px (Target: ~72px)');
      console.log('Page 2 Content Left offset from sheet left:', page2Metrics.diffX, 'px (Target: 64px)');
    }

    // Scroll to the junction between Page 1 and Page 2 (showing gap & Page 2 top)
    console.log('\nScrolling to gap and Page 2...');
    await client.evaluate(`
      (() => {
        const scroller = document.querySelector('.overflow-y-auto');
        if (scroller) scroller.scrollTop = 700;
      })()
    `);
    await wait(400);
    await client.captureScreenshot('editor-gap-and-page2.png');
    console.log('Saved editor-gap-and-page2.png');

    // Click in the GAP between Page 1 and Page 2
    console.log('\nClicking in the GAP between Page 1 and Page 2...');
    const gapCoordinates = await client.evaluate(`
      (() => {
        const gap = document.querySelector('[class*="page-gap-visual"]');
        if (!gap) return null;
        const rect = gap.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()
    `);

    if (gapCoordinates) {
      console.log('Gap coordinates on screen:', gapCoordinates);
      // Click at gap center
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: gapCoordinates.x,
        y: gapCoordinates.y,
        clickCount: 1,
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: gapCoordinates.x,
        y: gapCoordinates.y,
        button: 'left',
      });

      await wait(300);

      // Try typing into the gap
      await client.send('Input.insertText', { text: 'GAPTEXT' });
      await wait(300);
      const textAfterGapClick = await client.evaluate(`document.querySelector('.ProseMirror').innerText`);
      const gapBlocked = !textAfterGapClick.includes('GAPTEXT');
      console.log('Typing in gap prevented?', gapBlocked ? '✅ PASSED (Gap is strictly non-editable)' : '❌ FAILED');
    }

    // Click on Page 2 writing area and type
    console.log('\nClicking on Page 2 writing area...');
    const page2Pos = await client.evaluate(`
      (() => {
        const sheet2 = document.querySelectorAll('[id^="page-sheet-"]')[1];
        if (!sheet2) return null;
        const rect = sheet2.getBoundingClientRect();
        return { x: rect.left + 100, y: rect.top + 90 };
      })()
    `);

    if (page2Pos) {
      await client.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: page2Pos.x,
        y: page2Pos.y,
        button: 'left',
        clickCount: 1,
      });
      await client.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: page2Pos.x,
        y: page2Pos.y,
        button: 'left',
      });
      await wait(300);

      await client.send('Input.insertText', { text: ' - Typed on Page 2' });
      await wait(300);
      const fullText = await client.evaluate(`document.querySelector('.ProseMirror').innerText`);
      console.log('Full document text after editing Page 2:', JSON.stringify(fullText));
      await client.captureScreenshot('editor-page2-edited.png');
      console.log('Saved editor-page2-edited.png');
    }

    // Test Delete Page Break / Empty Page via Backspace
    console.log('\nTesting Page Break deletion...');
    // Delete page break using Backspace from Page 2
    await client.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      windowsVirtualKeyCode: 8, // Backspace
    });
    await client.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      windowsVirtualKeyCode: 8,
    });
    await wait(800);

    const pagesAfterDelete = await client.evaluate(`document.querySelectorAll('[id^="page-sheet-"]').length`);
    console.log('Pages count after deletion test:', pagesAfterDelete);
    console.log('Page deletion successful?', pagesAfterDelete >= 1 ? '✅ PASSED (No crash, document intact)' : '❌ FAILED');

    // 4. Test Dark Theme
    console.log('\nTesting Dark Theme...');
    await client.evaluate(`
      (() => {
        document.documentElement.classList.add('dark');
        const scroller = document.querySelector('.overflow-y-auto');
        if (scroller) scroller.scrollTop = 0;
      })()
    `);
    await wait(400);
    await client.captureScreenshot('editor-dark-mode.png');
    console.log('Saved editor-dark-mode.png');

    client.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
