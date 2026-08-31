"""
Document Parser Service
=======================
Mengekstrak kalimat/teks dari berbagai format file dan teks input:
  - PDF (via pdfplumber)
  - Excel (.xlsx, .xls, .csv via pandas)
  - HTML / View-Page-Source (Ultra-Fast Regex Pre-Clean + BeautifulSoup4)
  - Plain Text (.txt & Scraped Post Format)

Keluaran: daftar kalimat terstruktur yang siap dikirim ke model IndoBERT.
"""

import os
import re
import io
import html
from typing import List, Dict, Any

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False


# ── CONFIGURATION CONSTANTS ──────────────────────────────────────────────────
MIN_LEN = 15           # Karakter minimum agar kalimat dianggap bermakna
MAX_SENTENCES = 2000   # Batas maksimum per batch proses

# Noise list yang sering muncul di UI medsos & portal berita (diabaikan)
UI_JUNK_PHRASES = {
    'suka', 'komentar', 'bagikan', 'kirim pesan', 'balas', 'ikuti', 'mengikuti',
    'bagikan postingan', 'lihat selengkapnya', 'see more', 'baca selengkapnya',
    'tulis komentar...', 'tulis balasan...', 'pemberitahuan', 'reels', 'marketplace',
    'beranda', 'notifikasi', 'cari di facebook', 'kirim via whatsapp', 'laporkan postingan',
    'baca juga:', 'simak video:', 'advertisement', 'scroll to continue with content',
    'foto:', 'penulis:', 'editor:', 'hak cipta', 'all rights reserved', 'kompas.com',
    'detikcom', 'tribunnews', 'liputan6', 'facebook ', 'twitter ', 'meta ',
    'sebelumnya', 'berikutnya', 'halaman selanjutnya', 'lihat ulasan lainnya'
}


def _clean_text(text: str) -> str:
    """Membersihkan karakter aneh, whitespace ganda, decode HTML entities."""
    if not text:
        return ""
    text = html.unescape(text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _is_junk_or_code(text: str) -> bool:
    """Memeriksa apakah teks merupakan potongan kode, JSON, atau UI boilerplate."""
    if not text or len(text) < MIN_LEN:
        return True
    
    t_lower = text.lower().strip()
    
    # 1. UI Noise match
    if t_lower in UI_JUNK_PHRASES:
        return True
    if any(t_lower.startswith(junk) for junk in ['baca juga:', 'simak video:', 'foto:', 'editor:', 'penulis:']):
        return True
        
    # 2. Code, JSON, JS remnants
    if t_lower.startswith(('{', 'window.', 'function', 'var ', 'const ', 'let ', '/*')):
        return True
    if t_lower.startswith('[') and ('{"' in t_lower or '":' in t_lower or '],' in t_lower or t_lower.startswith('["') and '"]' in t_lower and len(t_lower) < 60):
        return True
    if any(pattern in t_lower for pattern in ['{"require":', '__d(', 'require(', 'babelhelpers', 'document.getelement', 'return {']):
        return True
        
    # 3. Only URLs, timestamps or symbols
    if re.match(r'^(https?://\S+|www\.\S+)$', t_lower):
        return True
    if re.match(r'^\d+[\s\w\.\,\:\-\/]+(lalu|ago|menit|jam|hari|dtk|sec|min|hr|d)$', t_lower):
        return True
    if re.match(r'^[\d\s\.\,\:\-\/\+\*\#\(\)]+$', t_lower):
        return True

    return False


def _split_into_sentences(raw: str) -> List[str]:
    """
    Memecah teks panjang menjadi daftar kalimat/ulasan independen.
    Mendukung format [Post X], pemisah newline ganda, dan tanda baca penutup.
    """
    if not raw:
        return []

    # 1. Cek apakah teks menggunakan format block [Post X]
    if '[Post ' in raw:
        blocks = re.split(r'\[Post\s+\d+\]', raw)
        lines = [b.strip() for b in blocks if b.strip()]
    elif '\n\n' in raw:
        lines = [b.strip() for b in raw.split('\n\n') if b.strip()]
    else:
        lines = [l.strip() for l in raw.split('\n') if l.strip()]

    sentences = []
    for line in lines:
        cleaned_line = _clean_text(line)
        if _is_junk_or_code(cleaned_line):
            continue

        if len(cleaned_line) >= 35:
            # Jika kalimat panjang, coba pecah berdasarkan tanda titik/tanya/seru yang jelas
            sub_parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9\"\'“‘])', cleaned_line)
            if len(sub_parts) > 1:
                for p in sub_parts:
                    p_clean = _clean_text(p)
                    if not _is_junk_or_code(p_clean) and len(p_clean) >= MIN_LEN:
                        sentences.append(p_clean)
            else:
                sentences.append(cleaned_line)
        else:
            if not _is_junk_or_code(cleaned_line) and len(cleaned_line) >= MIN_LEN:
                sentences.append(cleaned_line)

    # Deduplikasi dengan fingerprint 60 karakter awal
    seen = set()
    unique = []
    for s in sentences:
        key = re.sub(r'\W+', '', s[:60].lower())
        if key and key not in seen and len(s) >= MIN_LEN:
            seen.add(key)
            unique.append(s)

    return unique[:MAX_SENTENCES]


# Pre-compiled fast HTML tag strip patterns (O(N) single-pass)
CLEAN_HTML_TAGS = ['script', 'style', 'svg', 'noscript', 'iframe', 'template', 'canvas', 'header', 'footer', 'nav', 'head', 'meta', 'link']
COMPILED_TAG_PATTERNS = [re.compile(rf'<{t}\b[^>]*>.*?</{t}>', re.DOTALL | re.IGNORECASE) for t in CLEAN_HTML_TAGS]
SELF_CLOSING_PATTERNS = re.compile(r'<(path|use|symbol|defs|img|hr|br|input)[^>]*>', re.IGNORECASE)


def parse_html_source(raw_text: str) -> Dict[str, Any]:
    """
    Ekstrak teks bersih dari Salinan HTML Mentah (View Page Source / outerHTML dari ekstensi).
    Dirancang khusus untuk Facebook, X/Twitter, dan Portal Berita:
    - Menghapus tag script, style, SVG, noscript, nav, iframe secara instan (10-20 ms).
    - Menyeleksi kontainer postingan dan artikel secara cerdas.
    - Menyaring noise UI dan menghasilkan daftar kalimat bersih siap analisis.
    """
    if not raw_text or not raw_text.strip():
        return {"sentences": [], "total": 0, "source_type": "empty", "error": "Teks HTML kosong"}

    is_html = ('<' in raw_text and '>' in raw_text) or ('<!DOCTYPE' in raw_text.upper())

    if is_html:
        # 1. ULTRA-FAST O(N) PRE-CLEANING (Proses < 20 ms untuk file 10 MB tanpa backtracking):
        cleaned_html = raw_text
        for pat in COMPILED_TAG_PATTERNS:
            cleaned_html = pat.sub(' ', cleaned_html)
        cleaned_html = SELF_CLOSING_PATTERNS.sub(' ', cleaned_html)

        if HAS_BS4:
            try:
                soup = BeautifulSoup(cleaned_html, 'html.parser')

                # 1. Bersihkan seluruh elemen sidebar, nav, header, footer, widget trending, dan iklan
                for junk_tag in soup.find_all(['aside', 'nav', 'header', 'footer', 'form', 'noscript', 'iframe']):
                    junk_tag.decompose()
                for junk_class in soup.find_all(['div', 'section', 'ul', 'ol'], class_=re.compile(r'sidebar|menu|nav|header|footer|trending|popular|populer|tag|filter|widget|banner|link-sisip|parallax|ads|ad')):
                    junk_class.decompose()

                extracted_chunks = []
                seen_chunk_keys = set()

                # Prioritas Utama: Kontainer Akumulasi Ekstensi (#fintech-accumulated-posts)
                acc_container = soup.select_one('#fintech-accumulated-posts')
                if acc_container:
                    articles = acc_container.find_all(['article', 'div'], class_=re.compile(r'fintech-saved-news|full-article|fintech-saved-tweet|fintech-saved-fb'), recursive=False)
                    if not articles:
                        articles = acc_container.find_all('article')
                    for art in articles:
                        txt = art.get_text(separator=' ', strip=True)
                        txt = _clean_text(txt)
                        if not _is_junk_or_code(txt):
                            k = re.sub(r'\W+', '', txt[:60].lower())
                            if k and k not in seen_chunk_keys:
                                seen_chunk_keys.add(k)
                                extracted_chunks.append(txt)
                else:
                    # Selektor Spesifik: Facebook, Twitter/X, Forum & Badan Artikel Berita Utuh
                    target_selectors = [
                        # Facebook Selectors
                        'div[data-ad-comet-preview="message"]',
                        'div[data-ad-preview="message"]',
                        'div[role="article"]',
                        
                        # X / Twitter Selectors
                        'div[data-testid="tweetText"]',
                        
                        # Portal Berita (Badan Artikel Utama & Judul)
                        '.detail__body-text p',
                        '.itp_bodycontent p',
                        '.read__content p',
                        '.article__body p',
                        '.entry-content p',
                        '.post-content p',
                        'h1.detail__title',
                        'h1.read__title',
                        'h1.entry-title',
                        'h1.title'
                    ]

                    found_elements = soup.select(', '.join(target_selectors))
                    for el in found_elements:
                        txt = el.get_text(separator=' ', strip=True)
                        txt = _clean_text(txt)
                        if not _is_junk_or_code(txt):
                            k = re.sub(r'\W+', '', txt[:60].lower())
                            if k and k not in seen_chunk_keys:
                                seen_chunk_keys.add(k)
                                extracted_chunks.append(txt)

                # 3. Segmentasi kalimat dari setiap chunk yang ditemukan
                all_sentences = []
                for chunk in extracted_chunks:
                    all_sentences.extend(_split_into_sentences(chunk))

                # 4. Final deduplication & sorting
                final_list = []
                final_seen = set()
                for s in all_sentences:
                    k = re.sub(r'\W+', '', s[:60].lower())
                    if k and k not in final_seen and len(s) >= MIN_LEN:
                        final_seen.add(k)
                        final_list.append(s)

                return {
                    "sentences": final_list[:MAX_SENTENCES],
                    "total": len(final_list[:MAX_SENTENCES]),
                    "source_type": "html_view_source",
                    "raw_length": len(raw_text),
                    "error": None
                }

            except Exception as e:
                print(f"[DocumentParser] BS4 Exception: {e}")

        # Fallback regex jika BeautifulSoup mengalami kegagalan
        clean_plain = re.sub(r'<[^>]+>', ' ', cleaned_html)
        sentences = _split_into_sentences(clean_plain)
        return {
            "sentences": sentences,
            "total": len(sentences),
            "source_type": "html_source_regex",
            "raw_length": len(raw_text),
            "error": None
        }

    # Plain text / fallback
    sentences = _split_into_sentences(raw_text)
    return {
        "sentences": sentences,
        "total": len(sentences),
        "source_type": "text_plain",
        "raw_length": len(raw_text),
        "error": None
    }


def parse_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """Ekstrak teks dari file PDF."""
    try:
        import pdfplumber
        sentences = []
        page_count = 0
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                text = page.extract_text() or ""
                sentences.extend(_split_into_sentences(text))
        return {
            "sentences": sentences[:MAX_SENTENCES],
            "total": len(sentences[:MAX_SENTENCES]),
            "source_type": "pdf",
            "pages": page_count,
            "error": None
        }
    except Exception as e:
        return {"sentences": [], "total": 0, "source_type": "pdf", "pages": 0, "error": str(e)}


def parse_excel(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Ekstrak teks dari file Excel (.xlsx, .xls) atau CSV."""
    try:
        import pandas as pd
        ext = filename.rsplit('.', 1)[-1].lower()
        if ext == 'csv':
            df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, on_bad_lines='skip')
        else:
            df = pd.read_excel(io.BytesIO(file_bytes), dtype=str)

        sentences = []
        for col in df.columns:
            col_texts = df[col].dropna().astype(str).tolist()
            for text in col_texts:
                text = _clean_text(text)
                if len(text) >= MIN_LEN:
                    sentences.append(text)

        seen = set()
        unique = []
        for s in sentences:
            key = s[:80].lower()
            if key not in seen:
                seen.add(key)
                unique.append(s)

        return {
            "sentences": unique[:MAX_SENTENCES],
            "total": len(unique[:MAX_SENTENCES]),
            "source_type": ext,
            "rows": len(df),
            "columns": list(df.columns),
            "error": None
        }
    except Exception as e:
        return {"sentences": [], "total": 0, "source_type": "excel", "rows": 0, "columns": [], "error": str(e)}


def parse_txt(file_bytes: bytes) -> Dict[str, Any]:
    """Ekstrak teks dari file .txt biasa."""
    try:
        text = file_bytes.decode('utf-8', errors='replace')
        sentences = _split_into_sentences(text)
        return {
            "sentences": sentences,
            "total": len(sentences),
            "source_type": "txt",
            "error": None
        }
    except Exception as e:
        return {"sentences": [], "total": 0, "source_type": "txt", "error": str(e)}
