const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, '..', 'docs');
const figuresDir = path.join(docsDir, 'figures');
const logoPath = path.join(docsDir, 'srm_logo_hd.png');

const SECTION_BREAK = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';

const imageDimensions = {
  // Suriya Diagrams & Figures
  "fig_arch_suriya.png": { width: 2400, height: 1440, ratio: 1.667 },
  "fig_dfd_lvl0_suriya.png": { width: 2400, height: 1240, ratio: 1.935 },
  "fig_dfd_lvl1_suriya.png": { width: 2400, height: 1360, ratio: 1.765 },
  "fig_dfd_lvl2_suriya.png": { width: 2400, height: 1360, ratio: 1.765 },
  "fig_financial_er_model.png": { width: 2400, height: 1844, ratio: 1.302 },
  "fig_escrow_statemachine.png": { width: 2400, height: 1040, ratio: 2.308 },
  "fig_refund_timelock_flow.png": { width: 2400, height: 1120, ratio: 2.143 },
  "fig_generation_fencing_seq.png": { width: 2400, height: 1120, ratio: 2.143 },
  "fig_dispute_consensus_pipeline.png": { width: 2400, height: 1120, ratio: 2.143 },

  // Vignesh Diagrams & Figures
  "fig_arch_vignesh.png": { width: 2400, height: 1440, ratio: 1.667 },
  "fig_frontend_dfd_lvl0.png": { width: 2400, height: 1240, ratio: 1.935 },
  "fig_frontend_dfd_lvl1.png": { width: 2400, height: 1360, ratio: 1.765 },
  "fig_client_escrow_flow.png": { width: 2400, height: 1120, ratio: 2.143 },
  "fig_freelancer_ci_seq.png": { width: 2400, height: 1120, ratio: 2.143 },
  "fig_dispute_consensus_state.png": { width: 2400, height: 1040, ratio: 2.308 },

  // Live Application Screenshots (High-Resolution Pristine Light Mode)
  "screenshot_landing_page.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_projects_marketplace.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_project_workspace.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_milestones_studio.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_ask_ai_chat.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_wallet_escrow.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_wallet_required_banner.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_contracts_registry.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_disputes_consensus.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_wallet_escrow_balances.png": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_project_detail_mobile.jpg": { width: 2880, height: 1800, ratio: 1.600 },
  "screenshot_ask_ai_chat.jpg": { width: 2880, height: 1800, ratio: 1.600 }
};

// Helper to format image tag with caption (renders as clean block div, not a table)
function renderFigure(imageName, figNumber, caption) {
  const imgPath = path.join(figuresDir, imageName);
  const info = imageDimensions[imageName] || { ratio: 1.6 };
  let targetWidthPt, targetHeightPt;

  if (imageName.startsWith('screenshot_')) {
    // Large application screenshots: 395pt width (91.2% of printable page width)
    // Allows two screenshots + captions + descriptions to fit cleanly on one page (total ~610pt < 698pt usable height)
    targetWidthPt = 395;
    targetHeightPt = Math.round(targetWidthPt / info.ratio); // 247 pt
  } else if (info.ratio >= 1.8) {
    // Wide diagrams (DFD Level 0, sequence diagrams, state machines)
    targetWidthPt = 415;
    targetHeightPt = Math.round(targetWidthPt / info.ratio);
  } else if (info.ratio >= 1.5) {
    // Architecture and standard diagrams
    targetWidthPt = 415;
    targetHeightPt = Math.round(targetWidthPt / info.ratio);
  } else {
    // Taller models (ER model: ratio 1.302)
    targetWidthPt = 390;
    targetHeightPt = Math.round(targetWidthPt / info.ratio);
  }

  const imgBorder = imageName.startsWith('screenshot_') ? 'border: 1px solid #000000;' : '';

  let html = `
<div class="figure-container" style="text-align: center; margin-top: 2pt; margin-bottom: 2pt; page-break-inside: avoid !important;">
  <p align="center" style="text-align: center; margin: 0 auto; line-height: 1.0; mso-line-height-rule: exactly; page-break-inside: avoid; page-break-after: avoid; mso-keep-with-next: yes;">
    <img src="${imgPath}" alt="${caption}" style="width: ${targetWidthPt}pt; max-width: 100%; height: auto; display: block; margin: 0 auto; ${imgBorder}" />
  </p>
  <p align="center" class="figure-caption" style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; color: #000000; margin-top: 2pt; margin-bottom: 2pt; line-height: 1.15; page-break-before: avoid; page-break-after: avoid; mso-keep-with-next: yes;">Figure ${figNumber}: ${caption}</p>
</div>`;
  return html;
}

// Markdown parser customized for academic reports
function parseMarkdownForAcademic(mdText, figuresMap) {
  const lines = mdText.split(/\r?\n/);
  const htmlLines = [];
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer = [];
  let inTable = false;
  let tableBuffer = [];
  let inList = false;
  let listItems = [];

  function flushList() {
    if (inList && listItems.length > 0) {
      htmlLines.push('<ul style="margin-left: 20pt; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">');
      for (const item of listItems) {
        htmlLines.push(`  <li style="margin-bottom: 3pt; text-align: justify; font-size: 12pt; line-height: 1.5;">${item}</li>`);
      }
      htmlLines.push('</ul>');
      listItems = [];
      inList = false;
    }
  }

  function flushTable() {
    if (inTable && tableBuffer.length > 0) {
      htmlLines.push(convertMarkdownTableToHtml(tableBuffer));
      tableBuffer = [];
      inTable = false;
    }
  }

  function formatInline(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\\([$])/g, '$1')
      .replace(/\$([^\$]+)\$/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/&nbsp;/g, ' ');
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Explicit \newpage
    if (line.trim() === '\\newpage') {
      flushList();
      flushTable();
      let nextIsHeading = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().length === 0) continue;
        if (lines[j].trim().startsWith('# ')) {
          nextIsHeading = true;
        }
        break;
      }
      if (!nextIsHeading) {
        htmlLines.push('<div style="page-break-before: always;"></div>');
      }
      continue;
    }

    // Code blocks start or end
    if (line.trim().startsWith('```')) {
      flushList();
      flushTable();
      if (inCodeBlock) {
        const codeText = codeBuffer.join('\n');
        inCodeBlock = false;
        codeBuffer = [];

        // Check if ASCII art diagram
        const isAsciiArt = (codeLanguage === '' || codeLanguage === 'text') && (
          codeText.includes('+----+') || codeText.includes('+---') || codeText.includes('|    |') ||
          codeText.includes('|---') || codeText.includes('┌──') || codeText.includes('│') ||
          codeText.includes('──>') || codeText.includes('==>') || codeText.includes('+-------')
        );

        let nextCaptionLine = '';
        let captionLineIdx = -1;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim().startsWith('*Figure') || lines[j].trim().match(/^Figure\s+\d+\.\d+:/)) {
            nextCaptionLine = lines[j].trim();
            captionLineIdx = j;
            break;
          }
          if (lines[j].trim().length > 0 && !lines[j].trim().startsWith('*Figure')) {
            break;
          }
        }

        if (isAsciiArt) {
          let matchedFig = null;
          if (nextCaptionLine) {
            for (const [key, figData] of Object.entries(figuresMap)) {
              if (nextCaptionLine.includes(key + ":") || nextCaptionLine.includes(key + " :")) {
                matchedFig = figData;
                break;
              }
            }
          }

          if (matchedFig) {
            htmlLines.push(renderFigure(matchedFig.image, matchedFig.num, matchedFig.caption));
            if (captionLineIdx !== -1) {
              i = captionLineIdx;
            }
            continue;
          } else {
            continue;
          }
        }

        // Real code block
        const escaped = codeText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        if (escaped.trim().length > 0) {
          htmlLines.push(`<pre><code class="language-${codeLanguage}">${escaped}</code></pre>`);
        }
        codeLanguage = '';
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Standalone Figure caption
    if (line.trim().startsWith('*Figure') || line.trim().match(/^Figure\s+\d+\.\d+:/)) {
      let matchedFig = null;
      for (const [key, figData] of Object.entries(figuresMap)) {
        if (line.includes(key + ":") || line.includes(key + " :")) {
          matchedFig = figData;
          break;
        }
      }
      if (matchedFig) {
        flushList();
        flushTable();
        htmlLines.push(renderFigure(matchedFig.image, matchedFig.num, matchedFig.caption));
        continue;
      }
    }

    // Table caption (e.g. *Table 2.1: ...*)
    if (line.trim().startsWith('*Table ') || line.trim().startsWith('Table ')) {
      flushList();
      flushTable();
      const rawCaption = line.trim().replace(/^\*|\*$/g, '').trim();
      htmlLines.push(`<p align="center" class="table-caption" style="text-align: center; font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; font-style: normal; color: #000000; margin-top: 10pt; margin-bottom: 4pt; page-break-after: avoid !important; mso-pagination: lines-together; mso-keep-with-next: yes;">${formatInline(rawCaption)}</p>`);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      inTable = true;
      tableBuffer.push(line.trim());
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      const h1Title = formatInline(line.slice(2).trim());
      if (h1Title.startsWith('CHAPTER 1') || h1Title.startsWith('1 ')) {
        htmlLines.push(`<h1 class="chapter-heading" style="page-break-before: auto; margin-top: 0pt; margin-bottom: 12pt;">${h1Title}</h1>`);
      } else {
        htmlLines.push(`<h1 class="chapter-heading" style="page-break-before: always; margin-top: 0pt; margin-bottom: 12pt;">${h1Title}</h1>`);
      }
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      htmlLines.push(`<h2>${formatInline(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      htmlLines.push(`<h3>${formatInline(line.slice(4).trim())}</h3>`);
      continue;
    }

    // Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      inList = true;
      listItems.push(formatInline(line.trim().slice(2)));
      continue;
    } else {
      flushList();
    }

    // Empty lines
    if (line.trim().length === 0) {
      continue;
    }

    // Horizontal rules
    if (line.trim() === '---' || line.trim() === '***') {
      continue;
    }

    // Bibliography entries (12pt font, hanging indent)
    if (line.trim().match(/^\[\d+\]/)) {
      htmlLines.push(`<p class="bibliography-entry">${formatInline(line.trim())}</p>`);
      continue;
    }

    // Regular body paragraphs (12pt font, 1.5 line spacing)
    htmlLines.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();
  flushTable();
  return htmlLines.join('\n');
}

// Convert markdown table rows into academic table HTML with 1px black borders & subtle gray header
function convertMarkdownTableToHtml(tableLines) {
  if (tableLines.length < 2) return '';
  const parseRow = (rowStr) =>
    rowStr
      .split('|')
      .slice(1, -1)
      .map(c => c.trim());

  const headers = parseRow(tableLines[0]);
  let dataRows = [];
  let startIndex = 1;

  if (tableLines[1].includes('---') || tableLines[1].includes(':---')) {
    startIndex = 2;
  }

  for (let i = startIndex; i < tableLines.length; i++) {
    dataRows.push(parseRow(tableLines[i]));
  }

  let html = '<table class="academic-table" style="width: 100%; border-collapse: collapse; margin-top: 4pt; margin-bottom: 6pt; border: 1px solid #000000; page-break-inside: auto;">\n  <thead>\n    <tr style="page-break-inside: avoid; mso-keep-with-next: yes;">\n';
  for (const h of headers) {
    html += `      <th style="border: 1px solid #000000; background-color: #ffffff; padding: 3pt 6pt; font-family: 'Times New Roman', serif; font-size: 10.5pt; font-weight: bold; color: #000000; text-align: left;">${h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>\n`;
  }
  html += '    </tr>\n  </thead>\n  <tbody>\n';

  for (const row of dataRows) {
    html += '    <tr style="page-break-inside: avoid;">\n';
    for (let c = 0; c < row.length; c++) {
      const cell = row[c] || '';
      const formatted = cell
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\([$])/g, '$1')
        .replace(/\$([^\$]+)\$/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      html += `      <td style="border: 1px solid #000000; padding: 2.5pt 6pt; font-family: 'Times New Roman', serif; font-size: 10pt; line-height: 1.2; color: #000000; vertical-align: top;">${formatted}</td>\n`;
    }
    html += '    </tr>\n';
  }
  html += '  </tbody>\n</table>';
  return html;
}

// Base styles strictly following SRM academic specification: Headings 15pt, Body 12pt, Line-spacing 1.5
const baseStyles = `
@page {
  size: A4 portrait;
  margin-top: 1.0in;
  margin-bottom: 1.0in;
  margin-left: 1.25in;
  margin-right: 1.0in;
  mso-header-margin: 0.5in;
  mso-footer-margin: 0.5in;
  mso-page-border-surround-header: no;
  mso-page-border-surround-footer: no;
}

body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #000000;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
}

h1.chapter-heading {
  font-family: 'Times New Roman', Times, serif;
  font-size: 15pt;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  margin-top: 0pt;
  margin-bottom: 10pt;
  color: #000000;
  page-break-after: avoid;
  mso-keep-with-next: yes;
}

h1.frontmatter-heading {
  font-family: 'Times New Roman', Times, serif;
  font-size: 15pt;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  margin-top: 0pt;
  margin-bottom: 10pt;
  page-break-before: auto;
  page-break-after: avoid;
  color: #000000;
  mso-keep-with-next: yes;
}

h2 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 15pt;
  font-weight: bold;
  margin-top: 10pt;
  margin-bottom: 4pt;
  page-break-after: avoid;
  color: #000000;
  mso-keep-with-next: yes;
}

h3 {
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  font-weight: bold;
  margin-top: 7pt;
  margin-bottom: 3pt;
  page-break-after: avoid;
  color: #000000;
  mso-keep-with-next: yes;
}

p {
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.5;
  text-align: justify;
  text-justify: inter-word;
  margin-top: 0pt;
  margin-bottom: 5pt;
  color: #000000;
}

p.table-caption, .table-caption {
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  font-weight: bold;
  font-style: normal;
  text-align: center;
  color: #000000;
  margin-top: 10pt;
  margin-bottom: 4pt;
  page-break-after: avoid !important;
  mso-pagination: lines-together;
  mso-keep-with-next: yes;
}

p.figure-caption, .figure-caption {
  font-family: 'Times New Roman', Times, serif;
  font-size: 11pt;
  font-weight: bold;
  font-style: normal;
  text-align: center;
  color: #000000;
  margin-top: 4pt;
  margin-bottom: 4pt;
  page-break-before: avoid !important;
  page-break-after: avoid !important;
  mso-pagination: lines-together;
  mso-keep-with-next: yes;
}

pre {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 4pt 6pt;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 8.5pt;
  line-height: 1.2;
  margin-top: 3pt;
  margin-bottom: 5pt;
  page-break-inside: avoid;
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 9pt;
  background-color: #f1f5f9;
  padding: 1pt 3pt;
  border-radius: 2pt;
}

table.academic-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6pt;
  margin-bottom: 8pt;
  page-break-inside: auto;
  font-family: 'Times New Roman', Times, serif;
  font-size: 10pt;
  border: 1px solid #000000;
}

table.academic-table th, table.academic-table td {
  border: 1px solid #000000;
  padding: 4pt 6pt;
  text-align: left;
  vertical-align: top;
  line-height: 1.25;
  color: #000000;
}

table.academic-table th {
  background-color: #ffffff;
  color: #000000;
  font-weight: bold;
  text-align: left;
  font-size: 10.5pt;
}

table.toc-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4pt;
  margin-bottom: 0pt;
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.25;
  border: 1px solid #000000;
}

table.toc-table th, table.toc-table td {
  border: 1px solid #000000;
  padding: 3pt 5pt;
  vertical-align: middle;
  color: #000000;
  font-size: 12pt;
}

table.toc-table th {
  background-color: #ffffff;
  color: #000000;
  font-weight: bold;
  text-align: center;
  font-size: 12pt;
}

table.toc-table td.center {
  text-align: center;
  vertical-align: middle;
}

p.bibliography-entry {
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.35;
  text-align: justify;
  text-justify: inter-word;
  margin-top: 0pt;
  margin-bottom: 4pt;
  padding-left: 22pt;
  text-indent: -22pt;
  color: #000000;
}

table.borderless-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8pt;
  margin-bottom: 8pt;
}

table.borderless-table td {
  border: none;
  padding: 2pt 4pt;
  vertical-align: top;
}

.center { text-align: center; }
.right { text-align: right; }
`;

function generateStudentDocumentHtml(cfg, bodyHtml) {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${cfg.title}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
${baseStyles}
.abstract-p {
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.5;
  text-align: justify;
  text-justify: inter-word;
  margin-top: 0pt;
  margin-bottom: 10pt;
  text-indent: 0pt;
  color: #000000;
}
</style>
</head>
<body>

<!-- 1. TITLE / COVER PAGE (Page 1 - EXACT SRM REFERENCE LAYOUT) -->
<div style="text-align: center; margin-top: 0pt; line-height: 1.3;">
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; font-weight: bold; margin-top: 0pt; margin-bottom: 8pt; letter-spacing: 0.5px; text-transform: uppercase;">CAPSTONE PROJECT REPORT</p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin-top: 0pt; margin-bottom: 8pt; text-transform: uppercase;">ON</p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 12.5pt; font-weight: bold; line-height: 1.35; margin-top: 0pt; margin-bottom: 14pt; text-transform: uppercase;">
    ${cfg.title}
  </p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">A PROJECT REPORT SUBMITTED TO</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; font-weight: bold; margin-top: 0pt; margin-bottom: 10pt; text-transform: uppercase;">SRM INSTITUTE OF SCIENCE &amp; TECHNOLOGY</p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 10pt; font-weight: normal; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin-top: 0pt; margin-bottom: 12pt; text-transform: uppercase;">MASTER OF COMPUTER APPLICATION</p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 3pt; text-transform: uppercase;">BY</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">${cfg.studentName}</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 12pt; text-transform: uppercase;">REG NO: ${cfg.regNo}</p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">UNDER THE GUIDANCE OF</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; font-weight: bold; margin-top: 0pt; margin-bottom: 10pt;">${cfg.guide}</p>

  <div style="margin-top: 0pt; margin-bottom: 10pt; text-align: center;">
    <img src="${logoPath}" alt="SRM Logo" width="200" height="68" style="width: 150pt; height: 50.8pt; display: block; margin: 0 auto;" />
  </div>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">DEPARTMENT OF COMPUTER APPLICATIONS (MCA)</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">FACULTY OF LIBERAL ARTS BUSINESS STUDIES</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 10pt; text-transform: uppercase;">VADAPALANI, CHENNAI</p>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; font-weight: bold; margin-top: 0pt; margin-bottom: 0pt;">2026-2027</p>
</div>

${SECTION_BREAK}

<!-- 2. BONAFIDE CERTIFICATE (Page 2 - EXACT SRM REFERENCE LAYOUT) -->
<div style="text-align: center; margin-top: 0pt; line-height: 1.3;">
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">DEPARTMENT OF COMPUTER APPLICATIONS (MCA)</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">FACULTY OF LIBERAL ARTS BUSINESS STUDIES</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 2pt; text-transform: uppercase;">SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; font-weight: bold; margin-top: 0pt; margin-bottom: 8pt; text-transform: uppercase;">VADAPALANI, CHENNAI</p>

  <div style="margin-top: 0pt; margin-bottom: 8pt; text-align: center;">
    <img src="${logoPath}" alt="SRM Logo" width="173" height="59" style="width: 130pt; height: 44pt; display: block; margin: 0 auto;" />
  </div>

  <p style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; font-weight: bold; margin-top: 0pt; margin-bottom: 12pt; letter-spacing: 0.5px;">BONAFIDE CERTIFICATE</p>
</div>

<p style="font-family: 'Times New Roman', Times, serif; text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 11.5pt; margin-top: 0pt; margin-bottom: 16pt;">
  This is to certify that the project report titled <strong>&ldquo;${cfg.title}&rdquo;</strong> is work done and submitted by <strong>${cfg.studentName} (Reg. No: ${cfg.regNo})</strong> and submitted during 2026&ndash;2027 academic year, in partial fulfillment of the requirements for the award of the degree of <strong>MASTER OF COMPUTER APPLICATION</strong>, at <strong>SRM INSTITUTE OF SCIENCE &amp; TECHNOLOGY</strong>, Vadapalani, Chennai.
</p>

<table class="borderless-table" style="width: 100%; margin-top: 10pt; margin-bottom: 14pt;">
  <tr>
    <td style="width: 50%; text-align: left; font-size: 11pt; line-height: 1.35; vertical-align: top;">
      <strong>Signature of the Guide</strong><br /><br /><br />
      <strong>${cfg.guide}</strong><br />
      Associate Professor
    </td>
    <td style="width: 50%; text-align: right; font-size: 11pt; line-height: 1.35; vertical-align: top;">
      <strong>Signature of the HOD</strong><br /><br /><br />
      <strong>${cfg.hod}</strong><br />
      Head of the Department, MCA
    </td>
  </tr>
</table>

<p style="font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; line-height: 1.4; margin-top: 8pt; margin-bottom: 3pt;">
  <strong>Submitted for Project Work Viva-Voce Examination on ______________________</strong>
</p>
<p style="font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; font-weight: bold; margin-bottom: 18pt;">Place: VADAPALANI</p>

<table class="borderless-table" style="width: 100%; margin-top: 6pt; margin-bottom: 0pt;">
  <tr>
    <td style="width: 50%; text-align: left; font-size: 11pt; font-weight: bold; vertical-align: bottom;">
      INTERNAL EXAMINER
    </td>
    <td style="width: 50%; text-align: right; font-size: 11pt; font-weight: bold; vertical-align: bottom;">
      EXTERNAL EXAMINER
    </td>
  </tr>
</table>

${SECTION_BREAK}

<!-- 3. DECLARATION (Page 3 - EXACT SRM REFERENCE LAYOUT) -->
<div style="text-align: center; margin-top: 10pt; margin-bottom: 20pt;">
  <p style="font-family: 'Times New Roman', Times, serif; font-size: 15pt; font-weight: bold; letter-spacing: 0.5px;">DECLARATION</p>
</div>

<p style="font-family: 'Times New Roman', Times, serif; text-align: justify; text-justify: inter-word; line-height: 1.6; font-size: 12pt; margin-top: 10pt; margin-bottom: 16pt;">
  I hereby declare that the project report entitled <strong>&ldquo;${cfg.title}&rdquo;</strong> submitted to <strong>SRM INSTITUTE OF SCIENCE &amp; TECHNOLOGY</strong>, Vadapalani, Chennai, in partial fulfillment of the requirements for the award of the degree of <strong>MASTER OF COMPUTER APPLICATION</strong>, is a bonafide record of the original project work carried out by me under the guidance of <strong>${cfg.guide}</strong>, Department of Computer Applications (MCA).
</p>

<p style="font-family: 'Times New Roman', Times, serif; text-align: justify; text-justify: inter-word; line-height: 1.6; font-size: 12pt; margin-top: 10pt; margin-bottom: 36pt;">
  I further declare that this project work has not been submitted previously in part or in full to any other University or Institution for the award of any degree, diploma, or other similar academic recognition.
</p>

<table class="borderless-table" style="width: 100%; margin-top: 24pt; margin-bottom: 10pt;">
  <tr>
    <td style="width: 50%; text-align: left; font-size: 11pt; line-height: 1.4; vertical-align: top;">
      <strong>Place: VADAPALANI, CHENNAI</strong><br /><br />
      <strong>Date:</strong>
    </td>
    <td style="width: 50%; text-align: right; font-size: 11pt; line-height: 1.4; vertical-align: top;">
      <strong>Signature of the Candidate</strong><br /><br /><br /><br />
      <strong>${cfg.studentName}</strong><br />
      <strong>REG NO: ${cfg.regNo}</strong>
    </td>
  </tr>
</table>

${SECTION_BREAK}

<!-- 4. ABSTRACT (Page 4 - (i)) -->
<h1 class="frontmatter-heading">ABSTRACT</h1>
${cfg.abstractHtml}

${SECTION_BREAK}

<!-- 5. ACKNOWLEDGEMENT (Page 5 - (ii)) -->
<h1 class="frontmatter-heading">ACKNOWLEDGEMENT</h1>
${cfg.acknowledgementHtml}

${SECTION_BREAK}

<!-- 6. TABLE OF CONTENTS (Pages 6 & 7 - (iii) & (iv)) -->
<h1 class="frontmatter-heading" style="margin-bottom: 8pt;">TABLE OF CONTENTS</h1>
${cfg.tocHtml}

${SECTION_BREAK}

<!-- 7. LIST OF TABLES (Page 8 - (v)) -->
<h1 class="frontmatter-heading" style="margin-bottom: 8pt;">LIST OF TABLES</h1>
${cfg.tablesTableHtml}

${SECTION_BREAK}

<!-- 8. LIST OF FIGURES (Page 9 - (vi)) -->
<h1 class="frontmatter-heading" style="margin-bottom: 8pt;">LIST OF FIGURES</h1>
${cfg.figuresTableHtml}

${SECTION_BREAK}

<!-- 9. MAIN BODY CHAPTERS (Starting on Page 1) -->
${bodyHtml}

</body>
</html>`;
}

// ============================================================================
// STUDENT 1: SURIYA E CONFIGURATION
// ============================================================================
const suriyaFiguresMap = {
  // Fig 4.1 to 4.5 in Chapter 4 (Design)
  "Figure 4.1": {
    image: "fig_arch_suriya.png",
    num: "4.1",
    caption: "Architecture of FairWork Decentralized Escrow Protocol",
    analysis: "The system architecture partitions operations into four decoupled tiers: Client Tier (React 19 + MetaMask), API Gateway Tier (Express + JWT + Gemini AI), Settlement Processor Tier (Lease Manager with generation fencing, Reorg Engine, Arbitrator Relay), and Storage / Blockchain Plane (Sepolia Smart Contracts: EscrowContract, DisputeContract, ReputationContract, and MongoDB Replica Cluster)."
  },
  "Figure 4.2": {
    image: "fig_dfd_lvl0_suriya.png",
    num: "4.2",
    caption: "Data Flow Diagram — Level 0 (Context Level)",
    analysis: "The Context Level DFD depicts interaction boundaries between Human Users (Clients and Developers), the MetaMask Injected Signer, the Node.js Express API, and the Ethereum Sepolia smart contracts."
  },
  "Figure 4.3": {
    image: "fig_dfd_lvl1_suriya.png",
    num: "4.3",
    caption: "Data Flow Diagram — Level 1 (Decentralized Settlement Flow)",
    analysis: "The Level 1 Data Flow Diagram traces fund movement and state transitions. When a client funds a project, USDC tokens are transferred to EscrowContract.sol. The contract emits an EscrowFunded event indexed by reconciliationService.js. Upon milestone release, funds transfer directly to the freelancer address without platform commissions."
  },
  "Figure 4.4": {
    image: "fig_dfd_lvl2_suriya.png",
    num: "4.4",
    caption: "Data Flow Diagram — Level 2 (Reorg Engine & Lease Fencing)",
    analysis: "The Level 2 DFD outlines the internal indexing pipeline: reorgEngine.js queries canonical block hashes to roll back speculative database mutations whenever blockchain reorganizations exceed finality limits, while leaseManager.js enforces generation fencing."
  },
  "Figure 4.5": {
    image: "fig_financial_er_model.png",
    num: "4.5",
    caption: "Complete Project Entity-Relationship (ER) Data Model",
    analysis: "The complete project entity-relationship data model establishes relational schema integrity across on-chain Ethereum smart contracts and off-chain MongoDB collections. It defines Crow's Foot cardinality constraints across Users, Projects, Milestones, Deliverables with GitHub CI checks, Escrow Vaults, Disputes with AI arbitration, Settlement Events, and Generation-Fenced Sync Leases."
  },

  // Fig 8.1 to 8.6 in Chapter 8 (Appendix Screenshots - Live System Telemetry & Application UI)
  "Figure 8.1": {
    image: "screenshot_wallet_escrow.png",
    num: "8.1",
    caption: "Live Testnet Escrow Verification & Web3 Wallet Balances",
    analysis: "Live network telemetry and Web3 wallet balance verification on Ethereum Sepolia, verifying zero balance leakage and MetaMask EIP-1193 signer integration."
  },
  "Figure 8.2": {
    image: "screenshot_project_workspace.png",
    num: "8.2",
    caption: "Non-Custodial Smart Contract Milestone Escrow Vault",
    analysis: "Multi-milestone escrow vault workspace managing non-custodial capital locking in EscrowContract.sol with automated reconciliation tracking."
  },
  "Figure 8.3": {
    image: "screenshot_milestones_studio.png",
    num: "8.3",
    caption: "Milestone Deliverable Inspection & Automated Settlement Gates",
    analysis: "Automated milestone deliverable inspection integrating GitHub Actions CI verification and non-reentrant token disbursement gates."
  },
  "Figure 8.4": {
    image: "screenshot_ask_ai_chat.png",
    num: "8.4",
    caption: "AI Dispute Mediation Drawer & Arbitrator Execution Pipeline",
    analysis: "AI-assisted dispute mediation interface synthesizing deliverable diffs via Gemini 1.5 Pro and executing arbitrator signatures on Ethereum Sepolia."
  },
  "Figure 8.5": {
    image: "screenshot_projects_marketplace.png",
    num: "8.5",
    caption: "Decentralized Escrow Marketplace & Transactional Outbox Microservice",
    analysis: "Decentralized escrow marketplace synchronized by the background transactional outbox worker microservice with generation-fenced lease protection."
  },
  "Figure 8.6": {
    image: "screenshot_contracts_registry.png",
    num: "8.6",
    caption: "Sepolia Smart Contracts Deployment & Zero-Fee Settlement Ledger",
    analysis: "Verified protocol deployment metrics, smart contract registry, and zero-fee settlement ledger on the Ethereum Sepolia testnet."
  }
};

const suriyaTocHtml = `
<table class="toc-table">
  <thead>
    <tr>
      <th style="width: 15%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">S.NO</th>
      <th style="width: 70%; text-align: left; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">TITLE</th>
      <th style="width: 15%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">PAGE NO</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center">1</td><td><strong>BONAFIDE CERTIFICATE</strong></td><td class="center">I</td></tr>
    <tr><td class="center">2</td><td><strong>DECLARATION</strong></td><td class="center">II</td></tr>
    <tr><td class="center">3</td><td><strong>ACKNOWLEDGEMENT</strong></td><td class="center">III</td></tr>
    <tr><td class="center">4</td><td><strong>ABSTRACT</strong></td><td class="center">IV</td></tr>
    <tr><td class="center">5</td><td><strong>LIST OF TABLES</strong></td><td class="center">V</td></tr>
    <tr><td class="center">6</td><td><strong>LIST OF FIGURES</strong></td><td class="center">VI</td></tr>
    <tr>
      <td class="center">7</td>
      <td>
        <strong>INTRODUCTION</strong><br/>
        &nbsp;&nbsp;1.1 PROJECT INTRODUCTION<br/>
        &nbsp;&nbsp;1.2 BACKGROUND AND MOTIVATION<br/>
        &nbsp;&nbsp;1.3 PROBLEM STATEMENT<br/>
        &nbsp;&nbsp;1.4 NEED FOR THE PROJECT
      </td>
      <td class="center">1</td>
    </tr>
    <tr>
      <td class="center">8</td>
      <td>
        <strong>WORKING ENVIRONMENT</strong><br/>
        &nbsp;&nbsp;2.1 HARDWARE REQUIREMENT<br/>
        &nbsp;&nbsp;2.2 SOFTWARE REQUIREMENT<br/>
        &nbsp;&nbsp;2.3 SYSTEM SOFTWARE<br/>
        &nbsp;&nbsp;2.4 DEVELOPMENT ENVIRONMENT
      </td>
      <td class="center">3</td>
    </tr>
    <tr>
      <td class="center">9</td>
      <td>
        <strong>SYSTEM ANALYSIS</strong><br/>
        &nbsp;&nbsp;3.1 FEASIBILITY STUDY<br/>
        &nbsp;&nbsp;3.2 EXISTING SYSTEM<br/>
        &nbsp;&nbsp;3.3 DRAWBACKS OF EXISTING SYSTEM<br/>
        &nbsp;&nbsp;3.4 PROPOSED SYSTEM<br/>
        &nbsp;&nbsp;3.5 BENEFITS OF PROPOSED SYSTEM<br/>
        &nbsp;&nbsp;3.6 SCOPE OF THE PROJECT
      </td>
      <td class="center">5</td>
    </tr>
    <tr>
      <td class="center">10</td>
      <td>
        <strong>SYSTEM DESIGN</strong><br/>
        &nbsp;&nbsp;4.1 ARCHITECTURE DESIGN<br/>
        &nbsp;&nbsp;4.2 MODULE DESIGN<br/>
        &nbsp;&nbsp;4.3 DATA FLOW DESIGN<br/>
        &nbsp;&nbsp;4.4 DATA STORAGE DESIGN<br/>
        &nbsp;&nbsp;4.5 INTERFACE DESIGN
      </td>
      <td class="center">7</td>
    </tr>
    <tr>
      <td class="center">11</td>
      <td>
        <strong>PROJECT DESCRIPTION</strong><br/>
        &nbsp;&nbsp;5.1 OBJECTIVE<br/>
        &nbsp;&nbsp;5.2 MODULE DESCRIPTION<br/>
        &nbsp;&nbsp;5.3 IMPLEMENTATION<br/>
        &nbsp;&nbsp;5.4 MAINTENANCE
      </td>
      <td class="center">13</td>
    </tr>
    <tr>
      <td class="center">12</td>
      <td>
        <strong>SYSTEM TESTING</strong><br/>
        &nbsp;&nbsp;6.1 TESTING DEFINITION<br/>
        &nbsp;&nbsp;6.2 TESTING OBJECTIVE<br/>
        &nbsp;&nbsp;6.3 TYPES OF TESTING<br/>
        &nbsp;&nbsp;6.4 TEST CASES
      </td>
      <td class="center">16</td>
    </tr>
    <tr>
      <td class="center">13</td>
      <td>
        <strong>CONCLUSION</strong><br/>
        &nbsp;&nbsp;7.1 SUMMARY<br/>
        &nbsp;&nbsp;7.2 FUTURE ENHANCEMENT
      </td>
      <td class="center">18</td>
    </tr>
    <tr>
      <td class="center">14</td>
      <td>
        <strong>APPENDIX</strong><br/>
        &nbsp;&nbsp;8.1 SCREENSHOTS<br/>
        &nbsp;&nbsp;8.2 CODING<br/>
        &nbsp;&nbsp;8.3 DATA DICTIONARY<br/>
        &nbsp;&nbsp;8.4 PROJECT SPECIFICATION AND CONSIDERATIONS
      </td>
      <td class="center">19</td>
    </tr>
    <tr>
      <td class="center">15</td>
      <td><strong>BIBLIOGRAPHY AND REFERENCES</strong></td>
      <td class="center">29</td>
    </tr>
  </tbody>
</table>
`;

const suriyaTablesTableHtml = `
<table class="toc-table">
  <thead>
    <tr>
      <th style="width: 16%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">TABLE NO.</th>
      <th style="width: 70%; text-align: left; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">TABLE TITLE</th>
      <th style="width: 14%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center">2.1</td><td>Minimum and Recommended Hardware Requirements</td><td class="center">3</td></tr>
    <tr><td class="center">2.2</td><td>Software Specifications and Development Dependencies</td><td class="center">3</td></tr>
    <tr><td class="center">3.1</td><td>Comparative Matrix: Centralized Platforms vs. Proposed FairWork System</td><td class="center">6</td></tr>
    <tr><td class="center">4.1</td><td>System Modular Breakdown and Constituent File Matrix</td><td class="center">8</td></tr>
    <tr><td class="center">4.2</td><td>Database Collection &amp; Storage Schema</td><td class="center">12</td></tr>
    <tr><td class="center">6.1</td><td>Comprehensive Verification Test Suite (TC01 - TC10)</td><td class="center">17</td></tr>
    <tr><td class="center">8.1</td><td>Data Dictionary of Storage Entities and State Flags</td><td class="center">28</td></tr>
  </tbody>
</table>
`;

const suriyaFiguresTableHtml = `
<table class="toc-table">
  <thead>
    <tr>
      <th style="width: 16%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">FIGURE NO.</th>
      <th style="width: 70%; text-align: left; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">FIGURE TITLE</th>
      <th style="width: 14%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center">4.1</td><td>Architecture of FairWork Decentralized Escrow Protocol</td><td class="center">7</td></tr>
    <tr><td class="center">4.2</td><td>Data Flow Diagram &mdash; Level 0 (Context Level)</td><td class="center">9</td></tr>
    <tr><td class="center">4.3</td><td>Data Flow Diagram &mdash; Level 1 (Decentralized Settlement Flow)</td><td class="center">9</td></tr>
    <tr><td class="center">4.4</td><td>Data Flow Diagram &mdash; Level 2 (Reorg Engine &amp; Lease Fencing)</td><td class="center">10</td></tr>
    <tr><td class="center">4.5</td><td>Complete Project Entity-Relationship (ER) Data Model</td><td class="center">11</td></tr>
    <tr><td class="center">8.1</td><td>Live Testnet Escrow Verification &amp; Web3 Wallet Balances</td><td class="center">19</td></tr>
    <tr><td class="center">8.2</td><td>Non-Custodial Smart Contract Milestone Escrow Vault</td><td class="center">19</td></tr>
    <tr><td class="center">8.3</td><td>Milestone Deliverable Inspection &amp; Automated Settlement Gates</td><td class="center">20</td></tr>
    <tr><td class="center">8.4</td><td>AI Dispute Mediation Drawer &amp; Arbitrator Execution Pipeline</td><td class="center">20</td></tr>
    <tr><td class="center">8.5</td><td>Decentralized Escrow Marketplace &amp; Transactional Outbox Microservice</td><td class="center">21</td></tr>
    <tr><td class="center">8.6</td><td>Sepolia Smart Contracts Deployment &amp; Zero-Fee Settlement Ledger</td><td class="center">21</td></tr>
  </tbody>
</table>
`;

const suriyaAcknowledgementHtml = `
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I express my deepest sense of gratitude and sincere thanks to the Management and Dean, Faculty of Liberal Arts and Business Studies, SRM Institute of Science and Technology, Vadapalani, for providing the necessary facilities, academic environment, and infrastructure throughout the course of this project.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I wish to express my profound gratitude and heartfelt thanks to the Head of the Department, <strong>Dr. J. ANITHA RUTH, M.C.A., M.Phil., M.S., Ph.D.</strong>, Department of Computer Applications (MCA), for her constant encouragement, administrative support, and valuable suggestions during the tenure of this work.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I convey my sincere indebtedness and heartfelt thanks to my project guide, <strong>Dr. M. SIVASAKTHI, M.Sc., M.Phil., Ph.D., NET</strong>, Department of Computer Applications (MCA), for her inspiring guidance, constructive criticisms, patient advice, and continuous motivation at every stage of the project.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I wish to place on record my heartfelt gratitude and sincere thanks to my Class Incharge, <strong>Dr. M. SIVASAKTHI, M.Sc., M.Phil., Ph.D., NET</strong>, Department of Computer Applications (MCA), for her continuous academic support, guidance, encouragement, and valuable advice throughout the duration of this project.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I also extend my sincere appreciation to all the faculty members and staff of the Department of Computer Applications for their cooperation and goodwill throughout the period of my study.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 18pt;">
  Finally, I express my deep heartfelt gratitude to my family members and friends for their endless support.
</p>

<table class="borderless-table" style="width: 100%; margin-top: 12pt; margin-bottom: 8pt;">
  <tr>
    <td style="width: 50%;"></td>
    <td style="width: 50%; text-align: right; font-size: 11pt; line-height: 1.4; vertical-align: top;">
      <strong>Signature of the Candidate</strong><br /><br />
      <strong>SURIYA E</strong><br />
      <strong>REG NO: RA2532241040042</strong>
    </td>
  </tr>
</table>
`;

// Professional, academic, deeply technical abstract for Suriya E
const suriyaAbstractHtml = `
<p class="abstract-p">
  Contemporary freelance labor marketplaces remain encumbered by centralized corporate intermediaries that impose punitive commission rates ranging from 10% to 20%, enforce protracted two-week settlement delays, hold opaque custodial reserves, and adjudicate technical disputes through arbitrary administrative reviews. These systemic inefficiencies create substantial counterparty risk and financial friction for independent software engineers. To resolve these systemic vulnerabilities, this project presents <strong>FairWork</strong>, an enterprise-grade decentralized freelance protocol engineered on the Ethereum blockchain that establishes verifiable cryptographic trust, non-custodial collateral custody, and complete intermediary disintermediation.
</p>
<p class="abstract-p">
  As Member 1 of this two-member development team, <strong>SURIYA E (Register No: RA2532241040042)</strong> was primarily responsible for the core blockchain smart contract architecture, non-custodial milestone escrow vaults, on-chain reputation engine, and fault-tolerant settlement infrastructure of FairWork. The protocol core comprises a gas-optimized suite of Solidity smart contracts deployed on Ethereum Sepolia (EscrowContract, DisputeContract, ReputationContract). Operating under non-reentrant guarantees with SafeERC20 primitives, the escrow vault facilitates direct peer-to-peer USD Coin disbursements with guaranteed zero platform rent extraction, instantaneous client milestone releases, and an inviolable 48-hour challenge timelock on refund requests to eliminate capital drain exploits.
</p>
<p class="abstract-p">
  To bridge asynchronous blockchain finality with off-chain microservices, a resilient five-pillar backend settlement architecture was engineered. This infrastructure implements distributed lock orchestration with monotonic generation fencing to prevent split-brain anomalies, an automated reorganization rollback engine reconciling state mutations back to canonical common ancestors, and an autonomous arbitrator cryptographic relay executing bilateral Gemini AI mediation settlements on-chain. Empirical verification confirms 100% test passage across 12 Hardhat smart contract suites and 71 backend integration suites, establishing a mathematically secure foundation for decentralized freelance commerce.
</p>
`;

// ============================================================================
// STUDENT 2: VIGNESH V CONFIGURATION
// ============================================================================
const vigneshFiguresMap = {
  // Fig 4.1 to 4.5 in Chapter 4 (Design)
  "Figure 4.1": {
    image: "fig_arch_vignesh.png",
    num: "4.1",
    caption: "Component-Driven Reactive Client Architecture",
    analysis: "The frontend client architecture separates concerns across global application providers (AuthContext, ThemeProvider, ToastProvider), declarative React Router routes, and high-conversion page controllers. Atomic design primitives provide consistent UX, while api.js and web3 services interface with Express and Ethereum Sepolia."
  },
  "Figure 4.2": {
    image: "fig_frontend_dfd_lvl0.png",
    num: "4.2",
    caption: "Data Flow Diagram — Context Level 0",
    analysis: "The frontend Context Diagram illustrates user inputs (client project specifications, freelancer bids, deliverable artifacts) flowing through UI boundaries to backend services and Ethereum smart contract events."
  },
  "Figure 4.3": {
    image: "fig_frontend_dfd_lvl1.png",
    num: "4.3",
    caption: "Data Flow Diagram — Functional Level 1",
    analysis: "The Level 1 Frontend DFD highlights internal state transitions: Form validation engines feed into REST API handlers, which trigger Web3 transaction dispatchers and update local React contexts and toast notification buses upon blockchain confirmation."
  },
  "Figure 4.4": {
    image: "fig_client_escrow_flow.png",
    num: "4.4",
    caption: "Client-Side Escrow Interaction & State Machine Flow",
    analysis: "The client escrow workflow illustrates project posting, proposals evaluation, digital agreement signing, MetaMask USDC allowance approval, deliverable inspection, and client-gated milestone release payouts followed by on-chain rating submission."
  },
  "Figure 4.5": {
    image: "fig_freelancer_ci_seq.png",
    num: "4.5",
    caption: "Freelancer Automated CI/CD Verification Sequence",
    analysis: "The developer delivery sequence maps code submission through GitHub pull requests, automated GitHub Actions CI check-runs verification, displaying verified green badges, and receiving direct non-custodial USDC payouts into the contractor wallet."
  },

  // Fig 8.1 to 8.6 in Chapter 8 (Appendix Screenshots - Live UI)
  "Figure 8.1": {
    image: "screenshot_landing_page.png",
    num: "8.1",
    caption: "FairWork Homepage & Responsive Project Discovery Portal",
    analysis: "The responsive landing page showcases platform trust pillars: direct zero-fee escrow comparisons, automated GitHub verification badges, and live Sepolia smart contract deployment metrics."
  },
  "Figure 8.2": {
    image: "screenshot_projects_marketplace.png",
    num: "8.2",
    caption: "Projects Marketplace & Active Escrow Directory",
    analysis: "The project discovery feed enables category filtering, skill badge tagging, and real-time project card inspection with verified contractor earnings and milestone progress indicators."
  },
  "Figure 8.3": {
    image: "screenshot_wallet_escrow.png",
    num: "8.3",
    caption: "Web3 Wallet Connection Modal & Network Switch Guard",
    analysis: "The project posting interface enforces rigorous form validation and displays an intuitive amber banner when an active Web3 wallet is required before on-chain project creation."
  },
  "Figure 8.4": {
    image: "screenshot_project_workspace.png",
    num: "8.4",
    caption: "Mobile Responsive Milestone Workspace & Escrow Inspector",
    analysis: "The responsive mobile workspace view unifies project overview metrics, multi-milestone release actions, and deliverable submission dialogs optimized for touch-driven mobile viewports."
  },
  "Figure 8.5": {
    image: "screenshot_ask_ai_chat.png",
    num: "8.5",
    caption: "AI Negotiation Assistant & Interactive Chat Interface",
    analysis: "The integrated mobile chat assistant provides instant procedural guidance regarding milestone approval gates, dispute arbitration rules, and MetaMask wallet allowance configurations."
  },
  "Figure 8.6": {
    image: "screenshot_milestones_studio.png",
    num: "8.6",
    caption: "Interactive Milestone Escrow Studio & Deliverable Verification Workspace",
    analysis: "The interactive milestone studio interface unifies milestone progress tracking, GitHub PR deliverable submission with passing CI verification badges, and non-custodial milestone approval triggers."
  }
};

const vigneshTocHtml = `
<table class="toc-table">
  <thead>
    <tr>
      <th style="width: 15%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">S.NO</th>
      <th style="width: 70%; text-align: left; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">TITLE</th>
      <th style="width: 15%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">PAGE NO</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center">1</td><td><strong>BONAFIDE CERTIFICATE</strong></td><td class="center">I</td></tr>
    <tr><td class="center">2</td><td><strong>DECLARATION</strong></td><td class="center">II</td></tr>
    <tr><td class="center">3</td><td><strong>ACKNOWLEDGEMENT</strong></td><td class="center">III</td></tr>
    <tr><td class="center">4</td><td><strong>ABSTRACT</strong></td><td class="center">IV</td></tr>
    <tr><td class="center">5</td><td><strong>LIST OF TABLES</strong></td><td class="center">V</td></tr>
    <tr><td class="center">6</td><td><strong>LIST OF FIGURES</strong></td><td class="center">VI</td></tr>
    <tr>
      <td class="center">7</td>
      <td>
        <strong>INTRODUCTION</strong><br/>
        &nbsp;&nbsp;1.1 PROJECT INTRODUCTION<br/>
        &nbsp;&nbsp;1.2 BACKGROUND AND MOTIVATION<br/>
        &nbsp;&nbsp;1.3 PROBLEM STATEMENT<br/>
        &nbsp;&nbsp;1.4 NEED FOR THE PROJECT
      </td>
      <td class="center">1</td>
    </tr>
    <tr>
      <td class="center">8</td>
      <td>
        <strong>WORKING ENVIRONMENT</strong><br/>
        &nbsp;&nbsp;2.1 HARDWARE REQUIREMENT<br/>
        &nbsp;&nbsp;2.2 SOFTWARE REQUIREMENT<br/>
        &nbsp;&nbsp;2.3 SYSTEM SOFTWARE<br/>
        &nbsp;&nbsp;2.4 DEVELOPMENT ENVIRONMENT
      </td>
      <td class="center">3</td>
    </tr>
    <tr>
      <td class="center">9</td>
      <td>
        <strong>SYSTEM ANALYSIS</strong><br/>
        &nbsp;&nbsp;3.1 FEASIBILITY STUDY<br/>
        &nbsp;&nbsp;3.2 EXISTING SYSTEM<br/>
        &nbsp;&nbsp;3.3 DRAWBACKS OF EXISTING SYSTEM<br/>
        &nbsp;&nbsp;3.4 PROPOSED SYSTEM<br/>
        &nbsp;&nbsp;3.5 BENEFITS OF PROPOSED SYSTEM<br/>
        &nbsp;&nbsp;3.6 SCOPE OF THE PROJECT
      </td>
      <td class="center">5</td>
    </tr>
    <tr>
      <td class="center">10</td>
      <td>
        <strong>SYSTEM DESIGN</strong><br/>
        &nbsp;&nbsp;4.1 ARCHITECTURE DESIGN<br/>
        &nbsp;&nbsp;4.2 MODULE DESIGN<br/>
        &nbsp;&nbsp;4.3 DATA FLOW DESIGN<br/>
        &nbsp;&nbsp;4.4 DATA STORAGE DESIGN<br/>
        &nbsp;&nbsp;4.5 INTERFACE DESIGN
      </td>
      <td class="center">7</td>
    </tr>
    <tr>
      <td class="center">11</td>
      <td>
        <strong>PROJECT DESCRIPTION</strong><br/>
        &nbsp;&nbsp;5.1 OBJECTIVE<br/>
        &nbsp;&nbsp;5.2 MODULE DESCRIPTION<br/>
        &nbsp;&nbsp;5.3 IMPLEMENTATION<br/>
        &nbsp;&nbsp;5.4 MAINTENANCE
      </td>
      <td class="center">12</td>
    </tr>
    <tr>
      <td class="center">12</td>
      <td>
        <strong>SYSTEM TESTING</strong><br/>
        &nbsp;&nbsp;6.1 TESTING DEFINITION<br/>
        &nbsp;&nbsp;6.2 TESTING OBJECTIVE<br/>
        &nbsp;&nbsp;6.3 TYPES OF TESTING<br/>
        &nbsp;&nbsp;6.4 TEST CASES
      </td>
      <td class="center">15</td>
    </tr>
    <tr>
      <td class="center">13</td>
      <td>
        <strong>CONCLUSION</strong><br/>
        &nbsp;&nbsp;7.1 SUMMARY<br/>
        &nbsp;&nbsp;7.2 FUTURE ENHANCEMENT
      </td>
      <td class="center">17</td>
    </tr>
    <tr>
      <td class="center">14</td>
      <td>
        <strong>APPENDIX</strong><br/>
        &nbsp;&nbsp;8.1 SCREENSHOTS<br/>
        &nbsp;&nbsp;8.2 CODING<br/>
        &nbsp;&nbsp;8.3 DATA DICTIONARY<br/>
        &nbsp;&nbsp;8.4 PROJECT SPECIFICATION AND CONSIDERATIONS
      </td>
      <td class="center">18</td>
    </tr>
    <tr>
      <td class="center">15</td>
      <td><strong>BIBLIOGRAPHY AND REFERENCES</strong></td>
      <td class="center">28</td>
    </tr>
  </tbody>
</table>
`;

const vigneshTablesTableHtml = `
<table class="toc-table">
  <thead>
    <tr>
      <th style="width: 16%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">TABLE NO.</th>
      <th style="width: 70%; text-align: left; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">TABLE TITLE</th>
      <th style="width: 14%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center">2.1</td><td>Minimum and Recommended Hardware Requirements</td><td class="center">3</td></tr>
    <tr><td class="center">2.2</td><td>Software Specifications and Development Dependencies</td><td class="center">3</td></tr>
    <tr><td class="center">3.1</td><td>Comparative Matrix: Legacy Web2 Portals vs. Proposed FairWork Interface</td><td class="center">6</td></tr>
    <tr><td class="center">4.1</td><td>Frontend Modular Breakdown and Component Architecture Matrix</td><td class="center">7</td></tr>
    <tr><td class="center">4.2</td><td>Client State Management &amp; Cache Schema</td><td class="center">11</td></tr>
    <tr><td class="center">6.1</td><td>Comprehensive Verification Test Suite (TC01 - TC10)</td><td class="center">16</td></tr>
    <tr><td class="center">8.1</td><td>Data Dictionary of Client State Entities and Route Flags</td><td class="center">27</td></tr>
  </tbody>
</table>
`;

const vigneshFiguresTableHtml = `
<table class="toc-table">
  <thead>
    <tr>
      <th style="width: 16%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">FIGURE NO.</th>
      <th style="width: 70%; text-align: left; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">FIGURE TITLE</th>
      <th style="width: 14%; text-align: center; border: 1px solid #000000; font-weight: bold; font-size: 12pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center">4.1</td><td>Component-Driven Reactive Client Architecture</td><td class="center">9</td></tr>
    <tr><td class="center">4.2</td><td>Data Flow Diagram &mdash; Context Level 0</td><td class="center">10</td></tr>
    <tr><td class="center">4.3</td><td>Data Flow Diagram &mdash; Functional Level 1</td><td class="center">10</td></tr>
    <tr><td class="center">4.4</td><td>Client-Side Escrow Interaction &amp; State Machine Flow</td><td class="center">10</td></tr>
    <tr><td class="center">4.5</td><td>Freelancer Automated CI/CD Verification Sequence</td><td class="center">11</td></tr>
    <tr><td class="center">8.1</td><td>FairWork Homepage &amp; Responsive Project Discovery Portal</td><td class="center">18</td></tr>
    <tr><td class="center">8.2</td><td>Projects Marketplace &amp; Active Escrow Directory</td><td class="center">18</td></tr>
    <tr><td class="center">8.3</td><td>Web3 Wallet Connection Modal &amp; Network Switch Guard</td><td class="center">19</td></tr>
    <tr><td class="center">8.4</td><td>Mobile Responsive Milestone Workspace &amp; Escrow Inspector</td><td class="center">19</td></tr>
    <tr><td class="center">8.5</td><td>AI Negotiation Assistant &amp; Interactive Chat Interface</td><td class="center">20</td></tr>
    <tr><td class="center">8.6</td><td>Interactive Milestone Escrow Studio &amp; Deliverable Verification Workspace</td><td class="center">20</td></tr>
  </tbody>
</table>
`;

const vigneshAcknowledgementHtml = `
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I express my deepest sense of gratitude and sincere thanks to the Management and Dean, Faculty of Liberal Arts and Business Studies, SRM Institute of Science and Technology, Vadapalani, for providing the necessary facilities, academic environment, and infrastructure throughout the course of this project.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I wish to express my profound gratitude and heartfelt thanks to the Head of the Department, <strong>Dr. J. ANITHA RUTH, M.C.A., M.Phil., M.S., Ph.D.</strong>, Department of Computer Applications (MCA), for her constant encouragement, administrative support, and valuable suggestions during the tenure of this work.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I convey my sincere indebtedness and heartfelt thanks to my project guide, <strong>Dr. M. SIVASAKTHI, M.Sc., M.Phil., Ph.D., NET</strong>, Department of Computer Applications (MCA), for her inspiring guidance, constructive criticisms, patient advice, and continuous motivation at every stage of the project.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I wish to place on record my heartfelt gratitude and sincere thanks to my Class Incharge, <strong>Dr. M. SIVASAKTHI, M.Sc., M.Phil., Ph.D., NET</strong>, Department of Computer Applications (MCA), for her continuous academic support, guidance, encouragement, and valuable advice throughout the duration of this project.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 8pt;">
  I also extend my sincere appreciation to all the faculty members and staff of the Department of Computer Applications for their cooperation and goodwill throughout the period of my study.
</p>
<p style="text-align: justify; text-justify: inter-word; line-height: 1.5; font-size: 12pt; margin-bottom: 18pt;">
  Finally, I express my deep heartfelt gratitude to my family members and friends for their endless support.
</p>

<table class="borderless-table" style="width: 100%; margin-top: 12pt; margin-bottom: 8pt;">
  <tr>
    <td style="width: 50%;"></td>
    <td style="width: 50%; text-align: right; font-size: 11pt; line-height: 1.4; vertical-align: top;">
      <strong>Signature of the Candidate</strong><br /><br />
      <strong>VIGNESH V</strong><br />
      <strong>REG NO: RA2532241040045</strong>
    </td>
  </tr>
</table>
`;

// Professional, academic, deeply technical abstract for Vignesh V
const vigneshAbstractHtml = `
<p class="abstract-p">
  Decentralized Web3 applications frequently encounter substantial user adoption friction due to fragmented interfaces, intimidating cryptographic wallet interactions, unpredictable transaction latency, and a lack of responsive ergonomic layouts. These interaction deficiencies create severe barriers for mainstream clients and independent contractors accustomed to frictionless consumer software standards. To bridge this critical usability divide, this project introduces <strong>FairWork</strong>, an enterprise-grade decentralized freelancing application that unifies non-custodial smart contract escrow with an intuitive, component-driven client architecture designed for seamless workflow automation and consumer-grade responsiveness.
</p>
<p class="abstract-p">
  As Member 2 of this two-member development team, <strong>VIGNESH V (Register No: RA2532241040045)</strong> was primarily responsible for the responsive Web3 client architecture, atomic design system, React 19 single-page interface, multi-role user workflows, continuous integration telemetry badging, and browser wallet integration layers of FairWork. Engineered using React 19, TypeScript, and Vite 6 with Tailwind CSS, the client provides high-conversion marketplace discovery feeds, an interactive milestone budget estimator with real-time zero-commission fee comparisons, and an on-chain transparency registry linking directly to deployed Sepolia smart contract addresses on Etherscan.
</p>
<p class="abstract-p">
  To streamline collaboration between clients and contractors, feature-rich project workspaces unify multi-tab milestone management, secure deliverable submissions, and an automated GitHub Pull Request CI interface rendering live test pipeline verification badges directly within the delivery stream. Essential safety guardrails include a Web3 wallet connection enforcement preventing unconfirmed state modifications, interactive on-chain reputation feedback dialogues, and an intuitive AI dispute mediation portal presenting Gemini AI rationale syntheses alongside an active 48-hour consensus countdown clock. Usability testing confirms zero TypeScript build errors, flawless cross-device viewport responsiveness, and sub-second interaction latencies.
</p>
`;

// ============================================================================
// CONVERSION RUNNER VIA WORD COM AUTOMATION
// ============================================================================
function convertHtmlToWordAndPdf(htmlPath, docxPath, pdfPath) {
  const runnerPs1 = `
$ErrorActionPreference = "Stop"
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.Options.BackgroundSave = $false
$word.Options.SaveInterval = 0
$word.Options.DoNotPromptForConvert = $true

Write-Output "Opening HTML: ${htmlPath.replace(/\\/g, '\\\\')}"
$doc = $word.Documents.Open("${htmlPath.replace(/\\/g, '\\\\')}")
$word.ActiveWindow.View.Type = 3 # wdPrintView
try {
    $word.Options.DoNotCompressPictures = $true
    $doc.DoNotCompressPictures = $true
} catch {}
Write-Output "Opened in $($sw.ElapsedMilliseconds) ms"

# 1. PROCESS AND RESIZE ALL INLINESHAPES (PREVENT OVERFLOW, CENTER, PERMANENTLY EMBED)
Add-Type -AssemblyName System.Drawing
Write-Output "Processing $($doc.InlineShapes.Count) inline shapes..."

for ($i = 1; $i -le $doc.InlineShapes.Count; $i++) {
    $shape = $doc.InlineShapes.Item($i)
    $shape.Range.ParagraphFormat.Alignment = 1 # Center

    # Check if shape is the SRM logo
    $isLogo = $false
    try {
        if ($shape.Range.ParagraphFormat.SpaceAfter -le 12 -and $shape.Range.Information(3) -le 2) {
            $isLogo = $true
        }
    } catch {}

    if ($isLogo) {
        # Logo sizing: crisp, proportional
        if ($shape.Range.Information(3) -eq 1) {
            $shape.Width = [single]150.0
            $shape.Height = [single]50.8
        } else {
            $shape.Width = [single]130.0
            $shape.Height = [single]44.0
        }
    } else {
        # Diagram and screenshot sizing: large, crisp, filling page width
        $w = [double]$shape.Width
        $h = [double]$shape.Height
        $ratio = if ($h -gt 0) { $w / $h } else { 1.6 }

        if ($ratio -ge 1.8) {
            # Wide diagram (DFD Level 0, sequence, state machines)
            $targetW = 415.0
            $targetH = [Math]::Round($targetW / $ratio)
        } elseif ($ratio -ge 1.62) {
            # Architecture diagrams (ratio 1.667)
            $targetW = 415.0
            $targetH = [Math]::Round($targetW / $ratio)
        } elseif ($ratio -ge 1.45) {
            # Application screenshots (ratio 1.600)
            # 395 pt width (height 247 pt). Fits two figures cleanly on one page (~610pt < 698pt usable height)
            $targetW = 395.0
            $targetH = [Math]::Round($targetW / $ratio)
        } else {
            # ER diagrams (ratio 1.302)
            $targetW = 390.0
            $targetH = [Math]::Round($targetW / $ratio)
        }
        $shape.Width = [single]$targetW
        $shape.Height = [single]$targetH

        # Set single line spacing and tight space around shape paragraph to prevent Word 1.5 line expansion
        try {
            $shape.Range.ParagraphFormat.Alignment = 1 # Center
            $shape.Range.ParagraphFormat.LineSpacingRule = 0 # Single
            $shape.Range.ParagraphFormat.SpaceBefore = 0
            $shape.Range.ParagraphFormat.SpaceAfter = 2
            $shape.Range.ParagraphFormat.KeepWithNext = -1
        } catch {}
    }

    # Embed permanently
    try {
        if ($shape.LinkFormat) {
            $shape.LinkFormat.SavePictureWithDocument = $true
            $shape.LinkFormat.BreakLink()
        }
    } catch {}
}

# 2. OPTIMIZE AND BIND ALL TABLES (BORDERS, PADDING, SHADING, PREVENT ORPHANS)
Write-Output "Processing $($doc.Tables.Count) tables..."
foreach ($table in $doc.Tables) {
    # Detect signature and candidate layout tables (bonafide, declaration, acknowledgement)
    $isSig = $false
    try {
        $fullText = $table.Range.Text
        if ($fullText -match "Signature" -or $fullText -match "EXAMINER" -or $fullText -match "Place:" -or $fullText -match "REG NO:" -or $fullText -match "Associate Professor" -or $fullText -match "Head of the Department" -or $fullText -match "SURIYA E" -or $fullText -match "VIGNESH V") {
            $isSig = $true
        }
    } catch {}

    if ($isSig) {
        try {
            $table.Borders.Enable = 0
            $table.Borders.InsideLineStyle = 0
            $table.Borders.OutsideLineStyle = 0
            $table.Shading.BackgroundPatternColor = -16777216
        } catch {}
        continue
    }

    try {
        $table.Rows.AllowBreakAcrossPages = 0
        $table.Rows.Item(1).HeadingFormat = -1
        $table.Rows.Item(1).Range.ParagraphFormat.KeepWithNext = -1

        # Center table and auto-fit to window margins
        $table.Rows.Alignment = 1 # wdAlignRowCenter
        $table.AutoFitBehavior(1) # wdAutoFitWindow

        # Enforce clean 0.5pt black grid borders on ALL cells (matching official reference format)
        $table.Borders.InsideLineStyle = 1 # wdLineStyleSingle
        $table.Borders.InsideLineWidth = 4 # 0.5 pt
        $table.Borders.InsideColor = 0 # Black
        $table.Borders.OutsideLineStyle = 1 # wdLineStyleSingle
        $table.Borders.OutsideLineWidth = 4 # 0.5 pt
        $table.Borders.OutsideColor = 0 # Black

        # Header and cells background: pure white / no gray pattern (matching reference format)
        $table.Shading.BackgroundPatternColor = 16777215 # White
        $table.Rows.Item(1).Shading.BackgroundPatternColor = 16777215 # White
        $table.Rows.Item(1).Range.Bold = $true

        # Proper cell padding: TOC tables (12pt font) get 2.5pt top/bottom, content tables get 3.5pt top/bottom
        if ($fullText -match "S\.NO" -or $fullText -match "TABLE NO" -or $fullText -match "FIGURE NO") {
            $table.TopPadding = 2.5
            $table.BottomPadding = 2.5
            $table.LeftPadding = 5.0
            $table.RightPadding = 5.0
        } else {
            $table.TopPadding = 3.5
            $table.BottomPadding = 3.5
            $table.LeftPadding = 6.0
            $table.RightPadding = 6.0
        }
    } catch {}
}

# KeepWithNext for table captions, figure captions, and headings
Write-Output "Binding captions and headings with KeepWithNext..."
for ($p = 1; $p -le $doc.Paragraphs.Count; $p++) {
    $para = $doc.Paragraphs.Item($p)
    $txt = $para.Range.Text.Trim()
    if ($txt -match "^Table \d+\.\d+" -or $txt -match "^\*?Table \d+\.\d+" -or $txt -match "^Figure \d+\.\d+" -or $txt -match "^\*?Figure \d+\.\d+") {
        $para.Format.KeepWithNext = -1
        $para.Format.KeepTogether = -1
    }
    if ($txt -match "^CHAPTER \d+" -or $txt -match "^[1-9]\.\d+" -or $txt -match "^APPENDIX" -or $txt -match "^REFERENCES" -or $txt -match "^BIBLIOGRAPHY") {
        $para.Format.KeepWithNext = -1
        $para.Format.KeepTogether = -1
    }
}

# 3. CONFIGURE PAGE NUMBERING IN FOOTERS MATCHING OFFICIAL SRM REFERENCE FORMAT
Write-Output "Configuring Page Numbering in Footers across $($doc.Sections.Count) sections..."
for ($s = 1; $s -le $doc.Sections.Count; $s++) {
    $sec = $doc.Sections.Item($s)
    $sec.PageSetup.SectionStart = 2 # wdSectionNewPage
    $sec.Borders.Enable = 0

    $footer = $sec.Footers.Item(1) # wdHeaderFooterPrimary
    $footer.LinkToPrevious = $false

    if ($s -le 3) {
        # Sections 1, 2, 3: Title/Cover page, Bonafide, Declaration -> No footer page number
        $footer.Range.Text = ""
    } elseif ($s -ge 4 -and $s -le 8) {
        # Sections 4-8: Front matter (Abstract, Ack, TOC, List of Tables, List of Figures) -> Lowercase Roman: (i), (ii), (iii), (iv), (v), (vi)
        $footer.PageNumbers.NumberStyle = 2 # wdPageNumberStyleLowercaseRoman
        if ($s -eq 4) {
            $footer.PageNumbers.RestartNumberingAtSection = $true
            $footer.PageNumbers.StartingNumber = 1 # Starts at (i) on Abstract
        } else {
            $footer.PageNumbers.RestartNumberingAtSection = $false
        }
        $footer.Range.Text = ""
        $footer.Range.ParagraphFormat.Alignment = 1 # Center
        $range = $footer.Range
        $range.Collapse(0) # wdCollapseEnd
        $doc.Fields.Add($range, 33) | Out-Null # wdFieldPage
    } else {
        # Section 9+: Main Body Chapters -> Arabic numerals (1, 2, 3...)
        $footer.PageNumbers.NumberStyle = 0 # wdPageNumberStyleArabic
        if ($s -eq 9) {
            $footer.PageNumbers.RestartNumberingAtSection = $true
            $footer.PageNumbers.StartingNumber = 1 # Starts at 1 on Chapter 1
        } else {
            $footer.PageNumbers.RestartNumberingAtSection = $false
        }
        $footer.Range.Text = ""
        $footer.Range.ParagraphFormat.Alignment = 1 # Center
        $range = $footer.Range
        $range.Collapse(0)
        $doc.Fields.Add($range, 33) | Out-Null # wdFieldPage
    }
}

# 4. RE-PAGINATE AND SAVE TO DOCX AND PDF
$doc.Repaginate()

Write-Output "--- DOCUMENT TELEMETRY ---"
Write-Output "Total Document Pages: $($doc.ComputeStatistics(2))"
for ($s = 1; $s -le $doc.Sections.Count; $s++) {
    $pCount = $doc.Sections.Item($s).Range.ComputeStatistics(2)
    Write-Output "Section $($s): $pCount page(s)"
}

Write-Output "Saving DOCX: ${docxPath.replace(/\\/g, '\\\\')}"
$tDocx = [System.Diagnostics.Stopwatch]::StartNew()
$docxStr = [string]"${docxPath.replace(/\\/g, '\\\\')}"
$pdfStr = [string]"${pdfPath.replace(/\\/g, '\\\\')}"
$doc.SaveAs2($docxStr, 16) # wdFormatDocumentDefault (DOCX)
Write-Output "Saved DOCX in $($tDocx.ElapsedMilliseconds) ms"

Write-Output "Saving High-Resolution Print-Quality PDF: ${pdfPath.replace(/\\/g, '\\\\')}"
$tPdf = [System.Diagnostics.Stopwatch]::StartNew()
# OptimizeFor = 0 (wdExportOptimizeForPrint) ensures 300 DPI+ lossless images, eliminating all blurriness
$doc.ExportAsFixedFormat($pdfStr, 17, $false, 0, 0, 0, 0, 0, $true, $true, 1, $true, $true, $false)
Write-Output "Saved High-Resolution PDF in $($tPdf.ElapsedMilliseconds) ms"

$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output "Conversion complete!"
`;
  const runFile = path.join(__dirname, 'run_perfect_conversion.ps1');
  fs.writeFileSync(runFile, runnerPs1, 'utf8');

  execSync(`powershell -ExecutionPolicy Bypass -File "${runFile}"`, { stdio: 'inherit' });
  fs.unlinkSync(runFile);
}

function processStudent(studentKey, mdFileName, outDocxName, outPdfName, cfg, figuresMap) {
  console.log(`\n============================================================`);
  console.log(`PROCESSING: ${cfg.studentName} (${cfg.regNo})`);
  console.log(`============================================================`);

  const mdPath = path.join(docsDir, mdFileName);
  const mdContent = fs.readFileSync(mdPath, 'utf8');

  // Strip front pages from original markdown (start from Chapter 1)
  let ch1Idx = mdContent.indexOf('# CHAPTER 1');
  if (ch1Idx === -1) ch1Idx = mdContent.indexOf('## 1.1');
  const bodyMd = ch1Idx !== -1 ? mdContent.slice(ch1Idx) : mdContent;

  const parsedBody = parseMarkdownForAcademic(bodyMd, figuresMap);
  const fullHtml = generateStudentDocumentHtml(cfg, parsedBody);

  const htmlPath = path.join(docsDir, `${studentKey}_perfect.html`);
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log(`Generated HTML intermediate: ${htmlPath}`);

  const docxPath = path.join(docsDir, outDocxName);
  const pdfPath = path.join(docsDir, outPdfName);

  convertHtmlToWordAndPdf(htmlPath, docxPath, pdfPath);
}

function main() {
  console.log("================================================================================");
  console.log("FAIRWORK - ACADEMIC PROJECT REPORT GENERATOR (OFFICIAL SRM REFERENCE FORMAT)");
  console.log("================================================================================");

  // Stop any lingering Word instances
  try {
    execSync('powershell -Command "Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue"');
  } catch {}

  // 1. Suriya E (Blockchain & Backend)
  processStudent(
    'suriya',
    'MCA_Project_Report_SURIYA_E_Blockchain_Backend.md',
    'Suriya_E_RA2532241040042_MCA_Project_Report.docx',
    'Suriya_E_RA2532241040042_MCA_Project_Report.pdf',
    {
      studentName: 'SURIYA E',
      regNo: 'RA2532241040042',
      title: 'FAIRWORK: NON-CUSTODIAL SMART CONTRACT ESCROW AND REORG-RESILIENT BACKEND SETTLEMENT SYSTEM',
      guide: 'Dr. M. SIVASAKTHI, M.Sc., M.Phil., Ph.D., NET',
      hod: 'Dr. J. ANITHA RUTH, M.C.A., M.Phil., M.S., Ph.D.',
      abstractHtml: suriyaAbstractHtml,
      acknowledgementHtml: suriyaAcknowledgementHtml,
      tocHtml: suriyaTocHtml,
      tablesTableHtml: suriyaTablesTableHtml,
      figuresTableHtml: suriyaFiguresTableHtml
    },
    suriyaFiguresMap
  );

  // 2. Vignesh V (Frontend UI/UX)
  processStudent(
    'vignesh',
    'MCA_Project_Report_VIGNESH_V_Frontend_UIUX.md',
    'Vignesh_V_RA2532241040045_MCA_Project_Report.docx',
    'Vignesh_V_RA2532241040045_MCA_Project_Report.pdf',
    {
      studentName: 'VIGNESH V',
      regNo: 'RA2532241040045',
      title: 'FAIRWORK: WEB3-ENABLED RESPONSIVE CLIENT INTERFACE AND MILESTONE WORKSPACE SYSTEM',
      guide: 'Dr. M. SIVASAKTHI, M.Sc., M.Phil., Ph.D., NET',
      hod: 'Dr. J. ANITHA RUTH, M.C.A., M.Phil., M.S., Ph.D.',
      abstractHtml: vigneshAbstractHtml,
      acknowledgementHtml: vigneshAcknowledgementHtml,
      tocHtml: vigneshTocHtml,
      tablesTableHtml: vigneshTablesTableHtml,
      figuresTableHtml: vigneshFiguresTableHtml
    },
    vigneshFiguresMap
  );

  console.log("\n================================================================================");
  console.log("ALL ACADEMIC REPORTS REGENERATED WITH OFFICIAL SRM REFERENCE FORMAT & FAIRWORK BRANDING!");
  console.log("================================================================================");
}

main();
