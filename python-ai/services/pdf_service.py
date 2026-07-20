"""
PDF text extraction service using pdfminer.six.
"""
import io
import httpx
import fitz  # PyMuPDF

def extract_text_from_pdf_url(pdf_url: str) -> str:
    """Download PDF from URL and extract text using PyMuPDF."""
    try:
        response = httpx.get(pdf_url, timeout=30)
        response.raise_for_status()
        
        doc = fitz.open(stream=response.content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        doc.close()
        
        return text.strip()
    except Exception as e:
        return f"Error extracting PDF: {e}"

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        doc.close()
        return text.strip()
    except Exception as e:
        return f"Error extracting PDF: {e}"
