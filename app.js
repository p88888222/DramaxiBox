/**
 * DRAMAXIN BOX - STABLE ENGINE
 * 7 Bagian Lengkap: API, Tab, Search, Home, Grid, Player, & Init
 */

const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;

// 1. API GET (Dengan AbortController agar tidak hang)
async function apiGet(path) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const json = await res.json();
        let result = path.includes('/vip') 
            ? (json.columnVoList?.flatMap(c => c.bookList || []) || []) 
            : (json.data?.data || json.data || json);
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// 2. NAVIGASI TAB
async function changeTab(type, el) {
    if (el) setActiveTab(el);
    const container = document.getElementById('mainContainer');
    if (container) container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold">MEMUAT...</div>';
    
    const data = await apiGet(type === 'dubindo' ? '/dubindo?classify=terbaru&page=1' : `/${type}`);
    renderGrid(data);
}

// 3. PENCARIAN SERVER-SIDE
async function performSearch(query) {
    const container = document.getElementById('mainContainer');
    if (container) container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 font-bold">MENCARI...</div>';
    const results = await apiGet(`/search?query=${encodeURIComponent(query)}`);
    renderGrid(results);
}

// 4. LOAD HOME (Hanya Trending agar cepat & tidak macet)
async function loadHome() {
    await changeTab('trending', document.querySelector('.nav-btn'));
}

// 5. RENDER GRID
function renderGrid(items) {
    const container = document.getElementById('mainContainer');
    if (!container) return;
    container.innerHTML = items.length ? "" : '<p class="col-span-full text-center py-20 opacity-50">Data tidak ditemukan.</p>';
    items.forEach(item => {
        const id = item.bookId || item.id;
        const div = document.createElement('div');
        div.className = "cursor-pointer animate-slideUp";
        div.onclick = () => openDetail(id, item.bookName || item.title, item.introduction);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${item.coverWap || item.cover}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x400'">
            </div>
            <h3 class="text-[10px] font-bold line-clamp-2 text-gray-200">${item.bookName || item.title}</h3>`;
        container.appendChild(div);
    });
}

// 6. PLAYER & DETAIL (Next, Prev, Close)
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "No description.";
    
    epData = await apiGet(`/allepisode?bookId=${id}`);
    const epList = document.getElementById('modalEpisodes');
    epList.innerHTML = "";
    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-2xl text-[10px] border border-gray-800 flex justify-between mb-2";
        btn.innerHTML = `<span>EPISODE ${i + 1}</span><i class="fa-solid fa-play text-red-600"></i>`;
        btn.onclick = () => playEp(i);
        epList.appendChild(btn);
    });
}

function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const player = document.getElementById('mainPlayer');
    document.getElementById('playerContainer').classList.remove('hidden');
    let ep = epData[idx];
    let url = ep.videoUrl || ep.url;
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        url = (ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0]).videoPathList[0].videoPath;
    }
    player.src = url;
    player.play();
    document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
    document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    const player = document.getElementById('mainPlayer');
    player.pause();
    player.src = "";
    document.body.style.overflow = "auto";
}

function setActiveTab(el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    el.classList.add('tab-active');
}

// 7. INISIALISASI (Event Listener Utama)
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    const p = new URLSearchParams(window.location.search);
    if (p.get('bookId')) loadHome().then(() => openDetail(p.get('bookId'), "Memuat...", ""));
    else if (p.get('query')) performSearch(p.get('query'));
    else loadHome();

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch(e.target.value);
    });
});
