/**
 * YouTube Playlist and Videos Scraper
 * Fields: Playlist/Channel Title, Video Title, Duration, URL
 */

function getPlaylistData() {
    let videoElements = [];
    let mainTitle = "Unknown";
    
    // 1. Grab the overall Title (Channel name or Playlist name)
    const titleElement = 
        document.querySelector('yt-page-header-view-model h1 span') || // New channel header
        document.querySelector('ytd-playlist-header-renderer #text') || // Modern playlist title
        document.querySelector('ytd-playlist-header-renderer .title') || // Alternative playlist title
        document.querySelector('#header-description h3 yt-formatted-string a') || 
        document.querySelector('#header-description h3 yt-formatted-string') ||
        document.querySelector('h1#title');
    
    if (titleElement) {
        mainTitle = titleElement.innerText.trim();
    }

    // 2. Identify page type and find video items
    const href = window.location.href;
    if (href.includes('playlist') || (href.includes('watch') && href.includes('list='))) {
        // Playlist Page or Watch Page with List
        if (href.includes('watch')) {
            videoElements = document.querySelectorAll('ytd-playlist-panel-video-renderer');
        } else {
            videoElements = document.querySelectorAll('ytd-playlist-video-renderer, ytd-grid-video-renderer');
        }
    } else if (href.includes('/videos')) {
        // Channel Videos Section
        videoElements = document.querySelectorAll('ytd-rich-item-renderer');
    }

    // Fallback if no elements found by specific page type logic
    if (videoElements.length === 0) {
        videoElements = document.querySelectorAll('ytd-playlist-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer');
    }

    return Array.from(videoElements).map(item => {
        // Video Title
        const titleElement = item.querySelector('#video-title') || 
                             item.querySelector('#video-title-link') ||
                             item.querySelector('.yt-simple-endpoint.ytd-video-renderer');
        const title = titleElement ? titleElement.innerText.trim() : 'Unknown';

        // Duration
        const durationElement = item.querySelector('ytd-thumbnail-overlay-time-status-renderer span') || 
                               item.querySelector('.yt-badge-shape__text') ||
                               item.querySelector('#overlays #text') ||
                               item.querySelector('.ytd-thumbnail-overlay-time-status-renderer');
        const duration = durationElement ? durationElement.innerText.trim().split('\n')[0] : 'N/A';

        // Link
        const linkElement = item.querySelector('a#video-title-link') || 
                           item.querySelector('a#video-title') ||
                           item.querySelector('a#wc-endpoint') || 
                           item.querySelector('a#thumbnail') ||
                           item.querySelector('a');
        let link = '';
        if (linkElement) {
            const rawHref = linkElement.getAttribute('href');
            if (rawHref) {
                link = "https://www.youtube.com" + rawHref.split('&')[0];
            }
        }

        return {
            "Playlist/Channel Title": mainTitle,
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Videos");
        
        // Column widths: Title, Video Title, Duration, URL
        worksheet["!cols"] = [
            { wch: 40 }, 
            { wch: 50 }, 
            { wch: 12 }, 
            { wch: 40 }
        ];

        const timestamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `YouTube_Data_Export_${timestamp}.xlsx`);
    } catch (err) {
        console.error("Excel Export Error:", err);
    }
}

// Support for Popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_VIDEO_DATA") {
        const data = getPlaylistData();
        sendResponse({ videos: data });
    } else if (request.action === "DOWNLOAD_EXCEL") {
        downloadExcel(request.data);
        sendResponse({ success: true });
    }
    return true; // Keep message channel open for async
});
