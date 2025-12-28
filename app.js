// Menggunakan proxy Vercel untuk menghindari Mixed Content / CORS
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        console.log("Debug Data:", result);

        // Menangani berbagai variasi struktur JSON API
        let dataArray = result.data || result;
        if (dataArray && dataArray.data) dataArray = dataArray.data;

        return Array.isArray(dataArray) ? dataArray : [];
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        return [];
    }
}

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 text-white">Sedang memuat...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm">Data ${label} tidak ditemukan atau API sedang sibuk.</div>`;
        return;
    }

    items.forEach(item => {
        // Ambil bookId dan bookName secara fleksibel
        const id = item.bookId || item.id || item.bookid;
        const name = item.bookName || item.title || item.name;
        const cover = item.cover || item.thumb || 'https://via.placeholder.com/300x400?text=No+Cover';

        if (id && name) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(id, name);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 text-gray-200">${name}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    if(el) el.classList.add('tab-active');

    const config = {
        'trending': { p: '/trending', l: 'Drama Trending' },
        'latest': { p: '/latest', l: 'Drama Terbaru' },
        'foryou': { p: '/foryou', l: 'For You' },
        'dubindo': { p: '/dubindo', l: 'Dub Indo' },
        'vip': { p: '/vip', l: 'VIP' }
    };

    const target = config[type] || config['latest'];
    renderDrama(target.p, target.l);
}

async function openDetail(id, name) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    modal.classList.remove('hidden');
    epList.innerHTML = '<p class="text-gray-500 text-sm italic">Memuat episode...</p>';

    // Memanggil API detail sesuai gambar 1
    const episodes = await callApi(`/allepisode?id=${id}`);
    epList.innerHTML = '';

    if (episodes.length === 0) {
        epList.innerHTML = '<p class="text-yellow-500 text-sm italic">Episode belum tersedia.</p>';
    } else {
        episodes.forEach((ep, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#161b2c] p-3 rounded-lg text-sm border border-gray-800 hover:border-red-600 mb-2";
            btn.innerHTML = `Episode ${i + 1}`;
            btn.onclick = () => window.open(ep.videoUrl || ep.url, '_blank');
            epList.appendChild(btn);
        });
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

window.onload = () => renderDrama('/latest', 'Drama Terbaru');
