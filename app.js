const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) return [];
        const result = await response.json();
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;
        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// FUNGSI CARI
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query !== "") {
        renderDrama(`/search?s=${encodeURIComponent(query)}`, `CARI: ${query.toUpperCase()}`);
    }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 text-white">Mencari...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm">Data tidak ditemukan.</div>`;
        return;
    }

    items.forEach(item => {
        const bid = item.bookId || item.id;
        const bname = item.bookName || item.title;
        const img = item.coverWap || item.cover || 'https://via.placeholder.com/300x400';

        if (bid && bname) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(bid, bname, item.introduction);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 text-gray-200">${bname}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

async function openDetail(bid, bname, intro) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    const videoContainer = document.getElementById('videoPlayerContainer');
    
    modal.classList.remove('hidden');
    videoContainer.classList.add('hidden'); 
    document.body.style.overflow = 'hidden';
    
    document.getElementById('modalTitle').innerText = bname;
    document.getElementById('modalDesc').innerText = intro || "Tidak ada deskripsi.";
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse text-center py-10">Memuat episode...</p>';

    try {
        // AMBIL EPISODE DENGAN bookId
        currentEpisodes = await callApi(`/allepisode?bookId=${bid}`);
        epList.innerHTML = '';

        if (currentEpisodes.length === 0) {
            epList.innerHTML = `<p class="text-yellow-500 text-sm italic text-center py-4">Belum ada episode.</p>`;
        } else {
            currentEpisodes.forEach((ep, i) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-xs border border-gray-800 hover:border-red-600 mb-2 transition flex justify-between items-center text-white";
                const epTitle = ep.chapterName || ep.episodeName || `Episode ${i + 1}`;
                btn.innerHTML = `<span><i class="fa-solid fa-play text-red-600 mr-3"></i> ${epTitle}</span>`;
                btn.onclick = () => playEpisode(i);
                epList.appendChild(btn);
// Konfigurasi Proxy Vercel untuk menghindari pemblokiran CORS
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) return [];
        const result = await response.json();
        
        // Menangani berbagai jenis struktur data JSON (data, result, atau array)
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;

        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("Gagal memanggil API:", error);
        return [];
    }
}

/** * FUNGSI PENCARIAN TERBARU
 * Menggunakan query string 's' berdasarkan judul bookName
 */
async function handleSearch() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    
    if (query !== "") {
        // Mengirim query string judul ke endpoint /search?s=...
        // encodeURIComponent penting agar karakter spasi tidak merusak URL
        renderDrama(`/search?s=${encodeURIComponent(query)}`, `HASIL CARI: ${query.toUpperCase()}`);
    } else {
        alert("Silakan masukkan judul drama!");
    }
}

// Mendukung pencarian saat menekan tombol ENTER di keyboard
document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 text-white">Mencari drama...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm italic">Drama "${label.replace('HASIL CARI: ', '')}" tidak ditemukan.</div>`;
        return;
    }

    items.forEach(item => {
        // Ekstraksi data secara fleksibel (bookId, bookName, coverWap)
        const bid = item.bookId || item.id;
        const bname = item.bookName || item.title;
        const img = item.coverWap || item.cover || 'https://via.placeholder.com/300x400';

        if (bid && bname) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(bid, bname, item.introduction);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 text-gray-200">${bname}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

async function openDetail(bid, bname, intro) {
    const modal = document.getElementById('detailModal');
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) return [];
        const result = await response.json();
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;
        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// FUNGSI PENCARIAN (Gunakan parameter ?s=)
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query !== "") {
        renderDrama(`/search?s=${encodeURIComponent(query)}`, `CARI: ${query.toUpperCase()}`);
    }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 text-white">Mencari...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm">Data tidak ditemukan.</div>`;
        return;
    }

    items.forEach(item => {
        const bid = item.bookId || item.id;
        const bname = item.bookName || item.title;
        const img = item.coverWap || item.cover || 'https://via.placeholder.com/300x400';

        if (bid && bname) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(bid, bname, item.introduction);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 text-gray-200">${bname}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

async function openDetail(bid, bname, intro) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    const videoContainer = document.getElementById('videoPlayerContainer');
    
    modal.classList.remove('hidden');
    videoContainer.classList.add('hidden'); 
    document.body.style.overflow = 'hidden';
    
    document.getElementById('modalTitle').innerText = bname;
    document.getElementById('modalDesc').innerText = intro || "Tidak ada deskripsi.";
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse text-center py-10">Memuat episode...</p>';

    try {
        // Ambil episode menggunakan bookId
        currentEpisodes = await callApi(`/allepisode?bookId=${bid}`);
        epList.innerHTML = '';

        if (currentEpisodes.length === 0) {
            epList.innerHTML = `<p class="text-yellow-500 text-sm italic text-center py-4">Belum ada episode.</p>`;
        } else {
            currentEpisodes.forEach((ep, i) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-xs border border-gray-800 hover:border-red-600 mb-2 flex justify-between items-center text-white";
                const epTitle = ep.chapterName || ep.episodeName || `Episode ${i + 1}`;
                btn.innerHTML = `<span><i class="fa-solid fa-play text-red-600 mr-3"></i> ${epTitle}</span>`;
                btn.onclick = () => playEpisode(i);
                epList.appendChild(btn);
            });
        }
    } catch (e) {
        epList.innerHTML = '<p class="text-red-500 text-sm text-center">Gagal memuat.</p>';
    }
// Menggunakan proxy Vercel untuk kestabilan koneksi
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

// Fungsi fetch dengan penanganan error agar tidak macet
async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        // Normalisasi data (mengambil array dari berbagai kemungkinan struktur JSON)
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;

        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("API Fetch Failure:", error);
        return []; // Kembalikan array kosong agar aplikasi tidak crash
    }
}

// Handler Pencarian yang diperbaiki
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        renderDrama(`/search?s=${encodeURIComponent(query)}`, `HASIL: ${query.toUpperCase()}`);
    }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse">Menghubungkan ke server...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500 text-sm italic">Data tidak ditemukan atau server sibuk.</div>`;
        return;
    }

    items.forEach(item => {
        const bid = item.bookId || item.id;
        const bname = item.bookName || item.title;
        const img = item.coverWap || item.cover || 'https://via.placeholder.com/300x400?text=No+Image';

        const card = document.createElement('div');
        card.className = "cursor-pointer group animate-slideUp";
        card.onclick = () => openDetail(bid, bname, item.introduction);
        card.innerHTML = `
            <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2 text-gray-200">${bname || 'Judul Tidak Ada'}</h3>
        `;
        grid.appendChild(card);
    });
}

async function openDetail(bid, bname, intro) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    const videoContainer = document.getElementById('videoPlayerContainer');
    
    modal.classList.remove('hidden');
    videoContainer.classList.add('hidden'); 
    document.body.style.overflow = 'hidden';
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) return [];
        const result = await response.json();
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;
        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// FUNGSI CARI
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query !== "") {
        renderDrama(`/search?s=${encodeURIComponent(query)}`, `CARI: ${query.toUpperCase()}`);
    }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 text-white">Mencari...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm">Data tidak ditemukan.</div>`;
        return;
    }

    items.forEach(item => {
        const bid = item.bookId || item.id;
        const bname = item.bookName || item.title;
        const img = item.coverWap || item.cover || 'https://via.placeholder.com/300x400';

        if (bid && bname) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(bid, bname, item.introduction);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 text-gray-200">${bname}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

async function openDetail(bid, bname, intro) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    const videoContainer = document.getElementById('videoPlayerContainer');
    
    modal.classList.remove('hidden');
    videoContainer.classList.add('hidden'); 
    document.body.style.overflow = 'hidden';
    
    document.getElementById('modalTitle').innerText = bname;
    document.getElementById('modalDesc').innerText = intro || "Tidak ada deskripsi.";
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse text-center py-10">Memuat episode...</p>';

    try {
        // AMBIL EPISODE DENGAN bookId
        currentEpisodes = await callApi(`/allepisode?bookId=${bid}`);
        epList.innerHTML = '';

        if (currentEpisodes.length === 0) {
            epList.innerHTML = `<p class="text-yellow-500 text-sm italic text-center py-4">Belum ada episode.</p>`;
        } else {
            currentEpisodes.forEach((ep, i) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-xs border border-gray-800 hover:border-red-600 mb-2 transition flex justify-between items-center text-white";
                const epTitle = ep.chapterName || ep.episodeName || `Episode ${i + 1}`;
                btn.innerHTML = `<span><i class="fa-solid fa-play text-red-600 mr-3"></i> ${epTitle}</span>`;
                btn.onclick = () => playEpisode(i);
                epList.appendChild(btn);
            });
        }
    } catch (e) {
        epList.innerHTML = '<p class="text-red-500 text-sm text-center">Gagal memuat.</p>';
    }
}

function playEpisode(index) {
    if (index < 0 || index >= currentEpisodes.length) return;
    currentIndex = index;
    const ep = currentEpisodes[index];
    const player = document.getElementById('player');
    const container = document.getElementById('videoPlayerContainer');

    // EKSTRAKSI LINK VIDEO DALAM
    let playUrl = "";
    if (ep.cdnList && ep.cdnList.length > 0) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        if (cdn.videoPathList && cdn.videoPathList.length > 0) {
            const video = cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0];
            playUrl = video.videoPath;
        }
    }
    if (!playUrl) playUrl = ep.videoUrl || ep.url || ep.play_url;

    if (playUrl) {
        container.classList.remove('hidden');
        player.src = playUrl;
        player.play();
        
        document.getElementById('prevBtn').disabled = (currentIndex === 0);
        document.getElementById('nextBtn').disabled = (currentIndex === currentEpisodes.length - 1);
        
        // Auto-Next saat video selesai
        player.onended = () => { if(currentIndex < currentEpisodes.length -1) playEpisode(currentIndex + 1); };

        // Scroll ke player
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    } else {
        alert("Link video tidak ditemukan.");
    }
}

document.getElementById('prevBtn').onclick = () => playEpisode(currentIndex - 1);
document.getElementById('nextBtn').onclick = () => playEpisode(currentIndex + 1);

function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('tab-active');
        b.classList.add('text-gray-500');
    });
    if (el) el.classList.add('tab-active');

    const config = {
        'trending': { p: '/trending', l: 'DRAMA TRENDING' },
        'latest': { p: '/latest', l: 'DRAMA TERBARU' },
        'foryou': { p: '/foryou', l: 'UNTUK ANDA' },
        'dubindo': { p: '/dubindo', l: 'SULIH SUARA (DUB)' },
        'vip': { p: '/vip', l: 'DRAMA VIP' },
        'populersearch': { p: '/populersearch', l: 'POPULER' }
    };

    const target = config[type] || config['latest'];
    renderDrama(target.p, target.l);
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('player').pause();
    document.body.style.overflow = 'auto';
}

window.onload = () => renderDrama('/trending', 'DRAMA TRENDING');
