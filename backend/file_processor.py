import io
from PyPDF2 import PdfReader
from docx import Document

def extract_text_from_file(content: bytes, file_extension: str) -> str:
    try:
        if file_extension == 'pdf':
            return extract_from_pdf(content)
        elif file_extension in ['doc', 'docx']:
            return extract_from_docx(content)
        elif file_extension == 'txt':
            return content.decode('utf-8')
        else:
            return "Unsupported file format. Please upload PDF, DOCX, or TXT files."
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def extract_from_pdf(content: bytes) -> str:
    pdf_file = io.BytesIO(content)
    reader = PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def extract_from_docx(content: bytes) -> str:
    doc_file = io.BytesIO(content)
    doc = Document(doc_file)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text