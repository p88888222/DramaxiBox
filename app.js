// Konfigurasi Basis API
const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;

// Helper: Satu Gerbang untuk Semua Request
async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error("Network Response Error");
        const json = await res.json();
        
        // Ekstraksi data fleksibel dari struktur Dramabox
        let data = json.data?.data || json.data || json;
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("API Fetch Failure:", e);
        return [];
    }
}

// FUNGSI PENCARIAN (Gunakan parameter query)
async function handleSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) {
        // Menggunakan ?query= sesuai format yang Anda minta
        renderGrid(`/search?query=${encodeURIComponent(q)}`, `HASIL CARI: ${q.toUpperCase()}`);
    } else {
        alert("Masukkan judul drama!");
    }
}

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
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500">Data tidak ditemukan. Silakan coba tab lain.</div>';
        return;
    }

    items.forEach(item => {
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

// Buka Detail & Episod
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
        epList.innerHTML = '<p class="text-center text-yellow-600 text-xs py-5">Gagal memuat episode.</p>';
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

// Play Video: Navigasi CDN
function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    
    // Ekstraksi video path dari cdnList sesuai spesifikasi
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
        player.play().catch(() => console.log("Interaction required"));
        
        // Setup tombol Navigasi & Auto-next
        document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
        document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
        player.onended = () => playEp(curIdx + 1);
        
        // Auto Scroll ke atas modal agar video terlihat
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    } else {
        alert("Link video tidak tersedia di server.");
    }
}

// Fungsi Fullscreen
function toggleFS() {
    const v = document.getElementById('mainPlayer');
    if (!document.fullscreenElement) {
        if (v.requestFullscreen) v.requestFullscreen();
        else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    } else {
        document.exitFullscreen?.();
    }
}

// Fitur Tab
function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    el.classList.add('tab-active');
    
    let path = `/${type}`;
    // Khusus tab dubindo tambahkan parameter classify sesuai contoh Anda
    if (type === 'dubindo') path += "?classify=terbaru&page=1";
    
    renderGrid(path, type.toUpperCase());
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    const p = document.getElementById('mainPlayer');
    p.pause(); p.src = "";
    document.body.style.overflow = "auto";
}

// Jalankan otomatis saat web dibuka
window.onload = () => renderGrid('/trending', 'TRENDING');
