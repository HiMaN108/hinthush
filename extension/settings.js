// Shared settings for every part of the extension (content scripts, popup, options).

const PX_DEFAULTS = {
  hideLabels: true,          // hide "Click & hold to reveal" style labels
  revealLocal: true,         // remove blur on pages served from this computer
  phrases: ['Click & hold to reveal', 'Click and hold to reveal', 'Hold to reveal'],
  pausedSites: [],           // hostnames where the extension does nothing
};

// Pages the "reveal" feature is allowed on: your own computer / local dev names.
function pxIsLocalHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
         host.endsWith('.localhost') || host.endsWith('.test');
}

async function pxGetSettings() {
  const stored = await chrome.storage.sync.get(PX_DEFAULTS);
  return { ...PX_DEFAULTS, ...stored };
}

function pxSetSettings(patch) {
  return chrome.storage.sync.set(patch);
}

// Turns the phrase list into one case-insensitive pattern.
// "&" also matches "and", and any run of spaces matches any whitespace.
function pxPhraseRegex(phrases) {
  const parts = phrases
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
               .replace(/\s*&\s*/g, '\\s*(?:&|and)\\s*')
               .replace(/\s+/g, '\\s+'));
  return parts.length ? new RegExp(parts.join('|'), 'i') : null;
}
