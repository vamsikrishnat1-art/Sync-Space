const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mdPath = path.join(__dirname, '..', 'SYNCSPACE_COMPLETE_PRD.md');
const tempHtmlPath = path.join(__dirname, '..', 'prd_temp.html');
const outHtmlPath = path.join(__dirname, '..', 'SYNCSPACE_COMPLETE_PRD.html');
const outPdfPath = path.join(__dirname, '..', 'SYNCSPACE_COMPLETE_PRD.pdf');

// Run marked using relative paths from workspace root
console.log('Generating HTML from markdown...');
execSync('npx.cmd --yes marked -i SYNCSPACE_COMPLETE_PRD.md -o prd_temp.html', { cwd: path.join(__dirname, '..'), shell: 'cmd.exe' });

const bodyContent = fs.readFileSync(tempHtmlPath, 'utf8');

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SyncSpace — Complete Product & Technical Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a202c;
      background: #ffffff;
      padding: 0;
      margin: 0;
    }
    h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-top: 0;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 22pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      margin-top: 14pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }
    h4 {
      font-size: 10.5pt;
      font-weight: 600;
      color: #475569;
      margin-top: 10pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }
    p, li {
      color: #334155;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9pt;
      background-color: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      color: #0f172a;
    }
    pre {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 8.5pt;
      line-height: 1.4;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 9pt;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    blockquote {
      border-left: 4px solid #3b82f6;
      margin: 10pt 0;
      padding: 6pt 12pt;
      background-color: #eff6ff;
      color: #1e3a8a;
      border-radius: 0 6px 6px 0;
    }
    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 20pt 0;
    }
    ul, ol {
      margin-top: 4pt;
      margin-bottom: 8pt;
      padding-left: 20px;
    }
    li {
      margin-bottom: 3pt;
    }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;

fs.writeFileSync(outHtmlPath, fullHtml, 'utf8');
if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);

console.log('Rendering PDF via Headless Chrome...');
const { execFileSync } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
execFileSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${outPdfPath}`,
  outHtmlPath
]);

console.log('PDF generated successfully at:', outPdfPath);
const stats = fs.statSync(outPdfPath);
console.log('PDF Size (bytes):', stats.size);
