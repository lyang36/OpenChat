
#!/usr/bin/env python3
import fitz
import base64
import json
import sys
import os

def extract_pdf_content(pdf_path):
    """
    Extract both text and embedded images from PDF using PyMuPDF
    Returns: dict with text, images, and metadata
    """
    try:
        doc = fitz.open(pdf_path)
        pages = []
        full_text = ""
        
        for i, page in enumerate(doc, start=1):
            # Extract text
            text = page.get_text("text") or ""
            full_text += f"[Page {i}]\n{text}\n"
            
            # Extract images
            images = []
            for xref, *_rest in page.get_images(full=True):
                try:
                    info = doc.extract_image(xref)
                    data = info["image"]
                    ext = info.get("ext", "png").lower()
                    mime = "image/jpeg" if ext in ("jpg", "jpeg", "jpe") else f"image/{ext}"
                    b64 = base64.b64encode(data).decode("ascii")
                    
                    images.append({
                        "page": i,
                        "mime_type": mime,
                        "base64": b64,
                        "width": info.get("width"),
                        "height": info.get("height"),
                        "size": len(data)
                    })
                except Exception as img_error:
                    print(f"Error extracting image from page {i}: {img_error}", file=sys.stderr)
            
            pages.append({
                "page": i,
                "text": text,
                "images": images
            })
        
        doc.close()
        
        return {
            "success": True,
            "total_pages": len(pages),
            "full_text": full_text.strip(),
            "pages": pages,
            "total_images": sum(len(page["images"]) for page in pages)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: python pdf_processor.py <pdf_file>"}))
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    if not os.path.exists(pdf_file):
        print(json.dumps({"success": False, "error": f"File not found: {pdf_file}"}))
        sys.exit(1)
    
    result = extract_pdf_content(pdf_file)
    print(json.dumps(result, ensure_ascii=False))
