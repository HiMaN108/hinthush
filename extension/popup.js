const $ = id => document.getElementById(id);
$('ver').textContent = 'v' + chrome.runtime.getManifest().version;

let tab, url, host, settings;

function setStatus(text, kind) {
  $('status').textContent = text;
  $('status').className = 'pill ' + kind;
}

// Ask one content script for its numbers (top frame only). Null = not running there.
async function ask(type) {
  try { return await chrome.tabs.sendMessage(tab.id, { type }, { frameId: 0 }); }
  catch { return null; }
}

async function refresh() {
  settings = await pxGetSettings();
  const paused = settings.pausedSites.includes(host);
  const local = pxIsLocalHost(host);

  $('hideLabels').checked = settings.hideLabels;
  $('revealLocal').checked = local && settings.revealLocal;
  $('revealLocal').disabled = !local;
  $('revealDesc').textContent = local
    ? 'Shows blurred questions all at once, so you can test your own quiz page.'
    : 'Only works on pages running on your own computer (localhost), for testing your own quiz before it goes live.';

  $('pause').textContent = paused ? 'Resume on this site' : 'Pause on this site';
  $('pauseText').textContent = paused ? 'Paused on this site' : 'Running on this site';

  const labels = await ask('px-label-stats');
  const reveal = local ? await ask('px-reveal-stats') : null;

  $('blocked').classList.toggle('hidden', !!labels);
  $('stats').classList.toggle('hidden', !labels);
  $('nLabels').textContent = labels?.count ?? 0;
  $('nRevealed').textContent = reveal?.count ?? 0;

  if (!labels) setStatus('Blocked', 'warn');
  else if (paused) setStatus('Paused', 'off');
  else if (!settings.hideLabels && !(local && settings.revealLocal)) setStatus('Off', 'off');
  else setStatus('Active', 'ok');
}

async function init() {
  // popup.html?tab=<id> lets automated tests open the popup in a normal tab for a given page.
  const testTab = new URLSearchParams(location.search).get('tab');
  [tab] = testTab ? [await chrome.tabs.get(Number(testTab))] : await chrome.tabs.query({ active: true, currentWindow: true });
  try { url = new URL(tab.url); } catch { url = null; }
  // Chrome may hide the tab's address from the popup; the page's own script can tell us.
  if (!url) {
    const info = await ask('px-label-stats');
    if (info?.href) url = new URL(info.href);
  }

  if (!url || !/^https?:$/.test(url.protocol)) {
    $('site').textContent = url ? url.protocol.replace(':', '') + ' page' : '—';
    $('unsupported').classList.remove('hidden');
    $('stats').classList.add('hidden');
    document.querySelectorAll('input, #pause').forEach(e => e.disabled = true);
    setStatus('Not available', 'off');
    return;
  }

  host = url.hostname;
  $('site').textContent = host;
  $('site').title = url.href;
  await refresh();
}

$('hideLabels').addEventListener('change', async e => {
  await pxSetSettings({ hideLabels: e.target.checked });
  setTimeout(refresh, 250);
});

$('revealLocal').addEventListener('change', async e => {
  await pxSetSettings({ revealLocal: e.target.checked });
  setTimeout(refresh, 250);
});

$('pause').addEventListener('click', async () => {
  const s = await pxGetSettings();
  const paused = s.pausedSites.includes(host);
  const pausedSites = paused ? s.pausedSites.filter(h => h !== host) : [...s.pausedSites, host];
  await pxSetSettings({ pausedSites });
  setTimeout(refresh, 250);
});

// Chrome's "On click" site access: ask for permission on this site, then reload so scripts start.
$('allow').addEventListener('click', async () => {
  const granted = await chrome.permissions.request({ origins: [`${url.origin}/*`] });
  if (granted) {
    await chrome.tabs.reload(tab.id);
    setStatus('Starting…', 'off');
    setTimeout(refresh, 1200);
  }
});

// Keep the numbers live while the popup is open.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'px-count' && sender.tab?.id === tab?.id) refresh();
});

init();
