// Background service worker
console.log('Wiki Editor background script loaded');

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToWiki',
    title: 'Wikiに追加',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToWiki') {
    const selectedText = info.selectionText;
    
    // Open popup with selected text
    chrome.storage.local.set({ 
      quickAdd: selectedText 
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getQuickAdd') {
    chrome.storage.local.get(['quickAdd'], (result) => {
      sendResponse({ text: result.quickAdd || '' });
      chrome.storage.local.remove(['quickAdd']);
    });
    return true;
  }
});
