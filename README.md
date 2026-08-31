# 🛡️ Deteksi Otomatis Fintech Lending Ilegal Menggunakan IndoBERT

Sistem cerdas berbasis Natural Language Processing (NLP) untuk klasifikasi dan deteksi otomatis konten pinjaman online ilegal pada media sosial (Twitter/X, Facebook) dan portal berita di Indonesia.

---

### 🔬 Model & Metrik Evaluasi
* **Model Utama**: IndoBERT (`indobenchmark/indobert-base-p2`) Fine-Tuned
* **Akurasi**: 96.60%
* **F1-Score**: 95.74%
* **Hugging Face Model**: [`muzakir17/indobert-fintech-lending-ilegal`](https://huggingface.co/muzakir17/indobert-fintech-lending-ilegal)

---

### 🌐 Demo Aplikasi Web
* **URL Live**: [https://fintech-lending-ilegal-detector-theta.vercel.app/](https://fintech-lending-ilegal-detector-theta.vercel.app/)

---

### 📂 Struktur Repositori
```text
├── api/             # Vercel Serverless Entrypoint
├── services/        # Engine NLP IndoBERT & Parser Dokumen
├── static/          # Antarmuka Web & Ekstensi Chrome Scraper
├── public/          # Static Assets & Edge CDN Distribution
├── main.py          # Backend FastAPI REST API
├── requirements.txt # Dependensi Python
└── vercel.json      # Konfigurasi Serverless Deployment
```
