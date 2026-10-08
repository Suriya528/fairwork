const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, '..', 'docs');
const figuresDir = path.join(docsDir, 'figures');
const logoPath = path.join(docsDir, 'srm_logo.png');

const PAGE_BREAK = '<br clear="all" style="page-break-before:always; mso-break-type:section-break;" />';

// Helper to format image tag with caption
function renderFigure(imageName, figNumber, caption, textAnalysis = '') {
  const imgPath = path.join(figuresDir, imageName);
  let html = `
<div class="figure-container">
  <div class="figure-img-box">
    <img src="${imgPath}" alt="${caption}" />
  </div>
  <p class="figure-caption"><strong>Figure ${figNumber}:</strong> ${caption}</p>
</div>`;
  if (textAnalysis) {
    html += `\n<p style="text-align: justify; font-size: 11pt; color: #1e293b; margin-top: 4pt; margin-bottom: 10pt;">${textAnalysis}</p>\n`;
  }
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
  let listType = '';

  function flushList() {
    if (inList) {
      htmlLines.push(`</${listType}>`);
      inList = false;
      listType = '';
    }
  }

  function flushTable() {
    if (inTable) {
      let tableHtml = '<table class="academic-table">\n';
      tableBuffer.forEach((row, idx) => {
        const cells = row.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
        if (cells.every(c => /^:?-+:?$/.test(c))) return;
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += '  <tr>\n';
        cells.forEach(cell => {
          tableHtml += `    <${tag}>${formatInline(cell)}</${tag}>\n`;
        });
        tableHtml += '  </tr>\n';
      });
      tableHtml += '</table>\n';
      htmlLines.push(tableHtml);
      inTable = false;
      tableBuffer = [];
    }
  }

  function formatInline(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/&nbsp;/g, ' ');
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.trim() === '\\newpage') {
      flushList();
      flushTable();
      htmlLines.push(PAGE_BREAK);
      continue;
    }

    // Code blocks start or end
    if (line.trim().startsWith('```')) {
      flushList();
      flushTable();
      if (inCodeBlock) {
        // Closing code fence!
        const codeText = codeBuffer.join('\n');
        inCodeBlock = false;
        codeBuffer = [];

        // Check if this code block was ASCII art diagram!
        const isAsciiArt = codeText.includes('+----+') || codeText.includes('+---') || codeText.includes('|    |') || codeText.includes('|---');

        // Check if the next line is a Figure caption (e.g. *Figure 3.1: ...*)
        let nextCaptionLine = '';
        let captionLineIdx = -1;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim().startsWith('*Figure') || lines[j].trim().startsWith('Figure ')) {
            nextCaptionLine = lines[j].trim();
            captionLineIdx = j;
            break;
          }
          if (lines[j].trim().length > 0 && !lines[j].trim().startsWith('*Figure')) {
            break;
          }
        }

        if (isAsciiArt || nextCaptionLine) {
          // Find matching figure from figuresMap
          let matchedFig = null;
          if (nextCaptionLine) {
            for (const [key, figData] of Object.entries(figuresMap)) {
              if (nextCaptionLine.includes(key)) {
                matchedFig = figData;
                break;
              }
            }
          }

          if (matchedFig) {
            htmlLines.push(renderFigure(matchedFig.image, matchedFig.num, matchedFig.caption, matchedFig.analysis));
            if (captionLineIdx !== -1) {
              i = captionLineIdx; // Skip caption line since rendered in figure
            }
            continue;
          } else if (isAsciiArt) {
            // Drop unmapped ASCII art
            continue;
          }
        }

        // Normal code block
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

    // Check standalone Figure caption that wasn't adjacent to code block
    if (line.trim().startsWith('*Figure') || line.trim().startsWith('Figure ')) {
      let matchedFig = null;
      for (const [key, figData] of Object.entries(figuresMap)) {
        if (line.includes(key)) {
          matchedFig = figData;
          break;
        }
      }
      if (matchedFig) {
        flushList();
        flushTable();
        htmlLines.push(renderFigure(matchedFig.image, matchedFig.num, matchedFig.caption, matchedFig.analysis));
        continue;
      }
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
      htmlLines.push(`<h1 class="chapter-heading">${formatInline(line.slice(2).trim())}</h1>`);
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
    if (line.startsWith('#### ')) {
      flushList();
      htmlLines.push(`<h4>${formatInline(line.slice(5).trim())}</h4>`);
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      flushList();
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList || listType !== 'ul') {
        flushList();
        htmlLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const c = line.replace(/^\s*[-*]\s+/, '');
      htmlLines.push(`  <li>${formatInline(c)}</li>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inList || listType !== 'ol') {
        flushList();
        htmlLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const c = line.replace(/^\s*\d+\.\s+/, '');
      htmlLines.push(`  <li>${formatInline(c)}</li>`);
      continue;
    }

    if (line.trim() === '') {
      flushList();
      continue;
    }

    flushList();
    htmlLines.push(`<p>${formatInline(line.trim())}</p>`);
  }

  flushList();
  flushTable();
  return htmlLines.join('\n');
}

// Generate base document style
const baseStyles = `
  @page {
    size: A4;
    margin-top: 1.0in;
    margin-bottom: 1.0in;
    margin-left: 1.25in;
    margin-right: 1.0in;
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111111;
    margin: 0;
    padding: 0;
  }
  h1, h2, h3, h4 {
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    page-break-after: avoid;
  }
  h1.cover-title {
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    line-height: 1.35;
    margin-top: 6pt;
    margin-bottom: 14pt;
    text-transform: uppercase;
  }
  h1.chapter-heading {
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    margin-top: 16pt;
    margin-bottom: 12pt;
    text-transform: uppercase;
  }
  h2 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }
  h3 {
    font-size: 12pt;
    font-weight: bold;
    margin-top: 10pt;
    margin-bottom: 4pt;
  }
  h4 {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 8pt;
    margin-bottom: 2pt;
  }
  p {
    text-align: justify;
    text-justify: inter-word;
    margin-top: 0;
    margin-bottom: 6pt;
    line-height: 1.5;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .academic-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  .academic-table th, .academic-table td {
    border: 1px solid #333333;
    padding: 4.5pt 6pt;
    font-size: 9.5pt;
    vertical-align: top;
  }
  .academic-table th {
    background-color: #f1f5f9;
    font-weight: bold;
    text-align: left;
  }
  .borderless-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
  }
  .borderless-table td {
    border: none;
    padding: 2pt 4pt;
    vertical-align: top;
  }
  .figure-container {
    text-align: center;
    margin-top: 14pt;
    margin-bottom: 14pt;
    page-break-inside: avoid;
  }
  .figure-img-box {
    display: inline-block;
    max-width: 95%;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 4px;
    background-color: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  }
  .figure-img-box img {
    max-width: 100%;
    height: auto;
    display: block;
    border-radius: 6px;
  }
  .figure-caption {
    font-style: italic;
    font-size: 10pt;
    text-align: center;
    margin-top: 6pt;
    color: #334155;
  }
  pre {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 8pt 10pt;
    font-family: Consolas, 'Courier New', monospace;
    font-size: 9.5pt;
    line-height: 1.35;
    white-space: pre-wrap;
    word-break: break-all;
    margin-top: 6pt;
    margin-bottom: 8pt;
    page-break-inside: avoid;
  }
  code {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 10pt;
    background-color: #f1f5f9;
    padding: 1pt 3pt;
    border-radius: 3px;
  }
  pre code {
    background: none;
    padding: 0;
  }
  ul, ol {
    margin-top: 0;
    margin-bottom: 8pt;
    padding-left: 24pt;
  }
  li {
    margin-bottom: 3pt;
    text-align: justify;
    line-height: 1.5;
  }
`;

// Build Document HTML
function generateStudentDocumentHtml(cfg, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${cfg.title} - ${cfg.studentName}</title>
<style>${baseStyles}</style>
</head>
<body>

<!-- 1. COVER PAGE (Page 1) -->
<div style="text-align: center; margin-top: 4pt;">
  <h1 class="cover-title">${cfg.title}</h1>
  
  <p class="center bold" style="font-size: 11pt; margin-top: 10pt; margin-bottom: 2pt;">
    A PROJECT REPORT SUBMITTED TO SRM INSTITUTE OF SCIENCE & TECHNOLOGY
  </p>
  <p class="center" style="font-size: 10.5pt; margin-bottom: 2pt;">
    IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF
  </p>
  <p class="center bold" style="font-size: 13pt; margin-bottom: 12pt;">
    MASTER OF COMPUTER APPLICATIONS
  </p>

  <p class="center" style="font-size: 10.5pt; margin-bottom: 2pt;">SUBMITTED BY:</p>
  <p class="center bold" style="font-size: 12.5pt; margin-bottom: 2pt;">${cfg.studentName}</p>
  <p class="center bold" style="font-size: 11.5pt; margin-bottom: 12pt;">REG NO: ${cfg.regNo}</p>

  <p class="center" style="font-size: 10.5pt; margin-bottom: 2pt;">UNDER THE GUIDANCE OF</p>
  <p class="center bold" style="font-size: 12.5pt; margin-bottom: 2pt;">${cfg.guide}</p>
  <p class="center" style="font-size: 10.5pt; margin-bottom: 12pt;">${cfg.guideRole}</p>

  <div style="margin-top: 4pt; margin-bottom: 12pt;">
    <img src="${logoPath}" width="195" alt="SRM Institute of Science & Technology" />
  </div>

  <p class="center bold" style="font-size: 11.5pt; margin-bottom: 2pt;">DEPARTMENT OF COMPUTER APPLICATIONS (MCA)</p>
  <p class="center bold" style="font-size: 10.5pt; margin-bottom: 2pt;">FACULTY OF LIBERAL ARTS AND BUSINESS STUDIES</p>
  <p class="center bold" style="font-size: 11.5pt; margin-bottom: 2pt;">SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
  <p class="center bold" style="font-size: 10.5pt; margin-bottom: 2pt;">VADAPALANI CAMPUS, CHENNAI – 600026</p>
  <p class="center bold" style="font-size: 11.5pt; margin-top: 4pt;">ACADEMIC YEAR: 2025 – 2026</p>
</div>

${PAGE_BREAK}

<!-- 2. BONAFIDE CERTIFICATE (Page 2 - STRICTLY 1 PAGE) -->
<div style="text-align: center;">
  <p class="center bold" style="font-size: 11pt; margin-bottom: 2pt;">DEPARTMENT OF COMPUTER APPLICATIONS (MCA)</p>
  <p class="center bold" style="font-size: 10pt; margin-bottom: 2pt;">FACULTY OF LIBERAL ARTS AND BUSINESS STUDIES</p>
  <p class="center bold" style="font-size: 11pt; margin-bottom: 2pt;">SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
  <p class="center bold" style="font-size: 10pt; margin-bottom: 6pt;">VADAPALANI CAMPUS, CHENNAI – 600026</p>

  <div style="margin-bottom: 6pt;">
    <img src="${logoPath}" width="125" alt="SRM Logo" />
  </div>

  <h2 class="center bold" style="font-size: 13pt; margin-top: 4pt; margin-bottom: 10pt;">BONAFIDE CERTIFICATE</h2>
</div>

<p style="text-indent: 24pt; line-height: 1.45; font-size: 11pt; margin-bottom: 12pt;">
  This is to certify that the project report titled <strong>“${cfg.title}”</strong> is the bonafide work done and submitted by <strong>${cfg.studentName} (Reg. No: ${cfg.regNo})</strong> during the <strong>2025–2026</strong> academic year, in partial fulfillment of the requirements for the award of the degree of <strong>MASTER OF COMPUTER APPLICATIONS</strong>, at <strong>SRM INSTITUTE OF SCIENCE & TECHNOLOGY, Vadapalani, Chennai</strong>.
</p>

<table class="borderless-table" style="margin-top: 14pt; margin-bottom: 10pt;">
  <tr>
    <td style="width: 50%; text-align: left; font-size: 10pt; line-height: 1.3;">
      <div style="margin-bottom: 24pt;">_____________________________</div>
      <strong>Signature of the Guide</strong><br />
      <strong>${cfg.guide}</strong><br />
      ${cfg.guideRole}<br />
      SRM IST, Vadapalani Campus
    </td>
    <td style="width: 50%; text-align: right; font-size: 10pt; line-height: 1.3;">
      <div style="margin-bottom: 24pt;">_____________________________</div>
      <strong>Signature of the HOD</strong><br />
      <strong>${cfg.hod}</strong><br />
      Head of the Department<br />
      Department of Computer Applications<br />
      SRM IST, Vadapalani Campus
    </td>
  </tr>
</table>

<div style="margin-top: 10pt;">
  <p style="margin-bottom: 2pt; font-size: 10.5pt;">
    Submitted for Project Work Viva-Voce Examination held on: ____________________
  </p>
  <table class="borderless-table" style="margin-top: 2pt; margin-bottom: 8pt;">
    <tr>
      <td style="width: 50%; font-size: 10pt;"><strong>Place:</strong> VADAPALANI, CHENNAI</td>
      <td style="width: 50%; text-align: right; font-size: 10pt;"><strong>Date:</strong> ____________________</td>
    </tr>
  </table>

  <table class="borderless-table" style="margin-top: 10pt;">
    <tr>
      <td style="width: 50%; text-align: left; font-size: 10pt;">
        <div style="margin-bottom: 20pt;">_____________________________</div>
        <strong>INTERNAL EXAMINER</strong>
      </td>
      <td style="width: 50%; text-align: right; font-size: 10pt;">
        <div style="margin-bottom: 20pt;">_____________________________</div>
        <strong>EXTERNAL EXAMINER</strong>
      </td>
    </tr>
  </table>
</div>

${PAGE_BREAK}

<!-- 3. ACKNOWLEDGEMENT (Page 3 - iii) -->
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">iii</p>
<h1 class="chapter-heading">ACKNOWLEDGEMENT</h1>
<p>First and foremost, I would like to express with a deep sense of gratitude my heartfelt thanks to the management of <strong>SRM Institute of Science & Technology</strong> for providing modern laboratory infrastructure, technical facilities, and an encouraging academic environment.</p>
<p>I wish to express my sincere gratitude to the <strong>Dean</strong>, Faculty of Liberal Arts and Business Studies, for his constant administrative support and encouragement throughout the course of this MCA program.</p>
<p>I express my deepest gratitude to my esteemed project guide, <strong>${cfg.guide}</strong>, ${cfg.guideRole}, for her thoughtful guidance, insightful feedback, technical suggestions, and patient mentoring across every phase of designing and implementing this major project.</p>
<p>I extend my sincere thanks to <strong>${cfg.hod}</strong>, Head of the Department of Computer Applications, for her dedicated academic leadership, departmental support, and for facilitating the computational resources required to successfully complete this project.</p>
<p>I would also like to thank my class coordinator, faculty members, and staff of the Department of Computer Applications for their academic assistance, cooperation, and words of encouragement.</p>
<p>Finally, I convey my warmest gratitude to my parents and friends for their enduring patience, understanding, moral encouragement, and unconditional support during my project endeavors.</p>

<p class="right bold" style="margin-top: 24pt;">
  ${cfg.studentName}<br />
  <span style="font-size: 10pt; font-weight: normal;">(Reg. No: ${cfg.regNo})</span><br />
  <span style="font-size: 10pt; font-weight: normal;">Department of Computer Applications (MCA)</span><br />
  <span style="font-size: 10pt; font-weight: normal;">SRM Institute of Science & Technology, Vadapalani</span>
</p>

${PAGE_BREAK}

<!-- 4. ABSTRACT (Page 4 - iv) -->
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">iv</p>
<h1 class="chapter-heading">ABSTRACT</h1>
${cfg.abstractHtml}

${PAGE_BREAK}

<!-- 5. TABLE OF CONTENTS (Page 5 - v - STRICTLY 1 SINGLE PAGE) -->
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">v</p>
<h1 class="chapter-heading" style="margin-bottom: 8pt;">TABLE OF CONTENTS</h1>
${cfg.tocHtml}

${PAGE_BREAK}

<!-- 6. LIST OF TABLES (Page 6 - vi) -->
${cfg.listTablesHtml}

${PAGE_BREAK}

<!-- 7. LIST OF FIGURES (Page 7 - vii) -->
${cfg.listFiguresHtml}

${PAGE_BREAK}

<!-- 8. MAIN BODY CHAPTERS (Starting on Page 1) -->
${bodyHtml}

</body>
</html>`;
}

// ============================================================================
// STUDENT 1: SURIYA E CONFIGURATION
// ============================================================================
const suriyaFiguresMap = {
  // Fig 3.1
  "Figure 3.1": {
    image: "fig_arch_suriya.png",
    num: "3.1",
    caption: "FairWork End-to-End System Architecture (Blockchain & Backend Plane)",
    analysis: "The system architecture partitions operations into four decoupled tiers: Client Tier (React 19 + MetaMask), API Gateway Tier (Express + JWT + Gemini AI), Settlement Processor Tier (Lease Manager with generation fencing, Reorg Engine, Arbitrator Relay), and Storage / Blockchain Plane (Sepolia Smart Contracts: EscrowContract, DisputeContract, ReputationContract, and MongoDB Replica Cluster)."
  },
  // Fig 3.2
  "Figure 3.2": {
    image: "fig_dfd_suriya.png",
    num: "3.2",
    caption: "Data Flow Diagram Level 0 (Context Level Architecture)",
    analysis: "The Context Level DFD depicts interaction boundaries between Human Users (Clients and Developers), the MetaMask Injected Signer, the Node.js Express API, and the Ethereum Sepolia smart contracts."
  },
  // Fig 3.3
  "Figure 3.3": {
    image: "fig_dfd_suriya.png",
    num: "3.3",
    caption: "Data Flow Diagram Level 1 (Decentralized Settlement & Indexer Event Flow)",
    analysis: "The Level 1 Data Flow Diagram traces fund movement and state transitions. When a client funds a project, USDC tokens are transferred to EscrowContract.sol. The contract emits an EscrowFunded event indexed by leaseManager.js. Upon milestone release, funds transfer directly to the freelancer address without platform commissions."
  },
  // Fig 3.4
  "Figure 3.4": {
    image: "fig_dfd_suriya.png",
    num: "3.4",
    caption: "Data Flow Diagram Level 2 (Reorg Engine & Lease Fencing Subsystem)",
    analysis: "The Level 2 DFD outlines the internal indexing pipeline: reorgEngine.js queries canonical block hashes to roll back speculative database mutations whenever blockchain reorganizations exceed finality limits."
  },
  // Fig 3.5
  "Figure 3.5": {
    image: "fig_escrow_statemachine.png",
    num: "3.5",
    caption: "Smart Contract Escrow State Machine & Lifecycle Transitions",
    analysis: "The EscrowContract state machine enforces sequential milestone transitions: CREATED &rarr; FUNDED &rarr; SUBMITTED &rarr; APPROVED &rarr; RELEASED. If disputes occur, funds are frozen on-chain pending AI-assisted consensus resolution. In the event of a client refund request, an invariant 48-hour challenge timelock is initiated to protect contractors against capital drain exploits."
  },
  // Fig 3.6
  "Figure 3.6": {
    image: "fig_escrow_statemachine.png",
    num: "3.6",
    caption: "Financial Entity Relationship & Escrow State Invariants",
    analysis: "The relational mapping anchors on-chain Escrow deposits to project milestones, maintaining dual consistency between off-chain MongoDB documents and on-chain contract storage."
  },
  // Fig 4.1
  "Figure 4.1": {
    image: "screenshot_post_project_metamask.png",
    num: "4.1",
    caption: "Live Platform Telemetry: Web3 Client Wallet Connection & MetaMask Guardrail Banner",
    analysis: "The live application detects Web3 wallet availability in real time. If a user attempts to create a project without an active wallet or with a pending MetaMask prompt, an interactive amber warning modal blocks unconfirmed actions and provides direct recovery links."
  },
  // Fig 4.2
  "Figure 4.2": {
    image: "screenshot_ask_ai_dispute_sepolia.jpg",
    num: "4.2",
    caption: "Live Application Telemetry: FairWork Ask AI Assistant Explaining DisputeContract on Sepolia",
    analysis: "The embedded streaming AI assistant provides real-time technical clarity regarding on-chain contract addresses (DisputeContract.sol: 0x8ddbfe... on Sepolia testnet), explaining fund freezing mechanisms and arbitration rules directly within the application viewport."
  },
  // Fig 4.3
  "Figure 4.3": {
    image: "screenshot_landing_blueprint.png",
    num: "4.3",
    caption: "Automated 4-Stage Milestone Settlement Pipeline on Public Landing Studio",
    analysis: "The public discovery studio visualizes the 4-stage settlement pipeline (01 Scope, 02 Deposit, 03 Verify, 04 Settle), presenting verified Sepolia contract source code and transaction verification telemetry."
  }
};

const suriyaTocHtml = `
<table class="academic-table" style="font-size: 10pt; line-height: 1.35; margin-bottom: 0;">
  <thead>
    <tr style="background-color: #e2e8f0;">
      <th style="width: 16%; text-align: center; padding: 4pt 6pt;">CHAPTER</th>
      <th style="width: 68%; padding: 4pt 8pt;">TITLE</th>
      <th style="width: 16%; text-align: center; padding: 4pt 6pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center"></td><td><strong>BONAFIDE CERTIFICATE</strong></td><td class="center">ii</td></tr>
    <tr><td class="center"></td><td><strong>ACKNOWLEDGEMENT</strong></td><td class="center">iii</td></tr>
    <tr><td class="center"></td><td><strong>ABSTRACT</strong></td><td class="center">iv</td></tr>
    <tr><td class="center"></td><td><strong>LIST OF TABLES</strong></td><td class="center">vi</td></tr>
    <tr><td class="center"></td><td><strong>LIST OF FIGURES</strong></td><td class="center">vii</td></tr>
    <tr><td class="center"><strong>1</strong></td><td><strong>INTRODUCTION</strong></td><td class="center"><strong>1</strong></td></tr>
    <tr><td class="center"><strong>2</strong></td><td><strong>MODULE DESCRIPTION & SYSTEM REQUIREMENTS</strong></td><td class="center"><strong>5</strong></td></tr>
    <tr><td class="center"><strong>3</strong></td><td><strong>SYSTEM DESIGN & ARCHITECTURE</strong></td><td class="center"><strong>13</strong></td></tr>
    <tr><td class="center"><strong>4</strong></td><td><strong>IMPLEMENTATION & CODE METHODOLOGY</strong></td><td class="center"><strong>21</strong></td></tr>
    <tr><td class="center"><strong>5</strong></td><td><strong>TESTING AND VERIFICATION</strong></td><td class="center"><strong>39</strong></td></tr>
    <tr><td class="center"><strong>6</strong></td><td><strong>CONCLUSION & FUTURE ENHANCEMENTS</strong></td><td class="center"><strong>47</strong></td></tr>
    <tr><td class="center"></td><td><strong>APPENDIX: SMART CONTRACT ABIS & INTERFACES</strong></td><td class="center"><strong>49</strong></td></tr>
    <tr><td class="center"></td><td><strong>REFERENCES</strong></td><td class="center"><strong>52</strong></td></tr>
  </tbody>
</table>
`;

const suriyaListTablesHtml = `
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">vi</p>
<h1 class="chapter-heading" style="margin-bottom: 12pt;">LIST OF TABLES</h1>
<table class="academic-table" style="font-size: 10pt; line-height: 1.35;">
  <thead>
    <tr style="background-color: #e2e8f0;">
      <th style="width: 18%; text-align: center; padding: 4pt 6pt;">TABLE NO.</th>
      <th style="width: 67%; padding: 4pt 8pt;">TABLE NAME</th>
      <th style="width: 15%; text-align: center; padding: 4pt 6pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center"><strong>2.1</strong></td><td>Sepolia Smart Contract Registry & Invariants</td><td class="center">6</td></tr>
    <tr><td class="center"><strong>2.2</strong></td><td>Software & Technology Stack Dependency Matrix</td><td class="center">12</td></tr>
    <tr><td class="center"><strong>5.1</strong></td><td>Smart Contract Automated Hardhat Test Results (12/12)</td><td class="center">40</td></tr>
    <tr><td class="center"><strong>5.2</strong></td><td>Backend Settlement & Lease Fencing Test Suite (71/71)</td><td class="center">42</td></tr>
  </tbody>
</table>
`;

const suriyaListFiguresHtml = `
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">vii</p>
<h1 class="chapter-heading" style="margin-bottom: 12pt;">LIST OF FIGURES</h1>
<table class="academic-table" style="font-size: 10pt; line-height: 1.35;">
  <thead>
    <tr style="background-color: #e2e8f0;">
      <th style="width: 18%; text-align: center; padding: 4pt 6pt;">FIGURE NO.</th>
      <th style="width: 67%; padding: 4pt 8pt;">FIGURE NAME</th>
      <th style="width: 15%; text-align: center; padding: 4pt 6pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center"><strong>3.1</strong></td><td>FairWork End-to-End System Architecture (Blockchain & Backend Plane)</td><td class="center">14</td></tr>
    <tr><td class="center"><strong>3.2</strong></td><td>Data Flow Diagram Level 0 (Context Level Architecture)</td><td class="center">16</td></tr>
    <tr><td class="center"><strong>3.3</strong></td><td>Data Flow Diagram Level 1 (Decentralized Settlement Flow)</td><td class="center">17</td></tr>
    <tr><td class="center"><strong>3.4</strong></td><td>Data Flow Diagram Level 2 (Reorg Engine & Lease Fencing)</td><td class="center">18</td></tr>
    <tr><td class="center"><strong>3.5</strong></td><td>Smart Contract Escrow State Machine & Lifecycle Transitions</td><td class="center">19</td></tr>
    <tr><td class="center"><strong>3.6</strong></td><td>Financial Entity Relationship & Escrow State Invariants</td><td class="center">20</td></tr>
    <tr><td class="center"><strong>4.1</strong></td><td>Live Platform Telemetry: Web3 Client Wallet Connection & MetaMask Guardrail</td><td class="center">35</td></tr>
    <tr><td class="center"><strong>4.2</strong></td><td>Live Application Telemetry: FairWork Ask AI Explaining DisputeContract on Sepolia</td><td class="center">37</td></tr>
    <tr><td class="center"><strong>4.3</strong></td><td>Automated 4-Stage Milestone Settlement Pipeline on Public Landing Studio</td><td class="center">38</td></tr>
  </tbody>
</table>
`;

const suriyaAbstractHtml = `
<p style="text-indent: 30pt; line-height: 1.6;">
  This project presents <strong>FairWork</strong>, a decentralized, non-custodial milestone-based freelance marketplace platform designed to establish provable financial trust between clients and independent contractors without relying on predatory centralized intermediaries. Traditional freelance marketplaces extract between 10% and 20% in platform commissions, delay fund clearing by up to 14 days, enforce opaque custodial escrow accounts, and resolve code disputes through subjective support representatives. This project documentation specifically details the <strong>Blockchain, Smart Contracts, Non-Custodial Escrow Financial Settlement, On-Chain Reputation, AI-Assisted Dispute Mediation Relay, and Backend Resiliency Engineering</strong> designed and implemented by <strong>SURIYA E (Reg. No: RA2532241040042)</strong>.
</p>
<p style="text-indent: 30pt; line-height: 1.6;">
  The on-chain core comprises four verified contracts deployed on the Ethereum Sepolia Testnet: <code>EscrowContract.sol</code> (<code>0xc0d1b74a30a82d6fb846e446758a8c2ff391376c</code>), <code>DisputeContract.sol</code> (<code>0x0423025a6a8c4bbbe1f9ecf0cb5d4542ac5b7193</code>), <code>ReputationContract.sol</code> (<code>0xfa25823ccf7343fdfd7fa20a785d996331e66674</code>), and <code>MockUSDC.sol</code> (<code>0xf21bdf6737a3009359f9ec1fa515e6d74702f575</code>). <code>EscrowContract.sol</code> implements a non-reentrant multi-milestone vault utilizing OpenZeppelin 5.0 SafeERC20 with 6-decimal USDC. It guarantees 0% platform take-rate, direct peer-to-peer payout finality upon client signoff, and enforces an invariant 48-hour challenge timelock on client refund cancellations to prevent capital drain exploits. <code>DisputeContract.sol</code> isolates arbitration authority, freezes disputed balances, and settles funds based on binary allocation rules. <code>ReputationContract.sol</code> implements an $\\mathcal{O}(1)$ gas-complexity accumulator that records permanent, non-transferable counterparty ratings on-chain.
</p>
<p style="text-indent: 30pt; line-height: 1.6;">
  To bridge on-chain operations with off-chain applications securely, the backend architecture implements a 5-pillar settlement engine: generation-fenced distributed lease management (<code>leaseManager.js</code>) preventing split-brain writes across multi-pod clusters, a reorg rollback engine (<code>reorgEngine.js</code>) resolving deep block reorganizations back to common ancestors, transactional outbox delivery, fail-fast startup bytecode verification, and an automated arbitrator cryptographic relay executing mutual Gemini AI dispute agreements on-chain. The smart contract suite passes 12/12 comprehensive Hardhat tests, and the backend services pass 71/71 production tests, demonstrating mathematical security and enterprise readiness.
</p>
`;

// ============================================================================
// STUDENT 2: VIGNESH V CONFIGURATION
// ============================================================================
const vigneshFiguresMap = {
  // Fig 3.1
  "Figure 3.1": {
    image: "fig_arch_vignesh.png",
    num: "3.1",
    caption: "React 19 Frontend Component Architecture & State Store Hierarchy",
    analysis: "The frontend client architecture separates concerns across global application providers (AuthContext, ThemeProvider, ToastProvider), declarative React Router v7 routes, and high-conversion page controllers. Atomic design primitives in components/ui/ provide consistent UX, while projectsApi.ts and web3.ts interface with Express and Ethereum Sepolia."
  },
  // Fig 3.2
  "Figure 3.2": {
    image: "fig_user_workflows.png",
    num: "3.2",
    caption: "Client Milestone Escrow Lifecycle & Funding Flowchart",
    analysis: "The client escrow workflow illustrates project posting, proposals evaluation, digital agreement signing, MetaMask USDC allowance approval, and client-gated milestone release payouts."
  },
  // Fig 3.3
  "Figure 3.3": {
    image: "fig_user_workflows.png",
    num: "3.3",
    caption: "Freelancer Work Submission & GitHub CI Telemetry Sequence",
    analysis: "The developer delivery sequence maps code submission through pull requests, parsing CI test runs, displaying verified green badges, and receiving direct non-custodial payouts."
  },
  // Fig 3.4
  "Figure 3.4": {
    image: "fig_user_workflows.png",
    num: "3.4",
    caption: "AI Dispute Mediation Consensus & Bilateral Acceptance Workflow",
    analysis: "The dispute workflow outlines vault freezing, automated Gemini AI technical evidence review, the 48-hour consensus countdown window, and arbitrator relay execution upon mutual consent."
  },
  // Fig 3.5
  "Figure 3.5": {
    image: "fig_dfd_suriya.png",
    num: "3.5",
    caption: "Frontend Level 1 Data Flow Diagram (State & Web3 Interaction)",
    analysis: "The frontend Level 1 DFD traces user actions through UI components, REST API consumers, Viem contract callers, and reactive toast notifications."
  },
  // Fig 4.1
  "Figure 4.1": {
    image: "screenshot_landing_page.png",
    num: "4.1",
    caption: "FairWork Public Discovery Studio & Interactive Milestone Escrow Simulator",
    analysis: "The responsive landing page showcases the live protocol value proposition: universal search, real-time escrow balance simulation, zero take-rate fee calculator, and verified Sepolia smart contract links directly from Etherscan."
  },
  // Fig 4.2
  "Figure 4.2": {
    image: "screenshot_projects_marketplace.png",
    num: "4.2",
    caption: "FairWork Projects Marketplace with Real-Time Filtering & Milestone Budgets",
    analysis: "The discovery marketplace enables freelancers to filter freelance briefs by technical category, budget tier, and deadline urgency, with immediate visual indicators of escrow funding status."
  },
  // Fig 4.3
  "Figure 4.3": {
    image: "screenshot_project_detail_mobile.jpg",
    num: "4.3",
    caption: "Responsive Project Detail Hub with Multi-Tab Milestone & Contract Management",
    analysis: "The mobile-optimized collaboration hub provides quick access to Overview, Contract, Milestones, Files, and Activity tabs, showing live milestone funding progress, deadline countdowns, and action buttons."
  },
  // Fig 4.4
  "Figure 4.4": {
    image: "screenshot_wallet_required_banner.png",
    num: "4.4",
    caption: "Project Creation Workspace with Web3 Client Wallet Connection Guardrail",
    analysis: "When creating a project, the interface validates Web3 wallet availability. If an address is not connected, the prominent Web3 Client Wallet Required banner guides the user to connect MetaMask before allowing form submission."
  },
  // Fig 4.5
  "Figure 4.5": {
    image: "screenshot_ask_ai_chat.jpg",
    num: "4.5",
    caption: "FairWork Ask AI Streaming Assistant Interface",
    analysis: "The interactive SSE streaming assistant dialog guides users through Web3 escrow payments, gas fees, milestone release steps, and dispute resolution policies."
  }
};

const vigneshTocHtml = `
<table class="academic-table" style="font-size: 10pt; line-height: 1.35; margin-bottom: 0;">
  <thead>
    <tr style="background-color: #e2e8f0;">
      <th style="width: 16%; text-align: center; padding: 4pt 6pt;">CHAPTER</th>
      <th style="width: 68%; padding: 4pt 8pt;">TITLE</th>
      <th style="width: 16%; text-align: center; padding: 4pt 6pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center"></td><td><strong>BONAFIDE CERTIFICATE</strong></td><td class="center">ii</td></tr>
    <tr><td class="center"></td><td><strong>ACKNOWLEDGEMENT</strong></td><td class="center">iii</td></tr>
    <tr><td class="center"></td><td><strong>ABSTRACT</strong></td><td class="center">iv</td></tr>
    <tr><td class="center"></td><td><strong>LIST OF TABLES</strong></td><td class="center">vi</td></tr>
    <tr><td class="center"></td><td><strong>LIST OF FIGURES</strong></td><td class="center">vii</td></tr>
    <tr><td class="center"><strong>1</strong></td><td><strong>INTRODUCTION</strong></td><td class="center"><strong>1</strong></td></tr>
    <tr><td class="center"><strong>2</strong></td><td><strong>MODULE DESCRIPTION & SYSTEM REQUIREMENTS</strong></td><td class="center"><strong>5</strong></td></tr>
    <tr><td class="center"><strong>3</strong></td><td><strong>SYSTEM DESIGN & UI/UX ARCHITECTURE</strong></td><td class="center"><strong>14</strong></td></tr>
    <tr><td class="center"><strong>4</strong></td><td><strong>IMPLEMENTATION & CODE METHODOLOGY</strong></td><td class="center"><strong>22</strong></td></tr>
    <tr><td class="center"><strong>5</strong></td><td><strong>TESTING, USABILITY & PERFORMANCE VERIFICATION</strong></td><td class="center"><strong>40</strong></td></tr>
    <tr><td class="center"><strong>6</strong></td><td><strong>CONCLUSION & FUTURE ENHANCEMENTS</strong></td><td class="center"><strong>48</strong></td></tr>
    <tr><td class="center"></td><td><strong>APPENDIX: ROUTE MAP & API TYPINGS</strong></td><td class="center"><strong>50</strong></td></tr>
    <tr><td class="center"></td><td><strong>REFERENCES</strong></td><td class="center"><strong>53</strong></td></tr>
  </tbody>
</table>
`;

const vigneshListTablesHtml = `
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">vi</p>
<h1 class="chapter-heading" style="margin-bottom: 12pt;">LIST OF TABLES</h1>
<table class="academic-table" style="font-size: 10pt; line-height: 1.35;">
  <thead>
    <tr style="background-color: #e2e8f0;">
      <th style="width: 18%; text-align: center; padding: 4pt 6pt;">TABLE NO.</th>
      <th style="width: 67%; padding: 4pt 8pt;">TABLE NAME</th>
      <th style="width: 15%; text-align: center; padding: 4pt 6pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center"><strong>2.1</strong></td><td>Reusable Design System Component Specification</td><td class="center">7</td></tr>
    <tr><td class="center"><strong>2.2</strong></td><td>Frontend Software Stack & Dependency Matrix</td><td class="center">13</td></tr>
    <tr><td class="center"><strong>3.1</strong></td><td>Application Route Mapping & Access Authority</td><td class="center">21</td></tr>
    <tr><td class="center"><strong>5.1</strong></td><td>Client Form Validation & Security Test Matrix</td><td class="center">43</td></tr>
    <tr><td class="center"><strong>5.2</strong></td><td>Web3 Transaction Error Recovery & Fallback Matrix</td><td class="center">44</td></tr>
    <tr><td class="center"><strong>5.3</strong></td><td>Google Lighthouse Performance & Accessibility Scores</td><td class="center">46</td></tr>
  </tbody>
</table>
`;

const vigneshListFiguresHtml = `
<p class="right" style="font-size: 10pt; color: #64748b; margin-bottom: 2pt;">vii</p>
<h1 class="chapter-heading" style="margin-bottom: 12pt;">LIST OF FIGURES</h1>
<table class="academic-table" style="font-size: 10pt; line-height: 1.35;">
  <thead>
    <tr style="background-color: #e2e8f0;">
      <th style="width: 18%; text-align: center; padding: 4pt 6pt;">FIGURE NO.</th>
      <th style="width: 67%; padding: 4pt 8pt;">FIGURE NAME</th>
      <th style="width: 15%; text-align: center; padding: 4pt 6pt;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="center"><strong>3.1</strong></td><td>React 19 Frontend Component Architecture & State Store Hierarchy</td><td class="center">15</td></tr>
    <tr><td class="center"><strong>3.2</strong></td><td>Client Milestone Escrow Lifecycle & Funding Flowchart</td><td class="center">17</td></tr>
    <tr><td class="center"><strong>3.3</strong></td><td>Freelancer Work Submission & GitHub CI Telemetry Sequence</td><td class="center">18</td></tr>
    <tr><td class="center"><strong>3.4</strong></td><td>AI Dispute Mediation Consensus & Bilateral Acceptance Workflow</td><td class="center">19</td></tr>
    <tr><td class="center"><strong>3.5</strong></td><td>Frontend Level 1 Data Flow Diagram (State & Web3 Interaction)</td><td class="center">20</td></tr>
    <tr><td class="center"><strong>4.1</strong></td><td>FairWork Public Discovery Studio & Interactive Milestone Escrow Simulator</td><td class="center">35</td></tr>
    <tr><td class="center"><strong>4.2</strong></td><td>FairWork Projects Marketplace with Real-Time Filtering & Milestone Budgets</td><td class="center">36</td></tr>
    <tr><td class="center"><strong>4.3</strong></td><td>Responsive Project Detail Hub with Multi-Tab Milestone & Contract Management</td><td class="center">37</td></tr>
    <tr><td class="center"><strong>4.4</strong></td><td>Project Creation Workspace with Web3 Client Wallet Connection Guardrail</td><td class="center">38</td></tr>
    <tr><td class="center"><strong>4.5</strong></td><td>FairWork Ask AI Streaming Assistant Interface</td><td class="center">39</td></tr>
  </tbody>
</table>
`;

const vigneshAbstractHtml = `
<p style="text-indent: 30pt; line-height: 1.6;">
  Decentralized Web3 applications frequently fail to achieve mainstream adoption due to fragmented, confusing user experiences, cryptic blockchain error messages, complex wallet interaction dialogs, and clunky interfaces. For a freelance escrow platform to succeed, it must deliver the visual precision, accessibility, and frictionless responsiveness of modern enterprise consumer software while seamlessly interacting with decentralized smart contracts and backend REST APIs.
</p>
<p style="text-indent: 30pt; line-height: 1.6;">
  This project documentation details the <strong>Frontend Engineering, UI/UX Architecture, React/Vite Client Implementation, Tailwind CSS Design System, Multi-Role User Workflows, and REST/Web3 API Integrations</strong> designed and implemented by <strong>VIGNESH V (Reg. No: RA2532241040045)</strong>.
</p>
<p style="text-indent: 30pt; line-height: 1.6;">
  The frontend application is constructed using a high-performance <strong>React 19, TypeScript, and Vite 6</strong> technical stack styled via a custom <strong>Tailwind CSS</strong> variable token system. Key subsystems engineered include:
</p>
<ol style="margin-left: 20pt; line-height: 1.6;">
  <li><strong>Public Landing Page & Discovery Studio:</strong> Engineered a modular, authentic landing experience featuring HeroSection (universal search and interactive escrow simulator), EscrowFlowBlueprint (4-stage visual settlement pipeline), PlatformFeatures (core architectural safeguards), ProjectCalculator (interactive budget and milestone estimator), and VerifiedProtocolShowcase (live Sepolia smart contract registry with real Etherscan links).</li>
  <li><strong>Project Detail Hub & Multi-Tab Workspace:</strong> Engineered a collaborative workspace consolidating project overview, proposal evaluation, AI-generated legal contract signing, milestone submission with drag-and-drop file attachments, on-demand GitHub PR CI/CD status inspection (✓ CI Green, ✗ Failing, ⏳ In Progress), on-chain escrow funding triggers, and milestone release transactions.</li>
  <li><strong>AI Dispute Mediation Interface:</strong> Designed an intuitive dispute resolution portal displaying Gemini AI's objective recommendations, neutral rationale breakdowns, a live 48-hour mutual consensus window countdown, and one-click bilateral acceptance controls.</li>
  <li><strong>On-Chain Reputation Modal & Freelancer Showcase:</strong> Implemented an accessible post-completion rating dialog that writes immutable 1–5 star scores to the Sepolia ReputationContract accumulator with real-time MetaMask transaction feedback.</li>
  <li><strong>Robust API Client & State Layer:</strong> Developed type-safe REST consumers (projectsApi.ts, disputesApi.ts, contractsApi.ts) with normalized error handling, session token management, and Viem/MetaMask Web3 interaction wrappers (web3.ts).</li>
</ol>
<p style="text-indent: 30pt; line-height: 1.6;">
  The application compiles with <strong>zero TypeScript errors (<code>tsc -b && vite build</code>)</strong>, satisfies strict linting rules, and exhibits exceptional performance across mobile, tablet, and desktop viewports, demonstrating how decentralized freelance commerce can be delivered with enterprise-grade usability.
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

Write-Output "Opening HTML: ${htmlPath.replace(/\\/g, '\\\\')}"
$doc = $word.Documents.Open("${htmlPath.replace(/\\/g, '\\\\')}")
Write-Output "Opened in $($sw.ElapsedMilliseconds) ms"

Write-Output "Saving DOCX: ${docxPath.replace(/\\/g, '\\\\')}"
$sw.Restart()
$doc.SaveAs2("${docxPath.replace(/\\/g, '\\\\')}", 16)
Write-Output "Saved DOCX in $($sw.ElapsedMilliseconds) ms"

Write-Output "Saving PDF: ${pdfPath.replace(/\\/g, '\\\\')}"
$sw.Restart()
$doc.SaveAs2("${pdfPath.replace(/\\/g, '\\\\')}", 17)
Write-Output "Saved PDF in $($sw.ElapsedMilliseconds) ms"

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
  fs.unlinkSync(htmlPath);

  const docxStats = fs.statSync(docxPath);
  const pdfStats = fs.statSync(pdfPath);
  console.log(`✓ GENERATED DOCX: ${outDocxName} (${(docxStats.size / 1024).toFixed(1)} KB)`);
  console.log(`✓ GENERATED PDF:  ${outPdfName} (${(pdfStats.size / 1024).toFixed(1)} KB)`);
}

// Student 1: Suriya E
const suriyaConfig = {
  title: "FAIRWORK: A DECENTRALIZED FREELANCE MARKETPLACE WITH SMART CONTRACT ESCROW AND DISPUTE RESOLUTION",
  studentName: "SURIYA E",
  regNo: "RA2532241040042",
  guide: "Dr. M. Sivasakthi, M.Sc., M.Phil., Ph.D., NET",
  guideRole: "Associate Professor, Department of Computer Applications",
  hod: "Dr. J. Anitha Ruth, M.S., Ph.D.",
  tocHtml: suriyaTocHtml,
  listTablesHtml: suriyaListTablesHtml,
  listFiguresHtml: suriyaListFiguresHtml,
  abstractHtml: suriyaAbstractHtml
};

// Student 2: Vignesh V
const vigneshConfig = {
  title: "FAIRWORK: A DECENTRALIZED FREELANCE MARKETPLACE WITH SMART CONTRACT ESCROW AND DISPUTE RESOLUTION",
  studentName: "VIGNESH V",
  regNo: "RA2532241040045",
  guide: "Dr. M. Sivasakthi, M.Sc., M.Phil., Ph.D., NET",
  guideRole: "Associate Professor, Department of Computer Applications",
  hod: "Dr. J. Anitha Ruth, M.S., Ph.D.",
  tocHtml: vigneshTocHtml,
  listTablesHtml: vigneshListTablesHtml,
  listFiguresHtml: vigneshListFiguresHtml,
  abstractHtml: vigneshAbstractHtml
};

try {
  processStudent(
    'suriya',
    'MCA_Project_Report_SURIYA_E_Blockchain_Backend.md',
    'Suriya_E_RA2532241040042_MCA_Project_Report.docx',
    'Suriya_E_RA2532241040042_MCA_Project_Report.pdf',
    suriyaConfig,
    suriyaFiguresMap
  );

  processStudent(
    'vignesh',
    'MCA_Project_Report_VIGNESH_V_Frontend_UIUX.md',
    'Vignesh_V_RA2532241040045_MCA_Project_Report.docx',
    'Vignesh_V_RA2532241040045_MCA_Project_Report.pdf',
    vigneshConfig,
    vigneshFiguresMap
  );

  console.log(`\n============================================================`);
  console.log(`ALL PROFESSIONAL REPORTS GENERATED WITH REAL PROJECT IMAGES!`);
  console.log(`============================================================\n`);
} catch (err) {
  console.error("Build failed:", err);
  process.exit(1);
}
