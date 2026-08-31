// ─────────────────────────────────────────────────────────────────────────────
// popup.js — Unified Multi-Platform Controller: Facebook, 𝕏 Twitter/X, & Portal Berita
// Manifest V3 CSP-Compliant, Intelligent Multi-Page Auto-Crawler & Continuous Stream Accumulator
// ─────────────────────────────────────────────────────────────────────────────

let activeTab = null;
let currentPlatformMode = 'facebook'; // 'facebook' | 'twitter' | 'news'
let lastDetectedCount = 0;
let currentNewsPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  bindEventListeners();
  await initTab();
});

function bindEventListeners() {
  // 1. Platform Switcher Tabs (3 Modes)
  const tabBtnFb   = document.getElementById('tab-btn-fb');
  const tabBtnX    = document.getElementById('tab-btn-x');
  const tabBtnNews = document.getElementById('tab-btn-news');

  if (tabBtnFb)   tabBtnFb.addEventListener('click', () => setPlatformMode('facebook'));
  if (tabBtnX)    tabBtnX.addEventListener('click', () => setPlatformMode('twitter'));
  if (tabBtnNews) tabBtnNews.addEventListener('click', () => setPlatformMode('news'));

  // 2. Facebook Category Filter Tabs
  document.querySelectorAll('#fb-cat-tabs .cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#fb-cat-tabs .cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterPresetKeywords('fb', tab.getAttribute('data-cat'));
    });
  });

  // 3. Twitter / X Category Filter Tabs
  document.querySelectorAll('#x-cat-tabs .cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#x-cat-tabs .cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterPresetKeywords('x', tab.getAttribute('data-cat'));
    });
  });

  // 4. Portal Berita Category Filter Tabs
  document.querySelectorAll('#news-cat-tabs .cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#news-cat-tabs .cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterPresetKeywords('news', tab.getAttribute('data-cat'));
    });
  });

  // 5. Facebook Preset Search Buttons
  document.querySelectorAll('.fb-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      const input = document.getElementById('custom-fb-query');
      if (input && q) input.value = q;
      if (q) openFBSearch(q);
    });
  });

  // 6. Twitter / X Preset Search Buttons
  document.querySelectorAll('.x-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      const input = document.getElementById('custom-x-query');
      if (input && q) input.value = q;
      if (q) openXSearch(q);
    });
  });

  // 7. Portal Berita Preset Search Buttons
  document.querySelectorAll('.news-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      const target = btn.getAttribute('data-target') || 'mediakonsumen';
      const input = document.getElementById('custom-news-query');
      const selTarget = document.getElementById('custom-news-target');
      if (input && q) input.value = q;
      if (selTarget && target) selTarget.value = target;
      if (q) openNewsSearch(target, q);
    });
  });

  // 8. Custom Search Buttons
  const customFbBtn = document.getElementById('btn-custom-fb-search');
  if (customFbBtn) {
    customFbBtn.addEventListener('click', () => {
      const input = document.getElementById('custom-fb-query');
      const q = input ? input.value.trim() : 'pinjol sebar data';
      openFBSearch(q || 'pinjol sebar data');
    });
  }

  const customXBtn = document.getElementById('btn-custom-x-search');
  if (customXBtn) {
    customXBtn.addEventListener('click', () => {
      const input = document.getElementById('custom-x-query');
      const q = input ? input.value.trim() : 'pinjol sebar data';
      openXSearch(q || 'pinjol sebar data');
    });
  }

  const customNewsBtn = document.getElementById('btn-custom-news-search');
  if (customNewsBtn) {
    customNewsBtn.addEventListener('click', () => {
      const input = document.getElementById('custom-news-query');
      const targetSel = document.getElementById('custom-news-target');
      const q = input ? input.value.trim() : 'teror pinjol ilegal';
      const target = targetSel ? targetSel.value : 'mediakonsumen';
      openNewsSearch(target, q || 'teror pinjol ilegal');
    });
  }

  // 9. Portal Berita Multi-Page Navigation Buttons
  document.querySelectorAll('.news-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageNum = parseInt(btn.getAttribute('data-page'), 10) || 1;
      goToNewsPage(pageNum);
    });
  });

  const prevPageBtn = document.getElementById('btn-prev-page');
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentNewsPage > 1) goToNewsPage(currentNewsPage - 1);
    });
  }

  const nextPageBtn = document.getElementById('btn-next-page');
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      goToNewsPage(currentNewsPage + 1);
    });
  }

  const resetNewsBtn = document.getElementById('btn-reset-news-cache');
  if (resetNewsBtn) {
    resetNewsBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(['__fintech_news_storage', '__fintech_news_visited_pages']);
      lastDetectedCount = 0;
      updateDetectedBadge(0, 0, 'Artikel');
      showToast('🗑️ Riwayat Akumulasi Berita Dikosongkan!');
      const statusEl = document.getElementById('status-text');
      if (statusEl) {
        statusEl.innerHTML = '✨ <strong>Riwayat akumulasi berita dikosongkan.</strong> Silakan jelajahi Halaman 1, 2, 3 untuk mengumpulkan artikel baru.';
      }
    });
  }

  // Deep Full-Article News Extractor Button
  const deepExtractNewsBtn = document.getElementById('btn-deep-extract-news');
  if (deepExtractNewsBtn) {
    deepExtractNewsBtn.addEventListener('click', runSinglePageDeepNewsExtraction);
  }

  // Inputs Keydown (Enter)
  const inputFb = document.getElementById('custom-fb-query');
  if (inputFb) {
    inputFb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openFBSearch(inputFb.value.trim() || 'pinjol sebar data');
    });
  }

  const inputX = document.getElementById('custom-x-query');
  if (inputX) {
    inputX.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openXSearch(inputX.value.trim() || 'pinjol sebar data');
    });
  }

  const inputNews = document.getElementById('custom-news-query');
  if (inputNews) {
    inputNews.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const targetSel = document.getElementById('custom-news-target');
        openNewsSearch(targetSel ? targetSel.value : 'mediakonsumen', inputNews.value.trim() || 'teror pinjol ilegal');
      }
    });
  }

  // 10. Copy RAW HTML button (Main Primary Action)
  const copyHtmlBtn = document.getElementById('copy-html-btn');
  if (copyHtmlBtn) {
    copyHtmlBtn.addEventListener('click', copyPageSourceHTML);
  }

  // 11. Auto-scroll button (Routes to active platform)
  const autoScrollBtn = document.getElementById('btn-auto-scroll');
  if (autoScrollBtn) {
    autoScrollBtn.addEventListener('click', runPlatformAutoScroll);
  }
}

function setPlatformMode(mode) {
  currentPlatformMode = mode;
  const tabFb   = document.getElementById('tab-btn-fb');
  const tabX    = document.getElementById('tab-btn-x');
  const tabNews = document.getElementById('tab-btn-news');

  const viewFb   = document.getElementById('view-facebook');
  const viewX    = document.getElementById('view-twitter');
  const viewNews = document.getElementById('view-news');
  const scrollBtnText = document.getElementById('scrape-text');
  const depthSelect = document.getElementById('scroll-depth-select');

  [tabFb, tabX, tabNews].forEach(t => t && t.classList.remove('active'));
  [viewFb, viewX, viewNews].forEach(v => v && v.classList.remove('active'));

  if (mode === 'facebook') {
    if (tabFb) tabFb.classList.add('active');
    if (viewFb) viewFb.classList.add('active');
    if (scrollBtnText) scrollBtnText.textContent = 'Mulai Auto-Scroll Facebook';
    if (depthSelect) {
      depthSelect.innerHTML = `
        <option value="15">🚀 15x Scroll (Banyak)</option>
        <option value="25" selected>🔥 25x Deep Scroll (Ekstra Banyak)</option>
        <option value="40">⚡ 40x Ultra Scroll (Maksimal)</option>
      `;
    }
  } else if (mode === 'twitter') {
    if (tabX) tabX.classList.add('active');
    if (viewX) viewX.classList.add('active');
    if (scrollBtnText) scrollBtnText.textContent = 'Mulai Auto-Scroll Twitter/X';
    if (depthSelect) {
      depthSelect.innerHTML = `
        <option value="15">🚀 15x Scroll (Banyak)</option>
        <option value="25" selected>🔥 25x Deep Scroll (Ekstra Banyak)</option>
        <option value="40">⚡ 40x Ultra Scroll (Maksimal)</option>
      `;
    }
  } else {
    if (tabNews) tabNews.classList.add('active');
    if (viewNews) viewNews.classList.add('active');
    if (scrollBtnText) scrollBtnText.textContent = '⚡ Auto-Crawl & Baca Full Artikel';
    if (depthSelect) {
      depthSelect.innerHTML = `
        <option value="1">📄 1 Halaman Penuh (Deep Extract)</option>
        <option value="2" selected>🔥 Auto 2 Halaman (Hal 1 ➔ Hal 2)</option>
        <option value="3">⚡ Auto 3 Halaman (Hal 1 ➔ Hal 3)</option>
        <option value="4">🌟 Auto 4 Halaman (Maksimal)</option>
      `;
    }
  }
}

function filterPresetKeywords(type, cat) {
  let selector = '.fb-preset-btn';
  if (type === 'x') selector = '.x-preset-btn';
  if (type === 'news') selector = '.news-preset-btn';

  document.querySelectorAll(selector).forEach(btn => {
    const btnCat = btn.getAttribute('data-cat');
    if (cat === 'all' || btnCat === cat) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });
}

// ── Inisialisasi & Deteksi Tab Aktif ──────────────────────────────────────────
async function initTab() {
  const iconEl   = document.getElementById('platform-icon');
  const nameEl   = document.getElementById('platform-name');
  const urlEl    = document.getElementById('platform-url');
  const badgeEl  = document.getElementById('platform-badge');
  const statusEl = document.getElementById('status-text');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;
    activeTab = tabs[0];
    const url = activeTab.url || '';
    urlEl.textContent = url;

    // Detect Current Page Number in News
    detectCurrentNewsPage(url);

    // Detect MediaKonsumen / Detik / Kompas / Google News
    if (url.includes('mediakonsumen.com') || url.includes('detik.com') || url.includes('kompas.com')) {
      setPlatformMode('news');
      iconEl.textContent = '📰';
      iconEl.style.background = '#fef3c7';
      iconEl.style.color = '#92400e';

      let siteName = 'Portal Berita';
      const targetSel = document.getElementById('custom-news-target');
      const inputQuery = document.getElementById('custom-news-query');

      if (url.includes('detik.com')) {
        siteName = 'Detik.com — Portal Berita Nasional';
        if (targetSel) targetSel.value = 'detik';
        try {
          const u = new URL(url);
          const q = u.searchParams.get('query') || u.searchParams.get('q');
          if (q && inputQuery) inputQuery.value = decodeURIComponent(q);
        } catch(e){}
      } else if (url.includes('kompas.com')) {
        siteName = 'Kompas.com — Portal Berita Nasional';
        if (targetSel) targetSel.value = 'kompas';
        try {
          const u = new URL(url);
          const q = u.searchParams.get('q') || u.searchParams.get('query');
          if (q && inputQuery) inputQuery.value = decodeURIComponent(q);
        } catch(e){}
      } else if (url.includes('mediakonsumen.com')) {
        siteName = 'MediaKonsumen — Surat Aduan Konsumen';
        if (targetSel) targetSel.value = 'mediakonsumen';
        try {
          const u = new URL(url);
          const q = u.searchParams.get('s') || u.searchParams.get('q');
          if (q && inputQuery) inputQuery.value = decodeURIComponent(q);
        } catch(e){}
      }

      nameEl.textContent = `${siteName} (Hal ${currentNewsPage})`;
      badgeEl.textContent = `📰 Hal ${currentNewsPage}`;
      badgeEl.className = 'platform-badge badge-news';
      statusEl.innerHTML = `✅ <strong>${siteName} aktif (Halaman ${currentNewsPage})!</strong><br>Klik <strong>"📖 Ekstrak Seluruh Full Artikel"</strong> atau <strong>"⚡ Mulai Auto-Crawl Berita"</strong> untuk memindai seluruh berita di halaman ini!`;
      await scanPageItemsQuietly('news');
    }
    // Detect Twitter / X
    else if (url.includes('x.com') || url.includes('twitter.com')) {
      setPlatformMode('twitter');
      iconEl.textContent = '𝕏';
      iconEl.style.background = '#0f172a';
      iconEl.style.color = '#ffffff';

      if (url.includes('/search')) {
        nameEl.textContent = 'Twitter / X — Pencarian Live Tweet';
        badgeEl.textContent = '𝕏 Live Active';
        badgeEl.className = 'platform-badge badge-done';
        statusEl.innerHTML = '✅ <strong>Halaman pencarian Twitter / X aktif!</strong><br>Pilih kedalaman scroll lalu klik <strong>"Mulai Auto-Scroll"</strong> untuk mengekstrak puluhan tweet terbaru.';
      } else {
        nameEl.textContent = 'Twitter / X — Linimasa / Profil';
        badgeEl.textContent = '𝕏 Aktif';
        badgeEl.className = 'platform-badge badge-x';
        statusEl.innerHTML = '💡 <em>Tips:</em> Klik salah satu kata kunci Twitter di atas untuk membuka linimasa cuitan.';
      }
      await scanPageItemsQuietly('twitter');
    }
    // Detect Facebook
    else if (url.includes('facebook.com')) {
      setPlatformMode('facebook');
      iconEl.textContent = '📘';
      iconEl.style.background = '#eff6ff';
      iconEl.style.color = '#1e40af';

      if (url.includes('/search/')) {
        nameEl.textContent = 'Facebook — Halaman Pencarian';
        badgeEl.textContent = 'Siap Salin HTML';
        badgeEl.className = 'platform-badge badge-done';
        statusEl.innerHTML = '✅ <strong>Halaman pencarian Facebook aktif!</strong><br>Pilih kedalaman scroll lalu klik <strong>"Mulai Auto-Scroll"</strong> untuk mengumpulkan puluhan postingan.';
      } else {
        nameEl.textContent = 'Facebook — Beranda / Grup';
        badgeEl.textContent = 'Facebook Aktif';
        badgeEl.className = 'platform-badge badge-fb';
        statusEl.innerHTML = '💡 <em>Tips:</em> Klik salah satu kata kunci Facebook di atas untuk membuka postingan publik.';
      }
      await scanPageItemsQuietly('facebook');
    }
    // General Webpage
    else {
      iconEl.textContent = '🌐';
      iconEl.style.background = '#eff6ff';
      nameEl.textContent = 'Halaman Web Aktif';
      badgeEl.textContent = 'Siap';
      badgeEl.className = 'platform-badge badge-fb';
      statusEl.innerHTML = '👉 Anda bisa langsung klik tombol hijau <strong>"🌐 Salin HTML Source"</strong> atau buka topik Facebook / Twitter / Berita di atas.';
    }
  } catch (e) {
    nameEl.textContent = 'Ekstensi Siap';
  }
}

function detectCurrentNewsPage(url) {
  let page = 1;
  const pageMatch = url.match(/page\/(\d+)/i) || url.match(/[?&]page=(\d+)/i) || url.match(/gsc\.page=(\d+)/i);
  if (pageMatch) {
    page = parseInt(pageMatch[1], 10) || 1;
  }
  currentNewsPage = page;

  // Highlight active page button in popup
  document.querySelectorAll('.news-page-btn').forEach(btn => {
    const p = parseInt(btn.getAttribute('data-page'), 10);
    if (p === currentNewsPage) {
      btn.classList.add('active');
      btn.style.background = '#b45309';
      btn.style.color = '#ffffff';
      btn.style.borderColor = '#b45309';
    } else {
      btn.classList.remove('active');
      btn.style.background = '#ffffff';
      btn.style.color = '#92400e';
      btn.style.borderColor = '#fde68a';
    }
  });
}

function buildNewsUrlForPage(baseUrl, targetPage) {
  let q = 'teror pinjol ilegal';
  try {
    const inputQ = document.getElementById('custom-news-query');
    if (inputQ && inputQ.value.trim()) q = inputQ.value.trim();
    if (baseUrl.includes('?s=')) {
      const urlObj = new URL(baseUrl);
      q = urlObj.searchParams.get('s') || q;
    } else if (baseUrl.includes('query=')) {
      const urlObj = new URL(baseUrl);
      q = urlObj.searchParams.get('query') || q;
    } else if (baseUrl.includes('?q=')) {
      const urlObj = new URL(baseUrl);
      q = urlObj.searchParams.get('q') || q;
    }
  } catch(e){}

  if (baseUrl.includes('kompas.com')) {
    if (targetPage === 1) return `https://search.kompas.com/search/?q=${encodeURIComponent(q)}`;
    return `https://search.kompas.com/search/?q=${encodeURIComponent(q)}&page=${targetPage}#gsc.tab=0&gsc.page=${targetPage}`;
  } else if (baseUrl.includes('detik.com')) {
    return `https://www.detik.com/search/searchall?query=${encodeURIComponent(q)}&page=${targetPage}`;
  } else if (baseUrl.includes('mediakonsumen.com')) {
    if (targetPage === 1) return `https://mediakonsumen.com/?s=${encodeURIComponent(q)}`;
    return `https://mediakonsumen.com/page/${targetPage}/?s=${encodeURIComponent(q)}`;
  }
  return baseUrl;
}

// ── Pindah Halaman Berita Multi-Page ──────────────────────────────────────────
async function goToNewsPage(targetPage) {
  if (!activeTab || !activeTab.id) return;
  const currentUrl = activeTab.url || '';
  const targetUrl = buildNewsUrlForPage(currentUrl, targetPage);

  currentNewsPage = targetPage;
  detectCurrentNewsPage(targetUrl);

  const statusEl = document.getElementById('status-text');
  if (statusEl) {
    statusEl.innerHTML = `⏳ <strong>Membuka Halaman ${targetPage}...</strong><br>Artikel dari halaman sebelumnya tetap aman tersimpan di memori.`;
  }

  await chrome.tabs.update(activeTab.id, { url: targetUrl });
}

// ── Buka URL Pencarian Facebook ───────────────────────────────────────────────
async function openFBSearch(query) {
  const targetUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}`;
  const statusEl = document.getElementById('status-text');
  statusEl.innerHTML = `⏳ <strong>Membuka pencarian Facebook: "${query}"...</strong><br>Tunggu 2–3 detik sampai postingan termuat, lalu klik tombol <strong>"Mulai Auto-Scroll"</strong>.`;
  
  if (activeTab && activeTab.id) {
    await chrome.tabs.update(activeTab.id, { url: targetUrl });
    activeTab = { ...activeTab, url: targetUrl }; // Update URL lokal agar tidak stale
  } else {
    chrome.tabs.create({ url: targetUrl });
  }
  _ensureScrollBtnEnabled();
}

// ── Buka URL Pencarian Twitter / X (f=live untuk Tweet Terkini) ───────────────
async function openXSearch(query) {
  const domain = (activeTab?.url || '').includes('twitter.com') ? 'twitter.com' : 'x.com';
  const targetUrl = `https://${domain}/search?q=${encodeURIComponent(query)}&f=live`;
  const statusEl = document.getElementById('status-text');
  statusEl.innerHTML = `⏳ <strong>Membuka pencarian Twitter/X (Live): "${query}"...</strong><br>Tunggu 2–3 detik sampai linimasa termuat, lalu klik tombol <strong>"Mulai Auto-Scroll"</strong>.`;
  
  if (activeTab && activeTab.id) {
    await chrome.tabs.update(activeTab.id, { url: targetUrl });
    activeTab = { ...activeTab, url: targetUrl }; // Update URL lokal agar tidak stale
  } else {
    chrome.tabs.create({ url: targetUrl });
  }
  _ensureScrollBtnEnabled();
}

// ── Buka URL Pencarian Portal Berita ──────────────────────────────────────────
async function openNewsSearch(target, query) {
  let targetUrl = `https://mediakonsumen.com/?s=${encodeURIComponent(query)}`;
  if (target === 'detik') {
    targetUrl = `https://www.detik.com/search/searchall?query=${encodeURIComponent(query)}`;
  } else if (target === 'kompas') {
    targetUrl = `https://search.kompas.com/search/?q=${encodeURIComponent(query)}`;
  }

  currentNewsPage = 1;
  const statusEl = document.getElementById('status-text');
  statusEl.innerHTML = `⏳ <strong>Membuka ${target.toUpperCase()}: "${query}"...</strong><br>Tunggu halaman termuat penuh, lalu klik <strong>"⚡ Auto-Crawl &amp; Baca Full Artikel"</strong>.`;

  if (activeTab && activeTab.id) {
    await chrome.tabs.update(activeTab.id, { url: targetUrl });
    activeTab = { ...activeTab, url: targetUrl }; // Update URL lokal agar tidak stale
  } else {
    chrome.tabs.create({ url: targetUrl });
  }
  _ensureScrollBtnEnabled();
}

// ── Scan Ringan Hitung Postingan / Tweet / Artikel di Halaman ─────────────────
async function scanPageItemsQuietly(platform) {
  if (!activeTab || !activeTab.id) return;
  // Tunda 600ms agar halaman punya waktu mencapai document_idle sebelum scripting
  await new Promise(r => setTimeout(r, 600));
  try {
    let scanFn = countPostsInDOM;
    if (platform === 'twitter') scanFn = countTweetsInDOM;
    if (platform === 'news') scanFn = countNewsInDOM;

    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: scanFn
    });
    const info = results?.[0]?.result;

    if (platform === 'news') {
      const storageData = await chrome.storage.local.get(['__fintech_news_storage']);
      const storedArticles = storageData.__fintech_news_storage || [];
      const currentCount = info?.count || 0;
      const totalCombined = Math.max(storedArticles.length, currentCount);

      if (totalCombined > 0) {
        lastDetectedCount = totalCombined;
        updateDetectedBadge(totalCombined, info?.sizeKb || 200, 'Artikel');
      } else {
        updateDetectedBadge(0, 0, 'Artikel');
      }
    } else if (info && info.count > 0) {
      lastDetectedCount = info.count;
      const unit = platform === 'twitter' ? 'Tweet' : 'Postingan';
      updateDetectedBadge(info.count, info.sizeKb, unit);
    } else {
      updateDetectedBadge(0, 0, platform === 'twitter' ? 'Tweet' : 'Postingan');
    }
  } catch (e) {
    // Gagal scan = halaman masih loading, abaikan saja
  }
}

function updateDetectedBadge(count, sizeKb, unit = 'Konten') {
  const badge = document.getElementById('live-detected-badge');
  const btnText = document.getElementById('copy-html-btn-text');
  if (badge) {
    if (count > 0) {
      badge.textContent = `🎯 ${count} ${unit} (${Math.round(sizeKb / 1024 * 10) / 10} MB)`;
      badge.style.background = '#dcfce7';
      badge.style.color = '#166534';
    } else {
      badge.textContent = `🔍 0 ${unit} (Scroll dulu)`;
      badge.style.background = '#fef3c7';
      badge.style.color = '#92400e';
    }
  }
  if (btnText && count > 0) {
    btnText.textContent = `Salin HTML Source (${count} ${unit} Siap Uji)`;
  }
}

// ── DOM Scanner Helpers ───────────────────────────────────────────────────────
function countTweetsInDOM() {
  if (window.__fintech_accumulated_tweets && window.__fintech_accumulated_tweets.size > 0) {
    return {
      count: window.__fintech_accumulated_tweets.size,
      sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024)
    };
  }
  const elements = document.querySelectorAll('article[data-testid="tweet"], div[data-testid="tweetText"]');
  const seen = new Set();
  elements.forEach(el => {
    const txt = (el.innerText || '').trim();
    if (txt.length >= 25) seen.add(txt.slice(0, 50).toLowerCase());
  });
  return {
    count: seen.size,
    sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024)
  };
}

function countPostsInDOM() {
  if (window.__fintech_accumulated_fb && window.__fintech_accumulated_fb.size > 0) {
    return {
      count: window.__fintech_accumulated_fb.size,
      sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024)
    };
  }
  const targetSelectors = [
    'div[role="feed"] > div',
    'div[role="article"]',
    'div[dir="auto"]',
    'span[dir="auto"]',
    'div[data-ad-comet-preview="message"]',
    'div[data-pagelet*="FeedUnit"]'
  ];
  const seen = new Set();
  const elements = document.querySelectorAll(targetSelectors.join(', '));
  elements.forEach(el => {
    const txt = (el.innerText || '').trim();
    if (txt.length >= 30) seen.add(txt.slice(0, 50).toLowerCase());
  });
  return {
    count: seen.size,
    sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024)
  };
}

function countNewsInDOM() {
  if (window.__fintech_accumulated_news && window.__fintech_accumulated_news.size > 0) {
    return {
      count: window.__fintech_accumulated_news.size,
      sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024)
    };
  }
  const selectors = [
    'article', 'article.des-post', 'div.des-post', 'h2.title', '.entry-content', '.entry-summary',
    '.article__content', '.read__content', '.detail__body-text', 'div[role="article"]', '.teaser', 'h3, h4',
    'div.gsc-webResult', 'div.gs-title', 'div.gs-snippet'
  ];
  const elements = document.querySelectorAll(selectors.join(', '));
  const seen = new Set();
  elements.forEach(el => {
    const txt = (el.innerText || '').trim();
    if (txt.length >= 35) seen.add(txt.slice(0, 50).toLowerCase());
  });
  return {
    count: seen.size,
    sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024)
  };
}

// ── Router Auto-Scroll Sesuai Platform Aktif ──────────────────────────────────
// Selalu reset tombol terlebih dulu agar tidak pernah stuck disabled
function _ensureScrollBtnEnabled() {
  const btn = document.getElementById('btn-auto-scroll');
  const btnText = document.getElementById('scrape-text');
  const spinner = document.getElementById('scrape-spinner');
  if (btn) btn.disabled = false;
  if (spinner) spinner.style.display = 'none';
  // Teks tombol disesuaikan dengan mode
  if (btnText) {
    if (currentPlatformMode === 'news') btnText.textContent = '⚡ Auto-Crawl & Baca Full Artikel';
    else if (currentPlatformMode === 'twitter') btnText.textContent = 'Mulai Auto-Scroll Twitter/X';
    else btnText.textContent = 'Mulai Auto-Scroll Facebook';
  }
}

async function runPlatformAutoScroll() {
  // Selalu refresh activeTab real-time sebelum routing
  try {
    const freshTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (freshTabs && freshTabs.length > 0) activeTab = freshTabs[0];
  } catch(e) {}

  if (!activeTab || !activeTab.id) {
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.innerHTML = '⚠️ <strong>Tab browser aktif tidak ditemukan.</strong> Buka tab baru dan navigasi ke portal berita atau media sosial.';
    return;
  }

  const url = activeTab.url || '';
  if (url.includes('x.com') || url.includes('twitter.com')) {
    await autoScrollTwitter();
  } else if (url.includes('mediakonsumen.com') || url.includes('detik.com') || url.includes('kompas.com')) {
    await autoScrollNewsSmartMultiPage();
  } else if (url.includes('facebook.com') || currentPlatformMode === 'facebook') {
    await autoScrollFacebook();
  } else if (currentPlatformMode === 'twitter') {
    await autoScrollTwitter();
  } else if (currentPlatformMode === 'news') {
    await autoScrollNewsSmartMultiPage();
  } else {
    // Fallback: tampilkan pesan
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.innerHTML = '⚠️ <strong>Platform tidak dikenali.</strong> Buka salah satu platform: Facebook, Twitter/X, MediaKonsumen, Detik.com, atau Kompas.com.';
  }
}

// ── Auto-Scroll Facebook (DOM Scroll + Accumulator) ───────────────────────────
async function autoScrollFacebook() {
  const depthSelect = document.getElementById('scroll-depth-select');
  const maxSteps = depthSelect ? parseInt(depthSelect.value, 10) : 25;

  const btn      = document.getElementById('btn-auto-scroll');
  const btnText  = document.getElementById('scrape-text');
  const spinner  = document.getElementById('scrape-spinner');
  const statusEl = document.getElementById('status-text');

  btn.disabled = true;
  btnText.textContent = `Menggulir Facebook (${maxSteps}x)...`;
  spinner.style.display = 'block';
  statusEl.innerHTML = `🔄 <strong>Auto-Scrolling Facebook (${maxSteps} siklus) berlangsung...</strong><br>Mengumpulkan postingan &amp; memperluas struktur HTML.`;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (maxSteps) => {
        if (!window.__fintech_accumulated_fb) {
          window.__fintech_accumulated_fb = new Map();
        }
        const fbMap = window.__fintech_accumulated_fb;

        function captureVisible() {
          const selectors = [
            'div[role="feed"] > div', 'div[role="article"]',
            'div[data-ad-comet-preview="message"]', 'div[data-pagelet*="FeedUnit"]',
            'div[dir="auto"]'
          ];
          document.querySelectorAll(selectors.join(', ')).forEach(el => {
            const raw = (el.innerText || el.textContent || '').trim();
            if (raw.length >= 30) {
              const key = raw.slice(0, 60).toLowerCase();
              if (!fbMap.has(key)) fbMap.set(key, raw.replace(/\s+/g, ' '));
            }
          });
        }

        return (async () => {
          captureVisible();
          for (let i = 0; i < maxSteps; i++) {
            window.scrollBy({ top: 1400, behavior: 'smooth' });
            await new Promise(r => setTimeout(r, 700));
            captureVisible();
          }
          // Inject container
          let acc = document.getElementById('fintech-accumulated-posts');
          if (!acc) {
            acc = document.createElement('div');
            acc.id = 'fintech-accumulated-posts';
            acc.style.display = 'none';
            document.body.appendChild(acc);
          }
          const all = Array.from(fbMap.values());
          acc.innerHTML = all.map(t => `<article data-testid="fb-post" class="fintech-saved-fb"><div class="post-content">${t}</div></article>`).join('\n');
          return {
            count: fbMap.size,
            sizeKb: Math.round((document.documentElement.outerHTML || '').length / 1024),
            samples: all.slice(0, 3)
          };
        })();
      },
      args: [maxSteps]
    });

    const info = results?.[0]?.result || { count: 0, sizeKb: 0 };
    lastDetectedCount = info.count;
    updateDetectedBadge(info.count, info.sizeKb, 'Postingan');

    const sizeMb = (info.sizeKb / 1024).toFixed(2);
    statusEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="status-count">🎯 ${info.count} Postingan Facebook Terkumpul!</div>
        <span style="font-size:10px;font-weight:800;background:#1e40af;color:#ffffff;padding:2px 8px;border-radius:99px;">${sizeMb} MB HTML</span>
      </div>
      <div class="status-sub">Postingan Facebook berhasil dikumpulkan. Klik tombol hijau <strong>"🌐 Salin HTML Source"</strong> untuk analisis!</div>
    `;

    const prev = document.getElementById('preview-area');
    if (prev) {
      prev.style.display = 'block';
      prev.textContent = `[Hasil Auto-Scroll Facebook: ${info.count} Postingan]\n` +
        (info.samples || []).map((s, idx) => `• [Post ${idx+1}] ${s.slice(0, 110)}...`).join('\n') +
        `\n\nSiap dianalisis! Klik tombol hijau di atas.`;
    }

  } catch (err) {
    statusEl.innerHTML = `❌ <strong>Kendala auto-scroll Facebook:</strong> ${err.message}<br><small>Silakan langsung klik tombol hijau "Salin HTML Source".</small>`;
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Mulai Auto-Scroll Facebook Lagi';
    spinner.style.display = 'none';
  }

}


// ── Deep Auto-Scroll Twitter / X ─────────────────────────────────────────────
async function autoScrollTwitter() {
  const depthSelect = document.getElementById('scroll-depth-select');
  const maxSteps = depthSelect ? parseInt(depthSelect.value, 10) : 25;

  const btn      = document.getElementById('btn-auto-scroll');
  const btnText  = document.getElementById('scrape-text');
  const spinner  = document.getElementById('scrape-spinner');
  const statusEl = document.getElementById('status-text');

  btn.disabled = true;
  btnText.textContent = `Menggulir 𝕏 (${maxSteps}x)...`;
  spinner.style.display = 'block';
  statusEl.innerHTML = `🔄 <strong>Deep Auto-Scrolling Twitter / X (${maxSteps} siklus) berlangsung...</strong><br>Mengumpulkan linimasa tweet &amp; memperluas struktur HTML secara otomatis.`;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: inPageDeepTwitterScroller,
      args: [maxSteps]
    });

    const info = results?.[0]?.result || { count: 0, sizeKb: 0 };
    lastDetectedCount = info.count;
    updateDetectedBadge(info.count, info.sizeKb, 'Tweet');

    const sizeMb = (info.sizeKb / 1024).toFixed(2);

    statusEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="status-count">🎯 ${info.count} Tweet Terkumpul!</div>
        <span style="font-size:10px;font-weight:800;background:#0f172a;color:#ffffff;padding:2px 8px;border-radius:99px;">${sizeMb} MB HTML</span>
      </div>
      <div class="status-sub">Struktur DOM Twitter telah diperluas dengan <strong>${info.count} tweet terverifikasi</strong>.</div>
      <div style="margin-top:7px;font-size:11px;color:#166534;font-weight:700;">
        👉 Klik tombol hijau <strong>"🌐 Salin HTML Source (${info.count} Tweet)"</strong> di atas, lalu tempel di <strong>Card B Web Detektor</strong>!
      </div>
    `;

    const prev = document.getElementById('preview-area');
    prev.style.display = 'block';
    prev.textContent = `[Hasil Auto-Scroll 𝕏: ${info.count} Tweet Terdeteksi (${sizeMb} MB)]\n` + 
      (info.samples || []).map((s, idx) => `• [Tweet ${idx+1}] ${s.slice(0, 110)}...`).join('\n') +
      `\n\nSiap dianalisis! Klik tombol hijau di atas.`;

  } catch (err) {
    statusEl.innerHTML = `❌ <strong>Kendala auto-scroll Twitter:</strong> ${err.message}<br><small>Silakan langsung klik tombol hijau "Salin HTML Source".</small>`;
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Mulai Auto-Scroll Twitter Lagi';
    spinner.style.display = 'none';
  }
}

// ── In-Page Deep Scroller Function Twitter / X (With Continuous Accumulator) ──
async function inPageDeepTwitterScroller(maxSteps) {
  if (!window.__fintech_accumulated_tweets) {
    window.__fintech_accumulated_tweets = new Map();
  }
  const tweetMap = window.__fintech_accumulated_tweets;

  function captureCurrentVisible() {
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

    const tweetContainers = document.querySelectorAll('article[data-testid="tweet"], div[data-testid="tweetText"]');
    tweetContainers.forEach(el => {
      const raw = (el.innerText || el.textContent || '').trim();
      if (raw.length >= 25) {
        const clean = raw.replace(/\s+/g, ' ');
        const key = clean.slice(0, 60).toLowerCase();
        if (!tweetMap.has(key)) {
          tweetMap.set(key, clean);
        }
      }
    });
  }

  captureCurrentVisible();

  for (let i = 0; i < maxSteps; i++) {
    window.scrollBy({ top: 1400, behavior: 'smooth' });
    await new Promise(r => setTimeout(r, 650));
    captureCurrentVisible();
  }

  let accContainer = document.getElementById('fintech-accumulated-posts');
  if (!accContainer) {
    accContainer = document.createElement('div');
    accContainer.id = 'fintech-accumulated-posts';
    accContainer.style.display = 'none';
    document.body.appendChild(accContainer);
  }

  const allTweets = Array.from(tweetMap.values());
  accContainer.innerHTML = allTweets.map((t, idx) => `<article data-testid="tweet" class="fintech-saved-tweet"><div data-testid="tweetText">${t}</div></article>`).join('\n');

  const fullHtml = document.documentElement.outerHTML || '';
  return {
    count: tweetMap.size,
    sizeKb: Math.round(fullHtml.length / 1024),
    samples: allTweets.slice(0, 3)
  };
}

// ── DEEP FULL-ARTICLE EXTRACTION (SINGLE PAGE) ────────────────────────────────
// ── UNIVERSAL NEWS HTML PARSER (DETIK, KOMPAS, MEDIAKONSUMEN, GOOGLE NEWS, DLL) ──
function parseGenericNewsHtml(url, htmlText, defaultTitle = '') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // 1. Title
  const titleEl = doc.querySelector('h1.read__title, h1.detail__title, h1.title, h1.entry-title, h1.post-title, h1.headline, h1');
  const title = titleEl ? titleEl.innerText.trim() : (defaultTitle || doc.title || 'Artikel Berita');

  // 2. Author & Date
  const authorEl = doc.querySelector('.author, .penulis, .entry-author, a[rel="author"], .read__author, .detail__author, .credit-title-name, .credit');
  const author = authorEl ? authorEl.innerText.trim() : 'Redaksi / Jurnalis';

  const dateEl = doc.querySelector('.date, time, .tanggal, .entry-date, .read__time, .detail__date, .read__date, .published');
  const date = dateEl ? dateEl.innerText.trim() : '';

  // 3. Body Container Selectors
  const bodyContainer = doc.querySelector('.read__content, .detail__body-text, .itp_bodycontent, .entry-content, .post-content, .article__body, .read__article, .col-bs10-7, .detail-text, .content-detail, div[itemprop="articleBody"]');
  let paragraphs = [];

  if (bodyContainer) {
    const junk = bodyContainer.querySelectorAll('table, script, style, iframe, form, .link-sisip, .baca-juga, .parallax, .banner, .ad, .ads, .detail__tag, .tag, .share, .komentar, .widget, .sidebar, .related');
    junk.forEach(j => j.remove());

    paragraphs = Array.from(bodyContainer.querySelectorAll('p'))
      .map(p => (p.innerText || p.textContent || '').trim())
      .filter(t => {
        const l = t.toLowerCase();
        return t.length > 25 
          && !l.startsWith('baca juga') 
          && !l.startsWith('simak video') 
          && !l.startsWith('foto:')
          && !l.startsWith('advertisement')
          && !l.startsWith('copyright')
          && !l.startsWith('editor:')
          && !l.startsWith('redaksi:');
      });
  }

  // 4. Fallback search all substantive paragraphs in main/body
  if (paragraphs.length < 2 && doc.body) {
    const mainEl = doc.querySelector('main, #main, .main, article, #content, .content') || doc.body;
    paragraphs = Array.from(mainEl.querySelectorAll('p'))
      .map(p => (p.innerText || p.textContent || '').trim())
      .filter(t => {
        const l = t.toLowerCase();
        return t.length > 30
          && !l.startsWith('baca juga') 
          && !l.startsWith('simak video') 
          && !l.startsWith('foto:')
          && !l.startsWith('advertisement')
          && !l.startsWith('copyright')
          && !l.startsWith('redaksi:');
      });
  }

  // 5. Comments / Tanggapan Pembaca
  const comments = Array.from(doc.querySelectorAll('.comment-body p, .comment-content p'))
    .map(p => (p.innerText || p.textContent || '').trim())
    .filter(t => t.length > 20);

  const fullTextCombined = [
    `[Judul: ${title}]`,
    `[Penulis: ${author} | Tanggal: ${date}]`,
    '',
    paragraphs.join('\n\n'),
    comments.length > 0 ? ('\n[Tanggapan / Komentar Pembaca]:\n' + comments.join('\n')) : ''
  ].filter(Boolean).join('\n');

  return {
    url: url,
    title: title,
    author: author,
    date: date,
    paragraphs: paragraphs,
    comments: comments,
    fullTextCombined: fullTextCombined
  };
}

// ── DISCOVERY FUNCTION IN ACTIVE TAB (DISCOVER LINKS & CARDS) ─────────────────
function inPageDiscoverNewsLinks(maxArticles = 30) {
  const host = window.location.hostname;
  const isMediaKonsumen = host.includes('mediakonsumen.com');
  const isDetik = host.includes('detik.com');
  const isKompas = host.includes('kompas.com');

  const targetItems = [];
  // Clear old card markers
  document.querySelectorAll('[data-fintech-card-id]').forEach(el => el.removeAttribute('data-fintech-card-id'));

  const seenUrls = new Set();
  const allAnchors = Array.from(document.querySelectorAll('a[href], a[data-ctorig], a[data-href]'));

  allAnchors.forEach(a => {
    let rawHref = (a.getAttribute('data-ctorig') || a.getAttribute('data-href') || a.getAttribute('href') || '').trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;

    // Unwrap Google CSE redirect
    if (rawHref.includes('google.com/url') || rawHref.includes('/url?')) {
      try {
        const u = new URL(rawHref, window.location.origin);
        const qParam = u.searchParams.get('q') || u.searchParams.get('url');
        if (qParam && qParam.startsWith('http')) rawHref = qParam;
      } catch (e) {}
    }

    let href = rawHref;
    try {
      href = new URL(rawHref, window.location.origin).href;
    } catch (e) {
      return;
    }

    const cleanUrl = href.split('#')[0];

    if (isMediaKonsumen) {
      const isArt = (cleanUrl.includes('mediakonsumen.com/') && (cleanUrl.match(/\/\d{4}\/\d{2}\//) || cleanUrl.includes('/surat-pembaca/')))
        && !cleanUrl.includes('/category/') && !cleanUrl.includes('/tag/') && !cleanUrl.includes('/author/') && !cleanUrl.includes('/page/') && !cleanUrl.endsWith('/feed/');
      if (isArt && !seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        const card = a.closest('.des-post, article, div.des-post, li') || a.parentElement;
        if (card) { card.setAttribute('data-fintech-card-id', String(targetItems.length)); card.style.position = 'relative'; }
        const title = a.innerText.trim() || card?.querySelector('h2, h3, .title')?.innerText.trim() || '';
        targetItems.push({ url: cleanUrl, title: title, cardIndex: targetItems.length });
      }
    } else if (isDetik) {
      const isDetikArt = cleanUrl.includes('detik.com/') && (cleanUrl.includes('/d-') || cleanUrl.includes('/berita-') || cleanUrl.includes('/read/'));
      if (isDetikArt && !seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        const card = a.closest('article.list-content__item, article, div.media, div.list-content__item, li') || a.parentElement;
        if (card) { card.setAttribute('data-fintech-card-id', String(targetItems.length)); card.style.position = 'relative'; }
        const title = a.innerText.trim() || card?.querySelector('h2, h3, .media__title')?.innerText.trim() || '';
        targetItems.push({ url: cleanUrl, title: title, cardIndex: targetItems.length });
      }
    } else if (isKompas) {
      const isKompasArt = cleanUrl.includes('kompas.com/read/') && !cleanUrl.includes('/tag/') && !cleanUrl.includes('/author/');
      if (isKompasArt && !seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        const card = a.closest('div.articleItem, div.articleList, div.articleBox, div.gsc-webResult, div.gs-webResult, div.article__list, div.list__item, div.section-item, div.item, article, li, div') || a.parentElement;
        if (card) { card.setAttribute('data-fintech-card-id', String(targetItems.length)); card.style.position = 'relative'; }
        const title = a.innerText.trim() || card?.querySelector('h2, h3, .articleTitle, .article__title, .gs-title')?.innerText.trim() || '';
        targetItems.push({ url: cleanUrl, title: title, cardIndex: targetItems.length });
      }
    } else {
      if (cleanUrl.startsWith('http') && !seenUrls.has(cleanUrl) && cleanUrl.length > 25) {
        seenUrls.add(cleanUrl);
        const card = a.closest('article, div, li') || a.parentElement;
        if (card) { card.setAttribute('data-fintech-card-id', String(targetItems.length)); card.style.position = 'relative'; }
        targetItems.push({ url: cleanUrl, title: a.innerText.trim(), cardIndex: targetItems.length });
      }
    }
  });

  // Inject or prepare HUD in active page
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
        <span class="fintech-hud-page-badge" id="fintech-hud-page">Memindai</span>
      </div>
      <div class="fintech-hud-detail" id="fintech-hud-detail">Memulai pemindaian...</div>
      <div class="fintech-hud-progress-bg">
        <div class="fintech-hud-progress-bar" id="fintech-hud-bar" style="width:5%;"></div>
      </div>
    `;
    document.body.appendChild(hud);
  }
  hud.style.display = 'flex';
  hud.style.opacity = '1';

  return targetItems.slice(0, maxArticles);
}

// ── HIGHLIGHT CARD VISUALLY IN ACTIVE TAB ──────────────────────────────────────
function inPageHighlightCard(idx, total, title, paragraphCount = 0) {
  const hudDetail = document.getElementById('fintech-hud-detail');
  const hudBar = document.getElementById('fintech-hud-bar');
  const pct = Math.round(((idx + 1) / total) * 100);

  if (hudBar) hudBar.style.width = `${pct}%`;

  // Find exact card tagged with data-fintech-card-id
  let card = document.querySelector(`[data-fintech-card-id="${idx}"]`);
  if (!card) {
    const allCards = document.querySelectorAll('article, div.gsc-webResult, div.gs-webResult, div.article__list, div.list__item, .list-content__item, .des-post, div[role="article"]');
    card = allCards[idx] || allCards[0];
  }

  if (card) {
    try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e){}
    card.classList.add('fintech-card-active-scan');

    let tag = card.querySelector('.fintech-live-tag');
    if (!tag) {
      tag = document.createElement('span');
      tag.className = 'fintech-live-tag scanning';
      card.style.position = 'relative';
      card.appendChild(tag);
    }

    if (paragraphCount > 0) {
      tag.className = 'fintech-live-tag done';
      tag.textContent = `✅ ${paragraphCount} Paragraf Full`;
      card.classList.remove('fintech-card-active-scan');
      card.classList.add('fintech-card-scanned-done');
      if (hudDetail) hudDetail.innerHTML = `✅ [${idx + 1}/${total}] <strong>${title.slice(0, 42)}...</strong> (${paragraphCount} paragraf)`;
    } else {
      tag.className = 'fintech-live-tag scanning';
      tag.textContent = '⏳ Membaca Full Naskah...';
      if (hudDetail) hudDetail.innerHTML = `⏳ [${idx + 1}/${total}] Mengambil naskah: <strong>${title.slice(0, 42)}...</strong>`;
    }
  }
}

// ── AUTO-CRAWL CERDAS MULTI-PAGE PORTAL BERITA (POPUP CONTROLLER) ──────────────
async function autoScrollNewsSmartMultiPage() {
  const depthSelect = document.getElementById('scroll-depth-select');
  const maxPagesToCrawl = depthSelect ? (parseInt(depthSelect.value, 10) || 2) : 2;

  const btn      = document.getElementById('btn-auto-scroll');
  const btnText  = document.getElementById('scrape-text');
  const spinner  = document.getElementById('scrape-spinner');
  const statusEl = document.getElementById('status-text');

  // ── Selalu refresh activeTab dari Chrome API untuk mendapatkan URL terkini ──
  try {
    const freshTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!freshTabs || freshTabs.length === 0) {
      statusEl.innerHTML = `⚠️ <strong>Tab browser aktif tidak ditemukan.</strong> Coba buka tab baru dan navigasi ke portal berita.`;
      return;
    }
    activeTab = freshTabs[0];
  } catch(e) {
    statusEl.innerHTML = `⚠️ <strong>Gagal membaca tab aktif:</strong> ${e.message}`;
    return;
  }

  // ── Guard: Jika tab aktif adalah chrome:// atau newtab, navigasi dulu ke portal ──
  const currentTabUrl = activeTab?.url || '';
  const isRestrictedUrl = currentTabUrl.startsWith('chrome://') || currentTabUrl.startsWith('chrome-extension://') || currentTabUrl.startsWith('about:') || currentTabUrl === '';

  if (isRestrictedUrl) {
    // Auto-navigate to selected portal
    const targetSel = document.getElementById('custom-news-target');
    const queryInput = document.getElementById('custom-news-query');
    const target = targetSel ? targetSel.value : 'mediakonsumen';
    const query = (queryInput && queryInput.value.trim()) ? queryInput.value.trim() : 'teror pinjol ilegal';
    await openNewsSearch(target, query);
    statusEl.innerHTML = `⏳ <strong>Membuka portal berita...</strong><br>Tunggu halaman termuat penuh, lalu klik kembali <strong>"⚡ Auto-Crawl & Baca Full Artikel"</strong>.`;
    return;
  }

  // ── Guard: Pastikan tab berada di portal berita yang dikenali ──
  const isKnownNewsPortal = currentTabUrl.includes('mediakonsumen.com') || currentTabUrl.includes('detik.com') || currentTabUrl.includes('kompas.com');
  if (!isKnownNewsPortal) {
    statusEl.innerHTML = `⚠️ <strong>Halaman ini bukan portal berita yang didukung.</strong><br>Silakan buka <strong>MediaKonsumen, Detik.com, atau Kompas.com</strong> terlebih dahulu, lalu coba lagi.`;
    return;
  }

  btn.disabled = true;
  btnText.textContent = `Meng-crawl & Baca Full (Hal 1 ➔ ${maxPagesToCrawl})...`;
  spinner.style.display = 'block';

  try {
    let combinedMap = new Map();
    let currentUrl = activeTab?.url || '';

    // Hapus fragment (#gsc.tab=0, dll) dari URL agar tidak mengganggu navigasi
    try { currentUrl = new URL(currentUrl).origin + new URL(currentUrl).pathname + new URL(currentUrl).search; } catch(e){}

    // Reset & detect halaman saat ini dari URL yang baru
    detectCurrentNewsPage(currentUrl);

    // Scoped storage check by current domain to avoid cross-domain mixture
    const hostDomain = (new URL(currentUrl)).hostname;
    const existingStorage = await chrome.storage.local.get(['__fintech_news_storage', '__fintech_news_domain']);
    if (existingStorage.__fintech_news_domain && hostDomain.includes(existingStorage.__fintech_news_domain)) {
      (existingStorage.__fintech_news_storage || []).forEach(art => {
        const k = typeof art === 'string' ? art.slice(0, 60).toLowerCase() : (art.title || '').slice(0, 60).toLowerCase();
        combinedMap.set(k, art);
      });
    }

    let startPage = currentNewsPage || 1;
    let endPage = startPage + maxPagesToCrawl - 1;

    for (let page = startPage; page <= endPage; page++) {
      statusEl.innerHTML = `🔄 <strong>Sedang mengumpulkan &amp; membaca full artikel di Halaman ${page}...</strong><br>Mengambil seluruh naskah berita lengkap langsung ke sumber portal.`;

      // 1. Navigation handling
      if (page !== currentNewsPage) {
        const targetUrl = buildNewsUrlForPage(currentUrl, page);
        await chrome.tabs.update(activeTab.id, { url: targetUrl });
        currentNewsPage = page;
        detectCurrentNewsPage(targetUrl);
        await new Promise(r => setTimeout(r, 2600));
      }

      // 2. Discover article links from active tab
      const scanResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: inPageDiscoverNewsLinks,
        args: [25]
      });

      const discoveredItems = scanResults?.[0]?.result || [];

      // 3. For each discovered link, FETCH and PARSE in POPUP context (NO CORS RESTRICTION!)
      for (let i = 0; i < discoveredItems.length; i++) {
        const item = discoveredItems[i];

        // Step A: Highlight active card in page
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: inPageHighlightCard,
          args: [i, discoveredItems.length, item.title, 0]
        });

        // Step B: Fetch full article in popup context
        let fetchUrl = item.url;
        if (fetchUrl.includes('detik.com') && !fetchUrl.includes('single=1')) {
          fetchUrl += (fetchUrl.includes('?') ? '&single=1' : '?single=1');
        } else if (fetchUrl.includes('kompas.com') && !fetchUrl.includes('page=all')) {
          fetchUrl += (fetchUrl.includes('?') ? '&page=all' : '?page=all');
        }

        try {
          const resp = await fetch(fetchUrl);
          if (resp.ok) {
            const htmlText = await resp.text();
            let finalHtml = htmlText;
            let realUrl = fetchUrl;

            // Handle Google News redirect
            if (fetchUrl.includes('news.google.com/articles/')) {
              const redirectMatch = htmlText.match(/<a[^>]+href="([^"]+)"[^>]*>/i);
              if (redirectMatch && redirectMatch[1] && redirectMatch[1].startsWith('http')) {
                realUrl = redirectMatch[1];
                try {
                  const subResp = await fetch(realUrl);
                  if (subResp.ok) finalHtml = await subResp.text();
                } catch(e){}
              }
            }

            const parsed = parseGenericNewsHtml(realUrl, finalHtml, item.title);

            if (parsed.paragraphs.length > 0) {
              const key = (parsed.title || item.title).slice(0, 60).toLowerCase();
              combinedMap.set(key, parsed.fullTextCombined);

              // Update Card Tag in webpage to Done
              await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: inPageHighlightCard,
                args: [i, discoveredItems.length, parsed.title, parsed.paragraphs.length]
              });
            }
          }
        } catch (err) {
          console.warn('[Popup Crawler] Gagal fetch artikel:', item.url, err);
        }

        await new Promise(r => setTimeout(r, 200));
      }

      // Save to chrome storage after each page
      const currentList = Array.from(combinedMap.values());
      await chrome.storage.local.set({ 
        '__fintech_news_storage': currentList,
        '__fintech_news_domain': hostDomain
      });

      lastDetectedCount = currentList.length;
      updateDetectedBadge(currentList.length, 450, 'Artikel');

      if (page < endPage) {
        statusEl.innerHTML = `✅ <strong>Halaman ${page} selesai! (${currentList.length} total artikel).</strong> Berpindah ke <strong>Halaman ${page + 1}</strong>...`;
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    const finalArticlesArray = Array.from(combinedMap.values());
    const totalCombined = finalArticlesArray.length;

    // Inject clean DOM container into active tab
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (articles) => {
        let accContainer = document.getElementById('fintech-accumulated-posts');
        if (!accContainer) {
          accContainer = document.createElement('div');
          accContainer.id = 'fintech-accumulated-posts';
          accContainer.style.display = 'none';
          document.body.appendChild(accContainer);
        }
        accContainer.innerHTML = articles.map(t => `<article class="fintech-saved-news full-article"><div class="entry-content">${t}</div></article>`).join('\n');
        
        const hudDetail = document.getElementById('fintech-hud-detail');
        const hudBar = document.getElementById('fintech-hud-bar');
        if (hudDetail) hudDetail.innerHTML = `🎉 <strong>Crawl Selesai!</strong> Berhasil mengumpulkan <strong>${articles.length} artikel utuh</strong>.`;
        if (hudBar) hudBar.style.width = '100%';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      args: [finalArticlesArray]
    });

    statusEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="status-count">🎯 ${totalCombined} Artikel Lengkap Terkumpul!</div>
        <span style="font-size:10px;font-weight:800;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;">Hal ${startPage}–${endPage}</span>
      </div>
      <div class="status-sub">Telah selesai meng-crawl dari <strong>Halaman ${startPage} sampai Halaman ${endPage}</strong> (${totalCombined} artikel berita utuh dengan seluruh isi paragraf).</div>
      <div style="margin-top:7px;font-size:11px;color:#166534;font-weight:700;">
        👉 Klik tombol hijau <strong>"🌐 Salin HTML Source (${totalCombined} Artikel)"</strong> di atas, lalu tempel di <strong>Card B Web Detektor</strong>!
      </div>
    `;

    const prev = document.getElementById('preview-area');
    if (prev) {
      prev.style.display = 'block';
      prev.textContent = `[Hasil Auto-Crawl Multi-Page: ${totalCombined} Artikel Lengkap]\n` + 
        finalArticlesArray.slice(0, 3).map((s, idx) => `• [Artikel ${idx+1}] ${typeof s === 'string' ? s.slice(0, 120) : (s.title || '')}...`).join('\n') +
        `\n\nSiap dianalisis! Klik tombol hijau di atas.`;
    }

  } catch (err) {
    statusEl.innerHTML = `❌ <strong>Kendala auto-crawl berita:</strong> ${err.message}`;
  } finally {
    btn.disabled = false;
    btnText.textContent = '⚡ Auto-Crawl & Baca Full Artikel Lagi';
    spinner.style.display = 'none';
  }
}

// ── SALIN FULL HTML VIEW PAGE SOURCE (CLEAN DATASET FOR CARD B) ───────────────
async function copyPageSourceHTML() {
  if (!activeTab || !activeTab.id) {
    alert('Tab browser aktif tidak ditemukan.');
    return;
  }

  const statusEl = document.getElementById('status-text');
  statusEl.innerHTML = '⏳ <strong>Menyiapkan Dataset HTML Bersih...</strong>';

  try {
    let storedNewsArticles = [];
    const storageData = await chrome.storage.local.get(['__fintech_news_storage']);
    if (storageData.__fintech_news_storage && storageData.__fintech_news_storage.length > 0) {
      storedNewsArticles = storageData.__fintech_news_storage;
    }

    let fullHtml = '';

    if (currentPlatformMode === 'news' && storedNewsArticles.length > 0) {
      // Build pristine dedicated HTML containing ONLY the full articles inside #fintech-accumulated-posts
      fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Dataset Fintech Lending Ilegal - Full Articles</title>
</head>
<body>
  <div id="fintech-accumulated-posts">
${storedNewsArticles.map((art, idx) => {
  const content = typeof art === 'string' ? art : (art.fullTextCombined || `[Judul: ${art.title}]\n\n${(art.paragraphs || []).join('\n\n')}`);
  return `    <article class="fintech-saved-news full-article" data-index="${idx+1}">
      <div class="entry-content">${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </article>`;
}).join('\n')}
  </div>
</body>
</html>`;
    } else {
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => document.documentElement.outerHTML
      });
      fullHtml = injectionResults?.[0]?.result || '';
    }

    if (!fullHtml) {
      throw new Error('Gagal mengambil source code HTML.');
    }

    await navigator.clipboard.writeText(fullHtml);
    const sizeKb = Math.round(fullHtml.length / 1024);
    const countDisplay = lastDetectedCount > 0 ? `${lastDetectedCount} Artikel Lengkap` : `${sizeKb} KB HTML`;

    showToast(`✅ Dataset (${countDisplay}) Berhasil Disalin!`);
    statusEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div class="status-count">🌐 Dataset HTML Berhasil Disalin!</div>
        <span style="font-size:10px;font-weight:800;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:99px;">${countDisplay}</span>
      </div>
      <div class="status-sub">Total: <strong>${countDisplay}</strong>. Telah berada di clipboard Anda.</div>
      <div style="margin-top:7px;font-size:11px;color:#166534;font-weight:700;">
        👉 Sekarang buka Web Detektor di <a href="http://127.0.0.1:8000" target="_blank" style="color:#1e40af;text-decoration:underline;">http://127.0.0.1:8000</a>, klik tombol <strong>"📋 Tempel dari Clipboard"</strong> pada <strong>Card B</strong>, lalu klik <strong>"Ekstrak &amp; Analisis Salinan HTML"</strong>!
      </div>
    `;

    const prev = document.getElementById('preview-area');
    if (prev) {
      prev.style.display = 'block';
      prev.textContent = `<!-- Preview Full Dataset (${countDisplay}) -->\n` + 
        fullHtml.slice(0, 320) + '...\n\n[Full dataset telah berada di clipboard Anda, silakan tempel di Card B Web Detektor]';
    }

  } catch (err) {
    statusEl.innerHTML = `❌ <strong>Gagal menyalin HTML:</strong> ${err.message}`;
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
