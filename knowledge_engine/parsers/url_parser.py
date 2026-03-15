"""URL content parser using trafilatura and BeautifulSoup."""
from parsers.base import BaseParser
from urllib.parse import urljoin, urlparse

class URLParser:
    """Parser for web URLs using trafilatura and bs4 for deep link extraction."""
    
    SUPPORTED_FILE_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.csv', '.txt'}

    def parse(self, url: str) -> dict:
        """
        Parses a URL, returning extracting text and any discovered document links.
        Returns:
            dict: {
                "text": str,
                "file_links": list[str]
            }
        """
        import trafilatura
        from bs4 import BeautifulSoup
        import requests

        # We'll prioritize requests for http, and urllib for file
        downloaded = None
        if url.startswith("file://"):
            try:
                import urllib.request
                with urllib.request.urlopen(url) as response:
                    downloaded = response.read().decode('utf-8')
            except Exception:
                pass
        else:
            try:
                downloaded = trafilatura.fetch_url(url)
            except Exception:
                pass
                
            if not downloaded:
                import requests
                headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
                try:
                    r = requests.get(url, headers=headers, timeout=10)
                    downloaded = r.text
                except Exception:
                    pass

        file_links = []
        text = ""

        if downloaded:
            extracted = trafilatura.extract(downloaded, include_comments=False, include_tables=True)
            if extracted:
                text = extracted

            # Deep Scraper: Extract file links
            try:
                soup = BeautifulSoup(downloaded, 'html.parser')
                for a_tag in soup.find_all('a', href=True):
                    href = a_tag['href']
                    
                    # Check if it ends with a supported extension
                    parsed_href = urlparse(href)
                    path = parsed_href.path.lower()
                    
                    if any(path.endswith(ext) for ext in self.SUPPORTED_FILE_EXTENSIONS):
                        # Resolve relative URLs
                        full_url = urljoin(url, href)
                        if full_url not in file_links:
                            file_links.append(full_url)
            except Exception as e:
                # Don't fail the whole parsing if BS4 fails
                pass

        if not text and not file_links:
            raise ValueError(f"Could not extract any content or files from URL: {url}")

        return {
            "text": text,
            "file_links": file_links
        }
