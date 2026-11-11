// Reveals blurred content — runs ONLY on pages served from this computer
// (localhost, 127.0.0.1, *.localhost, *.test), for testing your own quiz pages.
// Finds every element whose filter / backdrop-filter uses blur() and overrides it.
// Can be switched on/off live from the popup, and undoes itself cleanly.

(() => {
  if (window.__pxRevealer) return;
  window.__pxRevealer = true;
  if (!pxIsLocalHost(location.hostname)) return; // safety net in addition to manifest matches

  const ATTR = 'data-px-revealed';
  const style = document.createElement('style');
  style.textContent = `
    [${ATTR}] {
      filter: none !important;
      -webkit-filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      user-select: text !important;
    }`;

  const hasBlur = el => {
    const cs = getComputedStyle(el);
    return /blur\(/.test(cs.filter) || /blur\(/.test(cs.backdropFilter || cs.webkitBackdropFilter || '');
  };

  function scan() {
    if (!document.body) return;
    for (const el of document.body.querySelectorAll('*')) {
      if (!el.hasAttribute(ATTR) && hasBlur(el)) el.setAttribute(ATTR, '');
    }
    report();
  }

  const count = () => document.querySelectorAll(`[${ATTR}]`).length;

  let reportTimer = null;
  function report() {
    clearTimeout(reportTimer);
    reportTimer = setTimeout(() => {
      try { chrome.runtime.sendMessage({ type: 'px-count', kind: 'revealed', count: count() }); } catch {}
    }, 150);
  }

  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  });

  let enabled = false;
  async function apply() {
    const s = await pxGetSettings();
    const on = s.revealLocal && !s.pausedSites.includes(location.hostname);
    if (on === enabled) return;
    enabled = on;
    if (on) {
      (document.head || document.documentElement).appendChild(style);
      scan();
      observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
    } else {
      observer.disconnect();
      style.remove();
      document.querySelectorAll(`[${ATTR}]`).forEach(e => e.removeAttribute(ATTR));
      report();
    }
  }

  chrome.storage.onChanged.addListener(apply);
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'px-reveal-stats') reply({ running: true, enabled, count: count() });
  });

  apply();
})();
