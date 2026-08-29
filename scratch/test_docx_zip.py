import os
import zipfile
import shutil

template_docx = r"d:\โครงงานวิศวะ\ไฟล์โครงงาน\บทที่ 1-5.docx"
print("Exists:", os.path.exists(template_docx))

with zipfile.ZipFile(template_docx, 'r') as z:
    for name in z.namelist():
        print(name)
