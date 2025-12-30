const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;
let allDramaCache = [];

async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        const json = await res.json();
        
        let result = [];
        // Deteksi struktur data VIP
        if (path.includes('/vip')) {
            if (json.columnVoList) {
                json.columnVoList.forEach(col => {
                    if (col.bookList) result = [...result, ...col.bookList];
                });
            }
        } else {
            result = json.data?.data || json.data || json;
        }
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}

// FUNGSI HOME - MENAMPILKAN KESELURUHAN DRAMA
async function loadAllDrama(el = null) {
    if (el) setActiveTab(el);
    const container = document.getElementById('mainContainer');
    const status = document.getElementById('loadingStatus');
    const label = document.getElementById('sectionLabel');
    
    label.innerText = "SEMUA KOLEKSI DRAMA";
    status.classList.remove('hidden');
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold uppercase tracking-widest">Menyatukan Seluruh Data...</div>';

    // Ambil data dari semua kategori sekaligus
    const [t, l, f, d, v] = await Promise.all([
        apiGet('/trending'),
        apiGet('/latest'),
        apiGet('/foryou'),
        apiGet('/dubindo?classify=terbaru&page=1'),
        apiGet('/vip')
    ]);

    allDramaCache = [...t, ...l, ...f, ...d, ...v];
    
    // Hilangkan Duplikat berdasarkan bookId
    const unique = Array.from(new Map(allDramaCache.map(item => [item.bookId || item.id, item])).values());
    
    status.classList.add('hidden');
    renderGrid(unique);
}

// Render data ke Grid
function renderGrid(items) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center py-20 opacity-50 italic">Data tidak ditemukan.</p>';
        return;
    }

    items.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title;
        const cover = item.coverWap || item.cover || "https://via.placeholder.com/300x400";

        const div = document.createElement('div');
        div.className = "cursor-pointer group animate-slideUp";
        div.onclick = () => openDetail(id, name, item.introduction);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 mb-2 shadow-lg ring-1 ring-white/5">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
            </div>
            <h3 class="text-[11px] font-bold line-clamp-2 px-1 text-gray-200 leading-tight">${name}</h3>
        `;
        container.appendChild(div);
    });
}

// Pencarian (Manual Client-Side Matching)
function handleSearch() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!q) return;

    const filtered = allDramaCache.filter(item => {
        const title = (item.bookName || item.title || "").toLowerCase();
        return title.includes(q);
    });

    document.getElementById('sectionLabel').innerText = `HASIL PENCARIAN: ${q.toUpperCase()}`;
    renderGrid(filtered);
}

// Buka Detail & Episod
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.body.style.overflow = "hidden";
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Deskripsi drama belum tersedia.";
    document.getElementById('playerContainer').classList.add('hidden');
    
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";
    
    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-2xl text-[10px] border border-gray-800 flex justify-between items-center transition hover:border-red-600";
        btn.innerHTML = `<span>EPISODE ${i + 1} - ${ep.chapterName || 'MULAI'}</span><i class="fa-solid fa-play-circle text-red-600 text-lg"></i>`;
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
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    }
}

function setActiveTab(el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    el.classList.add('tab-active');
}

function changeTab(type, el) {
    setActiveTab(el);
    const labelMap = { trending: 'TRENDING', foryou: 'UNTUK ANDA', dubindo: 'DUBBING INDO', vip: 'KONTEN VIP' };
    document.getElementById('sectionLabel').innerText = labelMap[type];
    const path = type === 'dubindo' ? '/dubindo?classify=terbaru&page=1' : `/${type}`;
    apiGet(path).then(data => renderGrid(data));
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('mainPlayer').pause();
    document.body.style.overflow = "auto";
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Load awal
window.onload = loadAllDrama;

function handleTelegramDeepLink() {
    // Ambil parameter ?bookId= dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('bookId');

    if (bookId) {
        console.log("Membuka drama dari Telegram ID:", bookId);
        // Beri jeda 1 detik agar data API utama selesai dimuat
        setTimeout(() => {
            if (typeof openDetail === 'function') {
                openDetail(bookId, "Memuat...", "Menyiapkan video dari Telegram...");
            }
        }, 1200);
    }
}

// Inisialisasi SDK Telegram
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Layar penuh
    tg.setHeaderColor('#0b0f1a'); // Sesuaikan dengan warna tema Anda
}

// Jalankan fungsi deep link saat halaman dimuat
window.addEventListener('load', handleTelegramDeepLink);

