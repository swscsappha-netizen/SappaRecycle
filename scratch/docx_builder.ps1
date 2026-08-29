[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression") | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null

$baseDir = (Get-Location).Path
$targetFolder = Join-Path $baseDir "ไฟล์โครงงาน"
if (-not (Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder | Out-Null
}

$template = Get-ChildItem -Path $baseDir -Recurse -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") } | Select-Object -First 1

function Escape-Xml([string]$text) {
    if ($null -eq $text) { return "" }
    return $text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace('"', "&quot;").Replace("'", "&apos;")
}

function New-ParagraphXml([string]$text, [string]$align = "both", [bool]$bold = $false, [int]$sizePt = 16, [int]$firstLineIndentDxa = 0, [int]$leftIndentDxa = 0, [int]$spaceBefore = 0, [int]$spaceAfter = 120) {
    $escaped = Escape-Xml $text
    $szVal = $sizePt * 2
    $bXml = if ($bold) { "<w:b/><w:bCs/>" } else { "" }
    $indXml = ""
    if ($firstLineIndentDxa -gt 0 -and $leftIndentDxa -gt 0) {
        $indXml = "<w:ind w:left=""$leftIndentDxa"" w:firstLine=""$firstLineIndentDxa""/>"
    } elseif ($firstLineIndentDxa -gt 0) {
        $indXml = "<w:ind w:firstLine=""$firstLineIndentDxa""/>"
    } elseif ($leftIndentDxa -gt 0) {
        $indXml = "<w:ind w:left=""$leftIndentDxa""/>"
    }

    $jcVal = if ($align -eq "center") { "center" } elseif ($align -eq "right") { "right" } elseif ($align -eq "left") { "left" } else { "both" }

    return @"
    <w:p>
      <w:pPr>
        <w:jc w:val="$jcVal"/>
        $indXml
        <w:spacing w:before="$spaceBefore" w:after="$spaceAfter" w:line="276" w:lineRule="auto"/>
        <w:rPr>
          <w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/>
          $bXml
          <w:sz w:val="$szVal"/>
          <w:szCs w:val="$szVal"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="TH Sarabun PSK" w:hAnsi="TH Sarabun PSK" w:cs="TH Sarabun PSK"/>
          $bXml
          <w:sz w:val="$szVal"/>
          <w:szCs w:val="$szVal"/>
        </w:rPr>
        <w:t xml:space="preserve">$escaped</w:t>
      </w:r>
    </w:p>
"@
}

function Build-Docx([string]$outDocxPath, [string]$bodyContentXml) {
    if (Test-Path $outDocxPath) { Remove-Item $outDocxPath -Force }
    Copy-Item $template.FullName $outDocxPath

    $zip = [System.IO.Compression.ZipFile]::Open($outDocxPath, [System.IO.Compression.ZipArchiveMode]::Update)
    $entry = $zip.GetEntry("word/document.xml")
    if ($entry) { $entry.Delete() }

    $newEntry = $zip.CreateEntry("word/document.xml")
    $stream = $newEntry.Open()
    $writer = New-Object System.IO.StreamWriter($stream, [System.Text.Encoding]::UTF8)

    $fullXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
$bodyContentXml
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="2160" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

    $writer.Write($fullXml)
    $writer.Flush()
    $writer.Close()
    $stream.Close()
    $zip.Dispose()
    Write-Output ("Created Docx: " + $outDocxPath + " (Size: " + (Get-Item $outDocxPath).Length + " bytes)")
}

Write-Output "Helper script loaded successfully."
