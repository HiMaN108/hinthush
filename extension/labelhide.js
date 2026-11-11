// Hides "Click & hold to reveal" style hint labels on any page.
// Only the label is hidden — figures, images and other content are never touched.
// Can be switched on/off live from the popup, and undoes itself cleanly.

(() => {
  if (window.__pxLabelHider) return;
  window.__pxLabelHider = true;

  const ATTR = 'data-px-label-hidden';
  const WRAP = 'data-px-label-wrap';
  // Visual content that must never be hidden together with a label.
  const MEDIA = 'img, svg, canvas, video, picture, iframe, object, embed, input, button, select, textarea';
  const hasBgImage = e => getComputedStyle(e).backgroundImage !== 'none';

  let pattern = null;
  let observer = null;
  let style = null;

  function hideTextNode(node) {
    const text = node.nodeValue;
    const m = text.match(pattern);
    if (!m) return;
    const el = node.parentElement;
    if (!el || el.closest(`[${ATTR}]`) || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(el.tagName)) return;

    // Is this text node just the label (plus punctuation/icons), or a sentence containing it?
    const onlyLabel = text.replace(pattern, '').replace(/[\s.:!…·•()\-–—👆🖱️]/gu, '') === '';

    // If it's only the label, walk up while the parent holds nothing else, so the
    // whole badge box is hidden. Stop at anything holding images/diagrams.
    const labelLen = text.trim().length;
    const isPlain = e => e.textContent.trim().length === labelLen && !e.querySelector(MEDIA) && !hasBgImage(e);
    let target = el;
    while (onlyLabel && target.parentElement && target.parentElement !== document.body &&
           isPlain(target.parentElement)) {
      target = target.parentElement;
    }

    if (onlyLabel && isPlain(target)) {
      target.setAttribute(ATTR, '');
    } else {
      // Label is mixed into other text: wrap just the matching words and hide them.
      const span = document.createElement('span');
      span.setAttribute(ATTR, '');
      span.setAttribute(WRAP, '');
      const after = node.splitText(m.index);
      after.splitText(m[0].length);
      after.parentNode.replaceChild(span, after);
      span.appendChild(after);
    }
  }

  function scan() {
    if (!document.body || !pattern) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => pattern.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const found = [];
    while (walker.nextNode()) found.push(walker.currentNode);
    found.forEach(hideTextNode);
    report();
  }

  function unhideAll() {
    document.querySelectorAll(`[${WRAP}]`).forEach(span => {
      const parent = span.parentNode;
      span.replaceWith(...span.childNodes);
      parent && parent.normalize();
    });
    document.querySelectorAll(`[${ATTR}]`).forEach(e => e.removeAttribute(ATTR));
    report();
  }

  const count = () => document.querySelectorAll(`[${ATTR}]`).length;

  let reportTimer = null;
  function report() {
    clearTimeout(reportTimer);
    reportTimer = setTimeout(() => {
      try { chrome.runtime.sendMessage({ type: 'px-count', kind: 'labels', count: count() }); } catch {}
    }, 150);
  }

  function start() {
    if (!style) {
      style = document.createElement('style');
      style.textContent = `[${ATTR}] { visibility: hidden !important; } [${WRAP}][${ATTR}] { display: none !important; }`;
    }
    (document.head || document.documentElement).appendChild(style);
    scan();
    if (!observer) {
      let pending = false;
      observer = new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => { pending = false; scan(); });
      });
    }
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  }

  function stop() {
    observer && observer.disconnect();
    unhideAll();
    style && style.remove();
  }

  let enabled = false;
  async function apply() {
    const s = await pxGetSettings();
    const on = s.hideLabels && !s.pausedSites.includes(location.hostname);
    const newPattern = pxPhraseRegex(s.phrases);
    if (enabled) stop();             // reset so phrase changes take effect
    pattern = newPattern;
    enabled = on && !!pattern;
    if (enabled) start(); else report();
  }

  chrome.storage.onChanged.addListener(apply);
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'px-label-stats') reply({ running: true, enabled, count: count(), href: location.href });
  });

  apply();
})();
