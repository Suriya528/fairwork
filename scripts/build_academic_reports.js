const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = path.join(__dirname, '..', 'docs');
const logoPath = path.join(docsDir, 'srm_logo.png');

// Markdown Parser Helper
function markdownToHtml(mdText) {
    const lines = mdText.split(/\r?\n/);
    const htmlLines = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer = [];
    let inTable = false;
    let tableBuffer = [];
    let inList = false;
    let listType = ''; // 'ul' or 'ol'

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
                // check if separator row like :---: or ---
                if (cells.every(c => /^:?-+:?$/.test(c))) {
                    return;
                }
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
            .replace(/&nbsp;/g, ' ')
            .replace(/\\newpage/g, '<div class="page-break"></div>');
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Page break
        if (line.trim() === '\\newpage') {
            flushList();
            flushTable();
            htmlLines.push('<div class="page-break"></div>');
            continue;
        }

        // Code block toggle
        if (line.trim().startsWith('```')) {
            flushList();
            flushTable();
            if (inCodeBlock) {
                // close code block
                const escapedCode = codeBuffer.join('\n')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                htmlLines.push(`<pre><code class="language-${codeLanguage}">${escapedCode}</code></pre>`);
                inCodeBlock = false;
                codeBuffer = [];
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

        // Horizontal rules
        if (line.trim() === '---' || line.trim() === '***') {
            flushList();
            htmlLines.push('<hr class="divider" />');
            continue;
        }

        // Unordered lists
        if (/^\s*[-*]\s+/.test(line)) {
            if (!inList || listType !== 'ul') {
                flushList();
                htmlLines.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            const content = line.replace(/^\s*[-*]\s+/, '');
            htmlLines.push(`  <li>${formatInline(content)}</li>`);
            continue;
        }

        // Ordered lists
        if (/^\s*\d+\.\s+/.test(line)) {
            if (!inList || listType !== 'ol') {
                flushList();
                htmlLines.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            const content = line.replace(/^\s*\d+\.\s+/, '');
            htmlLines.push(`  <li>${formatInline(content)}</li>`);
            continue;
        }

        // Blank lines
        if (line.trim() === '') {
            flushList();
            continue;
        }

        // Regular paragraph
        flushList();
        htmlLines.push(`<p>${formatInline(line.trim())}</p>`);
    }

    flushList();
    flushTable();

    return htmlLines.join('\n');
}

// Generate Full HTML Document with SRM Academic Styling
function buildAcademicHtml(memberConfig, markdownBody) {
    const parsedBody = markdownToHtml(markdownBody);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${memberConfig.title} - ${memberConfig.studentName}</title>
<style>
  @page {
    size: A4;
    margin-top: 1.0in;
    margin-bottom: 1.0in;
    margin-left: 1.25in;
    margin-right: 1.0in;
    mso-header-margin: 0.5in;
    mso-footer-margin: 0.5in;
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
    margin-top: 10pt;
    margin-bottom: 14pt;
    text-transform: uppercase;
  }
  h1.chapter-heading {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin-top: 18pt;
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
  .center {
    text-align: center;
  }
  .right {
    text-align: right;
  }
  .bold {
    font-weight: bold;
  }
  .page-break {
    page-break-after: always;
    mso-special-character: line-break;
  }
  .academic-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  .academic-table th, .academic-table td {
    border: 1px solid #333333;
    padding: 5pt 7pt;
    font-size: 10pt;
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
    margin-top: 14pt;
    margin-bottom: 14pt;
    border: none;
  }
  .borderless-table td {
    border: none;
    padding: 4pt 6pt;
    vertical-align: top;
    font-size: 11pt;
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
  hr.divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 12pt 0;
  }
</style>
</head>
<body>

<!-- ======================================================================= -->
<!-- 1. COVER PAGE                                                           -->
<!-- ======================================================================= -->
<div style="text-align: center; margin-top: 10pt;">
  <h1 class="cover-title">${memberConfig.title}</h1>
  
  <p class="center bold" style="font-size: 12pt; margin-top: 14pt; margin-bottom: 3pt;">
    A PROJECT REPORT SUBMITTED TO SRM INSTITUTE OF SCIENCE & TECHNOLOGY
  </p>
  <p class="center" style="font-size: 11pt; margin-bottom: 3pt;">
    IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF
  </p>
  <p class="center bold" style="font-size: 14pt; margin-bottom: 18pt;">
    MASTER OF COMPUTER APPLICATIONS
  </p>

  <p class="center" style="font-size: 11pt; margin-bottom: 2pt;">SUBMITTED BY:</p>
  <p class="center bold" style="font-size: 13pt; margin-bottom: 2pt;">${memberConfig.studentName}</p>
  <p class="center bold" style="font-size: 12pt; margin-bottom: 16pt;">REG NO: ${memberConfig.regNo}</p>

  <p class="center" style="font-size: 11pt; margin-bottom: 2pt;">UNDER THE GUIDANCE OF</p>
  <p class="center bold" style="font-size: 13pt; margin-bottom: 2pt;">${memberConfig.guide}</p>
  <p class="center" style="font-size: 11pt; margin-bottom: 16pt;">${memberConfig.guideRole}</p>

  <div style="margin-top: 8pt; margin-bottom: 16pt;">
    <img src="${logoPath}" width="210" alt="SRM Institute of Science & Technology" />
  </div>

  <p class="center bold" style="font-size: 12pt; margin-bottom: 2pt;">DEPARTMENT OF COMPUTER APPLICATIONS (MCA)</p>
  <p class="center bold" style="font-size: 11pt; margin-bottom: 2pt;">FACULTY OF LIBERAL ARTS AND BUSINESS STUDIES</p>
  <p class="center bold" style="font-size: 12pt; margin-bottom: 2pt;">SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
  <p class="center bold" style="font-size: 11pt; margin-bottom: 2pt;">VADAPALANI CAMPUS, CHENNAI – 600026</p>
  <p class="center bold" style="font-size: 12pt; margin-top: 4pt;">ACADEMIC YEAR: 2025 – 2026</p>
</div>

<div class="page-break"></div>

<!-- ======================================================================= -->
<!-- 2. BONAFIDE CERTIFICATE                                                 -->
<!-- ======================================================================= -->
<div style="text-align: center;">
  <p class="center bold" style="font-size: 12pt; margin-bottom: 2pt;">DEPARTMENT OF COMPUTER APPLICATIONS (MCA)</p>
  <p class="center bold" style="font-size: 11pt; margin-bottom: 2pt;">FACULTY OF LIBERAL ARTS AND BUSINESS STUDIES</p>
  <p class="center bold" style="font-size: 12pt; margin-bottom: 2pt;">SRM INSTITUTE OF SCIENCE AND TECHNOLOGY</p>
  <p class="center bold" style="font-size: 11pt; margin-bottom: 8pt;">VADAPALANI CAMPUS, CHENNAI – 600026</p>

  <div style="margin-bottom: 10pt;">
    <img src="${logoPath}" width="165" alt="SRM Logo" />
  </div>

  <h2 class="center" style="font-size: 14pt; margin-bottom: 14pt;">BONAFIDE CERTIFICATE</h2>
</div>

<p style="text-indent: 30pt; line-height: 1.6;">
  This is to certify that the project report titled <strong>“${memberConfig.title}”</strong> is the bonafide work done and submitted by <strong>${memberConfig.studentName} (Reg. No: ${memberConfig.regNo})</strong> during the <strong>2025–2026</strong> academic year, in partial fulfillment of the requirements for the award of the degree of <strong>MASTER OF COMPUTER APPLICATIONS</strong>, at <strong>SRM INSTITUTE OF SCIENCE & TECHNOLOGY, Vadapalani, Chennai</strong>.
</p>

<table class="borderless-table" style="margin-top: 36pt;">
  <tr>
    <td style="width: 50%; text-align: left;">
      <div style="margin-bottom: 30pt;">_____________________________</div>
      <strong>Signature of the Guide</strong><br />
      <strong>${memberConfig.guide}</strong><br />
      ${memberConfig.guideRole}<br />
      Department of Computer Applications<br />
      SRM IST, Vadapalani Campus
    </td>
    <td style="width: 50%; text-align: right;">
      <div style="margin-bottom: 30pt;">_____________________________</div>
      <strong>Signature of the HOD</strong><br />
      <strong>${memberConfig.hod}</strong><br />
      Head of the Department<br />
      Department of Computer Applications<br />
      SRM IST, Vadapalani Campus
    </td>
  </tr>
</table>

<div style="margin-top: 24pt;">
  <p style="margin-bottom: 4pt;">
    Submitted for Project Work Viva-Voce Examination held on: ____________________
  </p>
  <table class="borderless-table" style="margin-top: 4pt; margin-bottom: 20pt;">
    <tr>
      <td style="width: 50%;"><strong>Place:</strong> VADAPALANI, CHENNAI</td>
      <td style="width: 50%; text-align: right;"><strong>Date:</strong> ____________________</td>
    </tr>
  </table>

  <table class="borderless-table" style="margin-top: 20pt;">
    <tr>
      <td style="width: 50%; text-align: left;">
        <div style="margin-bottom: 25pt;">_____________________________</div>
        <strong>INTERNAL EXAMINER</strong>
      </td>
      <td style="width: 50%; text-align: right;">
        <div style="margin-bottom: 25pt;">_____________________________</div>
        <strong>EXTERNAL EXAMINER</strong>
      </td>
    </tr>
  </table>
</div>

<div class="page-break"></div>

<!-- ======================================================================= -->
<!-- 3. MAIN BODY CONTENT (ACKNOWLEDGEMENT, ABSTRACT, TOC, CHAPTERS, ETC.)   -->
<!-- ======================================================================= -->
${parsedBody}

</body>
</html>`;
}

// Convert HTML to DOCX and native PDF via Word COM Automation
function convertToWordAndPdf(htmlFilePath, docxFilePath, pdfFilePath) {
    const psScript = `
$ErrorActionPreference = "Stop"
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

Write-Output "Opening HTML: ${htmlFilePath.replace(/\\/g, '\\\\')}"
$doc = $word.Documents.Open("${htmlFilePath.replace(/\\/g, '\\\\')}")
Write-Output "Opened in $($sw.ElapsedMilliseconds) ms"

Write-Output "Saving DOCX: ${docxFilePath.replace(/\\/g, '\\\\')}"
$sw.Restart()
$doc.SaveAs2("${docxFilePath.replace(/\\/g, '\\\\')}", 16)
Write-Output "Saved DOCX in $($sw.ElapsedMilliseconds) ms"

Write-Output "Saving PDF: ${pdfFilePath.replace(/\\/g, '\\\\')}"
$sw.Restart()
$doc.SaveAs2("${pdfFilePath.replace(/\\/g, '\\\\')}", 17)
Write-Output "Saved PDF in $($sw.ElapsedMilliseconds) ms"

$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output "Done!"
`;

    const runnerPath = path.join(__dirname, 'run_conversion.ps1');
    fs.writeFileSync(runnerPath, psScript, 'utf8');

    console.log(`Executing Word automation for ${path.basename(docxFilePath)}...`);
    execSync(`powershell -ExecutionPolicy Bypass -File "${runnerPath}"`, { stdio: 'inherit' });
    fs.unlinkSync(runnerPath);
}

// Build function for a student
function processStudentReport(studentKey, mdFileName, outDocxName, outPdfName, memberConfig) {
    console.log(`\n============================================================`);
    console.log(`Generating Report for: ${memberConfig.studentName} (${memberConfig.regNo})`);
    console.log(`============================================================`);

    const mdPath = path.join(docsDir, mdFileName);
    const mdContent = fs.readFileSync(mdPath, 'utf8');

    // Extract content starting from Acknowledgement (skip original front pages in markdown)
    let bodyContent = mdContent;
    const ackIdx = mdContent.indexOf('## ACKNOWLEDGEMENT');
    if (ackIdx !== -1) {
        bodyContent = mdContent.slice(ackIdx);
    }

    const htmlContent = buildAcademicHtml(memberConfig, bodyContent);
    const htmlPath = path.join(docsDir, `${studentKey}_temp.html`);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`Generated HTML intermediate at: ${htmlPath}`);

    const docxPath = path.join(docsDir, outDocxName);
    const pdfPath = path.join(docsDir, outPdfName);

    convertToWordAndPdf(htmlPath, docxPath, pdfPath);

    fs.unlinkSync(htmlPath);

    const docxStats = fs.statSync(docxPath);
    const pdfStats = fs.statSync(pdfPath);
    console.log(`✓ Generated DOCX: ${outDocxName} (${(docxStats.size / 1024).toFixed(1)} KB)`);
    console.log(`✓ Generated PDF:  ${outPdfName} (${(pdfStats.size / 1024).toFixed(1)} KB)`);
}

// Configurations
const suriyaConfig = {
    title: "FAIRWORK: A DECENTRALIZED FREELANCE MARKETPLACE WITH SMART CONTRACT ESCROW AND DISPUTE RESOLUTION",
    studentName: "SURIYA E",
    regNo: "RA2532241040042",
    guide: "Dr. M. Sivasakthi, M.Sc., M.Phil., Ph.D., NET",
    guideRole: "Associate Professor, Department of Computer Applications",
    hod: "Dr. J. Anitha Ruth, M.S., Ph.D."
};

const vigneshConfig = {
    title: "FAIRWORK: A DECENTRALIZED FREELANCE MARKETPLACE WITH SMART CONTRACT ESCROW AND DISPUTE RESOLUTION",
    studentName: "VIGNESH V",
    regNo: "RA2532241040045",
    guide: "Dr. M. Sivasakthi, M.Sc., M.Phil., Ph.D., NET",
    guideRole: "Associate Professor, Department of Computer Applications",
    hod: "Dr. J. Anitha Ruth, M.S., Ph.D."
};

// Execute for both students
try {
    processStudentReport(
        'suriya',
        'MCA_Project_Report_SURIYA_E_Blockchain_Backend.md',
        'Suriya_E_RA2532241040042_MCA_Project_Report.docx',
        'Suriya_E_RA2532241040042_MCA_Project_Report.pdf',
        suriyaConfig
    );

    processStudentReport(
        'vignesh',
        'MCA_Project_Report_VIGNESH_V_Frontend_UIUX.md',
        'Vignesh_V_RA2532241040045_MCA_Project_Report.docx',
        'Vignesh_V_RA2532241040045_MCA_Project_Report.pdf',
        vigneshConfig
    );

    console.log("\n============================================================");
    console.log("ALL DELIVERABLES SUCCESSFULLY GENERATED IN DOCX AND PDF!");
    console.log("============================================================\n");
} catch (err) {
    console.error("Error generating reports:", err);
    process.exit(1);
}
