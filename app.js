// Konfigurasi Proxy Vercel
const API_BASE = window.location.hostname === 'localhost' 
    ? "https://api.sansekai.my.id/api/dramabox" 
    : "/api-proxy/dramabox";

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

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 text-white">Memuat...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm italic">Data ${label} tidak ditemukan.</div>`;
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
    const epList = document.getElementById('modalEpisodes');
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('modalTitle').innerText = bname;
    document.getElementById('modalDesc').innerText = intro || "Tidak ada deskripsi tersedia.";
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse text-center py-10">Mengambil daftar episode...</p>';

    try {
        // Menggunakan bookId sesuai instruksi
        const episodes = await callApi(`/allepisode?bookId=${bid}`);
        epList.innerHTML = '';

        if (!episodes || episodes.length === 0) {
            epList.innerHTML = `<p class="text-yellow-500 text-sm italic text-center py-4">Episode belum tersedia.</p>`;
        } else {
            episodes.forEach((ep, i) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-xs border border-gray-800 hover:border-red-600 mb-2 transition flex justify-between items-center text-white";
                
                const epTitle = ep.chapterName || ep.episodeName || ep.title || `Episode ${i + 1}`;
                btn.innerHTML = `<span><i class="fa-solid fa-play text-red-600 mr-3"></i> ${epTitle}</span> <i class="fa-solid fa-chevron-right text-gray-700"></i>`;
                
                // --- LOGIKA TERBARU UNTUK EKSTRAKSI VIDEO PATH ---
                let playUrl = "";
                
                if (ep.cdnList && ep.cdnList.length > 0) {
                    // Cari CDN default atau ambil yang pertama
                    const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
                    if (cdn && cdn.videoPathList && cdn.videoPathList.length > 0) {
                        // Cari kualitas default atau ambil kualitas pertama yang tersedia
                        const video = cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0];
                        playUrl = video.videoPath;
                    }
                }

                // Fallback jika struktur di atas tidak ditemukan
                if (!playUrl) playUrl = ep.videoUrl || ep.url || ep.play_url;

                btn.onclick = () => {
                    if (playUrl) {
                        window.open(playUrl, '_blank');
                    } else {
                        console.log("Data Episode Error:", ep);
                        alert("Maaf, link video tidak ditemukan pada data episode ini.");
                    }
                };
                epList.appendChild(btn);
            });
        }
    } catch (e) {
        epList.innerHTML = '<p class="text-red-500 text-sm text-center">Gagal memuat episode.</p>';
    }
}

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
        'dubindo': { p: '/dubindo', l: 'DRAMA DUB INDO' },
        'vip': { p: '/vip', l: 'DRAMA VIP' }
    };

    const target = config[type] || config['latest'];
    renderDrama(target.p, target.l);
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

window.onload = () => renderDrama('/trending', 'DRAMA TRENDING');
