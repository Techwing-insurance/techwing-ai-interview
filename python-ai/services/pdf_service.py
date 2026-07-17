"""
PDF text extraction service using PyPDF2.
"""
import io
import httpx

def extract_text_from_pdf_url(pdf_url: str) -> str:
    """Download PDF from URL and extract text."""
    try:
        import PyPDF2
        response = httpx.get(pdf_url, timeout=30)
        response.raise_for_status()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(response.content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return f"Error extracting PDF: {e}"

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        import PyPDF2
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return f"Error extracting PDF: {e}"
