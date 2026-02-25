/**
 * YouTube Playlist Scraper
 * Fields: Playlist Title, Video Title, Duration, URL
 */

function getPlaylistData() {
    let videoElements = [];
    let playlistTitle = "Unknown Playlist";
    
    // 1. Grab the overall Playlist Title (Targeting the link inside h3 from your HTML)
    const playlistTitleElement = document.querySelector('#header-description h3 yt-formatted-string a') || 
                                 document.querySelector('#header-description h3 yt-formatted-string') ||
                                 document.querySelector('ytd-playlist-header-renderer .title');
    
    if (playlistTitleElement) {
        playlistTitle = playlistTitleElement.innerText.trim();
    }

    // 2. Find video items
    if (window.location.href.includes('watch')) {
        videoElements = document.querySelectorAll('ytd-playlist-panel-video-renderer');
    } else {
        videoElements = document.querySelectorAll('ytd-playlist-video-renderer');
    }

    return Array.from(videoElements).map(item => {
        const titleElement = item.querySelector('#video-title');
        const title = titleElement ? titleElement.innerText.trim() : 'Unknown';

        const durationElement = item.querySelector('.yt-badge-shape__text');
        const duration = durationElement ? durationElement.innerText.trim() : 'N/A';

        const linkElement = item.querySelector('a#wc-endpoint') || item.querySelector('a#thumbnail') || item.querySelector('a');
        let link = '';
        if (linkElement) {
            const rawHref = linkElement.getAttribute('href');
            if (rawHref) {
                link = "https://www.youtube.com" + rawHref.split('&')[0];
            }
        }

        return {
            "Playlist Title": playlistTitle,
            "Video Title": title,
            "Duration": duration,
            "URL": link
        };
    }).filter(video => video["Video Title"] !== 'Unknown' && video["URL"] !== '');
}

function downloadExcel(data) {
    if (data.length === 0) {
        alert("No videos detected!");
        return;
    }
    
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Playlist");
        
        // Column widths: Playlist Title, Video Title, Duration, URL
        worksheet["!cols"] = [
            { wch: 40 }, 
            { wch: 50 }, 
            { wch: 12 }, 
            { wch: 40 }
        ];

        XLSX.writeFile(workbook, "YouTube_Playlist_Export.xlsx");
    } catch (err) {
        console.error("Excel Export Error:", err);
    }
}

function updateOrInjectButton() {
    let btn = document.getElementById('yt-export-btn');
    const data = getPlaylistData();
    const count = data.length;

    if (!btn) {
        const target = document.querySelector('#playlist-action-menu .top-level-buttons') || 
                       document.querySelector('#header-description');

        if (!target) return;

        btn = document.createElement('button');
        btn.id = 'yt-export-btn';
        btn.style.cssText = `
            background-color: #ff0000; color: white; border: none; padding: 10px 18px;
            margin: 10px; border-radius: 20px; cursor: pointer; font-family: Roboto, Arial, sans-serif;
            font-size: 14px; font-weight: bold; z-index: 9999;
        `;
        
        btn.onclick = () => downloadExcel(getPlaylistData());
        target.appendChild(btn);
    }
    
    btn.innerText = `📥 Export Excel (${count} videos)`;
}

setInterval(updateOrInjectButton, 2000);