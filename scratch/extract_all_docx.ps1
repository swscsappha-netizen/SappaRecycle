[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null

$outDir = Join-Path (Get-Location).Path "scratch"

Get-ChildItem -Recurse -Filter "*.docx" | Where-Object { -not $_.Name.StartsWith("~") } | ForEach-Object {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($_.FullName)
    $entry = $zip.GetEntry("word/document.xml")
    if ($entry) {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $zip.Dispose()

        $xml = [xml]$xmlContent
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
        $pNodes = $xml.SelectNodes("//w:p", $ns)
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($p in $pNodes) {
            $tNodes = $p.SelectNodes(".//w:t", $ns)
            $sb = New-Object System.Text.StringBuilder
            foreach ($t in $tNodes) {
                [void]$sb.Append($t.InnerText)
            }
            $str = $sb.ToString()
            if ($str.Trim().Length -gt 0) {
                $lines.Add($str)
            }
        }
        $safeName = $_.Directory.Name + "_" + $_.Name + ".txt"
        $outFile = Join-Path $outDir $safeName
        [System.IO.File]::WriteAllLines($outFile, $lines, [System.Text.Encoding]::UTF8)
        Write-Output ("SUCCESS: " + $safeName + " lines=" + $lines.Count)
    }
}
