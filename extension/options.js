const $ = id => document.getElementById(id);
let s;

function flashSaved() {
  $('saved').style.opacity = 1;
  clearTimeout(flashSaved.t);
  flashSaved.t = setTimeout(() => $('saved').style.opacity = 0, 1200);
}
async function save(patch) { await pxSetSettings(patch); flashSaved(); render(); }

function list(el, items, emptyText, onRemove) {
  el.replaceChildren();
  if (!items.length) {
    const li = document.createElement('li'); li.className = 'empty'; li.textContent = emptyText; el.append(li); return;
  }
  items.forEach((item, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span'); span.textContent = item;
    const x = document.createElement('button'); x.className = 'x'; x.textContent = 'Remove'; x.onclick = () => onRemove(i);
    li.append(span, x); el.append(li);
  });
}

async function render() {
  s = await pxGetSettings();
  $('hideLabels').checked = s.hideLabels;
  $('revealLocal').checked = s.revealLocal;
  list($('phrases'), s.phrases, 'No phrases — nothing will be hidden.', i => save({ phrases: s.phrases.filter((_, j) => j !== i) }));
  list($('paused'), s.pausedSites, 'No paused sites.', i => save({ pausedSites: s.pausedSites.filter((_, j) => j !== i) }));
}

$('hideLabels').onchange = e => save({ hideLabels: e.target.checked });
$('revealLocal').onchange = e => save({ revealLocal: e.target.checked });
$('addPhrase').onsubmit = e => {
  e.preventDefault();
  const v = $('newPhrase').value.trim();
  if (v && !s.phrases.some(p => p.toLowerCase() === v.toLowerCase())) save({ phrases: [...s.phrases, v] });
  $('newPhrase').value = '';
};
$('reset').onclick = () => save({ ...PX_DEFAULTS });
render();
