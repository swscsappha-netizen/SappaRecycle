$html = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Angsana New', sans-serif; font-size: 16pt; line-height: 1.15; }
    h1 { font-size: 18pt; text-align: center; font-weight: bold; margin-bottom: 5px; }
    h2 { font-size: 16pt; text-align: center; font-weight: bold; margin-top: 0; margin-bottom: 20px; }
    h3 { font-size: 16pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; }
    p { margin-top: 0; margin-bottom: 6px; text-indent: 1.25cm; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 14pt; }
    th, td { border: 1px solid black; padding: 5px; text-align: center; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .text-left { text-align: left; }
</style>
</head>
<body>
<h1>บทที่ 1</h1>
<h2>บทนำ</h2>
<h3>ที่มาและความสำคัญ</h3>
<p>ทดสอบการแปลงไฟล์จาก HTML เป็น DOCX ผ่าน Word COM</p>
</body>
</html>
"@

$htmlPath = Join-Path (Get-Location).Path "scratch\test.html"
$docxPath = Join-Path (Get-Location).Path "scratch\test.docx"

[System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.Encoding]::UTF8)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($htmlPath)
$doc.SaveAs2($docxPath, 16) # 16 = wdFormatXMLDocument (.docx)
$doc.Close()
$word.Quit()

Write-Output ("Saved: " + $docxPath + " Size: " + (Get-Item $docxPath).Length)
