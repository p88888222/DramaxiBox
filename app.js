const BASE = window.location.hostname.includes('vercel.app') ? "/api-proxy/dramabox" : "https://api.sansekai.my.id/api/dramabox";

let listEp = [];
let idxCur = -1;

// Gerbang Utama API
async function get(path) {
    try {
        const r = await fetch(`${BASE}${path}`);
        const j = await r.json();
        // Cek struktur data Dramabox yang berlapis
        const res = j.data?.data || j.data || j;
        return Array.isArray(res) ? res : [];
    } catch (e) {
        console.error("Error:", e);
        return [];
    }
}

// Render Drama ke Grid
async function loadDrama(path, label) {
    const grid = document.getElementById('gridBox');
    document.getElementById('labelTitle').innerText = label;
    grid.innerHTML = '<p class="col-span-full text-center py-10 opacity-50">Memuat...</p>';

    const data = await get(path);
    grid.innerHTML = "";

    if (data.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center py-10">Gagal memuat data.</p>';
        return;
    }

    data.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title || "No Title";
        const img = item.coverWap || item.cover || "https://via.placeholder.com/150";

        const div = document.createElement('div');
        div.className = "cursor-pointer group";
        div.onclick = () => openM(id, name, item.introduction || item.desc);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 mb-2">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2">${name}</h3>
        `;
        grid.appendChild(div);
    });
}

// Buka Detail & Episod
async function openM(id, title, desc) {
    const modal = document.getElementById('playerModal');
    const listArea = document.getElementById('epList');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    document.getElementById('mTitle').innerText = title;
    document.getElementById('mDesc').innerText = desc || "";
    document.getElementById('videoArea').classList.add('hidden');
    listArea.innerHTML = '<p class="text-center text-xs py-10">Loading episode...</p>';

    // Gunakan bookId (CamelCase)
    listEp = await get(`/allepisode?bookId=${id}`);
    listArea.innerHTML = "";

    listEp.forEach((ep, i) => {
        const b = document.createElement('button');
        b.className = "w-full text-left bg-[#0b0f1a] p-3 rounded-lg text-[10px] border border-gray-800 mb-2 flex justify-between";
        b.innerHTML = `<span>EP ${i+1} - ${ep.chapterName || 'Play'}</span><i class="fas fa-play text-red-600"></i>`;
        b.onclick = () => play(i);
        listArea.appendChild(b);
    });
}

// Fungsi Play Video
function play(i) {
    if (i < 0 || i >= listEp.length) return;
    idxCur = i;
    const ep = listEp[i];
    const vid = document.getElementById('vidObj');
    
    // Cari URL video di dalam cdnList (Sesuai JSON Anda)
    let url = ep.videoUrl || ep.url;
    try {
        if (ep.cdnList && ep.cdnList[0].videoPathList) {
            url = ep.cdnList[0].videoPathList[0].videoPath;
        }
    } catch(e) {}

    if (url) {
        document.getElementById('videoArea').classList.remove('hidden');
        vid.src = url;
        vid.play();
        // Auto Next
        vid.onended = () => goNav(1);
    } else {
        alert("Link video tidak ditemukan.");
    }
}

// Navigasi
function goNav(step) { play(idxCur + step); }

function doSearch() {
    const q = document.getElementById('searchInput').value;
    if (q) loadDrama(`/search?s=${encodeURIComponent(q)}`, `Hasil: ${q}`);
}

function navTo(type, el) {
    document.querySelectorAll('.nav-i').forEach(i => i.classList.add('text-gray-500'));
    el.classList.remove('text-gray-500');
    el.classList.add('tab-active');
    loadDrama(`/${type}`, type);
}

function closeM() {
    document.getElementById('playerModal').classList.add('hidden');
    document.getElementById('vidObj').pause();
    document.body.style.overflow = "auto";
}

// Start
window.onload = () => loadDrama('/trending', 'Trending');
