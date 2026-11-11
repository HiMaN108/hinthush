// Keeps the toolbar badge up to date and opens the welcome guide on install.

const counts = {}; // tabId -> { frameId -> { labels, revealed } }

function updateBadge(tabId) {
  const frames = counts[tabId] || {};
  let total = 0;
  for (const f of Object.values(frames)) total += (f.labels || 0) + (f.revealed || 0);
  chrome.action.setBadgeText({ tabId, text: total ? String(total) : '' });
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#2f5bea' });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'px-count' || !sender.tab) return;
  const tabId = sender.tab.id;
  counts[tabId] ??= {};
  counts[tabId][sender.frameId] ??= {};
  counts[tabId][sender.frameId][msg.kind] = msg.count;
  updateBadge(tabId);
});

// New page in a tab: forget the old page's numbers.
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading') { delete counts[tabId]; updateBadge(tabId); }
});
chrome.tabs.onRemoved.addListener(tabId => delete counts[tabId]);

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.tabs.create({ url: 'welcome.html' });
});
