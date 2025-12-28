const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        const result = await response.json();
        
        // Pengecekan data sesuai struktur JSON (result.data atau langsung result)
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;

        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50">Sedang memuat...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm italic">Data ${label} tidak tersedia.</div>`;
        return;
    }

    items.forEach(item => {
        // Penyesuaian Field Berdasarkan Data Trending
        const bid = item.bookId || item.id;
        const bname = item.bookName || item.title;
        const cover = item.coverWap || item.cover || 'https://via.placeholder.com/300x400';
        const hot = item.rankVo ? item.rankVo.hotCode : '';

        if (bid && bname) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            // Kirim data tambahan ke fungsi detail
            card.onclick = () => openDetail(bid, bname, item.introduction, item.protagonist);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy">
                    ${hot ? `<div class="absolute top-2 right-2 bg-red-600 text-[8px] px-1.5 py-0.5 rounded font-bold"><i class="fa-solid fa-fire mr-1"></i>${hot}</div>` : ''}
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 leading-tight">${bname}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

async function openDetail(bid, bname, intro, protagonist) {
    const modal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalActor = document.getElementById('modalProtagonist');
    const epList = document.getElementById('modalEpisodes');
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Isi data dari parameter (berasal dari data trending awal)
    modalTitle.innerText = bname;
    modalDesc.innerText = intro || "Tidak ada deskripsi tersedia.";
    modalActor.innerText = protagonist || "";
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse text-center py-4">Mengambil daftar episode...</p>';

    try {
        // Memanggil API episode dengan bookid dan bookname
        const episodes = await callApi(`/allepisode?bookid=${bid}&bookname=${encodeURIComponent(bname)}`);
        epList.innerHTML = '';

        if (!episodes || episodes.length === 0) {
            epList.innerHTML = '<p class="text-yellow-500 text-sm italic text-center">Maaf, episode belum tersedia.</p>';
        } else {
            episodes.forEach((ep, i) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-xs border border-gray-800 hover:border-red-600 mb-2 transition flex justify-between items-center";
                btn.innerHTML = `<span><i class="fa-solid fa-play-circle text-red-600 mr-3"></i> Episode ${i + 1}</span> <i class="fa-solid fa-chevron-right text-gray-600 text-[10px]"></i>`;
                
                const playUrl = ep.videoUrl || ep.url || ep.play_url;
                btn.onclick = () => window.open(playUrl, '_blank');
                epList.appendChild(btn);
            });
        }
    } catch (e) {
        modalDesc.innerText = "Gagal memuat detail dari server.";
    }
}

function changeTab(type, el) {
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('tab-active');
        b.classList.add('text-gray-500');
    });
    if (el) {
        el.classList.add('tab-active');
        el.classList.remove('text-gray-500');
    }

    const config = {
        'trending': { p: '/trending', l: 'DRAMA TRENDING' },
        'latest': { p: '/latest', l: 'DRAMA TERBARU' },
        'foryou': { p: '/foryou', l: 'REKOMENDASI UNTUKMU' },
        'dubindo': { p: '/dubindo', l: 'DRAMA SULIH SUARA' },
        'vip': { p: '/vip', l: 'DRAMA VIP' },
        'populersearch': { p: '/populersearch', l: 'PENCARIAN POPULER' }
    };

    const target = config[type] || config['latest'];
    renderDrama(target.p, target.l);
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Fitur Pencarian Sederhana
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value;
        if(query) renderDrama(`/search?s=${encodeURIComponent(query)}`, `HASIL CARI: ${query.toUpperCase()}`);
    }
});

// Load pertama kali
window.onload = () => renderDrama('/trending', 'DRAMA TRENDING');
