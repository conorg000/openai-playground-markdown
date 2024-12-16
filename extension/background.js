// Listen for clicks on the extension button
chrome.action.onClicked.addListener((tab) => {
    // Send a message to the content script in the active tab
    chrome.tabs.sendMessage(tab.id, { action: "toggleMarkdown" }, (response) => {
        console.log('Toggle message sent to content script. Response:', response);
    });
});