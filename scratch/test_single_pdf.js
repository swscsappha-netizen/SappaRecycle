const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runPowerShell(script) {
    const buffer = Buffer.from(script, 'utf16le');
    const base64 = buffer.toString('base64');
    return execSync(`powershell -ExecutionPolicy Bypass -EncodedCommand ${base64}`, { encoding: 'utf-8' });
}

const psScript = `
    try {
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        $word.DisplayAlerts = 0
        $docxPath = "d:\\โครงงานวิศวะ\\ไฟล์โครงงาน\\บทที่ 1.docx"
        $pdfPath = "d:\\โครงงานวิศวะ\\ไฟล์โครงงาน\\บทที่ 1.pdf"
        
        $doc = $word.Documents.Open($docxPath)
        $doc.SaveAs([ref]$pdfPath, [ref]17)
        $doc.Close([ref]0)
        $word.Quit()
        Write-Output "PDF Export Success: $pdfPath"
    } catch {
        Write-Output "Error: $($_.Exception.Message)"
    }
`;

console.log(runPowerShell(psScript));
