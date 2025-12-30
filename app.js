/**
 * DRAMAXIN BOX - REFINED APP JS
 * Solusi Anti-Macet & Sinkronisasi Search
 */

const CONFIG = {
    API_BASE: "https://api.sansekai.my.id/api/dramabox",
    TIMEOUT: 10000 // Batas waktu tunggu API 10 detik
};

// 1. Fungsi Fetch dengan Timeout agar tidak macet selamanya
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = CONFIG.TIMEOUT } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
}

// 2. Fungsi Pencarian Utama
async function performSearch(query) {
    const container = document.getElementById('drama-container');
    if (!container) return;

    container.innerHTML = `<div class="status">🔍 Mencari "${query}"...</div>`;

    try {
        const response = await fetchWithTimeout(`${CONFIG.API_BASE}/search?query=${encodeURIComponent(query)}`);
        const json = await response.json();
        
        // Ekstraksi data secara aman
        const dramas = json.data?.data || json.data || [];

        if (dramas.length === 0) {
            container.innerHTML = `<div class="status">❌ Judul "${query}" tidak ditemukan.</div>`;
            return;
        }

        renderResults(dramas);
    } catch (err) {
        console.error("Search Error:", err);
        container.innerHTML = '<div class="status">⚠️ Gagal memuat data. Server mungkin sedang sibuk.</div>';
    }
}

// 3. Fungsi Render UI
function renderResults(dramas) {
    const container = document.getElementById('drama-container');
    if (!container) return;
    
    container.innerHTML = ''; 
    const fragment = document.createDocumentFragment();

    dramas.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title || "Untitled";
        const cover = item.cover || item.coverWap || "https://via.placeholder.com/150x200?text=No+Cover";

        const card = document.createElement('div');
        card.className = 'drama-card';
        card.innerHTML = `
            <div class="card-content" onclick="safeOpenDetail('${id}', '${name.replace(/'/g, "\\'")}', '${cover}')">
                <img src="${cover}" alt="${name}" loading="lazy" onerror="this.src='https://via.placeholder.com/150x200?text=Error'">
                <div class="card-info">
                    <h4>${name}</h4>
                </div>
            </div>
        `;
        fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
}

// 4. Wrapper Aman untuk openDetail
function safeOpenDetail(id, name, cover) {
    if (typeof openDetail === 'function') {
        openDetail(id, name, cover);
    } else {
        alert("Fungsi pemutar video belum siap. Silakan muat ulang halaman.");
    }
}

// 5. Inisialisasi & Penanganan Trafik (Telegram/Query)
function initApp() {
    // Jalankan WebApp Telegram jika tersedia
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('query');
    const bookId = params.get('bookId');

    // Cek Parameter URL
    if (bookId) {
        setTimeout(() => safeOpenDetail(bookId, "Loading...", ""), 500);
    } else if (q) {
        performSearch(q);
    }

    // Pasang Event Listener ke elemen pencarian (jika ada)
    const searchBtn = document.getElementById('search-button');
    const searchInp = document.getElementById('search-input');
    
    if (searchBtn && searchInp) {
        searchBtn.onclick = () => performSearch(searchInp.value.trim());
        searchInp.onkeypress = (e) => {
            if (e.key === 'Enter') performSearch(searchInp.value.trim());
        };
    }
}

// Jalankan aplikasi saat dokumen siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
