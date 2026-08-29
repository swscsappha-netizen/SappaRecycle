[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression") | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null

$template = Get-ChildItem -Recurse -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") } | Select-Object -First 1
$outDir = Join-Path (Get-Location).Path "scratch"
$testDocx = Join-Path $outDir "test_clean.docx"

if (Test-Path $testDocx) { Remove-Item $testDocx -Force }
Copy-Item $template.FullName $testDocx

$zip = [System.IO.Compression.ZipFile]::Open($testDocx, [System.IO.Compression.ZipArchiveMode]::Update)
$entry = $zip.GetEntry("word/document.xml")
if ($entry) { $entry.Delete() }

$newEntry = $zip.CreateEntry("word/document.xml")
$stream = $newEntry.Open()
$writer = New-Object System.IO.StreamWriter($stream, [System.Text.Encoding]::UTF8)

$xml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:rPr>
          <w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/>
          <w:b/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/>
          <w:b/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
        </w:rPr>
        <w:t>บทที่ 1</w:t>
      </w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="2160"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

$writer.Write($xml)
$writer.Flush()
$writer.Close()
$stream.Close()
$zip.Dispose()

Write-Output ("SUCCESS! Generated: " + $testDocx + " size=" + (Get-Item $testDocx).Length)
