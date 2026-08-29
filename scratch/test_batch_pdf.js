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
        
        $files = Get-ChildItem -Path (Get-Location).Path -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") }
        foreach ($f in $files) {
            $pdfPath = [System.IO.Path]::ChangeExtension($f.FullName, ".pdf")
            $doc = $word.Documents.Open($f.FullName)
            $doc.SaveAs([ref]$pdfPath, [ref]17)
            $doc.Close([ref]0)
            Write-Output "Exported: $($f.Name) -> $($pdfPath)"
        }
        $word.Quit()
    } catch {
        Write-Output "Error: $($_.Exception.Message)"
    }
`;

console.log(runPowerShell(psScript));
