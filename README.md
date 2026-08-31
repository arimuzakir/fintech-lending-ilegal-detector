# Deteksi Otomatis Fintech Lending Ilegal Menggunakan IndoBERT

Repositori ini memuat implementasi sistem klasifikasi dan deteksi otomatis konten pinjaman online (fintech lending) ilegal berbasis pemrosesan bahasa alami (Natural Language Processing) dan transformer monolingual bahasa Indonesia (IndoBERT).

## Ringkasan Model & Evaluasi

Sistem mengimplementasikan fine-tuned model IndoBERT (`indobenchmark/indobert-base-p2`) yang dilatih untuk mengenali indikator dan modus penipuan pinjaman online ilegal pada media sosial (Twitter/X, Facebook) dan portal pengaduan berita.

| Metrik Evaluasi | Nilai |
| :--- | :--- |
| **Model Arsitektur** | IndoBERT Base Phase 2 (`indobenchmark/indobert-base-p2`) |
| **Akurasi (Accuracy)** | 96.60% |
| **Precision (Macro)** | 95.71% |
| **Recall (Macro)** | 95.78% |
| **F1-Score (Macro)** | 95.74% |
| **Hugging Face Model** | [muzakir17/indobert-fintech-lending-ilegal](https://huggingface.co/muzakir17/indobert-fintech-lending-ilegal) |

## Akses Aplikasi

Aplikasi deteksi terdistribusi secara publik dan dapat diakses melalui tautan berikut:
* **URL Aplikasi**: [https://fintech-lending-ilegal-detector-theta.vercel.app/](https://fintech-lending-ilegal-detector-theta.vercel.app/)

## Struktur Repositori

```text
├── api/             # Vercel Serverless Function entrypoint
├── services/        # Engine inferensi IndoBERT dan parser dokumen
├── static/          # Antarmuka web pengguna dan ekstensi Chrome scraper
├── public/          # Distribusi aset statis Edge CDN
├── main.py          # FastAPI application server
├── requirements.txt # Dependensi pustaka Python
└── vercel.json      # Konfigurasi deployment serverless
```

## Lisensi & Sitasi

Proyek penelitian ini dikembangkan untuk kebutuhan riset akademik deteksi aktivitas keuangan ilegal di Indonesia.
