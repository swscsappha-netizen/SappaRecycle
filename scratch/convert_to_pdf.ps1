$baseDir = (Get-Location).Path
$targetFolder = Join-Path $baseDir "ไฟล์โครงงาน"
$separateFolder = Join-Path $targetFolder "แยก1-5"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$docxFiles = Get-ChildItem -Path $targetFolder -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") }

foreach ($f in $docxFiles) {
    $pdfName = $f.BaseName + ".pdf"
    $pdfPath1 = Join-Path $targetFolder $pdfName
    $pdfPath2 = Join-Path $baseDir $pdfName
    
    try {
        $doc = $word.Documents.Open($f.FullName, $false, $true) # Open ReadOnly
        # 17 = wdExportFormatPDF
        $doc.ExportAsFixedFormat($pdfPath1, 17)
        if (Test-Path $separateFolder) {
            $pdfPathSep = Join-Path $separateFolder $pdfName
            Copy-Item $pdfPath1 $pdfPathSep -Force
        }
        Copy-Item $pdfPath1 $pdfPath2 -Force
        $doc.Close([Microsoft.Office.Interop.Word.WdSaveOptions]::wdDoNotSaveChanges)
        Write-Output ("Successfully exported PDF: " + $pdfName)
    } catch {
        Write-Output ("Error converting " + $f.Name + ": " + $_.Exception.Message)
    }
}

$word.Quit()
Write-Output "ALL PDFS CREATED SUCCESSFULLY!"
