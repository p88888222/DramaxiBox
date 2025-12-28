const API_BASE = "https://api.sansekai.my.id/api/dramabox";

async function callApi(path) {
    try {
        const response = await fetch(`${API_BASE}${path}`);
        const result = await response.json();
        
        console.log(`Debug API Path ${path}:`, result);

        // Menangani berbagai kemungkinan bungkus data (result.data, result.data.data, dll)
        let rawData = result.data || result;
        if (rawData && rawData.data) rawData = rawData.data;

        // Pastikan hasil akhirnya adalah Array
        return Array.isArray(rawData) ? rawData : [];
    } catch (error) {
        console.error("Gagal memproses API:", error);
        return [];
    }
}

async function renderDrama(path, label) {
    const grid = document.getElementById('dramaGrid');
    document.getElementById('sectionLabel').innerText = label;
    grid.innerHTML = '<div class="col-span-2 text-center py-10 opacity-50">Memuat data...</div>';

    const items = await callApi(path);
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center py-10 text-yellow-500">Data ${label} tidak ditemukan.</div>`;
        return;
    }

    items.forEach(item => {
        // Logika Ekstraksi: Mengambil data bookId dan bookName pada masing-masing path
        // Karena tiap path mungkin punya nama field berbeda (misal: 'id' atau 'bookId')
        const id = item.bookId || item.id || item.bookid;
        const name = item.bookName || item.title || item.name || item.bookname;
        const cover = item.cover || item.thumb || item.image || 'https://via.placeholder.com/150x200?text=No+Cover';

        if (id && name) {
            const card = document.createElement('div');
            card.className = "cursor-pointer group animate-slideUp";
            card.onclick = () => openDetail(id, name);
            card.innerHTML = `
                <div class="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 mb-2 shadow-lg">
                    <img src="${cover}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                </div>
                <h3 class="text-[11px] font-semibold line-clamp-2">${name}</h3>
            `;
            grid.appendChild(card);
        }
    });
}
