/**
 * DRAMAXIN BOX - HYBRID ENGINE (STABLE)
 * Sinkronisasi Server-Side Search & Client-Side Cache
 */

const API_BASE = window.location.hostname.includes('vercel.app') 
    ? "/api-proxy/dramabox" 
    : "https://api.sansekai.my.id/api/dramabox";

let epData = [];
let curIdx = -1;
let allDramaCache = [];

// 1. FUNGSI API DASAR
async function apiGet(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) return [];
        const json = await res.json();
        
        let result = [];
        if (path.includes('/vip')) {
            if (json.columnVoList) {
                json.columnVoList.forEach(col => {
                    if (col.bookList) result = [...result, ...col.bookList];
                });
            }
        } else {
            // Support struktur data search (json.data.data) atau list (json.data)
            result = json.data?.data || json.data || json;
        }
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("Fetch Error:", e);
        return [];
    }
}
async function changeTab(type, el) {
    if (el) setActiveTab(el); // Mengatur tampilan tombol yang aktif
    
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    
    // Pemetaan nama label untuk tampilan
    const labelMap = { 
        trending: 'TRENDING', 
        foryou: 'UNTUK ANDA', 
        dubindo: 'DUBBING INDO', 
        vip: 'KONTEN VIP',
        latest: 'TERBARU'
    };
    
    label.innerText = labelMap[type] || "DRAMA";
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold">MEMUAT KATEGORI...</div>';

    // Menentukan path API berdasarkan tipe kategori
    const path = type === 'dubindo' ? '/dubindo?classify=terbaru&page=1' : `/${type}`;
    
    try {
        const data = await apiGet(path); // Mengambil data dari server
        renderGrid(data); // Menampilkan data ke dalam grid website
    } catch (error) {
        container.innerHTML = '<p class="col-span-full text-center py-20 opacity-50">Gagal memuat kategori ini.</p>';
    }
}
// 2. FUNGSI PENCARIAN (Server-Side Query)
async function performSearch(query) {
    if (!query) return;
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    
    label.innerText = `HASIL PENCARIAN: ${query.toUpperCase()}`;
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 font-bold">MENGHUBUNGI DATABASE...</div>';

    // Memanggil API search langsung (sinkron dengan bot)
    const results = await apiGet(`/search?query=${encodeURIComponent(query)}`);
    renderGrid(results);
}

// 3. LOAD HOME (Menampilkan Semua Kategori)
async function loadAllDrama(el = null) {
    if (el) setActiveTab(el);
    const container = document.getElementById('mainContainer');
    const label = document.getElementById('sectionLabel');
    
    label.innerText = "SEMUA KOLEKSI DRAMA";
    container.innerHTML = '<div class="col-span-full text-center py-20 text-red-500 animate-pulse font-bold">MENYATUKAN DATA...</div>';

    const [t, l, f, d, v] = await Promise.all([
        apiGet('/trending'), apiGet('/latest'), apiGet('/foryou'),
        apiGet('/dubindo?classify=terbaru&page=1'), apiGet('/vip')
    ]);

    allDramaCache = [...t, ...l, ...f, ...d, ...v];
    const unique = Array.from(new Map(allDramaCache.map(item => [item.bookId || item.id, item])).values());
    renderGrid(unique);
}

// 4. RENDER GRID
function renderGrid(items) {
    const container = document.getElementById('mainContainer');
    container.innerHTML = items.length === 0 ? '<p class="col-span-full text-center py-20 opacity-50">Data tidak ditemukan.</p>' : "";

    items.forEach(item => {
        const id = item.bookId || item.id;
        const name = item.bookName || item.title;
        const cover = item.coverWap || item.cover || "https://via.placeholder.com/300x400";

        const div = document.createElement('div');
        div.className = "cursor-pointer group animate-slideUp";
        div.onclick = () => openDetail(id, name, item.introduction);
        div.innerHTML = `
            <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${cover}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
            </div>
            <h3 class="text-[11px] font-bold line-clamp-2 px-1 text-gray-200">${name}</h3>
        `;
        container.appendChild(div);
    });
}

// 5. DETAIL & PLAYER
async function openDetail(id, title, desc) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc || "Deskripsi tidak tersedia.";
    
    epData = await apiGet(`/allepisode?bookId=${id}`);
    epList.innerHTML = "";
    epData.forEach((ep, i) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-[#0b0f1a] p-4 rounded-2xl text-[10px] border border-gray-800 flex justify-between items-center mb-2";
        btn.innerHTML = `<span>EPISODE ${i + 1}</span><i class="fa-solid fa-play-circle text-red-600"></i>`;
        btn.onclick = () => playEp(i);
        epList.appendChild(btn);
    });
}

function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    
    curIdx = idx; // Update index episode aktif
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    const playerContainer = document.getElementById('playerContainer');
    
    // Logika pengambilan URL Video
    let url = ep.videoUrl || ep.url;
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        url = (cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0]).videoPath;
    }

    if (url) {
        playerContainer.classList.remove('hidden');
        player.src = url;
        player.load();
        player.play();

        // Scroll ke atas agar player terlihat jika di mobile
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;

        // Hubungkan Tombol Next & Prev
        updateNavButtons();
    } else {
        alert("Link video tidak ditemukan untuk episode ini.");
    }
}

// 2. Fungsi Update Tombol Next & Prev
function updateNavButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const player = document.getElementById('mainPlayer');

    if (prevBtn) {
        prevBtn.onclick = () => playEp(curIdx - 1);
        // Sembunyikan prev jika di episode pertama
        prevBtn.style.opacity = curIdx === 0 ? "0.3" : "1";
        prevBtn.disabled = curIdx === 0;
    }

    if (nextBtn) {
        nextBtn.onclick = () => playEp(curIdx + 1);
        // Sembunyikan next jika di episode terakhir
        nextBtn.style.opacity = curIdx === epData.length - 1 ? "0.3" : "1";
        nextBtn.disabled = curIdx === epData.length - 1;
    }

    // Auto Next saat video selesai
    player.onended = () => {
        if (curIdx < epData.length - 1) {
            playEp(curIdx + 1);
        }
    };
}

// 3. Fungsi Tutup Modal (Close)
function closeModal() {
    const modal = document.getElementById('detailModal');
    const player = document.getElementById('mainPlayer');
    const playerContainer = document.getElementById('playerContainer');

    modal.classList.add('hidden');
    player.pause();
    player.src = ""; // Membersihkan memori player
    playerContainer.classList.add('hidden');
    document.body.style.overflow = "auto";
}

// 6. INIT LOAD (Telegram & Deep Link)
window.onload = function() {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('query');
    const bid = params.get('bookId');

    if (bid) {
        loadAllDrama().then(() => openDetail(bid, "Memuat...", ""));
    } else if (q) {
        performSearch(q);
    } else {
        loadAllDrama();
    }

    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch(e.target.value);
    });
};
