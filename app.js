// Tambahkan/Update fungsi ini di app.js Anda
function setActiveTab(el) {
    // Reset semua tombol
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('tab-active');
        const icon = btn.querySelector('i');
        const span = btn.querySelector('span');
        if (icon) icon.className = icon.className.replace('text-white', 'text-gray-500');
        if (span) span.classList.add('text-gray-500');
    });

    // Aktifkan yang diklik
    el.classList.add('tab-active');
    const activeIcon = el.querySelector('i');
    const activeSpan = el.querySelector('span');
    if (activeIcon) activeIcon.classList.remove('text-gray-500');
    if (activeSpan) activeSpan.classList.remove('text-gray-500');
}

// Update fungsi playEp agar mendukung fullscreen otomatis jika diinginkan
function playEp(idx) {
    if (idx < 0 || idx >= epData.length) return;
    curIdx = idx;
    const ep = epData[idx];
    const player = document.getElementById('mainPlayer');
    const playerContainer = document.getElementById('playerContainer');
    
    let url = ep.videoUrl || ep.url;
    if (ep.cdnList?.[0]?.videoPathList?.[0]) {
        const cdn = ep.cdnList.find(c => c.isDefault === 1) || ep.cdnList[0];
        url = (cdn.videoPathList.find(v => v.isDefault === 1) || cdn.videoPathList[0]).videoPath;
    }

    if (url) {
        playerContainer.classList.remove('hidden');
        player.src = url;
        player.load();
        player.play().catch(e => console.log("Autoplay dicegah browser"));

        // Navigasi tombol
        document.getElementById('prevBtn').onclick = () => playEp(curIdx - 1);
        document.getElementById('nextBtn').onclick = () => playEp(curIdx + 1);
        player.onended = () => playEp(curIdx + 1);

        // Auto-scroll ke player
        document.querySelector('#detailModal .overflow-y-auto').scrollTop = 0;
    }
}
