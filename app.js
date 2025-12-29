const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;
let allDramaCache = []; // Untuk optimasi pencarian

async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error("API Offline");
        const json = await res.json();
        let data = json.data?.data || json.data || json;
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Fetch Failure:", e);
        return [];
    }
}

// Fungsi Home - Reset ke awal
async function goHome() {
    document.getElementById('searchInput').value = "";
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    const homeTab = document.querySelector('.nav-btn');
    if (homeTab) homeTab.classList.add('tab-active');
    renderGrid('/trending', 'TRENDING');
}

// Fungsi Pencarian - Metode Pencocokan Judul (Client-Side)
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const grid = document.getElementById('dramaGrid');
    const labelEl = document.getElementById('sectionLabel');
    
    if (!query) return;

    labelEl.innerText = `HASIL PENCARIAN: ${query.toUpperCase()}`;
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-semibold">Mencocokkan judul drama...</div>';

    // Mengambil data dari berbagai sumber untuk dicocokkan
    const [t, l, d] = await Promise.all([
        apiGet('/trending'),
        apiGet('/latest'),
        apiGet('/dubindo?classify=terbaru&page=1')
    ]);
    
    // Gabungkan dan hilangkan duplikat
    allDramaCache = [...t, ...l, ...d];
    const unique = Array.from(new Map(allDramaCache.map(item => [item.bookId || item.id, item])).values());

    // Filter judul yang mengandung kata kunci query
    const filtered = unique.filter(item => {
        const title = (item.bookName || item.title || "").toLowerCase();
        return title.includes(query);
    });

    displayDrama(filtered);
}

// Menampilkan Data Drama ke Grid
function displayDrama(items) {
    const grid = document.getElementById('dramaGrid');
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 italic">Judul drama tidak ditemukan.</div>';
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
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg ring-1 ring-white/5">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2 px-1 text-gray-200 leading-tight">${name}</h3>
        `;
        grid.appendChild(div);
    });
}

// Detail Modal & Fetch Episode
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Tidak ada deskripsi.";
    document.getElementById('playerContainer').classList.add('hidden');
    epList.innerHTML = '<p class="text-center text-xs py-10 opacity-50 italic">Memuat episode...</p>';

    // Load Episode menggunakan bookId
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";

    if (epData.length === 0) {
        epList.innerHTML = '<p class="text-center text-yellow-600 text-xs py-5">Gagal memuat episode atau belum tersedia.</p>';
    } else {
        epData.forEach((ep, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-xl text-[10px] border border-gray-800 flex justify-between items-center mb-1 hover:border-red-600 transition";
            btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'START'}</span><i class="fas fa-play-circle text-red-600"></i>`;
            btn.onclick = () => playEp(i);
            epList.appendChild(btn);
        });
    }
}

// Logika Pemutar Video
function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    
    let url = "";
    // Navigasi CDN Path
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        const res = cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0];
        url = res.videoPath;
    }
    if (!url) url = ep.videoUrl || ep.url;

    if (url) {
        document.getElementById('playerContainer').classList.remove('hidden');
        player.src = url;
        player.load();
        player.play().catch(() => console.log("Interaction needed"));
        
        // Setup tombol Prev/Next & Auto-next
        document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
        document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
        player.onended = () => playEp(curIdx + 1);
        
        // Scroll ke atas player
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    } else {
        alert("Link video tidak tersedia.");
    }
}

// Fullscreen
function toggleFS() {
    const v = document.getElementById('mainPlayer');
    if (!document.fullscreenElement) {
        if (v.requestFullscreen) v.requestFullscreen();
        else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// Tab Handler
async function renderGrid(path, label) {
    document.getElementById('sectionLabel').innerText = label;
    const items = await apiGet(path);
    displayDrama(items);
}

function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    el.classList.add('tab-active');
    
    let path = `/${type}`;
    if (type === 'dubindo') path += "?classify=terbaru&page=1";
    
    renderGrid(path, type.toUpperCase());
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    const p = document.getElementById('mainPlayer');
    p.pause(); p.src = "";
    document.body.style.overflow = "auto";
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Load awal
window.onload = () => renderGrid('/trending', 'TRENDING');
