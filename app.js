/**
 * DRAMAXIN BOX - CORE APP JS
 * Sinkronisasi API Search dengan Bot Telegram
 */

const SEARCH_API = "https://api.sansekai.my.id/api/dramabox/search?query=";

// 1. Fungsi Pencarian Utama
async function performSearch(query) {
    const container = document.getElementById('drama-container');
    if (!container) return;

    container.innerHTML = '<div class="status">🔍 Mencari "' + query + '"...</div>';

    try {
        const response = await fetch(`${SEARCH_API}${encodeURIComponent(query)}`);
        const json = await response.json();
        
        const dramas = json.data?.data || json.data || [];

        if (dramas.length === 0) {
            container.innerHTML = `<div class="status">❌ Judul "${query}" tidak ditemukan.</div>`;
            return;
        }

        renderResults(dramas);
    } catch (err) {
        container.innerHTML = '<div class="status">⚠️ Gagal terhubung ke server API.</div>';
    }
}

// 2. Fungsi Menampilkan Kartu Drama
function renderResults(dramas) {
    const container = document.getElementById('drama-container');
    container.innerHTML = ''; 

    dramas.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title;
        const cover = item.cover || item.coverWap;

        const card = document.createElement('div');
        card.className = 'drama-card';
        card.innerHTML = `
            <div onclick="openDetail('${id}', '${name.replace(/'/g, "\\'")}', '${cover}')">
                <img src="${cover}" alt="${name}" loading="lazy">
                <div class="info">
                    <h4>${name}</h4>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Inisialisasi & Deep Linking
window.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('query');
    const bookId = params.get('bookId');

    // Jika ada parameter query di URL
    if (q) performSearch(q);

    // Jika datang dari bot untuk menonton (bookId)
    if (bookId) {
        setTimeout(() => {
            if (typeof openDetail === 'function') openDetail(bookId, "Memuat...", "");
        }, 1000);
    }

    // Hubungkan tombol cari manual di Website
    const searchBtn = document.getElementById('search-button');
    const searchInp = document.getElementById('search-input');
    if (searchBtn && searchInp) {
        searchBtn.onclick = () => performSearch(searchInp.value);
        searchInp.onkeypress = (e) => { if (e.key === 'Enter') performSearch(searchInp.value); };
    }
});
