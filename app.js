const API_BASE = "https://api.sansekai.my.id/api/dramabox";

// Fungsi Helper untuk Fetch agar tidak duplikasi code
async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        const result = await response.json();
        // Cek apakah data ada di result.data atau result
        const finalData = result.data || result;
        return Array.isArray(finalData) ? finalData : [];
    } catch (error) {
        console.error("Error fetching API:", error);
        return [];
    }
}

// 1. Render Drama ke Grid
async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-2 text-center py-10 opacity-50">Memuat drama...</div>';

    const dramas = await callApi(path);
    grid.innerHTML = '';

    if (dramas.length === 0) {
        grid.innerHTML = '<div class="col-span-2 text-center py-10 text-yellow-500">Data tidak ditemukan.</div>';
        return;
    }

    dramas.forEach(item => {
        const card = document.createElement('div');
        card.className = "cursor-pointer group";
        card.onclick = () => openDetail(item.bookId, item.bookName);
        card.innerHTML = `
            <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                <img src="${item.cover || 'https://via.placeholder.com/150x200?text=No+Cover'}" 
                     class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
            </div>
            <h3 class="text-xs font-semibold line-clamp-2">${item.bookName}</h3>
        `;
        grid.appendChild(card);
    });
}

// 2. Fungsi Pindah Tab
function changeTab(type) {
    // Update UI tombol aktif
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('tab-active'));
    event.currentTarget.classList.add('tab-active');

    const labels = {
        'trending': 'Drama Trending',
        'latest': 'Drama Terbaru',
        'foryou': 'Rekomendasi Untukmu',
        'dubindo': 'Drama Dub Indo',
        'vip': 'Halaman VIP',
        'populersearch': 'Pencarian Populer'
    };

    renderDrama(`/${type}`, labels[type]);
}

// 3. Modal Detail & Episode
async function openDetail(id, name) {
    const modal = document.getElementById('detailModal');
    const epList = document.getElementById('modalEpisodes');
    
    modal.classList.remove('hidden');
    epList.innerHTML = '<p class="text-gray-500 text-sm animate-pulse">Mengambil daftar episode...</p>';

    const episodes = await callApi(`/allepisode?id=${id}`);
    epList.innerHTML = '';

    if (episodes.length === 0) {
        epList.innerHTML = '<p class="text-yellow-500 text-sm italic">Episode belum tersedia.</p>';
    } else {
        episodes.forEach((ep, index) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left bg-[#161b2c] p-3 rounded-lg text-sm border border-gray-700 hover:border-red-500 transition";
            btn.innerHTML = `<i class="fa-solid fa-play text-red-500 mr-3"></i> Episode ${index + 1}`;
            btn.onclick = () => window.open(ep.videoUrl || ep.url, '_blank');
            epList.appendChild(btn);
        });
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// Jalankan saat pertama kali dibuka
window.onload = () => renderDrama('/latest', 'Drama Terbaru');
