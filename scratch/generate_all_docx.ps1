[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression") | Out-Null
[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null

$baseDir = (Get-Location).Path
$targetFolder = Join-Path $baseDir "ไฟล์โครงงาน"
if (-not (Test-Path $targetFolder)) {
    New-Item -ItemType Directory -Path $targetFolder | Out-Null
}

$template = Get-ChildItem -Path $baseDir -Recurse -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") } | Select-Object -First 1

function Escape-XmlText([string]$text) {
    if ([string]::IsNullOrEmpty($text)) { return "" }
    return [System.Security.SecurityElement]::Escape($text)
}

function New-PXml([string]$text, [string]$align = "both", [bool]$bold = $false, [int]$sizePt = 16, [int]$firstLineIndentDxa = 0, [int]$leftIndentDxa = 0, [int]$spaceBefore = 0, [int]$spaceAfter = 120) {
    $escaped = Escape-XmlText $text
    $szVal = $sizePt * 2
    $bXml = if ($bold) { "<w:b/><w:bCs/>" } else { "" }
    $indXml = ""
    if ($firstLineIndentDxa -gt 0 -and $leftIndentDxa -gt 0) {
        $indXml = "<w:ind w:left=""$leftIndentDxa"" w:firstLine=""$firstLineIndentDxa""/>"
    } elseif ($firstLineIndentDxa -gt 0) {
        $indXml = "<w:ind w:firstLine=""$firstLineIndentDxa""/>"
    } elseif ($leftIndentDxa -gt 0) {
        $indXml = "<w:ind w:left=""$leftIndentDxa"" w:firstLine=""0""/>"
    }

    $jcVal = if ($align -eq "center") { "center" } elseif ($align -eq "right") { "right" } elseif ($align -eq "left") { "left" } else { "both" }

    $pXml = "<w:p><w:pPr><w:jc w:val=""" + $jcVal + """/>" + $indXml + "<w:spacing w:before=""" + $spaceBefore + """ w:after=""" + $spaceAfter + """ w:line=""276"" w:lineRule=""auto""/><w:rPr><w:rFonts w:ascii=""TH Sarabun PSK"" w:hAnsi=""TH Sarabun PSK"" w:cs=""TH Sarabun PSK""/><w:sz w:val=""" + $szVal + """/><w:szCs w:val=""" + $szVal + """/>" + $bXml + "</w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=""TH Sarabun PSK"" w:hAnsi=""TH Sarabun PSK"" w:cs=""TH Sarabun PSK""/><w:sz w:val=""" + $szVal + """/><w:szCs w:val=""" + $szVal + """/>" + $bXml + "</w:rPr><w:t xml:space=""preserve"">" + $escaped + "</w:t></w:r></w:p>"
    return $pXml
}

function New-TableXml([System.Collections.Generic.List[string]]$tableLines) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append("<w:tbl><w:tblPr><w:tblW w:w=""5000"" w:type=""pct""/><w:jc w:val=""center""/><w:tblBorders><w:top w:val=""single"" w:sz=""4"" w:space=""0"" w:color=""auto""/><w:left w:val=""single"" w:sz=""4"" w:space=""0"" w:color=""auto""/><w:bottom w:val=""single"" w:sz=""4"" w:space=""0"" w:color=""auto""/><w:right w:val=""single"" w:sz=""4"" w:space=""0"" w:color=""auto""/><w:insideH w:val=""single"" w:sz=""4"" w:space=""0"" w:color=""auto""/><w:insideV w:val=""single"" w:sz=""4"" w:space=""0"" w:color=""auto""/></w:tblBorders></w:tblPr>")

    $isFirst = $true
    foreach ($row in $tableLines) {
        $trimmedRow = $row.Trim()
        if ($trimmedRow.StartsWith("+--") -or $trimmedRow.StartsWith("+-")) { continue }
        if (-not ($trimmedRow.StartsWith("|") -and $trimmedRow.EndsWith("|"))) { continue }
        
        $rawCells = $trimmedRow.Substring(1, $trimmedRow.Length - 2).Split("|")
        [void]$sb.Append("<w:tr>")
        foreach ($c in $rawCells) {
            $cellText = Escape-XmlText ($c.Trim())
            $bTag = if ($isFirst) { "<w:b/><w:bCs/>" } else { "" }
            $bgTag = if ($isFirst) { "<w:shd w:val=""clear"" w:color=""auto"" w:fill=""F2F2F2""/>" } else { "" }
            $align = if ($isFirst -or $cellText -match "^[0-9\.\%\,\-\:\s]+$") { "center" } else { "left" }
            [void]$sb.Append("<w:tc><w:tcPr>" + $bgTag + "<w:vAlign w:val=""center""/><w:tcMar><w:top w:w=""120"" w:type=""dxa""/><w:bottom w:w=""120"" w:type=""dxa""/><w:left w:w=""150"" w:type=""dxa""/><w:right w:w=""150"" w:type=""dxa""/></w:tcMar></w:tcPr><w:p><w:pPr><w:jc w:val=""" + $align + """/><w:spacing w:before=""40"" w:after=""40""/><w:rPr><w:rFonts w:ascii=""TH Sarabun PSK"" w:hAnsi=""TH Sarabun PSK"" w:cs=""TH Sarabun PSK""/><w:sz w:val=""26""/><w:szCs w:val=""26""/>" + $bTag + "</w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii=""TH Sarabun PSK"" w:hAnsi=""TH Sarabun PSK"" w:cs=""TH Sarabun PSK""/><w:sz w:val=""26""/><w:szCs w:val=""26""/>" + $bTag + "</w:rPr><w:t xml:space=""preserve"">" + $cellText + "</w:t></w:r></w:p></w:tc>")
        }
        [void]$sb.Append("</w:tr>")
        $isFirst = $false
    }
    [void]$sb.Append("</w:tbl>")
    return $sb.ToString()
}

function Build-DocxFile([string]$outDocxPath, [string]$bodyContentXml) {
    if (Test-Path $outDocxPath) { Remove-Item $outDocxPath -Force }
    Copy-Item $template.FullName $outDocxPath

    $zip = [System.IO.Compression.ZipFile]::Open($outDocxPath, [System.IO.Compression.ZipArchiveMode]::Update)
    $entry = $zip.GetEntry("word/document.xml")
    if ($entry) { $entry.Delete() }

    $newEntry = $zip.CreateEntry("word/document.xml")
    $stream = $newEntry.Open()
    $writer = New-Object System.IO.StreamWriter($stream, [System.Text.Encoding]::UTF8)

    $fullXml = "<?xml version=""1.0"" encoding=""UTF-8"" standalone=""yes""?><w:document xmlns:w=""http://schemas.openxmlformats.org/wordprocessingml/2006/main""><w:body>" + $bodyContentXml + "<w:sectPr><w:pgSz w:w=""11906"" w:h=""16838""/><w:pgMar w:top=""2160"" w:right=""1440"" w:bottom=""1440"" w:left=""2160"" w:header=""720"" w:footer=""720""/></w:sectPr></w:body></w:document>"

    $writer.Write($fullXml)
    $writer.Flush()
    $writer.Close()
    $stream.Close()
    $zip.Dispose()
    Write-Output ("Saved: " + $outDocxPath + " (Size: " + (Get-Item $outDocxPath).Length + " bytes)")
}

# ----------------- PARSE AND GENERATE CHAPTERS -----------------

function Process-TextToXml([string]$txtPath) {
    $lines = [System.IO.File]::ReadAllLines($txtPath, [System.Text.Encoding]::UTF8)
    $sb = New-Object System.Text.StringBuilder
    $tableBuffer = New-Object System.Collections.Generic.List[string]
    $inTable = $false

    foreach ($line in $lines) {
        $trimmed = $line.Trim()

        # Check Table boundaries
        if ($trimmed.StartsWith("+--") -or $trimmed.StartsWith("+-")) {
            if (-not $inTable) {
                $inTable = $true
                $tableBuffer.Clear()
            }
            continue
        }

        if ($inTable) {
            if ($trimmed.StartsWith("|") -and $trimmed.EndsWith("|")) {
                $tableBuffer.Add($trimmed)
                continue
            } else {
                # End of table
                $inTable = $false
                if ($tableBuffer.Count -gt 0) {
                    [void]$sb.AppendLine((New-TableXml $tableBuffer))
                    $tableBuffer.Clear()
                }
            }
        }

        if ($trimmed.Length -eq 0) {
            continue
        }

        # Check Chapter header
        if ($trimmed -match "^บทที่\s+\d+") {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "center" -bold $true -sizePt 18 -spaceBefore 240 -spaceAfter 120))
            continue
        }
        if ($trimmed -in @("บทนำ", "เอกสารและโครงงานที่เกี่ยวข้อง", "วิธีการดำเนินงาน", "ผลการจัดทำโครงงาน", "สรุปผล อภิปรายผล และข้อเสนอแนะ", "เอกสารอ้างอิง")) {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "center" -bold $true -sizePt 18 -spaceBefore 0 -spaceAfter 240))
            continue
        }

        # Check Main Headings
        if ($trimmed -in @("ที่มาและความสำคัญ", "วัตถุประสงค์", "ขอบเขตการศึกษา", "ประโยชน์ที่คาดว่าจะได้รับ", "นิยามศัพท์เฉพาะ", "วัตถุประสงค์ของโครงงาน", "สรุปผลการดำเนินงาน", "อภิปรายผล", "ข้อเสนอแนะ")) {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "left" -bold $true -sizePt 16 -spaceBefore 200 -spaceAfter 100))
            continue
        }

        if ($trimmed -match "^ขั้นตอนที่\s+\d+") {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "left" -bold $true -sizePt 16 -spaceBefore 200 -spaceAfter 100))
            continue
        }

        if ($trimmed -match "^\d+\.\s+[^\d]") {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "both" -bold $false -sizePt 16 -firstLineIndentDxa 0 -leftIndentDxa 720 -spaceBefore 60 -spaceAfter 60))
            continue
        }

        if ($trimmed -match "^(ตารางที่|ภาพที่)\s+\d+") {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "left" -bold $true -sizePt 16 -spaceBefore 180 -spaceAfter 100))
            continue
        }

        # Sub items (e.g. 1.1, 1.2, ข้อที่ 1, หรือย่อหน้าทั่วไป)
        if ($trimmed -match "^(\d+\.\d+|ข้อที่\s+\d+)") {
            [void]$sb.AppendLine((New-PXml -text $trimmed -align "both" -bold $false -sizePt 16 -firstLineIndentDxa 0 -leftIndentDxa 720 -spaceBefore 40 -spaceAfter 40))
            continue
        }

        # Standard indented paragraph
        [void]$sb.AppendLine((New-PXml -text $trimmed -align "both" -bold $false -sizePt 16 -firstLineIndentDxa 720 -spaceBefore 60 -spaceAfter 100))
    }

    if ($inTable -and $tableBuffer.Count -gt 0) {
        [void]$sb.AppendLine((New-TableXml $tableBuffer))
        $tableBuffer.Clear()
    }

    return $sb.ToString()
}

$chapters = @("บทที่ 1", "บทที่ 2", "บทที่ 3", "บทที่ 4", "บทที่ 5", "เอกสารอ้างอิง")

foreach ($ch in $chapters) {
    $txtFile = Join-Path $baseDir ($ch + ".txt")
    if (Test-Path $txtFile) {
        $xmlContent = Process-TextToXml -txtPath $txtFile
        
        # Save in 'ไฟล์โครงงาน'
        $docxTarget1 = Join-Path $targetFolder ($ch + ".docx")
        Build-DocxFile -outDocxPath $docxTarget1 -bodyContentXml $xmlContent

        # Also save in root directory
        $docxTarget2 = Join-Path $baseDir ($ch + ".docx")
        Build-DocxFile -outDocxPath $docxTarget2 -bodyContentXml $xmlContent
    }
}

# Also generate a merged complete docx: 'บทที่ 1-5 รวมเล่ม.docx'
$mergedSb = New-Object System.Text.StringBuilder
foreach ($ch in @("บทที่ 1", "บทที่ 2", "บทที่ 3", "บทที่ 4", "บทที่ 5", "เอกสารอ้างอิง")) {
    $txtFile = Join-Path $baseDir ($ch + ".txt")
    if (Test-Path $txtFile) {
        [void]$mergedSb.AppendLine((Process-TextToXml -txtPath $txtFile))
        [void]$mergedSb.AppendLine("<w:p><w:r><w:br w:type=""page""/></w:r></w:p>")
    }
}
$mergedTarget1 = Join-Path $targetFolder "บทที่ 1-5 รวมเล่ม.docx"
$mergedTarget2 = Join-Path $baseDir "บทที่ 1-5 รวมเล่ม.docx"
Build-DocxFile -outDocxPath $mergedTarget1 -bodyContentXml $mergedSb.ToString()
Build-DocxFile -outDocxPath $mergedTarget2 -bodyContentXml $mergedSb.ToString()

Write-Output "ALL CHAPTERS AND MERGED FILE GENERATED SUCCESSFULLY!"
