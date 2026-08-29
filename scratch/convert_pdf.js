const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runPowerShell(script) {
    const buffer = Buffer.from(script, 'utf16le');
    const base64 = buffer.toString('base64');
    return execSync(`powershell -ExecutionPolicy Bypass -EncodedCommand ${base64}`, { encoding: 'utf-8' });
}

const baseDir = path.resolve('d:/โครงงานวิศวะ');
const targetFolder = path.join(baseDir, 'ไฟล์โครงงาน');
const separateFolder = path.join(targetFolder, 'แยก1-5');

const psScript = `
    $baseDir = "${baseDir}"
    $targetFolder = "${targetFolder}"
    $separateFolder = "${separateFolder}"

    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $docxFiles = Get-ChildItem -Path $targetFolder -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") }

    foreach ($f in $docxFiles) {
        $pdfName = $f.BaseName + ".pdf"
        $pdfPath1 = Join-Path $targetFolder $pdfName
        $pdfPath2 = Join-Path $baseDir $pdfName
        
        try {
            $doc = $word.Documents.Open($f.FullName, $false, $true)
            $doc.ExportAsFixedFormat($pdfPath1, 17)
            if (Test-Path $separateFolder) {
                $pdfPathSep = Join-Path $separateFolder $pdfName
                Copy-Item $pdfPath1 $pdfPathSep -Force
            }
            Copy-Item $pdfPath1 $pdfPath2 -Force
            $doc.Close(0)
            Write-Output ("Successfully exported PDF: " + $pdfName)
        } catch {
            Write-Output ("Error converting " + $f.Name + ": " + $_.Exception.Message)
        }
    }

    $word.Quit()
    Write-Output "ALL PDFS CREATED SUCCESSFULLY!"
`;

console.log('Starting Word PDF conversion...');
const out = runPowerShell(psScript);
console.log(out);
