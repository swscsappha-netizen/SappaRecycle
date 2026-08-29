import os
import zipfile
import xml.etree.ElementTree as ET

def extract_docx(docx_path, out_txt_path):
    if not os.path.exists(docx_path):
        print(f"Not found: {docx_path}")
        return
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read("word/document.xml")
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
            texts = [node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
            if texts:
                paragraphs.append("".join(texts))
        
        with open(out_txt_path, "w", encoding="utf-8") as f:
            f.write("\n".join(paragraphs))
        print(f"Extracted {docx_path} -> {out_txt_path} ({len(paragraphs)} paragraphs)")

folder = r"d:\โครงงานวิศวะ\ไฟล์โครงงาน"
scratch = r"d:\โครงงานวิศวะ\scratch"
os.makedirs(scratch, exist_ok=True)

for name in os.listdir(folder):
    if name.endswith(".docx") and not name.startswith("~"):
        docx_file = os.path.join(folder, name)
        out_file = os.path.join(scratch, os.path.splitext(name)[0] + ".txt")
        extract_docx(docx_file, out_file)
