# Aplikasi Web Deteksi Fintech Lending Ilegal (IndoBERT Real-Time)

Aplikasi web interaktif untuk pengujian dan evaluasi model Natural Language Processing (NLP) IndoBERT dalam mendeteksi konten pinjaman online (fintech lending) ilegal secara real-time.

---

## 🌟 Fitur Utama
1. **Real-Time Single Text Analysis**:
   - Deteksi instan teks SMS tawaran, pesan WhatsApp teror penagihan, postingan media sosial, ulasan korban, dan promosi berizin.
   - Dilengkapi preset kasus uji nyata yang siap diklik dalam 1 kali klik.
   - Indikator risiko (*BAHAYA TINGGI*, *WASPADA*, *AMAN*) dan skor tingkat keyakinan (Confidence Score).
   - Deteksi otomatis indikator kata kunci *red flags* (misal: sebar data, bunga per hari, ancaman debt collector, nomor kontak tidak resmi, link APK mencurigakan).

2. **Batch Testing (Pengujian Massal)**:
   - Memungkinkan pengujian puluhan kalimat sekaligus via endpoint /api/batch-predict.

3. **Dashboard Metrik & Visualisasi Hasil Evaluasi (Tahap 5)**:
   - Menampilkan metrik komparatif model terbaik (**IndoBERT** Akurasi **96.60%**, F1-Score **95.74%**).
   - Galeri grafik hasil eksperimen: Kurva Training & Loss, Confusion Matrix, WordCloud Ilegal vs Legal, dan Grafik Distribusi Kata.

4. **Kamus Kata Kunci & Metodologi**:
   - Dokumentasi lengkap kata kunci scraping (Twitter/X, Facebook, MediaKonsumen, Detik.com, Kompas.com).

---

## 📂 Struktur Folder plikasi/
`
aplikasi/
├── model/                     # Bobot model IndoBERT fine-tuned
│   ├── model.safetensors      # Bobot PyTorch SafeTensors (497 MB)
│   ├── config.json            # Konfigurasi arsitektur BERT
│   ├── tokenizer.json         # Tokenizer vocabulary
│   ├── tokenizer_config.json  # Tokenizer settings
│   ├── trainer_state.json     # Log training state
│   └── MODEL_TERBAIK.md       # Catatan evaluasi metrik model
├── output_evaluasi/           # Output visualisasi & CSV hasil pengujian
│   ├── Grafik Training.png
│   ├── confusion_matrices_comparison.png
│   ├── performance_comparison.png
│   ├── wordcloud_illegal.png
│   ├── wordcloud_legal.png
│   ├── eda_word_count_distribution.png
│   └── model_comparison_results.csv
├── services/
│   └── model_engine.py        # Service pemuat model PyTorch & analisis leksikon
├── static/
│   └── index.html             # Antarmuka web modern glassmorphism
├── main.py                    # Server FastAPI & API Router
├── run.py                     # Script launcher otomatis (membuka browser)
├── run.bat                    # Launcher 1-klik untuk Windows
├── requirements.txt           # Dependensi Python
└── README.md                  # Dokumentasi panduan
`

---

## 🚀 Cara Menjalankan Aplikasi

### Cara 1: Menggunakan Launcher Cepat (Windows)
Cukup klik ganda (double-click) berkas:
`ash
run.bat
`
atau jalankan melalui terminal:
`ash
python run.py
`

### Cara 2: Menjalankan Uvicorn Manual
`ash
cd aplikasi
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
`

Aplikasi web akan dapat diakses di browser pada:
👉 **http://127.0.0.1:8000**
👉 Dokumentasi Interaktif API Swagger UI: **http://127.0.0.1:8000/docs**

---

## 📡 API Endpoints
- GET / : Menampilkan UI Dashboard Web Deteksi.
- GET /api/health : Memeriksa status server, status model IndoBERT, dan hardware aktif (CUDA/CPU).
- GET /api/samples : Mengambil daftar contoh kasus uji nyata (preset).
- GET /api/metrics : Mengambil data metrik komparasi dan URL gambar evaluasi model.
- POST /api/predict : Inferensi teks tunggal secara real-time.
  - Body JSON: {"text": "Selamat! No Anda terpilih mendapat pinjaman 25jt cair 5 menit..."}
- POST /api/batch-predict : Inferensi daftar teks massal.
  - Body JSON: {"texts": ["teks 1", "teks 2", "teks 3"]}

---

## 🎯 Metrik Kinerja Model IndoBERT (Test Set)
- **Akurasi**: **96.60%**
- **Precision (Macro)**: **95.71%**
- **Recall (Macro)**: **95.78%**
- **F1-Score (Macro)**: **95.74%**
