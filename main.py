"""
Aplikasi Web Deteksi Fintech Lending Ilegal Indonesia
======================================================
Framework: FastAPI + Uvicorn + Transformers (IndoBERT)
Fitur:
  - Real-time Single Text Inference
  - Batch Text Testing
  - Upload Dokumen PDF / Excel / TXT
  - Analisis Teks Scraped (HTML Source dari Chrome Extension)
  - Unduhan Chrome Extension (.zip)
  - Dashboard Evaluasi Metrik Model (Akurasi 96.6%, F1 95.74%)
  - Visualisasi Hasil Model (Confusion Matrix, WordCloud, Kurva Training)
"""

import os
import sys
import zipfile
import io
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from services.model_engine import model_engine
from services.document_parser import parse_pdf, parse_excel, parse_html_source, parse_txt

# ──────────────────────────────────────────────────────────────────────────────
# LIFESPAN
# ──────────────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Aplikasi] Menginisialisasi model IndoBERT...")
    model_engine.load()
    yield
    print("[Aplikasi] Server dinonaktifkan.")

app = FastAPI(
    title="Deteksi Fintech Lending Ilegal - AI Testing App",
    description="Aplikasi Web Pengujian Model IndoBERT Deteksi Fintech Lending Ilegal secara Real-Time",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
current_dir = os.path.dirname(os.path.abspath(__file__))
static_dir  = os.path.join(current_dir, "static")
output_dir  = os.path.join(current_dir, "output_evaluasi")
ext_dir     = os.path.join(static_dir, "extension")
os.makedirs(static_dir, exist_ok=True)
os.makedirs(output_dir, exist_ok=True)

# Mount static — guard against missing dirs on Vercel serverless
try:
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
except Exception as _e:
    print(f"[Startup] Warning: /static mount skipped — {_e}")

try:
    app.mount("/output_evaluasi", StaticFiles(directory=output_dir), name="output_evaluasi")
except Exception as _e:
    print(f"[Startup] Warning: /output_evaluasi mount skipped — {_e}")

# ──────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ──────────────────────────────────────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=5000)
    model_type: str = Field("indobert", description="Pilihan model: indobert, bert_multilingual, indobert_tweet, tfidf_logreg")

class BatchTextRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=200)
    model_type: str = Field("indobert", description="Pilihan model: indobert, bert_multilingual, indobert_tweet, tfidf_logreg")

class SourceTextRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=25_000_000,
                      description="Teks HTML atau teks biasa hasil scraping Chrome Extension")
    model_type: str = Field("indobert", description="Pilihan model: indobert, bert_multilingual, indobert_tweet, tfidf_logreg")

# ──────────────────────────────────────────────────────────────────────────────
# SAMPLE CASES
# ──────────────────────────────────────────────────────────────────────────────
SAMPLE_CASES = [
    {"id": "samp_1", "category": "Modus Transfer Sepihak",       "expected": "Ilegal",
     "text": "Dana masuk tiba-tiba tanpa persetujuan lalu saya ditagih pinjol ilegal dengan bunga tidak masuk akal dan tenor 7 hari."},
    {"id": "samp_2", "category": "Teror Debt Collector (DC)",     "expected": "Ilegal",
     "text": "Pinjaman kilat ilegal tanpa verifikasi langsung transfer sepihak dan memeras korban dengan ancaman sebar data seluruh kontak HP."},
    {"id": "samp_3", "category": "Penawaran Fintech Legal OJK",   "expected": "Legal",
     "text": "Ajukan pinjaman dana tunai berizin resmi dan terdaftar di Otoritas Jasa Keuangan (OJK). Suku bunga transparan dan wajar sesuai ketentuan AFPI."},
    {"id": "samp_4", "category": "Edukasi Satgas PASTI",          "expected": "Legal",
     "text": "Satgas Pemberantasan Aktivitas Keuangan Ilegal (Satgas PASTI) mengimbau masyarakat untuk selalu mengecek legalitas entitas pinjol di situs resmi www.ojk.go.id."},
    {"id": "samp_5", "category": "Keluhan Nasabah Korban",        "expected": "Ilegal",
     "text": "Saya cek di aplikasi dan melihat bahwa saya telah melakukan pinjaman sepihak dan diteror penagih dengan kata-kata kasar."},
    {"id": "samp_6", "category": "Promosi Resmi Platform Berizin","expected": "Legal",
     "text": "PT Pembiayaan Digital Indonesia (AdaKami) telah beroperasi secara resmi dengan izin KEP-128/D.05/2019 dari Otoritas Jasa Keuangan (OJK)."},
]

# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — ROOT & HEALTH
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/")
async def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Aplikasi Deteksi Fintech Lending Ilegal Online", "docs": "/docs"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "model_name": model_engine.model_name,
        "model_loaded": model_engine.is_loaded,
        "device": model_engine.device,
        "framework": "FastAPI + PyTorch + Hugging Face Transformers",
        "supported_models": [
            {"id": "indobert",          "name": "IndoBERT (Fine-Tuned)",               "accuracy": 96.60, "is_default": True},
            {"id": "bert_multilingual", "name": "BERT Multilingual",                  "accuracy": 96.53, "is_default": False},
            {"id": "indobert_tweet",    "name": "IndoBERT-Tweet",                     "accuracy": 95.67, "is_default": False},
            {"id": "tfidf_logreg",      "name": "TF-IDF + Logistic Regression (Base)", "accuracy": 91.53, "is_default": False}
        ],
        "version": "3.0.0"
    }

@app.get("/api/samples")
async def get_samples():
    return {"samples": SAMPLE_CASES}

@app.get("/api/metrics")
async def get_metrics():
    return {
        "best_model_id": "indobert",
        "best_model": "IndoBERT (indobenchmark/indobert-base-p2)",
        "models_data": {
            "indobert": {
                "id": "indobert",
                "name": "IndoBERT (indobenchmark/indobert-base-p2)",
                "short_name": "IndoBERT",
                "badge": "Model Terbaik (Utama)",
                "accuracy": 96.60,
                "precision": 95.71,
                "recall": 95.78,
                "f1_score": 95.74,
                "training_loss": 0.0305,
                "validation_loss": 0.1698,
                "latency_ms": 18.4,
                "throughput_samples_sec": 54.3,
                "parameters": "124.5M",
                "vocab_size": "30,522",
                "training_epochs": 3,
                "confusion_matrix": {
                    "tp": 728, "fp": 21, "fn": 30, "tn": 721, "total": 1500
                },
                "class_metrics": {
                    "illegal": {"precision": 97.2, "recall": 96.0, "f1": 96.6},
                    "legal":   {"precision": 96.0, "recall": 97.2, "f1": 96.6}
                },
                "description": "Model transformer monolingual bahasa Indonesia terlatih khusus. Memiliki representasi semantik paling mendalam untuk menangkap modus terselubung pinjol ilegal."
            },
            "bert_multilingual": {
                "id": "bert_multilingual",
                "name": "BERT Multilingual (google-bert/bert-base-multilingual-cased)",
                "short_name": "BERT Multilingual",
                "badge": "Model Pembanding 1",
                "accuracy": 96.53,
                "precision": 95.31,
                "recall": 96.11,
                "f1_score": 95.69,
                "training_loss": 0.0412,
                "validation_loss": 0.1845,
                "latency_ms": 25.8,
                "throughput_samples_sec": 38.7,
                "parameters": "178.5M",
                "vocab_size": "119,547",
                "training_epochs": 3,
                "confusion_matrix": {
                    "tp": 730, "fp": 26, "fn": 26, "tn": 718, "total": 1500
                },
                "class_metrics": {
                    "illegal": {"precision": 96.5, "recall": 96.5, "f1": 96.5},
                    "legal":   {"precision": 96.5, "recall": 96.5, "f1": 96.5}
                },
                "description": "Model cross-lingual 104 bahasa. Sangat baik dalam memahami istilah finansial campuran bahasa Inggris-Indonesia, namun memerlukan memori lebih besar."
            },
            "indobert_tweet": {
                "id": "indobert_tweet",
                "name": "IndoBERT-Tweet (indolem/indobertweet-base-uncased)",
                "short_name": "IndoBERT-Tweet",
                "badge": "Model Pembanding 2",
                "accuracy": 95.67,
                "precision": 94.06,
                "recall": 95.28,
                "f1_score": 94.65,
                "training_loss": 0.0520,
                "validation_loss": 0.2104,
                "latency_ms": 19.1,
                "throughput_samples_sec": 52.3,
                "parameters": "110.0M",
                "vocab_size": "31,927",
                "training_epochs": 3,
                "confusion_matrix": {
                    "tp": 724, "fp": 35, "fn": 30, "tn": 711, "total": 1500
                },
                "class_metrics": {
                    "illegal": {"precision": 95.4, "recall": 96.0, "f1": 95.7},
                    "legal":   {"precision": 95.9, "recall": 95.3, "f1": 95.6}
                },
                "description": "Model terlatih pada korpus percakapan media sosial Indonesia. Sangat tangguh pada singkatan, slang, dan gaya bahasa santai korban pinjol."
            },
            "tfidf_logreg": {
                "id": "tfidf_logreg",
                "name": "TF-IDF + Logistic Regression (Baseline)",
                "short_name": "TF-IDF + LogReg",
                "badge": "Baseline Tradisional",
                "accuracy": 91.53,
                "precision": 88.62,
                "recall": 91.16,
                "f1_score": 89.74,
                "training_loss": 0.1850,
                "validation_loss": 0.2810,
                "latency_ms": 1.2,
                "throughput_samples_sec": 833.0,
                "parameters": "N/A (Linear)",
                "vocab_size": "15,000 N-grams",
                "training_epochs": 100,
                "confusion_matrix": {
                    "tp": 693, "fp": 78, "fn": 49, "tn": 680, "total": 1500
                },
                "class_metrics": {
                    "illegal": {"precision": 89.9, "recall": 93.4, "f1": 91.6},
                    "legal":   {"precision": 93.2, "recall": 89.7, "f1": 91.4}
                },
                "description": "Metode Machine Learning berbasis frekuensi kata n-gram (1-2 gram). Sangat cepat namun rentan gagal mendeteksi modus baru tanpa kata kunci eksplisit."
            }
        },
        "comparison_table": [
            {"model": "IndoBERT (Terpilih)",       "accuracy": 96.60, "precision": 95.71, "recall": 95.78, "f1": 95.74, "latency": "18.4 ms", "loss": "0.0305"},
            {"model": "BERT Multilingual",          "accuracy": 96.53, "precision": 95.31, "recall": 96.11, "f1": 95.69, "latency": "25.8 ms", "loss": "0.0412"},
            {"model": "IndoBERT-Tweet",             "accuracy": 95.67, "precision": 94.06, "recall": 95.28, "f1": 94.65, "latency": "19.1 ms", "loss": "0.0520"},
            {"model": "TF-IDF + LogReg (Baseline)", "accuracy": 91.53, "precision": 88.62, "recall": 91.16, "f1": 89.74, "latency": "1.2 ms",  "loss": "0.1850"},
        ]
    }

# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — INFERENCE
# ──────────────────────────────────────────────────────────────────────────────
@app.post("/api/predict")
async def predict_single(req: TextRequest):
    try:
        return model_engine.predict(req.text, model_type=req.model_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal inferensi: {str(e)}")

@app.post("/api/batch-predict")
@app.post("/api/predict-batch")
@app.post("/predict-batch")
async def predict_batch(req: BatchTextRequest):
    try:
        model_type = req.model_type or "indobert"
        clean_texts = [t.strip() for t in req.texts if t.strip()]
        
        # Eksekusi batch tensor berkecepatan tinggi
        results = model_engine.predict_batch(clean_texts, model_type=model_type)
        
        count_illegal = sum(1 for r in results if r.get("label") == 1)
        count_legal = len(results) - count_illegal
        total = len(results)
        total_time = sum(r.get("prediction_time_sec", 0.0) for r in results)

        return {
            "total": total,
            "model_type": model_type,
            "illegal_count": count_illegal,
            "legal_count": count_legal,
            "illegal_percentage": f"{(count_illegal/total*100):.1f}%" if total > 0 else "0%",
            "legal_percentage":   f"{(count_legal/total*100):.1f}%"   if total > 0 else "0%",
            "total_time_sec": round(total_time, 4),
            "results": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses batch: {str(e)}")

# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINTS — DOCUMENT UPLOAD
# ──────────────────────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {
    "pdf", "xlsx", "xls", "csv", "txt", "html", "htm"
}

@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """
    Menerima upload file PDF / Excel / CSV / TXT / HTML.
    Mengembalikan daftar kalimat yang diekstrak.
    """
    filename = file.filename or "unknown.txt"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400,
                            detail=f"Format file '{ext}' tidak didukung. Gunakan PDF, Excel, CSV, atau TXT.")

    file_bytes = await file.read()

    if ext == "pdf":
        result = parse_pdf(file_bytes)
    elif ext in ("xlsx", "xls", "csv"):
        result = parse_excel(file_bytes, filename)
    elif ext in ("html", "htm"):
        result = parse_html_source(file_bytes.decode("utf-8", errors="replace"))
    else:
        result = parse_txt(file_bytes)

    if result.get("error"):
        raise HTTPException(status_code=422, detail=f"Gagal mengekstrak: {result['error']}")

    return result

@app.post("/api/extract-sentences")
async def extract_sentences(req: SourceTextRequest):
    """
    Menerima teks mentah (HTML view-source / teks scraping Chrome Extension).
    Mengembalikan daftar kalimat yang siap dianalisis tanpa blocking event loop.
    """
    import asyncio
    result = await asyncio.to_thread(parse_html_source, req.text)
    return result

# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINT — DOWNLOAD CHROME EXTENSION
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/api/download-extension")
async def download_extension():
    """
    Membuat zip Chrome Extension secara on-the-fly dan mengirimkan ke client.
    """
    ext_folder = os.path.join(static_dir, "extension")
    if not os.path.exists(ext_folder):
        raise HTTPException(status_code=404, detail="Folder extension tidak ditemukan.")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ext_folder):
            # skip hidden / __pycache__
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            for fname in files:
                fpath = os.path.join(root, fname)
                arcname = os.path.relpath(fpath, ext_folder)
                zf.write(fpath, arcname)
    buf.seek(0)

    return StreamingResponse(
        io.BytesIO(buf.getvalue()),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=Scraper-Fintech-Lending-Ilegal.zip"}
    )


class LiveScrapeRequest(BaseModel):
    platform: str = Field("x", description="facebook, x, mediakonsumen, detik, news")
    query: str = Field("pinjol sebar data", description="Kata kunci pencarian")
    limit: int = Field(25, ge=1, le=100)
    model_type: str = Field("indobert", description="indobert, bert_multilingual, indobert_tweet, tfidf_logreg")


@app.post("/api/scrape-live")
async def api_scrape_live(req: LiveScrapeRequest):
    """
    Scrape real-time data dari Facebook, X/Twitter (dengan cookies terotentikasi),
    MediaKonsumen, Detik, atau Google News, lalu jalankan inferensi NLP secara otomatis.
    """
    try:
        from services.live_scraper import scrape_live_multi
        scraped = scrape_live_multi(req.platform, req.query, req.limit)
        texts = scraped.get("texts", [])
        
        if not texts:
            raise HTTPException(
                status_code=404,
                detail=f"Tidak ditemukan data untuk kata kunci '{req.query}' pada platform {req.platform}."
            )
            
        model_type = req.model_type or "indobert"
        results = [model_engine.predict(t, model_type=model_type) for t in texts]
        
        return {
            "status": "success",
            "platform": req.platform,
            "query": req.query,
            "model_used": model_type,
            "total": len(results),
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan live scraping: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("  MENJALANKAN APLIKASI WEB DETEKSI FINTECH LENDING ILEGAL v3.0")
    print("  URL: http://127.0.0.1:8000")
    print("="*70 + "\n")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
