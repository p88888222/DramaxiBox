// Konfigurasi API dengan Proxy Vercel
const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;

// Gerbang API Universal
async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error("Gagal terhubung ke API");
        const json = await res.json();
        
        // Ekstraksi data fleksibel (Dramabox format)
        let data = json.data?.data || json.data || json;
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("API Fetch Error:", e);
        return [];
    }
}

// FUNGSI PENCARIAN (Gunakan parameter query sesuai instruksi)
async function handleSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) {
        // Mengarahkan ke endpoint /search?query=pewaris
        renderGrid(`/search?query=${encodeURIComponent(q)}`, `HASIL: ${q.toUpperCase()}`);
    }
}

// Listener tombol Enter pada kolom pencarian
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Render Grid Drama
async function renderGrid(path, label) {
    const grid = document.getElementById('dramaGrid');
    const labelEl = document.getElementById('sectionLabel');
    if (labelEl) labelEl.innerText = label;
    
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse">Menghubungkan ke server...</div>';

    const items = await apiGet(path);
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500 text-sm">Drama tidak ditemukan.</div>';
        return;
    }

    items.forEach(item => {
        // Mendukung bookId dan bookName sesuai contoh API pencarian
        const id = item.bookId || item.id;
        const name = item.bookName || item.title || "No Title";
        const cover = item.coverWap || item.cover || "https://via.placeholder.com/300x400";

        const div = document.createElement('div');
        div.className = "cursor-pointer group animate-slideUp";
        div.onclick = () => openDetail(id, name, item.introduction || item.desc);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2 px-1 text-gray-200">${name}</h3>
        `;
        grid.appendChild(div);
    });
}

// Buka Detail & Episod (Menggunakan bookId)
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Deskripsi tidak tersedia.";
    document.getElementById('playerContainer').classList.add('hidden');
    epList.innerHTML = '<p class="text-center text-xs py-10 opacity-50 italic">Mengambil episode...</p>';

    // Load episode berdasarkan bookId
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";

    if (epData.length === 0) {
        epList.innerHTML = '<p class="text-center text-yellow-600 text-xs py-5">Episode belum tersedia untuk drama ini.</p>';
    } else {
        epData.forEach((ep, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-xl text-[10px] border border-gray-800 flex justify-between items-center mb-1 hover:border-red-600 transition";
            btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'PLAY'}</span><i class="fas fa-play-circle text-red-600"></i>`;
            btn.onclick = () => playEp(i);
            epList.appendChild(btn);
        });
    }
}

// Play Video: Navigasi CDN & Path
function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    
    // Ekstraksi path video sesuai struktur JSON CDN
    let url = "";
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        const video = cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0];
        url = video.videoPath;
    }
    if (!url) url = ep.videoUrl || ep.url;

    if (url) {
        document.getElementById('playerContainer').classList.remove('hidden');
        player.src = url;
        player.load();
        player.play().catch(() => console.log("Menunggu interaksi user..."));
        
        // Navigasi Prev/Next
        document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
        document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
        
        // Auto-next saat video selesai
        player.onended = () => playEp(curIdx + 1);
        
        // Reset scroll ke atas modal agar video terlihat di mobile
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    } else {
        alert("Maaf, link video tidak tersedia.");
    }
}

// Fullscreen Logic
function toggleFS() {
    const v = document.getElementById('mainPlayer');
    if (!document.fullscreenElement) {
        if (v.requestFullscreen) v.requestFullscreen();
        else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen(); // Safari
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// Tab Navigation
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

// Muat tab Trending saat pertama kali buka
window.onload = () => renderGrid('/trending', 'TRENDING');
