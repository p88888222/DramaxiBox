/**
 * DRAMAXIN BOX - ULTIMATE HYBRID ENGINE
 * Fitur: Search, Tab Navigation, Full Player Control, & Bot Sync
 */

const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;
let allDramaCache = [];

// 1. FUNGSI API DASAR (Mendukung semua struktur JSON API)
async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) return [];
        const json = await res.json();
        let result = [];
        if (path.includes('/vip')) {
            if (json.columnVoList) {
                json.columnVoList.forEach(col => {
                    if (col.bookList) result = [...result, ...col.bookList];
                });
            }
        } else {
            result = json.data?.data || json.data || json;
        }
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// 2. FUNGSI NAVIGASI TAB (Trending, VIP, For You, dll)
async function changeTab(type, el) {
    if (el) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
        el.classList.add('tab-active');
    }
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    const labelMap = { trending: 'TRENDING', foryou: 'UNTUK ANDA', dubindo: 'DUBBING INDO', vip: 'KONTEN VIP', latest: 'TERBARU' };
    
    label.innerText = labelMap[type] || "KOLEKSI DRAMA";
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold uppercase">Memuat Kategori...</div>';

    const path = type === 'dubindo' ? '/dubindo?classify=terbaru&page=1' : `/${type}`;
    const data = await apiGet(path);
    renderGrid(data);
}

// 3. FUNGSI PENCARIAN (Server-Side Query - Sinkron dengan Bot)
async function performSearch(query) {
    if (!query) return;
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    
    label.innerText = `HASIL PENCARIAN: ${query.toUpperCase()}`;
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 font-bold uppercase">Mencari di Database...</div>';

    const results = await apiGet(`/search?query=${encodeURIComponent(query)}`);
    renderGrid(results);
}

// 4. FUNGSI LOAD ALL (Menggabungkan semua data di Home)
async function loadAllDrama() {
    const container = document.getElementById('mainContainer');
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold uppercase">Menyatukan Seluruh Data...</div>';

    const categories = ['/trending', '/latest', '/foryou', '/vip'];
    const results = await Promise.all(categories.map(path => apiGet(path)));
    
    allDramaCache = results.flat();
    const unique = Array.from(new Map(allDramaCache.map(item => [item.bookId || item.id, item])).values());
    renderGrid(unique);
}

// 5. RENDER DATA KE GRID (Tampilan Kartu)
function renderGrid(items) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = items.length === 0 ? '<p class="col-span-full text-center py-20 opacity-50 italic">Data tidak ditemukan.</p>' : "";

    items.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title;
        const cover = item.coverWap || item.cover || "https://via.placeholder.com/300x400";

        const div = document.createElement('div');
        div.className = "cursor-pointer group animate-slideUp";
        div.onclick = () => openDetail(id, name, item.introduction);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 mb-2 shadow-lg ring-1 ring-white/5">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
            </div>
            <h3 class="text-[11px] font-bold line-clamp-2 px-1 text-gray-200 leading-tight">${name}</h3>
        `;
        container.appendChild(div);
    });
}

// 6. PLAYER & KONTROL (Detail, Next, Prev, Close)
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Deskripsi drama belum tersedia.";
    document.getElementById('playerContainer').classList.add('hidden');
    
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";
    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-2xl text-[10px] border border-gray-800 flex justify-between items-center mb-2 transition hover:border-red-600";
        btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'MULAI'}</span><i class="fa-solid fa-play-circle text-red-600 text-lg"></i>`;
        btn.onclick = () => playEp(i);
        epList.appendChild(btn);
    });
}

function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    
    let url = ep.videoUrl || ep.url;
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        url = (cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0]).videoPath;
    }

    if (url) {
        document.getElementById('playerContainer').classList.remove('hidden');
        player.src = url;
        player.play();
        
        // Pasang navigasi tombol
        document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
        document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
        player.onended = () => playEp(curIdx + 1);
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    const player = document.getElementById('mainPlayer');
    player.pause();
    player.src = "";
    document.body.style.overflow = "auto";
}

// 7. INISIALISASI & BOT SYNC (Menangani bookId dan query dari Telegram)
window.onload = function() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('query');
    const bid = params.get('bookId');

    if (bid) {
        // Mode Tonton Langsung dari Bot
        loadAllDrama().then(() => openDetail(bid, "Memuat Drama...", ""));
    } else if (q) {
        // Mode Pencarian dari Bot
        performSearch(q);
    } else {
        // Mode Normal
        loadAllDrama();
    }

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch(e.target.value);
    });
};
