# 📑 CATATAN SESI, LOG KERJA, DAN BASIS DATA BUG & PERBAIKAN SISTEM
**Proyek Riset:** *Aplikasi Cerdas Berbasis Kecerdasan Buatan untuk Deteksi Otomatis Fintech Lending Ilegal di Indonesia*  
**Arsitektur Model:** Fine-Tuned IndoBERT (Akurasi 96.60%), BERT Multilingual, IndoBERT-Tweet, Baseline TF-IDF  
**Terakhir Diperbarui:** 30 Agustus 2026

---

## 📌 1. Rangkuman Pencapaian Rekayasa Sistem (*Engineering Accomplishments*)

### A. Web Application & Detektor Real-Time (FastAPI + Modern UI)
1. **Desain Antarmuka Premium (macOS Glass Window Styling)**:
   * **Card A (Uji Cepat Teks & Berkas Dokumen)**: Dilengkapi macOS window header (🔴🟡🟢), area unggah PDF/Excel/TXT yang bersih, dan tombol analisis interaktif.
   * **Card B (Data Scraped Media Sosial & Berita)**: Dilengkapi tombol **`📋 Tempel dari Clipboard`** instan dan dukungan analisis multi-megabytes.
   * **Pipeline Stepper**: Horizontal flow (1 ── 2 ── 3 ── 4) yang responsif dan konsisten.
2. **Optimasi Kinerja String Raksasa (18,6 Juta Karakter HTML / 18,3 MB)**:
   * Menghilangkan pembekuan (*UI freezing*) saat menempelkan HTML hasil *scraper* berukuran belasan megabytes.
   * Menggunakan $O(1)$ fast head sampling (`slice(0, 500)`) untuk identifikasi tipe dokumen tanpa melakukan kloning string masif di RAM thread utama JavaScript.

---

### B. Ekstensi Browser Multi-Platform (Facebook, 𝕏 Twitter/X, Portal Berita)
1. **📘 Facebook Mode (16 Preset Riset)**:
   * Kategori: *Teror & Data, Bunga & Jebakan, Umpan Kilat, Korban & Galbay*.
   * **Auto-Scroll Facebook Mandiri**: Dilengkapi fungsi `autoScrollFacebook()` dengan continuous accumulator `window.__fintech_accumulated_fb` untuk mengumpulkan postingan publik secara berulang tanpa batas.
2. **𝕏 Twitter / X Mode (16 Preset Real-Time `f=live`)**:
   * Kategori: *Teror & DC, Bunga & Tenor, Joki & Data Busuk, Korban & OJK*.
   * **Continuous Stream Accumulator**: Mengatasi limitasi *React Virtual DOM Virtualization* Twitter dengan menangkap tweet di setiap siklus pergerakan scroll sebelum Twitter menghapusnya dari DOM viewport.
   * **Ekspansi "Show more" Khusus Badan Tweet**: Menargetkan teks *"Show more"* eksklusif pada kontainer `div[data-testid="tweetText"]` sehingga utas (*thread / UTAS*) panjang terbuka utuh tanpa menyentuh tombol bilah samping (*sidebar* / rekomendasi akun).
3. **📰 Portal Berita & Surat Aduan Konsumen (12 Preset Riset + Smart Unified Auto-Crawl)**:
   * Platform: **MediaKonsumen.com** (Surat Aduan Korban), **Detik.com** (Berita Nasional), dan **Kompas.com** (Berita Nasional).
   * **Eliminasi Google News**: Google News resmi dihilangkan dari seluruh ekosistem ekstensi agar fokus dataset penelitian murni pada 3 portal berita & aduan nasional utama yang paling relevan dan terstruktur.
   * **Smart Unified Auto-Crawl & Non-CORS Fetcher**: Seluruh pengambilan artikel berita utuh (15–25 paragraf) dieksekusi di level background/popup controller yang memiliki izin `host_permissions: ["<all_urls>"]` sehingga 100% bebas dari pemblokiran CORS peramban.
   * **Multi-Platform Stale-Tab Guard**: Refresh tab aktif real-time via `chrome.tabs.query()` di setiap interaksi tombol untuk mencegah kesalahan routing saat berganti platform.
   * **Auto-Reset Accumulator Pasca-Salin**: Setiap kali tombol **`🌐 Salin HTML Source`** ditekan, memori accumulator direset otomatis dan tombol scrape diaktifkan kembali sehingga pengguna dapat langsung melakukan scraping baru tanpa mengalami kondisi *stuck*.
   * **Visible Motion & Live In-Page Scanner HUD**: Layar peramban bergerak dinamis menelusuri artikel dengan efek glowing kartu dan progress bar interaktif di atas layar.

---

## ⚠️ 2. Matriks Lengkap Seluruh Bug, Penyebab, & Solusi Teknis

| No | Gejala / Pesan Error | Penyebab Utama (*Root Cause*) | Tindakan Solusi & Perbaikan (*Fix*) |
| :--- | :--- | :--- | :--- |
| **1** | `Executing inline event handler violates CSP directive 'script-src 'self''` | Chrome Manifest V3 melarang penggunaan atribut `onclick="..."` pada berkas HTML ekstensi. | Menghapus semua atribut `onclick` dan mengikat seluruh *event listener* secara dinamis menggunakan `addEventListener()` di `popup.js`. |
| **2** | Proses analisis HTML tampak *stuck* di `0%` saat memproses kode HTML besar (7–8 MB) | 1. Limit string Pydantic default adalah 2.000.000 karakter sementara HTML medsos mencapai 7–18 juta karakter.<br>2. BeautifulSoup lambat memproses puluhan ribu tag `<svg>` dan `<script>` secara sinkron. | 1. Naikkan limit Pydantic `SourceTextRequest` menjadi 25.000.000 (25 MB).<br>2. Pasang Ultra-Fast C-Regex Pre-Cleaner (membuang skrip, SVG, CSS dalam < 180 ms).<br>3. Pindahkan parsing ke worker thread `asyncio.to_thread`. |
| **3** | Browser freeze / lag saat menempelkan HTML 18 MB di Card B | Pemanggilan fungsi `.toLowerCase()` dan `.includes()` pada string 18.682.675 karakter menggandakan objek string 18 MB di RAM JavaScript thread utama. | Mengganti pengecekan menggunakan $O(1)$ sampling pada 500 karakter pertama: `v.slice(0, 500).toLowerCase().includes('<html')`. |
| **4** | Ekstensi tidak berubah setelah diedit meskipun sudah di-reload | Peramban Chrome memuat ekstensi dari folder ekstraksi lama di `C:\Users\user\Downloads\` (`Load unpacked`), sedangkan pengeditan kode dilakukan di repositori proyek `aplikasi\static\extension`. | Dibuat mekanisme **Sinkronisasi Otomatis** yang menyalin seluruh berkas terbaru dari `static/extension` langsung ke seluruh folder ekstensi di direktori Downloads. |
| **5** | Mengklik preset Twitter/X malah membuka halaman pencarian Facebook | Ekstensi masih menjalankan *cache* berkas popup lama yang belum mendukung tab switching multi-platform. | Membangun arsitektur 3 Tab Terpadu (`📘 Facebook` \| `𝕏 Twitter/X` \| `📰 Portal Berita`) dengan *action query routing* independen. |
| **6** | Auto-scroll Twitter/X membuka halaman rekomendasi follow (`x.com/i/connect_people`) | Skrip mengeksekusi `b.click()` pada elemen berteks *"Show more"* secara global, yang secara tidak sengaja mengklik link rekomendasi akun pada sidebar *"Who to follow"*. | Membatasi pencarian *"Show more"* eksklusif hanya di dalam badan teks tweet (`div[data-testid="tweetText"]`) dan memfilter link keluar. |
| **7** | Jumlah tweet terbaca tidak bertambah (mentok di 6 tweet) saat sering di-scroll di Twitter/X | Twitter/X menggunakan *React DOM Virtualization* yang otomatis menghapus (*unmount*) tweet di bagian atas layar demi menghemat RAM browser, menyisakan hanya ~6–8 tweet yang tampak di layar. | Membangun **Continuous Stream Accumulator** di `window.__fintech_accumulated_tweets` yang menangkap tweet di setiap *frame* langkah scroll sebelum React sempat menghapusnya, lalu menyuntikkannya ke dalam tag `#fintech-accumulated-posts`. |
| **8** | Terbaca 0 artikel dan berpindah ke artikel tunggal pada MediaKonsumen | Skrip mengeksekusi klik pada tombol *"Baca selengkapnya"* yang merupakan tag link `<a href="...">`, sehingga peramban berpindah ke halaman artikel tunggal dan kehilangan parameter pencarian `?s=...`. | Menghapus klik link keluar, mengekstrak ringkasan dan kartu langsung dari DOM daftar pencarian, serta mengunci kata kunci pencarian pada navigasi multi-page (`buildNewsUrlForPage`). |
| **9** | `ModuleNotFoundError: No module named 'torch'` | Runtime Python lokal belum memiliki paket PyTorch CPU. | Dilakukan instalasi `torch-2.13.0+cpu`, `transformers-5.15.1`, `tokenizers-0.22.2`, `beautifulsoup4`. |
| **10** | `NameError: name 'List' is not defined` pada `services/model_engine.py` | Modul `typing` belum diimpor untuk type hint `List[str]` dan `List[Dict[str, Any]]` pada metode `predict_batch`. | Menambahkan `from typing import List, Dict, Any, Optional, Tuple` di baris atas `services/model_engine.py`. |
| **11** | Navigasi Kompas Hal 2 melompat ke Detik dan kartu tidak tersorot | Struktur halaman pencarian Kompas yang baru menggunakan `.articleItem` dan memerlukan penguncian URL `buildNewsUrlForPage` khusus domain. | Menambahkan penanda `data-fintech-card-id` presisi untuk penyorotan kartu bergerak (*smooth scroll & glowing green effect*) serta mengunci URL `search.kompas.com/search/?q=...&page=...`. |
| **12** | Redundansi Menu & Penyesuaian Ruang Lingkup Riset (Eliminasi Google News) | Fokus dataset penelitian adalah portal berita dan surat pembaca nasional (MediaKonsumen, Detik, Kompas) serta menghindari inkonsistensi struktur artikel redirect Google News. | Menghapus opsi, tab, dan preset Google News dari popup, content script, dan manifes ekstensi agar antarmuka ringkas dan terfokus. |
| **13** | `Cannot access a chrome:// URL` saat klik Auto-Crawl | Ekstensi dijalankan ketika pengguna masih membuka tab `chrome://newtab/` atau `chrome://extensions/` yang dilarang diakses oleh Chrome Scripting API. | Menambahkan validasi URL awal (*Restricted URL Guard*) yang otomatis mengarahkan peramban ke portal berita terpilih dan meminta pengguna mengklik Auto-Crawl setelah halaman termuat. |
| **14** | Auto-Crawl tidak merespons setelah berpindah halaman / platform | Variabel `activeTab` bersifat *stale* (tersimpan sekali saat popup dibuka) sehingga URL lama terus terbaca meskipun tab browser sudah berpindah ke MediaKonsumen / Kompas / Detik. | Melakukan refresh instan `activeTab` via `chrome.tabs.query({active: true, currentWindow: true})` di setiap siklus routing tombol auto-scroll dan tombol pencarian. |
| **15** | `ReferenceError: autoScrollFacebook is not defined` | Fungsi router memanggil `autoScrollFacebook` yang belum terdefinisi saat pengguna berada di platform Facebook. | Mengimplementasikan fungsi lengkap `autoScrollFacebook()` dengan DOM scrolling bertahap, continuous accumulator `window.__fintech_accumulated_fb`, dan injeksi kontainer `#fintech-accumulated-posts`. |
| **16** | Ekstensi *stuck* / tombol tidak bisa diklik setelah menyalin HTML dan ingin scrape ulang | 1. Tombol scrape di widget in-page mencari ID yang salah (`fintech-btn-deep-news` alih-alih `fintech-btn-scrape`).<br>2. Memori accumulator tidak di-reset setelah penyalinan HTML sehingga crawling berikutnya terhambat state lama. | 1. Memperbaiki ID selektor tombol ke `fintech-btn-scrape`.<br>2. Menambahkan reset accumulator (`__fintech_accumulated_* = null`) saat tombol Salin HTML ditekan.<br>3. Memastikan `disabled = false` selalu dieksekusi di blok `finally`. |
| **17** | Loading berlebihan / ekstensi crash saat popup baru dibuka | Pemanggilan `scanPageItemsQuietly` mengeksekusi `executeScript` sebelum halaman website mencapai status `document_idle`. | Menambahkan *safe delay* 600ms dan *silent try-catch* pada fungsi scanner awal agar popup terbuka dengan instan dan mulus. |

---

## ⚡ 3. Perintah Sinkronisasi Otomatis Ekstensi (*Auto-Sync Command*)

Setiap kali ada pembaruan kode pada folder `aplikasi/static/extension/`, jalankan perintah Python berikut untuk langsung menyinkronkannya ke seluruh folder ekstensi di komputer:

```bash
python -c "
import os, shutil

src = r'e:\PAK ARI MUZAKIR\FINTECH LENDING ILEGAL ID\aplikasi\static\extension'
dl = os.path.expanduser('~/Downloads')

target_folders = [
    'Scraper-Fintech-Lending-Ilegal',
    'Scraper-Fintech-Lending-Ilegal (1)',
    'Scraper-Fintech-Lending-Ilegal (2)',
    'Scraper-Fintech-Lending-Ilegal (3)',
    'chrome-extension'
]

for folder in target_folders:
    dest = os.path.join(dl, folder)
    if os.path.exists(dest):
        for item in os.listdir(src):
            s_item = os.path.join(src, item)
            d_item = os.path.join(dest, item)
            if os.path.isdir(s_item):
                if os.path.exists(d_item):
                    shutil.rmtree(d_item)
                shutil.copytree(s_item, d_item)
            else:
                shutil.copy2(s_item, d_item)
        print('Synced:', folder)
"
```

---

## 🚀 4. Panduan Menjalankan Sistem

### A. Menjalankan Server Web (Lokal / Offline)
1. Buka folder: `E:\PAK ARI MUZAKIR\FINTECH LENDING ILEGAL ID\aplikasi\`
2. Klik ganda berkas: 👉 **[`run.bat`](file:///e:/PAK%20ARI%20MUZAKIR/FINTECH%20LENDING%20ILEGAL%20ID/aplikasi/run.bat)**
3. Browser akan otomatis terbuka di: **`http://127.0.0.1:8000`**

### B. Menjalankan Server Web (Online Publik / Ngrok)
1. Klik ganda berkas: 👉 **[`run_ngrok.bat`](file:///e:/PAK%20ARI%20MUZAKIR/FINTECH%20LENDING%20ILEGAL%20ID/aplikasi/run_ngrok.bat)**
2. Terminal akan menampilkan URL Publik Ngrok HTTPS dan membukanya di browser.

### C. Mengaktifkan Ekstensi Chrome di Browser
1. Buka Chrome, ketik di address bar: `chrome://extensions/`
2. Pastikan toggle **"Developer mode"** di pojok kanan atas dalam posisi **ON**.
3. Klik tombol **Reload (ikon putar 🔄)** pada kartu ekstensi.

---

## 📂 5. Struktur Berkas Repositori (*Project Architecture*)

```
E:\PAK ARI MUZAKIR\FINTECH LENDING ILEGAL ID\
├── aplikasi\
│   ├── main.py                        # Server FastAPI (RESTful API & Streaming Endpoints)
│   ├── run.py & run.bat               # Launcher lokal (http://127.0.0.1:8000)
│   ├── run_with_ngrok.py & run_ngrok.bat # Launcher online (Tunneling HTTPS)
│   ├── CATATAN_SESI_DAN_LOG_KERJA.md  # Basis data lengkap log kerja & matriks bug
│   ├── model\
│   │   ├── model.safetensors          # Bobot fine-tuned IndoBERT (497 MB)
│   │   ├── config.json, tokenizer.json, tokenizer_config.json
│   │   └── MODEL_TERBAIK.md           # Metadata akurasi 96.60% & metrik model
│   ├── services\
│   │   ├── model_engine.py            # Engine inferensi PyTorch + Leksikon Red-Flags
│   │   └── document_parser.py         # Ultra-Fast Parser (PDF, Excel, TXT, HTML 25MB)
│   ├── static\
│   │   ├── index.html                 # Web dashboard interaktif (macOS Glass Window Card A & B)
│   │   └── extension\                 # Ekstensi Chrome Multi-Platform MV3
│   │       ├── manifest.json          # Konfigurasi Manifest V3 (FB, X, MediaKonsumen, Detik, Kompas)
│   │       ├── popup.html & popup.js  # Popup UI & Multi-Page Continuous Crawler Controller
│   │       ├── content.js & content.css # In-page floating scraper widget
│   │       ├── background.js          # Background service worker
│   │       └── icons\                 # Icon aset 16px, 32px, 48px, 128px
│   └── output_evaluasi\               # Grafik evaluasi riset (Confusion Matrix, Loss, Wordcloud)
```

---

### 4. Arsitektur Non-CORS Popup Controller & Google News Scraper (30 Agustus 2026)
* **Akar Masalah CORS Ditemukan**: Pada Manifest V3, saat `fetch()` dieksekusi di dalam *content script* (halaman tab aktif seperti `search.kompas.com` atau `news.google.com`), browser memblokir *cross-origin fetch* ke domain artikel asli (`money.kompas.com`, `detik.com`, `bisnis.com`) karena *Same-Origin Policy*. Hal ini menyebabkan *fetch* naskah artikel gagal secara diam-diam dan data yang tersalin hanyalah cuplikan ringkasan kartu pencarian beserta footer hak cipta (*copyright*).
* **Solusi Arsitektur Popup Controller**:
  1. Ekstensi memindahkan seluruh eksekusi HTTP `fetch()` artikel langsung ke **konteks `popup.js`** yang memiliki `host_permissions: ["<all_urls>"]`, sehingga **100% bebas hambatan CORS** ke seluruh portal berita Indonesia.
  2. Tab browser hanya bertugas mendeteksi tautan kartu, melakukan *smooth scroll* visual, dan menampilkan efek *card glowing* + *live HUD progress*.
  3. Menambahkan dukungan penuh untuk **Google News (`news.google.com`)**: membongkar tautan `./articles/...` dan mengekstrak naskah berita lengkap dari media penerbit terkait (Detik, Kompas, Bisnis, Kumparan, dll.).
  4. Tombol **`🌐 Salin HTML Source`** kini membuat dokumen HTML khusus yang berisi **eksklusif naskah artikel lengkap (15–25 paragraf utuh)** di dalam `#fintech-accumulated-posts`, membuang 100% noise jumlah hasil pencarian, sidebar, dan footer hak cipta (*Copyright 2008–2026 PT. Kompas Cyber Media*).

---

## 🛡️ 7. Standar Mutu & Protokol Anti-Bug (*Zero Regression Guarantee*)

Untuk memastikan **tidak ada lagi bug atau eror serupa yang terulang pada perbaikan selanjutnya**, seluruh pengembangan wajib mengikuti 5 protokol baku berikut:

1. **🔒 Protokol 1 — Zero Navigation Triggering (Anti-Redirect Liar)**:
   * Dilarang keras mengeksekusi `.click()` secara bebas pada elemen `<a>` atau tombol navigasi luar saat proses *auto-scroll / auto-crawl*.
   * Tindakan ekspansi teks (seperti *"Show more"* atau *"Selengkapnya"*) wajib dibatasi eksklusif hanya di dalam badan teks target (`div[data-testid="tweetText"]` atau kartu artikel).
2. **💾 Protokol 2 — Continuous Stream Accumulator (Anti-Data Reset)**:
   * Setiap proses *scraping* pada platform yang menerapkan *virtualized DOM* (seperti Twitter/X) atau paginasi wajib mengumpulkan data di setiap milidetik siklus pergerakan dan menyimpannya di memori persisten (`window.__fintech_accumulated_*`).
   * Tombol *Auto-Scroll* yang diklik berulang kali wajib menambah data secara kumulatif, bukan me-reset ke 0.
3. **📂 Protokol 3 — Cross-Page Persistence (`chrome.storage.local`)**:
   * Perpindahan halaman pada portal berita (Hal 1 ➔ Hal 2 ➔ Hal 3) wajib menyimpan data halaman sebelumnya ke penyimpanan lokal persisten agar saat pengguna menyalin HTML, data dari seluruh halaman tetap utuh.
4. **⚡ Protokol 4 — Mandatory Auto-Sync Execution**:
   * Setiap kali ada berkas di `aplikasi/static/extension/` yang dimodifikasi, skrip sinkronisasi otomatis Python wajib langsung dieksekusi seketika ke seluruh folder ekstensi di `C:\Users\user\Downloads\` sebelum melaporkan ke pengguna.
5. **🚀 Protokol 5 — High-Performance & Memory Safety**:
   * Hindari operasi string masif (`.toLowerCase()`, `.split()`) pada string HTML berukuran megabytes di main UI thread JavaScript. Selalu gunakan $O(1)$ fast sampling dan serahkan pemrosesan berat ke worker thread/FastAPI backend.

