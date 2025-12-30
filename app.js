/**
 * DRAMAXIN BOX - CORE APP JS (Perbaikan Total)
 */

const API_BASE = "https://api.sansekai.my.id/api/dramabox";

// Fungsi Mencari Drama via Query
async function searchDrama(query) {
    const container = document.getElementById('drama-container');
    if (!container) return;
    container.innerHTML = '<div class="status">🔍 Mencari...</div>';

    try {
        const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`);
        const json = await res.json();
        const dramas = json.data?.data || json.data || [];

        if (dramas.length === 0) {
            container.innerHTML = `<div class="status">❌ "${query}" tidak ditemukan.</div>`;
            return;
        }

        renderUI(dramas);
    } catch (e) {
        container.innerHTML = '<div class="status">⚠️ Error memuat data.</div>';
    }
}

// Fungsi Render Kartu Drama
function renderUI(dramas) {
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
                <img src="${cover}" alt="${name}">
                <h4>${name}</h4>
            </div>
        `;
        container.appendChild(card);
    });
}

// Menangani Trafik dari Telegram (Deep Link)
function handleTelegramTraffic() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('bookId');
    const query = params.get('query');

    if (bookId) {
        setTimeout(() => {
            if (typeof openDetail === 'function') openDetail(bookId, "Memuat...", "");
        }, 1000);
    } else if (query) {
        searchDrama(query);
    }
}

// Inisialisasi
window.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    handleTelegramTraffic();
});
