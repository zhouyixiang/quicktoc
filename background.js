chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['content.css']
  });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['i18n.js', 'icons.js', 'content.js']
  });
}); 