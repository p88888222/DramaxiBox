// Konfigurasi API
const API_URL = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

// Fungsi Fetch Universal
async function fetchData(path) {
    try {
        const response = await fetch(`${API_URL}${path}`);
        if (!response.ok) return [];
        const result = await response.json();
        
        // Menangani berbagai struktur JSON API (Dramabox)
        const data = result.data?.data || result.data || result;
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// Render Drama ke Grid
async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    const labelEl = document.getElementById('sectionLabel');
    if (labelEl) labelEl.innerText = label;
    
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse">Memuat data...</div>';

    const items = await fetchData(path);
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500">Data tidak ditemukan.</div>';
        return;
    }

    items.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title || "Judul Drama";
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

// Buka Detail & Fetch Episode
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Deskripsi tidak tersedia.";
    document.getElementById('videoPlayerContainer').classList.add('hidden');
    
    epList.innerHTML = '<p class="text-center text-xs py-10 opacity-50 italic">Mengambil episode...</p>';

    // API Episode menggunakan bookId
    currentEpisodes = await fetchData(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";

    if (currentEpisodes.length === 0) {
        epList.innerHTML = '<p class="text-center text-yellow-600 text-xs py-5">Gagal memuat episode.</p>';
    } else {
        currentEpisodes.forEach((ep, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-xl text-[10px] border border-gray-800 flex justify-between items-center mb-1 hover:border-red-600 transition";
            btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'START'}</span><i class="fa-solid fa-circle-play text-red-600"></i>`;
            btn.onclick = () => playVideo(i);
            epList.appendChild(btn);
        });
    }
}

// Logika Pemutar Video
function playVideo(index) {
    if (index < 0 || index >= currentEpisodes.length) return;
    currentIndex = index;
    const ep = currentEpisodes[index];
    const player = document.getElementById('player');
    
    // Navigasi URL Video (cdnList extraction)
    let videoUrl = "";
    if (ep.cdnList && ep.cdnList[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        const res = cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0];
        videoUrl = res.videoPath;
    }
    if (!videoUrl) videoUrl = ep.videoUrl || ep.url;

    if (videoUrl) {
        document.getElementById('videoPlayerContainer').classList.remove('hidden');
        player.src = videoUrl;
        player.load();
        player.play().catch(() => console.log("Autoplay blocked"));
        
        // Auto Next & Scroll to player
        player.onended = () => playVideo(currentIndex + 1);
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
        
        // Bind Nav Buttons
        document.getElementById('prevBtn').onclick = () => playVideo(currentIndex - 1);
        document.getElementById('nextBtn').onclick = () => playVideo(currentIndex + 1);
    } else {
        alert("Link video tidak tersedia.");
    }
}

// Fitur Fullscreen
function toggleFullScreen() {
    const video = document.getElementById('player');
    if (!document.fullscreenElement) {
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// Fitur Pencarian (?s=query)
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        renderDrama(`/search?s=${encodeURIComponent(query)}`, `HASIL: ${query.toUpperCase()}`);
    }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Fitur Tab
function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(i => i.classList.remove('tab-active'));
    el.classList.add('tab-active');
    renderDrama(`/${type}`, type.toUpperCase());
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    const player = document.getElementById('player');
    player.pause();
    player.src = "";
    document.body.style.overflow = "auto";
}

// Initial Load
window.onload = () => renderDrama('/trending', 'TRENDING');
