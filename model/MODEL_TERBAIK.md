# MODEL TERBAIK HASIL EVALUASI (TAHAP 5)
## Proyek Deteksi Fintech Lending Ilegal Indonesia

Berdasarkan hasil pengujian eksperimen komparatif pada Tahap 5, model berikut ini telah dipilih sebagai model terbaik untuk diimplementasikan pada prototipe aplikasi:

* **Nama Model Utama**: **IndoBERT**
* **Repositori Asal**: `indobenchmark/indobert-base-p2`
* **Lokasi Penyimpanan Lokal**: `models/best_model_indobert/`
* **Arsitektur**: BERT-Base (Indonesian) dengan classification head biner (2 labels).

### Ringkasan Metrik Evaluasi Kinerja (Test Set)
* **Accuracy**: **96.60%** (0.966000)
* **Precision (Macro)**: **95.71%** (0.957089)
* **Recall (Macro)**: **95.78%** (0.957774)
* **F1-Score (Macro)**: **95.74%** (0.957431)

### Keterangan Pemuatan Model (FastAPI)
Model dan Tokenizer wajib dimuat langsung menggunakan bobot lokal dari path `models/best_model_indobert/`.
Bobot tersimpan dalam format safe tensors (`model.safetensors`).
Tokenizer menggunakan tokenizer terpadu dari `tokenizer.json` dan `tokenizer_config.json`.
