#!/usr/bin/env python3
import fitz
import base64
import json
import sys
import os

def extract_pdf_content(pdf_path):
    """
    Extract text, embedded images, and vector graphics from PDF using PyMuPDF
    Returns: dict with text, images, vector graphics, and metadata
    """
    try:
        doc = fitz.open(pdf_path)
        pages = []
        full_text = ""
        total_images = 0
        total_drawings = 0
        
        for i, page in enumerate(doc, start=1):
            # Extract text
            text = page.get_text("text") or ""
            full_text += f"[Page {i}]\n{text}\n"
            
            # Extract embedded bitmap images
            images = []
            for xref, *_rest in page.get_images(full=True):
                try:
                    info = doc.extract_image(xref)
                    data = info["image"]
                    ext = info.get("ext", "png").lower()
                    
                    # Convert to base64
                    base64_data = base64.b64encode(data).decode('utf-8')
                    
                    # Get image dimensions
                    width = info.get("width", 0)
                    height = info.get("height", 0)
                    
                    images.append({
                        "base64": base64_data,
                        "mime_type": f"image/{ext}",
                        "width": width,
                        "height": height,
                        "size": len(data),
                        "page": i
                    })
                    total_images += 1
                except Exception as e:
                    print(f"Error extracting image on page {i}: {e}", file=sys.stderr)
            
            # Extract vector graphics and drawing objects
            drawings = []
            try:
                # Look for text that might indicate figures
                has_figure_text = ("figure" in text.lower() or "fig." in text.lower() or 
                                 "chart" in text.lower() or "graph" in text.lower() or
                                 "diagram" in text.lower())
                
                if has_figure_text:
                    # Try to render page as image to capture vector graphics
                    try:
                        # Render page at 150 DPI
                        mat = fitz.Matrix(150/72, 150/72)  # 150 DPI scaling
                        pix = page.get_pixmap(matrix=mat)
                        img_data = pix.tobytes("png")
                        
                        # Only include if page has substantial visual content
                        if len(img_data) > 15000:  # More than 15KB suggests visual content
                            base64_page = base64.b64encode(img_data).decode('utf-8')
                            drawings.append({
                                "type": "page_render",
                                "page": i,
                                "base64": base64_page,
                                "mime_type": "image/png",
                                "width": pix.width,
                                "height": pix.height,
                                "size": len(img_data),
                                "note": "Full page render (contains figures/diagrams)"
                            })
                            total_drawings += 1
                    except Exception as e:
                        print(f"Error rendering page {i}: {e}", file=sys.stderr)
                        
            except Exception as e:
                print(f"Error extracting drawings on page {i}: {e}", file=sys.stderr)
            
            pages.append({
                "page": i,
                "text": text,
                "images": images,
                "drawings": drawings
            })
        
        doc.close()
        
        return {
            "success": True,
            "total_pages": len(pages),
            "total_images": total_images,
            "total_drawings": total_drawings,
            "full_text": full_text,
            "pages": pages
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "total_pages": 0,
            "total_images": 0,
            "total_drawings": 0
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 pdf_processor_enhanced.py <pdf_file>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File {pdf_path} not found", file=sys.stderr)
        sys.exit(1)
    
    result = extract_pdf_content(pdf_path)
    print(json.dumps(result, ensure_ascii=False))