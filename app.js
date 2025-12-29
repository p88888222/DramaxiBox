const API_BASE = window.location.hostname.includes('vercel.app') ? "/api-proxy/dramabox" : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;

async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        const json = await res.json();
        
        // --- LOGIKA CERDAS EKSTRAKSI DATA ---
        let result = [];
        
        if (path.includes('/vip')) {
            // Khusus VIP: Ambil dari columnVoList -> bookList
            if (json.columnVoList) {
                json.columnVoList.forEach(column => {
                    if (column.bookList) result = [...result, ...column.bookList];
                });
            }
        } else {
            // Umum: Trending, Terbaru, DubIndo
            result = json.data?.data || json.data || json;
        }

        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// Render Grid
async function renderGridView(path, label) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = `<h2 class="text-xs font-bold text-gray-500 uppercase mb-4 italic">${label}</h2><div id="dramaGrid" class="grid grid-cols-2 sm:grid-cols-3 gap-4"></div>`;
    
    const items = await apiGet(path);
    const grid = document.getElementById('dramaGrid');
    
    if (items.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center py-20 opacity-50">Data tidak tersedia.</p>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "cursor-pointer group";
        div.onclick = () => openDetail(item.bookId || item.id, item.bookName || item.title, item.introduction);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2">
                <img src="${item.coverWap || item.cover}" class="w-full h-full object-cover">
            </div>
            <h3 class="text-[11px] font-semibold line-clamp-2 px-1">${item.bookName || item.title}</h3>
        `;
        grid.appendChild(div);
    });
}

// Detail & Episode
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "";
    document.getElementById('playerContainer').classList.add('hidden');
    
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";
    
    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-xl text-[10px] border border-gray-800 flex justify-between items-center";
        btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'PLAY'}</span><i class="fas fa-play text-red-600"></i>`;
        btn.onclick = () => playEp(i);
        epList.appendChild(btn);
    });
}

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
    }
}

// Navigasi & Home
function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    el.classList.add('tab-active');
    const path = type === 'dubindo' ? '/dubindo?classify=terbaru&page=1' : `/${type}`;
    renderGridView(path, type.toUpperCase());
}

async function initHome() {
    renderGridView('/trending', 'TRENDING');
}

function goHome() {
    location.reload(); // Paling stabil untuk reset semua drama
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('mainPlayer').pause();
    document.body.style.overflow = "auto";
}

window.onload = initHome;

