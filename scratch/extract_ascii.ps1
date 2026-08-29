Add-Type -AssemblyName System.IO.Compression.FileSystem

$currentDir = (Get-Location).Path
$subFolder = Get-ChildItem -Directory | Where-Object { $_.Name -match "ไฟล์" }
if ($subFolder) {
    $folder = $subFolder.FullName
} else {
    $folder = Join-Path $currentDir "files"
}

$scratch = Join-Path $currentDir "scratch"

Get-ChildItem -Path $folder -Filter *.docx | Where-Object { -not $_.Name.StartsWith("~") } | ForEach-Object {
    $docxPath = $_.FullName
    $zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
    $entry = $zip.GetEntry("word/document.xml")
    if ($entry) {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $zip.Dispose()

        $xml = [xml]$xmlContent
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
        $pNodes = $xml.SelectNodes("//w:p", $ns)
        $lines = @()
        foreach ($p in $pNodes) {
            $tNodes = $p.SelectNodes(".//w:t", $ns)
            $txt = ""
            foreach ($t in $tNodes) {
                $txt += $t.InnerText
            }
            if ($txt.Trim().Length -gt 0) {
                $lines += $txt
            }
        }
        $outPath = Join-Path $scratch ($_.BaseName + ".txt")
        [System.IO.File]::WriteAllLines($outPath, $lines, [System.Text.Encoding]::UTF8)
        Write-Output ("Saved: " + $outPath + " (" + $lines.Count + " lines)")
    }
}
