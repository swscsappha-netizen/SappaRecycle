const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = path.resolve('d:/โครงงานวิศวะ');
const targetFolder = path.join(baseDir, 'ไฟล์โครงงาน');
if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
}

// Find template docx
const templateDocx = path.join(baseDir, 'ต้วอย่าง', 'ตัวอย่างรุ่นพี่.docx');

function runPowerShell(script) {
    const buffer = Buffer.from(script, 'utf16le');
    const base64 = buffer.toString('base64');
    return execSync(`powershell -ExecutionPolicy Bypass -EncodedCommand ${base64}`, { encoding: 'utf-8' });
}

function escapeXml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function newPXml(text, align = 'both', bold = false, sizePt = 16, firstLineIndentDxa = 0, leftIndentDxa = 0, spaceBefore = 0, spaceAfter = 120) {
    const escaped = escapeXml(text);
    const szVal = sizePt * 2;
    const bXml = bold ? '<w:b/><w:bCs/>' : '';
    let indXml = '';
    if (firstLineIndentDxa > 0 && leftIndentDxa > 0) {
        indXml = `<w:ind w:left="${leftIndentDxa}" w:firstLine="${firstLineIndentDxa}"/>`;
    } else if (firstLineIndentDxa > 0) {
        indXml = `<w:ind w:firstLine="${firstLineIndentDxa}"/>`;
    } else if (leftIndentDxa > 0) {
        indXml = `<w:ind w:left="${leftIndentDxa}" w:firstLine="0"/>`;
    }

    const jcVal = align === 'center' ? 'center' : align === 'right' ? 'right' : align === 'left' ? 'left' : 'both';

    return `<w:p><w:pPr><w:jc w:val="${jcVal}"/>${indXml}<w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}" w:line="276" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/><w:sz w:val="${szVal}"/><w:szCs w:val="${szVal}"/>${bXml}</w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/><w:sz w:val="${szVal}"/><w:szCs w:val="${szVal}"/>${bXml}</w:rPr><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
}

function newTableXml(tableLines) {
    let xml = '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr>';

    let isFirst = true;
    for (const row of tableLines) {
        const trimmedRow = row.trim();
        if (trimmedRow.startsWith('+--') || trimmedRow.startsWith('+-')) continue;
        if (!trimmedRow.startsWith('|')) continue;
        
        let cleanRow = trimmedRow;
        if (cleanRow.startsWith('|')) cleanRow = cleanRow.substring(1);
        if (cleanRow.endsWith('|')) cleanRow = cleanRow.substring(0, cleanRow.length - 1);
        
        const cells = cleanRow.split('|');
        xml += '<w:tr>';
        for (const c of cells) {
            const cellText = escapeXml(c.trim());
            const bTag = isFirst ? '<w:b/><w:bCs/>' : '';
            const bgTag = isFirst ? '<w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>' : '';
            const align = (isFirst || /^[0-9\.\%\,\-\:\s]+$/.test(cellText)) ? 'center' : 'left';
            
            xml += `<w:tc><w:tcPr>${bgTag}<w:vAlign w:val="center"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="40" w:after="40"/><w:rPr><w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/><w:sz w:val="26"/><w:szCs w:val="26"/>${bTag}</w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/><w:sz w:val="26"/><w:szCs w:val="26"/>${bTag}</w:rPr><w:t xml:space="preserve">${cellText}</w:t></w:r></w:p></w:tc>`;
        }
        xml += '</w:tr>';
        isFirst = false;
    }
    xml += '</w:tbl>';
    return xml;
}

function processTextToXml(txtPath) {
    const content = fs.readFileSync(txtPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    let xml = '';
    let tableBuffer = [];
    let inTable = false;
    let nonEmptyCount = 0;

    for (const rawLine of lines) {
        const trimmed = rawLine.trim();

        if (trimmed.startsWith('+--') || trimmed.startsWith('+-')) {
            if (!inTable) {
                inTable = true;
                tableBuffer = [];
            }
            continue;
        }

        if (inTable) {
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                tableBuffer.push(trimmed);
                continue;
            } else {
                inTable = false;
                if (tableBuffer.length > 0) {
                    xml += newTableXml(tableBuffer);
                    tableBuffer = [];
                }
            }
        }

        if (trimmed.length === 0) continue;

        nonEmptyCount++;

        // Chapter Header (e.g. บทที่ 1)
        if (nonEmptyCount === 1 && trimmed.length < 40) {
            xml += newPXml(trimmed, 'center', true, 18, 0, 0, 240, 100);
            continue;
        }
        // Chapter Title (e.g. บทนำ)
        if (nonEmptyCount === 2 && trimmed.length < 60 && !/^\d+\./.test(trimmed)) {
            xml += newPXml(trimmed, 'center', true, 18, 0, 0, 0, 240);
            continue;
        }

        // Section Headings (not indented, short)
        const isIndented = rawLine.startsWith(' ') || rawLine.startsWith('\t');
        if (!isIndented && trimmed.length < 60 && !/^\d+\.\s+[^\d]/.test(trimmed) && !/^\d+\.\d+/.test(trimmed)) {
            xml += newPXml(trimmed, 'left', true, 16, 0, 0, 200, 100);
            continue;
        }

        // Numbered list (1., 2., ข้อที่ 1, etc.)
        if (/^(\d+\.|\d+\.\d+|ข้อที่|\-|\*)\s*/.test(trimmed)) {
            xml += newPXml(trimmed, 'both', false, 16, 0, 720, 40, 40);
            continue;
        }

        // Standard Paragraph
        xml += newPXml(trimmed, 'both', false, 16, 720, 0, 40, 80);
    }

    if (inTable && tableBuffer.length > 0) {
        xml += newTableXml(tableBuffer);
        tableBuffer = [];
    }

    return xml;
}

function buildDocx(outPath, bodyXml) {
    const fullXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="2160" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720"/></w:sectPr></w:body></w:document>`;
    
    // Write temporary xml file
    const tempXmlPath = path.join(baseDir, 'scratch', 'temp_doc.xml');
    fs.writeFileSync(tempXmlPath, fullXml, 'utf-8');

    const psScript = `
        [System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression") | Out-Null
        [System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
        $template = "${templateDocx}"
        $target = "${outPath}"
        $xmlSource = "${tempXmlPath}"
        
        if (Test-Path $target) { Remove-Item $target -Force }
        Copy-Item $template $target
        
        $mode = [System.IO.Compression.ZipArchiveMode]::Update
        $zip = [System.IO.Compression.ZipFile]::Open($target, $mode)
        $entry = $zip.GetEntry("word/document.xml")
        if ($entry) { $entry.Delete() }
        
        $newEntry = $zip.CreateEntry("word/document.xml")
        $stream = $newEntry.Open()
        $bytes = [System.IO.File]::ReadAllBytes($xmlSource)
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
        $zip.Dispose()
    `;
    
    runPowerShell(psScript);
    console.log(`Created DOCX: ${outPath} (${fs.statSync(outPath).size} bytes)`);
}

const chapters = [
    { name: 'บทที่ 1', file: 'บทที่ 1.txt' },
    { name: 'บทที่ 2', file: 'บทที่ 2.txt' },
    { name: 'บทที่ 3', file: 'บทที่ 3.txt' },
    { name: 'บทที่ 4', file: 'บทที่ 4.txt' },
    { name: 'บทที่ 5', file: 'บทที่ 5.txt' },
    { name: 'เอกสารอ้างอิง', file: 'เอกสารอ้างอิง.txt' }
];

let mergedXml = '';

for (const ch of chapters) {
    const srcPath = path.join(baseDir, ch.file);
    if (fs.existsSync(srcPath)) {
        const bodyXml = processTextToXml(srcPath);
        
        // Save separate docx in 'ไฟล์โครงงาน'
        const docx1 = path.join(targetFolder, `${ch.name}.docx`);
        buildDocx(docx1, bodyXml);

        // Save separate docx in root directory
        const docx2 = path.join(baseDir, `${ch.name}.docx`);
        buildDocx(docx2, bodyXml);

        mergedXml += bodyXml;
        mergedXml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    }
}

// Build merged docx
const mergedDocx1 = path.join(targetFolder, 'บทที่ 1-5 รวมเล่ม.docx');
const mergedDocx2 = path.join(baseDir, 'บทที่ 1-5 รวมเล่ม.docx');
buildDocx(mergedDocx1, mergedXml);
buildDocx(mergedDocx2, mergedXml);

console.log('ALL CHAPTERS SEPARATED AND MERGED SUCCESSFULLY!');
