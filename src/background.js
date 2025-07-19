// The 'chrome' object is provided by the Chrome Extension environment.
// Make sure this script is referenced as a background script in your manifest.json.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  await chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: "sidepanel.html",
    enabled: true
  });

  await chrome.sidePanel.open({ tabId: tab.id });
});
