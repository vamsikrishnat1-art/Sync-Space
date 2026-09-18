import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { Editor } from '@tiptap/react';

type AlignmentTypeValue = (typeof AlignmentType)[keyof typeof AlignmentType];
type HeadingLevelValue = (typeof HeadingLevel)[keyof typeof HeadingLevel];

function sanitizeFilename(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]/g, '_') || 'Untitled Document';
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports document as plain text (.txt) file.
 */
export function exportAsTxt(title: string, editor: Editor) {
  const textContent = editor.getText();
  const filename = `${sanitizeFilename(title)}.txt`;
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Converts Tiptap text marks (bold, italic, underline, strike, color) to docx TextRuns.
 */
function convertTextNodes(contentNodes: any[] = []): TextRun[] {
  const runs: TextRun[] = [];

  for (const node of contentNodes) {
    if (node.type === 'text') {
      const isBold = node.marks?.some((m: any) => m.type === 'bold');
      const isItalic = node.marks?.some((m: any) => m.type === 'italic');
      const isUnderline = node.marks?.some((m: any) => m.type === 'underline');
      const isStrike = node.marks?.some((m: any) => m.type === 'strike');
      const colorMark = node.marks?.find((m: any) => m.type === 'textStyle' && m.attrs?.color);
      const hexColor = colorMark?.attrs?.color ? colorMark.attrs.color.replace('#', '') : undefined;

      runs.push(
        new TextRun({
          text: node.text || '',
          bold: isBold,
          italics: isItalic,
          underline: isUnderline ? {} : undefined,
          strike: isStrike,
          color: hexColor,
        })
      );
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ text: '\n', break: 1 }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun('')];
}

function getAlignment(align?: string): AlignmentTypeValue {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

/**
 * Exports document as Microsoft Word (.docx) file preserving headings, formatting, and lists.
 */
export async function exportAsDocx(title: string, editor: Editor) {
  const json = editor.getJSON();
  const docxParagraphs: Paragraph[] = [];

  // Title header in DOCX
  docxParagraphs.push(
    new Paragraph({
      text: title || 'Untitled Document',
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
    })
  );

  const nodes = json.content || [];

  for (const node of nodes) {
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      let docxHeading: HeadingLevelValue = HeadingLevel.HEADING_1;
      if (level === 2) docxHeading = HeadingLevel.HEADING_2;
      if (level === 3) docxHeading = HeadingLevel.HEADING_3;

      docxParagraphs.push(
        new Paragraph({
          children: convertTextNodes(node.content),
          heading: docxHeading,
          alignment: getAlignment(node.attrs?.textAlign),
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (node.type === 'paragraph') {
      docxParagraphs.push(
        new Paragraph({
          children: convertTextNodes(node.content),
          alignment: getAlignment(node.attrs?.textAlign),
          spacing: { after: 140, line: 276 },
        })
      );
    } else if (node.type === 'bulletList' || node.type === 'taskList') {
      const items = node.content || [];
      for (const item of items) {
        const textRuns: TextRun[] = [];
        const isChecked = item.attrs?.checked;
        const prefix = node.type === 'taskList' ? (isChecked ? '[✓] ' : '[ ] ') : '• ';

        textRuns.push(new TextRun({ text: prefix, bold: true }));

        const pNodes = item.content || [];
        for (const p of pNodes) {
          textRuns.push(...convertTextNodes(p.content));
        }

        docxParagraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 80 },
            indent: { left: 400 },
          })
        );
      }
    } else if (node.type === 'orderedList') {
      const items = node.content || [];
      let idx = 1;
      for (const item of items) {
        const textRuns: TextRun[] = [new TextRun({ text: `${idx}. `, bold: true })];
        const pNodes = item.content || [];
        for (const p of pNodes) {
          textRuns.push(...convertTextNodes(p.content));
        }

        docxParagraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 80 },
            indent: { left: 400 },
          })
        );
        idx++;
      }
    } else if (node.type === 'blockquote') {
      const pNodes = node.content || [];
      for (const p of pNodes) {
        docxParagraphs.push(
          new Paragraph({
            children: convertTextNodes(p.content),
            indent: { left: 600 },
            spacing: { before: 100, after: 100 },
            border: {
              left: {
                color: '4F46E5',
                space: 10,
                style: BorderStyle.SINGLE,
                size: 24,
              },
            },
          })
        );
      }
    } else if (node.type === 'codeBlock') {
      const runs = convertTextNodes(node.content);
      docxParagraphs.push(
        new Paragraph({
          children: runs,
          spacing: { before: 120, after: 120 },
          shading: { fill: 'F1F5F9' },
          indent: { left: 300, right: 300 },
        })
      );
    } else if (node.type === 'horizontalRule') {
      docxParagraphs.push(
        new Paragraph({
          text: '',
          border: {
            bottom: {
              color: 'CBD5E1',
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
    } else if (node.type === 'pageBreak') {
      docxParagraphs.push(
        new Paragraph({
          pageBreakBefore: true,
          children: [],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(title)}.docx`;
  triggerDownload(blob, filename);
}

/**
 * Triggers clean browser print dialog with document title for Save as PDF / Print.
 */
export function exportAsPdf(title: string) {
  const originalTitle = document.title;
  if (title) {
    document.title = title;
  }
  window.print();
  document.title = originalTitle;
}
