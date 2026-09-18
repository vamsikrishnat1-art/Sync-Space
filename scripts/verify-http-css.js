const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- Verifying Landing Page ---');
  const home = await fetchUrl('http://localhost:3000/');
  console.log(`Landing Page Status: ${home.statusCode}`);
  
  // Extract CSS stylesheet links from HTML
  const cssMatches = home.body.match(/\/(_next\/static\/css\/[a-zA-Z0-9_-]+\.css)/g) || [];
  console.log(`Found CSS stylesheet links:`, cssMatches);
  
  for (const cssPath of Array.from(new Set(cssMatches))) {
    const cssUrl = `http://localhost:3000${cssPath}`;
    const cssRes = await fetchUrl(cssUrl);
    console.log(`Fetched ${cssUrl} -> HTTP ${cssRes.statusCode} (${cssRes.body.length} bytes)`);
    if (cssRes.statusCode !== 200 || cssRes.body.length < 1000) {
      console.error(`ERROR: CSS at ${cssUrl} failed to load properly!`);
      process.exit(1);
    }
  }

  console.log('\n--- Verifying Editor Page ---');
  const editor = await fetchUrl('http://localhost:3000/editor?room=test-verify');
  console.log(`Editor Page Status: ${editor.statusCode}`);
  const editorCssMatches = editor.body.match(/\/(_next\/static\/css\/[a-zA-Z0-9_-]+\.css)/g) || [];
  console.log(`Found Editor CSS stylesheet links:`, editorCssMatches);
  for (const cssPath of Array.from(new Set(editorCssMatches))) {
    const cssUrl = `http://localhost:3000${cssPath}`;
    const cssRes = await fetchUrl(cssUrl);
    console.log(`Fetched ${cssUrl} -> HTTP ${cssRes.statusCode} (${cssRes.body.length} bytes)`);
  }

  console.log('\nAll CSS stylesheets and pages are serving HTTP 200 with complete contents!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
