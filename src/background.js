// Track requests and cookies
const requestData = new Map();
const cookieData = new Map();
const TRACKER_DOMAINS = new Set(['google-analytics.com', 'facebook.net', 'doubleclick.net']);

// Reset data when tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    requestData.set(tabId, []);
    cookieData.set(tabId, []);
  }
});

// Capture network requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!details.tabId || details.tabId === -1) return;
    
    const tabRequests = requestData.get(details.tabId) || [];
    const requestSize = calculateRequestSize(details);
    
    const requestInfo = {
      url: details.url,
      size: requestSize,
      isTracker: isTrackerDomain(details.url),
      cookies: [],
      timestamp: Date.now()
    };
    
    tabRequests.push(requestInfo);
    requestData.set(details.tabId, tabRequests);
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Capture cookies
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (!changeInfo.cause === "overwrite") return;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    const tabId = tabs[0].id;
    const tabCookies = cookieData.get(tabId) || [];
    
    tabCookies.push({
      domain: changeInfo.cookie.domain,
      name: changeInfo.cookie.name,
      value: changeInfo.cookie.value,
      size: JSON.stringify(changeInfo.cookie).length,
      isTracker: isTrackerDomain(changeInfo.cookie.domain)
    });
    
    cookieData.set(tabId, tabCookies);
  });
});

// Helper functions
function calculateRequestSize(details) {
  let size = 0;
  if (details.responseHeaders) {
    for (const header of details.responseHeaders) {
      if (header.name.toLowerCase() === 'content-length') {
        size = parseInt(header.value) || 0;
        break;
      }
    }
  }
  return size;
}

function isTrackerDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return TRACKER_DOMAINS.has(domain) || 
           domain.endsWith('.google-analytics.com') ||
           domain.endsWith('.doubleclick.net');
  } catch {
    return false;
  }
}

// Communication with side panel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "side-panel") return;
  
  port.onMessage.addListener((msg) => {
    if (msg.type === "get-data") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        
        const tabId = tabs[0].id;
        const requests = requestData.get(tabId) || [];
        const cookies = cookieData.get(tabId) || [];
        
        port.postMessage({
          type: "data-update",
          requests,
          cookies
        });
      });
    }
  });
});