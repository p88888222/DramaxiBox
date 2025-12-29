const API_BASE = window.location.hostname.includes('vercel.app') ? "/api-proxy/dramabox" : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;
let allDramaCache = []; // Cache untuk pencarian cepat

async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        const json = await res.json();
        let data = json.data?.data || json.data || json;
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("API Error:", e);
        return [];
    }
}

// Fungsi Home - Memuat semua drama
async function goHome() {
    document.getElementById('searchInput').value = "";
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    document.querySelector('.nav-btn').classList.add('tab-active'); // Set trending aktif
    renderGrid('/trending', 'SEMUA DRAMA');
}

// Fungsi Pencarian - Metode Pencocokan Client-Side
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const grid = document.getElementById('dramaGrid');
    const labelEl = document.getElementById('sectionLabel');
    
    if (!query) return;

    labelEl.innerText = `MENCARI: ${query.toUpperCase()}`;
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-semibold">Mencocokkan judul...</div>';

    // Ambil dari cache jika sudah ada, jika tidak, fetch sumber utama
    if (allDramaCache.length === 0) {
        const [t, l, d] = await Promise.all([
            apiGet('/trending'),
            apiGet('/latest'),
            apiGet('/dubindo?classify=terbaru&page=1')
        ]);
        allDramaCache = [...t, ...l, ...d];
    }

    // Filter unik berdasarkan bookId
    const unique = Array.from(new Map(allDramaCache.map(item => [item.bookId || item.id, item])).values());

    // Pencocokan Judul
    const filtered = unique.filter(item => {
        const title = (item.bookName || item.title || "").toLowerCase();
        return title.includes(query);
    });

    displayItems(filtered);
}

// Render Drama ke Layar
function displayItems(items) {
    const grid = document.getElementById('dramaGrid');
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 italic">Drama tidak ditemukan.</div>';
        return;
    }

    items.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title;
        const cover = item.cover || item.coverWap || "https://via.placeholder.com/300x400";

        const div = document.createElement('div');
        div.className = "cursor-pointer group animate-slideUp";
        div.onclick = () => openDetail(id, name, item.introduction || "");
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2 px-1 text-gray-200 leading-tight">${name}</h3>
        `;
        grid.appendChild(div);
    });
}

// Buka Detail & Episod
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Tidak ada deskripsi.";
    document.getElementById('playerContainer').classList.add('hidden');
    epList.innerHTML = '<p class="text-center text-xs py-10 opacity-50">Memuat episode...</p>';

    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";

    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-xl text-[10px] border border-gray-800 flex justify-between items-center mb-1 hover:border-red-600 transition";
        btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'START'}</span><i class="fas fa-play-circle text-red-600"></i>`;
        btn.onclick = () => playEp(i);
        epList.appendChild(btn);
    });
}

// Pemutar Video
function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    
    let url = "";
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        url = (cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0]).videoPath;
    }
    if (!url) url = ep.videoUrl || ep.url;

    if (url) {
        document.getElementById('playerContainer').classList.remove('hidden');
        player.src = url;
        player.play();
        document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
        document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
        player.onended = () => playEp(curIdx + 1);
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    }
}

// Tab & FS
async function renderGrid(path, label) {
    document.getElementById('sectionLabel').innerText = label;
    const data = await apiGet(path);
    displayItems(data);
}

function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    el.classList.add('tab-active');
    let path = `/${type}`;
    if (type === 'dubindo') path += "?classify=terbaru&page=1";
    renderGrid(path, type.toUpperCase());
}

function toggleFS() {
    const v = document.getElementById('mainPlayer');
    if (!document.fullscreenElement) v.requestFullscreen?.() || v.webkitRequestFullscreen?.();
    else document.exitFullscreen?.();
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    const p = document.getElementById('mainPlayer');
    p.pause(); p.src = "";
    document.body.style.overflow = "auto";
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

window.onload = () => renderGrid('/trending', 'TRENDING');
