const axios = require('axios');

const BASE_URL = 'https://api.sansekai.my.id/api';

/**
 * Fungsi untuk mendapatkan daftar drama terbaru
 */
async function getLatestDramas() {
    try {
        const response = await axios.get(`${BASE_URL}/dramabox/latest`);
        const dramas = response.data.data; // Menyesuaikan dengan struktur response API

        console.log("=== Daftar Drama Terbaru ===");
        dramas.forEach(drama => {
            console.log(`ID: ${drama.bookId} | Nama: ${drama.bookName}`);
        });

        return dramas;
    } catch (error) {
        console.error('Gagal mengambil data drama:', error.message);
    }
}

/**
 * Fungsi untuk mendapatkan semua episode berdasarkan bookId
 * @param {string|number} bookId 
 */
async function getAllEpisodes(bookId) {
    try {
        const response = await axios.get(`${BASE_URL}/dramabox/allepisode`, {
            params: { id: bookId } // Menggunakan query parameter 'id'
        });
        
        console.log(`\n=== Episode untuk ID ${bookId} ===`);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(`Gagal mengambil episode untuk ID ${bookId}:`, error.message);
    }
}

// Eksekusi Contoh
async function main() {
    const listDrama = await getLatestDramas();
    
    if (listDrama && listDrama.length > 0) {
        // Ambil episode dari drama pertama di list sebagai contoh
        await getAllEpisodes(listDrama[0].bookId);
    }
}

main();
