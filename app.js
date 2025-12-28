// Gunakan proxy Vercel untuk mengelakkan Mixed Content
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        const result = await response.json();
        
        // Pengecaman data yang fleksibel untuk pelbagai struktur API
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;

        return Array.isArray(finalData) ? finalData : (typeof finalData === 'object' ? finalData : []);
    } catch (error) {
        console.error("API Error:", error);
        return [];
    }
}

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50">Memuatkan...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm">Data ${label} tidak ditemukan.</div>`;
        return;
    }

    items.forEach(item => {
        // Ambil bookid dan bookname secara dinamik
        const bid = item.bookId || item.id || item.bookid;
        const bname = item.bookName || item.title || item.name || item.bookname;
        const cover = item.cover || item.thumb || 'https://via.placeholder.com/300x400?text=No+Cover';

        if (bid && bname) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(bid, bname);
            card.innerHTML = `
                <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 leading-tight">${bname}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

async function openDetail(bid, bname) {
    const modal = document.getElementById('detailModal');
    const modalDesc = document.getElementById('modalDesc');
    const epList = document.getElementById('modalEpisodes');
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modalDesc.innerText = "Memuatkan maklumat...";
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse text-center py-4">Mengambil episod...</p>';

    try {
        // 1. Ambil Detail Drama
        const detail = await callApi(`/detail?bookid=${bid}&bookname=${encodeURIComponent(bname)}`);
        modalDesc.innerText = detail.description || detail.desc || `Judul: ${bname}`;

        // 2. Ambil Semua Episod
        const episodes = await callApi(`/allepisode?bookid=${bid}&bookname=${encodeURIComponent(bname)}`);
        epList.innerHTML = '';

        if (!episodes || episodes.length === 0) {
            epList.innerHTML = '<p class="text-yellow-500 text-sm italic text-center">Tiada episod ditemui.</p>';
        } else {
            episodes.forEach((ep, i) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-sm border border-gray-800 hover:border-red-600 mb-2 transition flex justify-between";
                btn.innerHTML = `<span><i class="fa-solid fa-play text-red-600 mr-3"></i> Episode ${i + 1}</span>`;
                
                const playUrl = ep.videoUrl || ep.url || ep.play_url;
                btn.onclick = () => window.open(playUrl, '_blank');
                epList.appendChild(btn);
            });
        }
    } catch (e) {
        modalDesc.innerText = "Gagal memuatkan maklumat drama.";
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
        'trending': { p: '/trending', l: 'Drama Trending' },
        'latest': { p: '/latest', l: 'Drama Terbaru' },
        'foryou': { p: '/foryou', l: 'Untuk Anda' },
        'dubindo': { p: '/dubindo', l: 'Drama Dub Indo' },
        'vip': { p: '/vip', l: 'Drama VIP' },
        'populersearch': { p: '/populersearch', l: 'Populer' }
    };

    const target = config[type] || config['latest'];
    renderDrama(target.p, target.l);
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

window.onload = () => renderDrama('/latest', 'Drama Terbaru');
