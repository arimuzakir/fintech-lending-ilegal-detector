# 🛡️ PANDUAN KERJA DAN ATURAN WAJIB AGENT AI (AUTOMATIC WORKSPACE RULES)
**Proyek:** Aplikasi Cerdas Deteksi Otomatis Fintech Lending Ilegal (IndoBERT + Multi-Platform Scraper)

Setiap agent AI yang bekerja pada workspace ini **WAJIB MEMATUHI ATURAN BERIKUT SECARA OTOMATIS TANPA PERLU DIPERINGATKAN OLEH USER**:

---

## 🚫 1. ATURAN ANTI-BUG & KUALITAS SISTEM (ZERO REGRESSION)

1. **Zero Navigation Triggering (Anti-Redirect Liar)**:
   * DILARANG KERAS mengeksekusi `.click()` secara bebas pada elemen `<a>` atau tombol navigasi saat *auto-scroll / auto-crawl*.
   * Tindakan ekspansi teks (seperti *"Show more"* atau *"Selengkapnya"*) WAJIB dibatasi eksklusif hanya di dalam badan teks target (`div[data-testid="tweetText"]` pada Twitter/X atau kartu artikel pada portal berita).
   * Filter ketat: `el.closest('a')` yang mengarah ke link luar tidak boleh diklik.

2. **Continuous Stream Accumulator (Anti-Reset Data)**:
   * Twitter/X menggunakan *React Virtual DOM* yang menghapus tweet dari layar saat di-scroll.
   * Agent WAJIB menggunakan memori kontinu `window.__fintech_accumulated_tweets` yang menangkap tweet di setiap frame pergerakan dan menyuntikkannya ke dalam tag `#fintech-accumulated-posts`.
   * Tombol *Auto-Scroll* yang diklik berulang kali WAJIB menambah data secara kumulatif, TIDAK BOLEH mereset ke 0.

3. **Cross-Page Storage Persistence untuk Portal Berita**:
   * Saat auto-crawl berpindah dari Halaman 1 ke Halaman 2, 3, dst. pada MediaKonsumen, Detik, atau Kompas, agent WAJIB menyimpan dan menggabungkan (*merge*) data ke dalam `chrome.storage.local`.
   * Data dari halaman-halaman sebelumnya TIDAK BOLEH HILANG.

4. **Wajib Eksekusi Sinkronisasi Otomatis**:
   * Setiap kali ada berkas di `aplikasi/static/extension/` yang dimodifikasi, agent WAJIB langsung menjalankan skrip sinkronisasi Python ke seluruh folder ekstensi di `C:\Users\user\Downloads\` sebelum merespons ke user.

5. **$O(1)$ Memory & Performance Safety**:
   * Jangan menjalankan manipulasi string berat (`.toLowerCase()`, `.split()`) pada string HTML berukuran 18+ MB di main UI thread JavaScript. Selalu gunakan $O(1)$ fast head sampling `v.slice(0, 500)`.

---

## ⚡ 2. PERINTAH SINKRONISASI OTOMATIS EKSTENSI

Jalankan perintah ini setiap kali memperbarui folder `static/extension`:
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

## 🎯 3. FOKUS PROYEK
* Fokus murni pada **Rekayasa Sistem Aplikasi, FastAPI Backend, Fine-Tuned Model IndoBERT, dan Scraper Cerdas Multi-Platform (Facebook, Twitter/X, Portal Berita)**.
* Tidak perlu menyusun proposal dokumen akademik kecuali diminta secara eksplisit.
