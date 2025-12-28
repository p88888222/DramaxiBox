const API_BASE = "https://api.sansekai.my.id/api/dramabox";

// Fungsi Inti Pengambil Data
async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) throw new Error("API Network Error");
        
        const result = await response.json();
        console.log(`Data from ${path}:`, result);

        // Menangani berbagai jenis struktur JSON (data, result, atau array langsung)
        let finalData = result.data || result;
        if (finalData && finalData.data) finalData = finalData.data;

        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// Fungsi Render Drama ke Grid
async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-full text-center py-20 opacity-50">Memuat konten...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-20 text-yellow-500 text-sm italic">Data ${label} tidak ditemukan atau API sedang sibuk.</div>`;
        return;
    }

    items.forEach(item => {
        // AMBIL DATA BOOKID DAN BOOKNAME (Mendukung berbagai variasi field name)
        const id = item.bookId || item.id || item.bookid || item.book_id;
        const name = item.bookName || item.title || item.name || item.bookname;
        const cover = item.cover || item.thumb || item.image || 'https://via.placeholder.com/300x400?text=No+Cover';

        if (id && name) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(id, name);
            card.innerHTML = `
                <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
                    <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <span class="text-[9px] text-gray-300 font-mono">ID: ${id}</span>
                    </div>
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2 leading-relaxed">${name}</h3>
            `;
            grid.appendChild(card);
        }
    });
}

// Fungsi Ganti Tab
function changeTab(type, element) {
    // UI: Reset semua tombol nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('tab-active');
        btn.classList.add('text-gray-500');
    });

    // UI: Aktifkan tombol yang diklik
    if (element) {
        element.classList.add('tab-active');
        element.classList.remove('text-gray-500');
    }

    const labels = {
        'trending': 'Drama Trending',
        'latest': 'Drama Terbaru',
        'foryou': 'For You (Untukmu)',
        'dubindo': 'Drama Dub Indo',
        'vip': 'Halaman VIP',
        'populersearch': 'Pencarian Populer'
    };

    renderDrama(`/${type}`, labels[type] || 'Drama');
}

// Fungsi Modal Detail & Semua Episode
async function openDetail(id, name) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Stop scroll background
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse">Mengambil daftar episode...</p>';

    // Path sesuai gambar 1: /allepisode
    const episodes = await callApi(`/allepisode?id=${id}`);
    epList.innerHTML = '';

    if (episodes.length === 0) {
        epList.innerHTML = '<p class="text-yellow-500 text-sm italic">Episode belum tersedia untuk drama ini.</p>';
    } else {
        episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#161b2c] p-4 rounded-xl text-sm border border-gray-800 hover:border-red-600 transition flex items-center justify-between group";
            btn.innerHTML = `
                <span class="flex items-center gap-3">
                    <i class="fa-solid fa-play text-red-600 opacity-0 group-hover:opacity-100 transition"></i>
                    Episode ${index + 1}
                </span>
                <i class="fa-solid fa-circle-arrow-right text-gray-600"></i>
            `;
            // Buka link video di tab baru
            btn.onclick = () => window.open(ep.videoUrl || ep.url, '_blank');
            epList.appendChild(btn);
        });
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Pencarian Otomatis
document.getElementById('searchInput').oninput = (e) => {
    const val = e.target.value;
    if (val.length > 2) {
        renderDrama(`/search?s=${val}`, `Hasil Pencarian: ${val}`);
    }
};

// Initial Load
window.onload = () => renderDrama('/latest', 'Drama Terbaru');
