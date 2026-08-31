---
language:
- id
license: apache-2.0
tags:
- text-classification
- bert
- indobert
- pytorch
- fintech
- indonesian
pipeline_tag: text-classification
widget:
- text: "Pinjaman dana cepat cair 5 menit tanpa syarat tanpa jaminan langsung transfer hubungi WA."
  example_title: "Contoh Pinjol Ilegal"
- text: "PT Pembiayaan Digital Indonesia berizin resmi dan terdaftar di Otoritas Jasa Keuangan (OJK)."
  example_title: "Contoh Fintech Legal OJK"
- text: "Satgas PASTI mengimbau masyarakat untuk selalu mengecek legalitas pinjol di situs resmi OJK."
  example_title: "Contoh Edukasi Satgas PASTI"
---

# IndoBERT - Deteksi Fintech Lending Ilegal Indonesia

Model Klasifikasi Teks Cerdas berbasis **IndoBERT (Indonesian BERT Base P2)** yang telah di-fine-tune untuk mendeteksi penawaran pinjaman online (pinjol) ilegal, ancaman debt collector, penyebaran data pribadi, dan membedakannya dari fintech lending legal berizin OJK.

## 📊 Metrik Evaluasi Model
- **Akurasi**: **96.60%**
- **F1-Score**: **95.74%**
- **Precision**: **96.08%**
- **Recall**: **95.41%**

## 🏷️ Label Output
- `Legal` (0): Penawaran fintech lending berizin resmi OJK, edukasi literasi keuangan, atau konten netral.
- `Ilegal` (1): Pinjaman online ilegal, penipuan, intimidasi debt collector, atau penawaran tanpa izin OJK.
