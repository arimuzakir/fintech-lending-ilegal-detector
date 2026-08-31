---
name: research-paper-writer
description: "Expert skill for drafting Indonesian scientific journal manuscripts (SINTA 2/3, Journal of ISI), statistical table formatting, confusion matrix analysis, and HKI (Hak Cipta Program Komputer) submission documents."
---

# Academic Research Paper & HKI Writer

Specialized skill for converting machine learning experiments, NLP pipelines, and prototype software into high-impact academic publications (SINTA 3 accredited journals like *Journal of Information Systems and Informatics*) and Intellectual Property (HKI) registrations.

---

## 📑 1. SINTA 3 Manuscript Structure (IMRAD Framework)

### 1. Title (*Judul*)
- Concise, clear, reflecting the AI/NLP method and domain problem.
- *Example*: "Implementasi Model IndoBERT untuk Deteksi Otomatis Konten Fintech Lending Ilegal di Indonesia Berbasis Pembelajaran Mendalam"

### 2. Abstract (*Abstrak*)
- Structured 200–250 words:
  1. **Background & Problem**: Urgency of illegal fintech lending in Indonesia.
  2. **Proposed Solution**: Fine-tuning IndoBERT, IndoBERT-Tweet, and BERT Multilingual on 10,000 text data.
  3. **Methodology**: Scraping social media & news, preprocessing, tokenization, fine-tuning, real-time web prototype.
  4. **Key Results**: IndoBERT achieved the highest performance (Accuracy 96.60%, Precision 95.71%, Recall 95.78%, F1-Score 95.74%).
  5. **Impact**: Automated real-time screening protection for digital consumers.
- **Keywords**: *Fintech Lending Ilegal, Natural Language Processing, IndoBERT, Fine-Tuning, Klasifikasi Teks*

### 3. Introduction (*Pendahuluan*)
- Literature gap: Previous works using classical TF-IDF/SVM vs contextual Transformers.
- Research questions and specific contributions of this study.

### 4. Research Methodology (*Metode Penelitian*)
- **Dataset**: 10,000 labeled Indonesian loan texts (Twitter/X, Facebook, Detik, Kompas, MediaKonsumen).
- **Preprocessing Pipeline**: Cleaning, slang normalization, tokenization.
- **Model Architecture**: IndoBERT-Base-P2 (12 layers, 768 hidden, 12 attention heads, 124M parameters).
- **Hyperparameters**: Batch size 16/32, learning rate $2 \times 10^{-5}$, AdamW optimizer, cross-entropy loss, 3-5 epochs.
- **Evaluation Metrics**: Confusion Matrix, Accuracy, Macro Precision, Macro Recall, Macro F1-Score.

### 5. Results and Discussion (*Hasil dan Pembahasan*)
- Comparative Performance Table (TF-IDF vs BERT vs IndoBERT vs IndoBERT-Tweet).
- Visual analysis: Training Loss Curves, Confusion Matrices, WordClouds.
- Error analysis: Nuanced cases (satire, mixed sentiment).
- Real-time prototype response latency evaluation.

### 6. Conclusion (*Kesimpulan*)
- Synthesis of findings, practical implications, and future research roadmap.

---

## 📜 2. HKI (Hak Cipta Program Komputer) Preparation Checklist

To submit software copyright to DJKI (Direktorat Jenderal Kekayaan Intelektual):
1. **Nama Ciptaan**: "Sistem Cerdas Deteksi Otomatis Fintech Lending Ilegal Berbasis IndoBERT"
2. **Jenis Ciptaan**: Program Komputer / Aplikasi Web
3. **Deskripsi Teknis**: Ringkasan fungsi, bahasa pemrograman (Python, HTML, CSS, JavaScript), framework (FastAPI, PyTorch, Transformers).
4. **Buku Manual Panduan Pengguna (User Manual)**:
   - Tangkapan layar antarmuka (*Screenshots*).
   - Petunjuk instalasi & eksekusi server.
   - Cara input data & interpretasi hasil deteksi.
5. **Potongan Kode Sumber (Source Code Dump)**:
   - 10-20 halaman representatif kode program (`main.py`, `model_engine.py`, `index.html`).
