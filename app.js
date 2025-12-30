/**
 * DRAMAXIN BOX - HYBRID ENGINE (STABLE)
 * Sinkronisasi Server-Side Search & Client-Side Cache
 */

const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;
let allDramaCache = [];

// 1. FUNGSI API DASAR
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
            // Support struktur data search (json.data.data) atau list (json.data)
            result = json.data?.data || json.data || json;
        }
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// 2. FUNGSI PENCARIAN (Server-Side Query)
async function performSearch(query) {
    if (!query) return;
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    
    label.innerText = `HASIL PENCARIAN: ${query.toUpperCase()}`;
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 font-bold">MENGHUBUNGI DATABASE...</div>';

    // Memanggil API search langsung (sinkron dengan bot)
    const results = await apiGet(`/search?query=${encodeURIComponent(query)}`);
    renderGrid(results);
}

// 3. LOAD HOME (Menampilkan Semua Kategori)
async function loadAllDrama(el = null) {
    if (el) setActiveTab(el);
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    
    label.innerText = "SEMUA KOLEKSI DRAMA";
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold">MENYATUKAN DATA...</div>';

    const [t, l, f, d, v] = await Promise.all([
        apiGet('/trending'), apiGet('/latest'), apiGet('/foryou'),
        apiGet('/dubindo?classify=terbaru&page=1'), apiGet('/vip')
    ]);

    allDramaCache = [...t, ...l, ...f, ...d, ...v];
    const unique = Array.from(new Map(allDramaCache.map(item => [item.bookId || item.id, item])).values());
    renderGrid(unique);
}

// 4. RENDER GRID
function renderGrid(items) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = items.length === 0 ? '<p class="col-span-full text-center py-20 opacity-50">Data tidak ditemukan.</p>' : "";

    items.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title;
        const cover = item.coverWap || item.cover || "https://via.placeholder.com/300x400";

        const div = document.createElement('div');
        div.className = "cursor-pointer group animate-slideUp";
        div.onclick = () => openDetail(id, name, item.introduction);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
            </div>
            <h3 class="text-[11px] font-bold line-clamp-2 px-1 text-gray-200">${name}</h3>
        `;
        container.appendChild(div);
    });
}

// 5. DETAIL & PLAYER
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Deskripsi tidak tersedia.";
    
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";
    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-2xl text-[10px] border border-gray-800 flex justify-between items-center mb-2";
        btn.innerHTML = `<span>EPISODE ${i + 1}</span><i class="fa-solid fa-play-circle text-red-600"></i>`;
        btn.onclick = () => playEp(i);
        epList.appendChild(btn);
    });
}

function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
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
    }
}

// 6. INIT LOAD (Telegram & Deep Link)
window.onload = function() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('query');
    const bid = params.get('bookId');

    if (bid) {
        loadAllDrama().then(() => openDetail(bid, "Memuat...", ""));
    } else if (q) {
        performSearch(q);
    } else {
        loadAllDrama();
    }

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch(e.target.value);
    });
};
