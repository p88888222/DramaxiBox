const API_URL = window.location.hostname.includes('vercel.app') ? "/api-proxy/dramabox" : "https://api.sansekai.my.id/api/dramabox";

let currentEpisodes = [];
let currentIndex = -1;

// Helper Fetch: Mendeteksi array data secara otomatis
async function fetchData(path) {
    try {
        const res = await fetch(`${API_URL}${path}`);
        const json = await res.json();
        // Mengambil array dari result.data.data, result.data, atau langsung result
        const data = json.data?.data || json.data || json;
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// Render Grid Drama
async function renderDrama(path, label) {
    const grid = document.getElementById('gridBox');
    document.getElementById('labelTitle').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse">Menghubungkan ke server...</div>';

    const items = await fetchData(path);
    grid.innerHTML = items.length ? "" : '<div class="col-span-full text-center py-20 text-gray-500">Data tidak ditemukan.</div>';

    items.forEach(item => {
        const id = item.bookId || item.id;
        const div = document.createElement('div');
        div.className = "cursor-pointer group";
        div.onclick = () => openDetail(id, item.bookName || item.title, item.introduction || item.desc);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${item.coverWap || item.cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2 px-1">${item.bookName || item.title}</h3>
        `;
        grid.appendChild(div);
    });
}

// Detail & Episode: Menggunakan bookId (CamelCase)
async function openDetail(id, title, desc) {
    const modal = document.getElementById('playerModal');
    const epList = document.getElementById('epList');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    
    document.getElementById('mTitle').innerText = title;
    document.getElementById('mDesc').innerText = desc || "Deskripsi tidak tersedia.";
    document.getElementById('videoArea').classList.add('hidden');
    epList.innerHTML = '<p class="text-center text-xs py-10 opacity-50 italic">Mengambil daftar episode...</p>';

    // Memanggil API dengan parameter bookId sesuai instruksi
    currentEpisodes = await fetchData(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";

    if (currentEpisodes.length === 0) {
        epList.innerHTML = '<p class="text-yellow-600 text-center py-5 text-xs">Episode gagal dimuat atau tidak tersedia.</p>';
    } else {
        currentEpisodes.forEach((ep, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-xl text-[10px] border border-gray-800 flex justify-between items-center mb-2 hover:border-red-600 transition";
            btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'MULAI NONTON'}</span><i class="fa-solid fa-play text-red-600"></i>`;
            btn.onclick = () => playVideo(i);
            epList.appendChild(btn);
        });
    }
}

// Play Video: Menelusuri cdnList untuk mendapatkan videoPath
function playVideo(index) {
    if (index < 0 || index >= currentEpisodes.length) return;
    currentIndex = index;
    const ep = currentEpisodes[index];
    const player = document.getElementById('vidObj');
    
    // Mencari URL video di dalam cdnList sesuai contoh JSON Anda
    let url = "";
    if (ep.cdnList && ep.cdnList[0]?.videoPathList?.[0]) {
        // Ambil video default atau yang pertama tersedia
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        const video = cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0];
        url = video.videoPath;
    }
    
    if (!url) url = ep.videoUrl || ep.url || ep.play_url;

    if (url) {
        document.getElementById('videoArea').classList.remove('hidden');
        player.src = url;
        player.play().catch(() => console.log("Autoplay blocked"));
        
        // Auto Next saat video selesai
        player.onended = () => playVideo(currentIndex + 1);
        
        // Scroll ke atas agar video terlihat
        document.querySelector('#playerModal .overflow-y-auto').scrollTop = 0;
    } else {
        alert("Link video tidak tersedia untuk episode ini.");
    }
}

// Fitur Navigasi, Pencarian, & Tab
function goNav(step) { playVideo(currentIndex + step); }

function doSearch() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) renderDrama(`/search?s=${encodeURIComponent(q)}`, `HASIL: ${q.toUpperCase()}`);
}

function navTo(type, el) {
    document.querySelectorAll('.nav-i').forEach(i => i.classList.add('text-gray-500'));
    el.classList.remove('text-gray-500');
    el.classList.add('tab-active');
    renderDrama(`/${type}`, type.toUpperCase());
}

function closeM() {
    document.getElementById('playerModal').classList.add('hidden');
    document.getElementById('vidObj').pause();
    document.body.style.overflow = "auto";
}

// Inisialisasi awal
window.onload = () => renderDrama('/trending', 'TRENDING');
