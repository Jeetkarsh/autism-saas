import pytest
import os
from parsers.docx_parser import DocxParser
from parsers.xlsx_parser import XlsxParser

def test_docx_parser():
    parser = DocxParser()
    assert ".docx" in parser.supported_extensions()
    
    test_file = os.path.join(os.path.dirname(__file__), "test_doc.docx")
    with open(test_file, "rb") as f:
        content = f.read()
        
    text = parser.parse(content, "test_doc.docx")
    assert "Test Document Header" in text
    assert "This is a test paragraph." in text

def test_xlsx_parser():
    parser = XlsxParser()
    assert ".xlsx" in parser.supported_extensions()
    
    test_file = os.path.join(os.path.dirname(__file__), "test_data.xlsx")
    with open(test_file, "rb") as f:
        content = f.read()
        
    text = parser.parse(content, "test_data.xlsx")
    assert "Sheet: Data" in text
    assert "Name: Alice | Age: 30" in text
    assert "Name: Bob | Age: 25" in text
