// ─────────────────────────────────────────────────────────────────────────────
// content.js — Content Script Khusus Facebook, 𝕏 Twitter / X, & Portal Berita
// Strict CSP Compliant (Zero Inline Handlers)
// ─────────────────────────────────────────────────────────────────────────────

const PINJOL_KEYWORDS = [
  'pinjol', 'pinjaman online', 'pinjaman ilegal', 'fintech ilegal', 'lending',
  'sebar data', 'sebar kontak', 'kontak darurat', 'tagih kontak', 'ancam sebar',
  'cair 5 menit', 'cair kilat', 'cair langsung', 'tanpa verifikasi', 'tanpa slik',
  'bunga harian', 'bunga per hari', 'tenor 7 hari', 'tenor pendek',
  'dc kasar', 'debt collector', 'teror penagihan', 'ancaman penagih',
  'transfer sepihak', 'transfer tiba-tiba', 'ojk', 'satgas pasti',
  'korban pinjol', 'tertipu pinjol', 'grup pinjol', 'apk pinjol',
  'joki pinjol', 'data busuk', 'jasa hapus data'
];

let collectedTexts = [];

// ── Injeksi Floating Widget pada Halaman (100% Bebas Inline Event Handler) ───
function injectFloatingWidget() {
  if (document.getElementById('fintech-floating-widget')) return;

  const isFB = window.location.hostname.includes('facebook.com');
  const isX  = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
  const isNews = window.location.hostname.includes('mediakonsumen.com') || window.location.hostname.includes('detik.com') || window.location.hostname.includes('kompas.com') || window.location.hostname.includes('news.google.com');
  const isSearch = window.location.pathname.includes('/search') || window.location.search.includes('?s=') || window.location.search.includes('query=');

  let chipsHtml = '';
  let menuTitle = '';

  if (isX) {
    menuTitle = '𝕏 Menu Cepat Twitter / X (Live):';
    chipsHtml = `
      <a href="https://x.com/search?q=pinjol%20sebar%20data&f=live" class="fintech-chip-btn">sebar data</a>
      <a href="https://x.com/search?q=teror%20debt%20collector%20pinjol&f=live" class="fintech-chip-btn">teror dc</a>
      <a href="https://x.com/search?q=joki%20pinjol%20penipuan&f=live" class="fintech-chip-btn">joki pinjol</a>
      <a href="https://x.com/search?q=korban%20pinjol%20ilegal&f=live" class="fintech-chip-btn">korban pinjol</a>
    `;
  } else if (isNews) {
    menuTitle = '📰 Menu Cepat Portal Berita & Aduan:';
    chipsHtml = `
      <a href="https://mediakonsumen.com/?s=teror+pinjol+ilegal" class="fintech-chip-btn">MediaKonsumen</a>
      <a href="https://www.detik.com/search/searchall?query=penggerebekan+pinjol+ilegal" class="fintech-chip-btn">Detik</a>
      <a href="https://search.kompas.com/search/?q=satgas+pasti+ojk+pinjol" class="fintech-chip-btn">Kompas</a>
      <a href="https://news.google.com/search?q=kasus%20pinjol%20ilegal&hl=id&gl=ID&ceid=ID%3Aid" class="fintech-chip-btn">Google News</a>
    `;
  } else {
    menuTitle = '📘 Menu Cepat Pencarian Facebook:';
    chipsHtml = `
      <a href="https://www.facebook.com/search/posts/?q=pinjol%20sebar%20data" class="fintech-chip-btn">sebar data</a>
      <a href="https://www.facebook.com/search/posts/?q=teror%20debt%20collector%20pinjol" class="fintech-chip-btn">teror dc</a>
      <a href="https://www.facebook.com/search/posts/?q=bunga%20harian%20pinjol%20ilegal" class="fintech-chip-btn">bunga harian</a>
      <a href="https://www.facebook.com/search/posts/?q=korban%20pinjol%20ilegal" class="fintech-chip-btn">korban pinjol</a>
    `;
  }

  const platformLabel = isX ? 'Twitter/X' : (isNews ? 'Portal Berita' : 'Facebook');

  const container = document.createElement('div');
  container.id = 'fintech-floating-widget';
  container.innerHTML = `
    <div class="fintech-panel-card" id="fintech-panel">
      <div class="fintech-panel-header">
        <span>🛡️ Scraper Fintech Lending Ilegal</span>
        <button class="fintech-close-btn" id="fintech-btn-close">✕</button>
      </div>

      <div style="font-size:10.5px;font-weight:700;color:#1e3a8a;margin-bottom:5px;">
        ${menuTitle}
      </div>

      <div class="fintech-chips-row">
        ${chipsHtml}
      </div>

      <button class="fintech-btn-primary" id="fintech-btn-copy-html" style="background:#166534;margin-bottom:6px;">
        <span>🌐 Salin HTML Source (Siap Uji di Web)</span>
      </button>

      <button class="fintech-btn-sec" id="fintech-btn-scrape" style="width:100%;margin-bottom:6px;padding:7px;font-size:11px;font-weight:700;background:#1e3a8a;color:#fff;">
        <span>${isNews ? '⚡ Auto-Crawl & Ekstrak Full Artikel' : '⚡ Muat Lebih Banyak Konten (Auto-Scroll)'}</span>
      </button>

      <div class="fintech-status-text" id="fintech-status">
        ${isSearch ? `✅ Halaman pencarian ${platformLabel} terdeteksi. Klik tombol "⚡ Auto-Crawl" lalu "🌐 Salin HTML Source".` : '💡 Rekomendasi: Klik salah satu topik di atas untuk membuka konten publik.'}
      </div>
    </div>

    <div class="fintech-floating-pill" id="fintech-pill">
      <span>🛡️ Scraper Pinjol</span>
      <span id="fintech-pill-badge" style="background:#16a34a;color:#fff;padding:2px 6px;border-radius:99px;font-size:10px;">HTML Ready</span>
    </div>
  `;

  document.body.appendChild(container);

  // Bind event listeners safely via standard DOM methods
  const pillBtn    = container.querySelector('#fintech-pill');
  const panel      = container.querySelector('#fintech-panel');
  const closeB     = container.querySelector('#fintech-btn-close');
  const scrapeB    = container.querySelector('#fintech-btn-scrape');
  const copyHtmlB  = container.querySelector('#fintech-btn-copy-html');

  if (pillBtn) {
    pillBtn.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
  }

  if (closeB) {
    closeB.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  if (scrapeB) {
    scrapeB.addEventListener('click', () => {
      if (isNews) {
        startInPageDeepNewsScrape();
      } else {
        startInPageAutoScrape();
      }
    });
  }

  if (copyHtmlB) {
    copyHtmlB.addEventListener('click', async () => {
      const htmlCode = document.documentElement.outerHTML;
      const sizeKb = Math.round(htmlCode.length / 1024);
      try {
        await navigator.clipboard.writeText(htmlCode);
        // Reset accumulator agar crawl berikutnya bisa mulai fresh
        window.__fintech_accumulated_tweets = null;
        window.__fintech_accumulated_fb = null;
        window.__fintech_accumulated_news = null;
        const scrapeBtn = document.getElementById('fintech-btn-scrape');
        if (scrapeBtn) {
          scrapeBtn.disabled = false;
          const isNews = window.location.hostname.includes('mediakonsumen.com') || window.location.hostname.includes('detik.com') || window.location.hostname.includes('kompas.com');
          scrapeBtn.textContent = isNews ? '⚡ Auto-Crawl & Ekstrak Full Artikel (Baru)' : '⚡ Muat Lebih Banyak Konten (Auto-Scroll)';
        }
        const badge = document.getElementById('fintech-pill-badge');
        if (badge) { badge.textContent = 'Tersalin!'; badge.style.background = '#059669'; }
        alert(`✅ Salinan HTML (${sizeKb} KB) Berhasil Disalin ke Clipboard!\nSilakan klik tombol '📋 Tempel dari Clipboard' pada Card B di Web Detektor.\n\n🔄 Accumulator telah direset — siap crawl data baru!`);
      } catch {
        alert('Gagal menyalin HTML ke clipboard.');
      }
    });
  }
}

// ── In-Page Handlers (With Visible Motion & Live HUD) ────────────────────────
async function startInPageDeepNewsScrape() {
  // Gunakan fintech-btn-scrape (satu-satunya tombol scrape di widget)
  const btn    = document.getElementById('fintech-btn-scrape');
  const status = document.getElementById('fintech-status');
  const badge  = document.getElementById('fintech-pill-badge');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Mengambil Full Artikel...';
  }
  if (status) status.innerHTML = 'Memindai link artikel dan mengambil seluruh paragraf isi aduan...';

  // 1. Injeksi Live In-Page Scanner HUD Banner di layar pengguna
  let hud = document.getElementById('fintech-crawl-hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'fintech-crawl-hud';
    hud.innerHTML = `
      <div class="fintech-hud-header">
        <div class="fintech-hud-title">
          <span style="display:inline-block;animation:fintechPulse 1s infinite;">🛡️</span>
          <span>AI SMART CRAWLER &amp; FETCHER</span>
        </div>
        <span class="fintech-hud-page-badge" id="fintech-hud-page">Memindai Halaman</span>
      </div>
      <div class="fintech-hud-detail" id="fintech-hud-detail">Memulai pemindaian dan pembacaan artikel...</div>
      <div class="fintech-hud-progress-bg">
        <div class="fintech-hud-progress-bar" id="fintech-hud-bar" style="width:5%;"></div>
      </div>
    `;
    document.body.appendChild(hud);
  }
  hud.style.display = 'flex';
  hud.style.opacity = '1';

  const hudDetail = document.getElementById('fintech-hud-detail');
  const hudBar = document.getElementById('fintech-hud-bar');

  try {
    const isMediaKonsumen = window.location.hostname.includes('mediakonsumen.com');
    const isDetik = window.location.hostname.includes('detik.com');
    const isKompas = window.location.hostname.includes('kompas.com');

    const targetItems = [];
    const seenUrls = new Set();
    const allAnchors = Array.from(document.querySelectorAll('a[href], a[data-ctorig], a[data-href]'));
    allAnchors.forEach(a => {
      let rawHref = (a.getAttribute('data-ctorig') || a.getAttribute('data-href') || a.getAttribute('href') || '').trim();
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
      
      // Unwrap Google CSE / Google redirect
      if (rawHref.includes('google.com/url') || rawHref.includes('/url?')) {
        try {
          const u = new URL(rawHref, window.location.origin);
          const qParam = u.searchParams.get('q') || u.searchParams.get('url');
          if (qParam && qParam.startsWith('http')) {
            rawHref = qParam;
          }
        } catch (e) {}
      }

      let href = rawHref;
      try { href = new URL(rawHref, window.location.origin).href; } catch(e) { return; }
      const cleanUrl = href.split('#')[0];

      if (isMediaKonsumen) {
        const isArt = (cleanUrl.includes('mediakonsumen.com/') && (cleanUrl.match(/\/\d{4}\/\d{2}\//) || cleanUrl.includes('/surat-pembaca/')))
          && !cleanUrl.includes('/category/') && !cleanUrl.includes('/tag/') && !cleanUrl.includes('/author/') && !cleanUrl.includes('/page/') && !cleanUrl.endsWith('/feed/');
        if (isArt && !seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          const card = a.closest('.des-post, article, div.des-post, div.gsc-webResult, .list-content__item, .article__list, li, div[role="article"]') || a.parentElement;
          targetItems.push({ url: cleanUrl, anchor: a, card: card });
        }
      } else if (isDetik) {
        if (cleanUrl.includes('detik.com/') && (cleanUrl.includes('/berita-') || cleanUrl.includes('/d-') || cleanUrl.includes('/read/')) && !seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          const card = a.closest('article, .list-content__item, .media, li, div') || a.parentElement;
          targetItems.push({ url: cleanUrl, anchor: a, card: card });
        }
      } else if (isKompas) {
        if (cleanUrl.includes('kompas.com/read/') && !cleanUrl.includes('/tag/') && !cleanUrl.includes('/author/') && !seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          const card = a.closest('div.articleItem, div.articleList, div.articleBox, div.gsc-webResult, div.gs-webResult, .article__list, .list__item, article, li, div') || a.parentElement;
          targetItems.push({ url: cleanUrl, anchor: a, card: card });
        }
      }
    });

    const selectedItems = targetItems.slice(0, 20);
    const fullArticles = [];

    // Step-by-step visible motion loop
    for (let idx = 0; idx < selectedItems.length; idx++) {
      const item = selectedItems[idx];
      const cardEl = item.card || item.anchor;
      const progressPct = Math.round(((idx + 1) / selectedItems.length) * 100);

      if (hudDetail) hudDetail.innerHTML = `⏳ [${idx + 1}/${selectedItems.length}] Membaca artikel &amp; menggulir layar...`;
      if (hudBar) hudBar.style.width = `${progressPct}%`;

      // Smooth scroll to card
      if (cardEl && typeof cardEl.scrollIntoView === 'function') {
        try { cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e){}
      }

      // Add visual active scan highlight & tag
      if (cardEl && cardEl.classList) {
        cardEl.classList.add('fintech-card-active-scan');
        let tag = cardEl.querySelector('.fintech-live-tag');
        if (!tag) {
          tag = document.createElement('span');
          tag.className = 'fintech-live-tag scanning';
          cardEl.style.position = 'relative';
          cardEl.appendChild(tag);
        }
        tag.className = 'fintech-live-tag scanning';
        tag.textContent = '⏳ Membaca Full Naskah...';
      }

      try {
        let fetchUrl = item.url;
        if (isDetik && !fetchUrl.includes('single=1')) {
          fetchUrl += (fetchUrl.includes('?') ? '&single=1' : '?single=1');
        } else if (isKompas && !fetchUrl.includes('page=all')) {
          fetchUrl += (fetchUrl.includes('?') ? '&page=all' : '?page=all');
        }

        const resp = await fetch(fetchUrl, { credentials: 'omit' });
        if (resp.ok) {
          const html = await resp.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const titleEl = doc.querySelector('h1.read__title, h1.detail__title, h1.title, h1.entry-title, h1');
          const title = titleEl ? titleEl.innerText.trim() : (doc.title || 'Surat Aduan');

          const authorEl = doc.querySelector('.author, .entry-author, a[rel="author"], .read__author, .detail__author, .credit-title-name');
          const author = authorEl ? authorEl.innerText.trim() : 'Konsumen / Jurnalis';

          const dateEl = doc.querySelector('.date, time, .entry-date, .read__time, .detail__date, .read__date');
          const date = dateEl ? dateEl.innerText.trim() : '';

          const bodyContainer = doc.querySelector('.read__content, .detail__body-text, .itp_bodycontent, .entry-content, .post-content, .article__body, .read__article, .col-bs10-7, div[itemprop="articleBody"]');
          let paragraphs = [];
          if (bodyContainer) {
            const junk = bodyContainer.querySelectorAll('table, script, style, iframe, .link-sisip, .baca-juga, .parallax, .banner, .ad, .ads, .detail__tag, .tag, .share, .komentar, .widget');
            junk.forEach(j => j.remove());

            paragraphs = Array.from(bodyContainer.querySelectorAll('p'))
              .map(p => (p.innerText || p.textContent || '').trim())
              .filter(t => {
                const l = t.toLowerCase();
                return t.length > 20 
                  && !l.startsWith('baca juga') 
                  && !l.startsWith('simak video') 
                  && !l.startsWith('foto:')
                  && !l.startsWith('advertisement');
              });
          }

          if (paragraphs.length === 0 && doc.body) {
            const mainEl = doc.querySelector('main, #main, .main, #content, .content') || doc.body;
            paragraphs = Array.from(mainEl.querySelectorAll('p'))
              .map(p => (p.innerText || p.textContent || '').trim())
              .filter(t => {
                const l = t.toLowerCase();
                return t.length > 25
                  && !l.startsWith('baca juga') 
                  && !l.startsWith('simak video') 
                  && !l.startsWith('foto:')
                  && !l.startsWith('advertisement')
                  && !l.startsWith('copyright')
                  && !l.startsWith('redaksi');
              });
          }

          const combined = `[Judul: ${title}]\n[Penulis: ${author} | Tanggal: ${date}]\n\n${paragraphs.join('\n\n')}`;
          if (paragraphs.length > 0) {
            fullArticles.push(combined);

            if (cardEl) {
              cardEl.classList.remove('fintech-card-active-scan');
              cardEl.classList.add('fintech-card-scanned-done');
              const tag = cardEl.querySelector('.fintech-live-tag');
              if (tag) {
                tag.className = 'fintech-live-tag done';
                tag.textContent = `✅ ${paragraphs.length} Paragraf Full`;
              }
            }

            if (hudDetail) hudDetail.innerHTML = `✅ [${idx + 1}/${selectedItems.length}] <strong>${title.slice(0, 42)}...</strong> (${paragraphs.length} paragraf)`;
          }
        }
      } catch(e) {
        if (cardEl) cardEl.classList.remove('fintech-card-active-scan');
      }

      await new Promise(r => setTimeout(r, 240));
    }

    // Jika sedang berada di halaman artikel tunggal atau link = 0
    if (selectedItems.length === 0 || document.querySelector('.detail__body-text, .itp_bodycontent, .read__content, article.post')) {
      const doc = document;
      const titleEl = doc.querySelector('h1.title, h1.entry-title, h1.read__title, h1.detail__title, h1');
      const title = titleEl ? titleEl.innerText.trim() : (doc.title || 'Surat Aduan');

      const authorEl = doc.querySelector('.author, .entry-author, a[rel="author"], .read__author, .detail__author, .credit-title-name');
      const author = authorEl ? authorEl.innerText.trim() : 'Konsumen / Jurnalis';

      const dateEl = doc.querySelector('.date, time, .entry-date, .read__time, .detail__date, .read__date');
      const date = dateEl ? dateEl.innerText.trim() : '';

      const bodyContainer = doc.querySelector('.entry-content, .post-content, .detail__body-text, .itp_bodycontent, .read__content, .article__body, div[itemprop="articleBody"], article');
      let paragraphs = [];
      if (bodyContainer) {
        paragraphs = Array.from(bodyContainer.querySelectorAll('p'))
          .map(p => (p.innerText || p.textContent || '').trim())
          .filter(t => {
            const l = t.toLowerCase();
            return t.length > 20 
              && !l.startsWith('baca juga') 
              && !l.startsWith('simak video') 
              && !l.startsWith('foto:')
              && !l.startsWith('advertisement');
          });
      }

      if (paragraphs.length > 0) {
        const combined = `[Judul: ${title}]\n[Penulis: ${author} | Tanggal: ${date}]\n\n${paragraphs.join('\n\n')}`;
        fullArticles.push(combined);
      }
    }

    if (fullArticles.length > 0) {
      let accContainer = document.getElementById('fintech-accumulated-posts');
      if (!accContainer) {
        accContainer = document.createElement('div');
        accContainer.id = 'fintech-accumulated-posts';
        accContainer.style.display = 'none';
        document.body.appendChild(accContainer);
      }
      accContainer.innerHTML = fullArticles.map(t => `<article class="fintech-saved-news full-article"><div class="entry-content">${t}</div></article>`).join('\n');

      if (status) status.innerHTML = `✅ <strong>Berhasil mengekstrak ${fullArticles.length} artikel LENGKAP!</strong><br>Klik <strong>"🌐 Salin HTML Source"</strong> lalu tempel di Card B Web Detektor.`;
      if (badge) {
        badge.textContent = `${fullArticles.length} Full Artikel`;
        badge.style.background = '#059669';
      }
      if (hudDetail) hudDetail.innerHTML = `🎉 <strong>Halaman Selesai!</strong> Berhasil membaca <strong>${fullArticles.length} artikel lengkap</strong>.`;
      if (hudBar) hudBar.style.width = '100%';

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (status) status.innerHTML = `⚠️ Tidak ada artikel baru yang berhasil diambil. Coba tombol Auto-Scroll.`;
    }
  } catch(e) {
    if (status) status.innerHTML = `❌ Gagal mengambil full artikel: ${e.message}`;
  } finally {
    // Selalu re-enable tombol, apapun yang terjadi
    const scrapeBtn = document.getElementById('fintech-btn-scrape');
    if (scrapeBtn) {
      scrapeBtn.disabled = false;
      scrapeBtn.textContent = '⚡ Ulangi / Lanjutkan Scrape';
    }
    if (btn && btn !== scrapeBtn) {
      btn.disabled = false;
      btn.textContent = '📖 Baca Full Seluruh Artikel Lagi';
    }
    setTimeout(() => {
      if (hud) {
        hud.style.transition = 'opacity 0.5s ease';
        hud.style.opacity = '0';
        setTimeout(() => { if (hud) hud.style.display = 'none'; }, 500);
      }
    }, 3500);
  }
}

async function startInPageAutoScrape() {
  const btn    = document.getElementById('fintech-btn-scrape');
  const status = document.getElementById('fintech-status');
  const badge  = document.getElementById('fintech-pill-badge');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Sedang Auto-Scrolling...';
  }
  if (status) status.innerHTML = 'Menggulir halaman dan mengumpulkan konten...';

  const results = await runDeepPageScrape(8);
  collectedTexts = results;

  if (btn) {
    btn.disabled = false;
    btn.textContent = '⚡ Ulangi / Lanjutkan Scrape';
  }

  if (results.length > 0) {
    if (status) status.innerHTML = `✅ <strong>Berhasil mengumpulkan ${results.length} konten!</strong><br>Klik <strong>"🌐 Salin HTML Source"</strong> lalu tempel pada Card B di Web Detektor.`;
    if (badge) {
      badge.textContent = `${results.length} Konten`;
      badge.style.background = '#16a34a';
    }
  } else {
    if (status) status.innerHTML = `⚠️ Tidak ada konten baru ditemukan. Coba klik link pencarian topik di atas.`;
    if (badge) {
      badge.textContent = '0 Konten';
      badge.style.background = '#dc2626';
    }
  }
}

// ── Algoritma Ekstraksi Konten Multi-Platform ─────────────────────────────────
async function runDeepPageScrape(maxScrolls = 8) {
  const seen = new Set();
  const collected = [];
  const isSearchPage = window.location.pathname.includes('/search') || window.location.search.includes('?s=') || window.location.search.includes('query=');
  const isX = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
  const isNews = window.location.hostname.includes('mediakonsumen.com') || window.location.hostname.includes('detik.com') || window.location.hostname.includes('kompas.com') || window.location.hostname.includes('news.google.com');

  function extractCurrent() {
    if (isX) {
      // 1. Expand "Show more" / "Selengkapnya" EXCLUSIVELY inside tweet text body
      const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
      tweetArticles.forEach(article => {
        const tweetTextEl = article.querySelector('div[data-testid="tweetText"]');
        if (tweetTextEl) {
          const expandBtns = Array.from(tweetTextEl.querySelectorAll('span, div[role="button"]')).filter(el => {
            const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
            return txt === 'show more' || txt === 'tampilkan lebih banyak' || txt === 'selengkapnya';
          });
          expandBtns.forEach(btn => {
            const link = btn.closest('a');
            if (!link || !link.getAttribute('href') || !link.getAttribute('href').includes('/i/')) {
              try { btn.click(); } catch(e) {}
            }
          });
        }
      });

      // 2. Twitter / X extraction
      const tweetContainers = Array.from(document.querySelectorAll('article[data-testid="tweet"], div[data-testid="tweetText"]'));
      tweetContainers.forEach(el => {
        const raw = (el.innerText || el.textContent || '').trim();
        const cleaned = raw.replace(/\s+/g, ' ');
        if (cleaned.length >= 25) {
          const key = cleaned.slice(0, 60).toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            collected.push(cleaned);
          }
        }
      });
    } else if (isNews) {
      // News / MediaKonsumen extraction
      const newsContainers = Array.from(document.querySelectorAll([
        'article', 'article.des-post', 'div.des-post', 'h2.title', 'h1.title', 'h1.entry-title',
        '.entry-content', '.entry-content p', '.post-content', '.post-content p', '.entry-summary',
        '.article__content', '.article__content p', '.read__content', '.detail__body-text',
        'div[role="article"]', '.teaser', 'div.gsc-webResult', 'div.gs-title', 'div.gs-snippet',
        'h3', 'h4', '.comment-body p'
      ].join(', ')));
      newsContainers.forEach(el => {
        const raw = (el.innerText || el.textContent || '').trim();
        if (raw.length >= 35) {
          const cleaned = raw.replace(/\s+/g, ' ');
          const isHeaderJunk = cleaned.startsWith('KIRIM SURAT') || cleaned.startsWith('SURAT PEMBACA') || cleaned.startsWith('Copyright ©') || cleaned.startsWith('Panduan Komunitas') || cleaned.startsWith('Pedoman Perlindungan');
          if (!isHeaderJunk) {
            const key = cleaned.slice(0, 60).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              collected.push(cleaned);
            }
          }
        }
      });
    } else {
      // Facebook extraction
      const seeMoreButtons = Array.from(document.querySelectorAll('div[role="button"], span[role="button"]')).filter(b => {
        const txt = (b.innerText || '').toLowerCase();
        return txt.includes('lihat selengkapnya') || txt.includes('see more') || txt.includes('baca selengkapnya');
      });
      seeMoreButtons.forEach(b => { try { b.click(); } catch(e){} });

      const containers = Array.from(document.querySelectorAll('div[role="article"], div[role="feed"] > div, div[data-pagelet*="FeedUnit"], div[data-ad-comet-preview="message"], div[dir="auto"]'));
      containers.forEach(el => {
        const rawText = el.innerText || el.textContent || '';
        const cleaned = rawText.replace(/\s+/g, ' ').trim();

        if (cleaned.length >= 25) {
          const isButtonJunk = ['kirim pesan', 'suka', 'komentar', 'bagikan', 'ikuti', 'bagikan postingan', 'semua komentar'].includes(cleaned.toLowerCase());
          const isHeaderJunk = cleaned.startsWith('Facebook ©') || cleaned.startsWith('Menu navigasi');

          if (!isButtonJunk && !isHeaderJunk) {
            const hashKey = cleaned.slice(0, 75);
            if (!seen.has(hashKey)) {
              let isRelevant = isSearchPage ? true : PINJOL_KEYWORDS.some(kw => cleaned.toLowerCase().includes(kw));
              if (isRelevant) {
                seen.add(hashKey);
                collected.push(cleaned);
              }
            }
          }
        }
      });
    }
  }

  // Initial Scan
  extractCurrent();

  // Scroll loop
  for (let s = 0; s < maxScrolls; s++) {
    window.scrollBy({ top: 1200, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 600));
    extractCurrent();
  }

  return collected;
}

// Otomatis pasang widget jika pada Facebook, Twitter / X, atau Portal Berita
const targetHosts = ['facebook.com', 'x.com', 'twitter.com', 'mediakonsumen.com', 'detik.com', 'kompas.com', 'news.google.com'];
if (targetHosts.some(h => window.location.hostname.includes(h))) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(injectFloatingWidget, 1000);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(injectFloatingWidget, 1000));
  }
}
