
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $template = "d:\\โครงงานวิศวะ\\ต้วอย่าง\\ตัวอย่างรุ่นพี่.docx"
        $target = "d:\\โครงงานวิศวะ\\ไฟล์โครงงาน\\บทที่ 1.docx"
        $xmlSource = "d:\\โครงงานวิศวะ\\scratch\\temp_doc.xml"
        
        if (Test-Path $target) { Remove-Item $target -Force }
        Copy-Item $template $target
        
        $zip = [System.IO.Compression.ZipFile]::Open($target, [System.IO.Compression.ZipArchiveMode]::Update)
        $entry = $zip.GetEntry("word/document.xml")
        if ($entry) { $entry.Delete() }
        
        $newEntry = $zip.CreateEntry("word/document.xml")
        $stream = $newEntry.Open()
        $bytes = [System.IO.File]::ReadAllBytes($xmlSource)
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
        $zip.Dispose()
    