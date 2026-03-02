document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extract-btn');
    const exportBtn = document.getElementById('export-btn');
    const countValue = document.getElementById('count-value');
    const statusText = document.getElementById('status-text');

    let videoData = [];

    extractBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
                statusText.innerText = "Please go to YouTube";
                return;
            }

            // Start animation/loading state
            statusText.innerText = "Extracting...";
            extractBtn.disabled = true;

            chrome.tabs.sendMessage(tab.id, { action: "GET_VIDEO_DATA" }, (response) => {
                extractBtn.disabled = false;
                
                if (chrome.runtime.lastError) {
                    // Try to inject script if it's missing (rare with wide manifest matches but good for safety)
                    console.error("Message error:", chrome.runtime.lastError.message);
                    statusText.innerText = "Error: Please Refresh Page";
                    return;
                }

                if (response && response.videos) {
                    videoData = response.videos;
                    countValue.innerText = videoData.length;
                    
                    if (videoData.length > 0) {
                        statusText.innerText = "Videos Detected";
                        exportBtn.disabled = false;
                        exportBtn.classList.add('active');
                    } else {
                        statusText.innerText = "No videos found on this page";
                        exportBtn.disabled = true;
                        exportBtn.classList.remove('active');
                    }
                } else {
                    statusText.innerText = "No data received!";
                    countValue.innerText = "0";
                }
            });
        } catch (err) {
            console.error(err);
            statusText.innerText = "Extension Error";
            extractBtn.disabled = false;
        }
    });

    exportBtn.addEventListener('click', async () => {
        if (videoData.length === 0) return;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                chrome.tabs.sendMessage(tab.id, { action: "DOWNLOAD_EXCEL", data: videoData });
            }
        } catch (err) {
            console.error(err);
        }
    });
});
