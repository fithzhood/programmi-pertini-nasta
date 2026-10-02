/* Programmi di matematica e fisica (Pertini, Nasta, Giovanni Paolo II) — sito a una pagina con indirizzi navigabili (#/scuola/indirizzo/classe/materia) */
(() => {
'use strict';

const ROM = ['I', 'II', 'III', 'IV', 'V'];
const SCHOOLS = {
  GP2: { key: 'giovannipaolo2', name: 'Istituto Giovanni Paolo II', short: 'Giovanni Paolo II', title: 'Giovanni Paolo II', mono: 'GP',
    city: 'Ostia (Roma)', addr: 'Corso Duca di Genova 157',
    site: 'https://www2.istitutogiovannipaolo2.it/indirizzi/', siteLbl: 'Indirizzi sul sito della scuola' },
  Nasta: { key: 'nasta', name: 'Istituto Giuseppe Nasta', short: 'Nasta', title: 'Giuseppe Nasta', mono: 'GN',
    city: 'Corbara (SA)', addr: 'Via Tenente Lignola 20',
    site: 'https://www.istitutoparitarionasta.it/indirizzi-di-studio/', siteLbl: 'Indirizzi sul sito della scuola' },
  Pertini: { key: 'pertini', name: 'Istituto Sandro Pertini', short: 'Pertini', title: 'Sandro Pertini', mono: 'SP',
    city: 'Nocera Inferiore (SA)', addr: 'Via Cicalesi 19',
    site: 'https://www.istitutosandropertini.com/programma_scolastico', siteLbl: 'Programmi sul sito della scuola' },
};
const ORDER = ['GP2', 'Nasta', 'Pertini'];
// l'ordine delle scuole vale ovunque: pagina iniziale, ricerca, elenchi
DATA.sort((a, b) => ORDER.indexOf(a.ist) - ORDER.indexOf(b.ist));
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

const ICON = {
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
  print: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
};

/* ---------- utilità ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const VAR = { a: 'aàáâä', e: 'eèéêë', i: 'iìíîï', o: 'oòóôö', u: 'uùúûü', c: 'cç' };
function rxFor(q) {
  const nq = norm(q || '').trim();
  if (nq.length < 2) return null;
  const src = [...nq].map(ch => VAR[ch] ? '[' + VAR[ch] + ']' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
  return new RegExp(src, 'gi');
}
function hl(s, rx) {
  s = String(s);
  if (!rx) return esc(s);
  let out = '', last = 0;
  s.replace(rx, (m, off) => { out += esc(s.slice(last, off)) + '<mark>' + esc(m) + '</mark>'; last = off + m.length; return m; });
  return out + esc(s.slice(last));
}
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

/* I titoli dei PDF mescolano etichette e gruppi («Modulo 1 - Calcolo letterale. U.D. 2: I polinomi»):
   li scompongo in gruppo («Modulo 1 · Calcolo letterale»), etichetta («U.D. 2») e titolo («I polinomi»). */
const LBL = /(U\.D\.|Modulo|Unità)\s*(?:n°\s*)?(\d+|[A-Z])\b\s*[:.–-]?\s*/g;
function splitTitle(t) {
  let m, last = null;
  LBL.lastIndex = 0;
  while ((m = LBL.exec(t))) last = m;
  if (last) {
    const title = t.slice(last.index + last[0].length).trim();
    if (title) {
      const group = t.slice(0, last.index).replace(/[\s.:–-]+$/, '').replace(/\s+[-–]\s+|:\s*/g, ' · ').trim();
      return { group, label: last[1] + ' ' + last[2], title };
    }
  }
  const n = t.match(/^(\d+)\.\s+(.+)$/);
  if (n) return { group: '', label: n[1], title: n[2] };
  return { group: '', label: '', title: t };
}

/* Alcuni PDF scrivono un argomento come paragrafo: «Il piano cartesiano: le coordinate – i segmenti – la retta».
   Lo mostro come sottotitolo con il suo elenco; senza sottotitolo diventa più voci. */
const SEP = /\s*–\s*|\s+-\s+/;
function expandItem(a) {
  const m = a.match(/^([^:]{3,90}):\s*(.+)$/);
  const parts = (m ? m[2] : a).split(SEP).map(x => x.trim()).filter(Boolean);
  if (parts.length < 2) return [{ t: a }];
  return m ? [{ t: m[1].trim(), sub: parts }] : parts.map(t => ({ t }));
}

/* ---------- preparazione dei dati ---------- */
const INDS = new Map();
DATA.forEach(d => {
  d.S = SCHOOLS[d.ist];
  d.sk = d.S.key;
  d.ck = d.code.toLowerCase();
  // pk esplicito quando una classe ha due programmi della stessa area (Matematica e Complementi)
  d.pk = d.pk || d.cat + (d.sez ? '-' + d.sez.toLowerCase() : '');
  d.oldId = (d.ist + '-' + d.code + '-' + d.n + (d.sez || '') + '-' + d.cat).toLowerCase();
  d.warn = d.moduli.length === 0 || d.moduli.every(m => m.a.length === 0) || /errat|per errore|si interrompe|manca il modulo/i.test(d.note);
  d.blocks = d.moduli.map(m => {
    const list = m.a.flatMap(expandItem);
    return Object.assign(splitTitle(m.t), { items: m.a, list, leaves: list.reduce((s, x) => s + (x.sub ? x.sub.length : 1), 0), raw: m.t });
  });
  d.topics = d.blocks.reduce((s, b) => s + b.leaves, 0);
  if (!d.blocks.some(b => b.label)) d.blocks.forEach((b, i) => { b.label = String(i + 1); });
  const key = d.sk + '/' + d.ck;
  if (!INDS.has(key)) INDS.set(key, { key, ist: d.ist, S: d.S, code: d.code, ck: d.ck, ind: d.ind, tipo: d.tipo, progs: [] });
  INDS.get(key).progs.push(d);
});
const TOTAL_TOPICS = DATA.reduce((s, d) => s + d.topics, 0);
const href = (d, q) => '#/' + d.sk + '/' + d.ck + '/' + d.n + '/' + d.pk + (q ? '?q=' + encodeURIComponent(q) : '');
const progLabel = d => d.mat + (d.sez ? ' · sez. ' + d.sez : '');
const classLabel = d => 'Classe ' + d.cl + (d.sez ? ' ' + d.sez : '');

/* ---------- pagine ---------- */
const app = document.getElementById('app');

function searchForm(q, big) {
  return `<form class="searchbox" role="search" data-search>
    ${ICON.search}
    <input type="search" name="q" value="${esc(q || '')}" placeholder="Cerca un argomento: derivate, vettori, parabola…" aria-label="Cerca un argomento" autocomplete="off" ${big ? 'autofocus' : ''}>
    ${big ? '' : '<button class="btn" type="submit">Cerca</button>'}
  </form>`;
}
const SUGGEST = ['derivate', 'logaritmi', 'moto circolare', 'integrali', 'legge di Ohm', 'parabola', 'probabilità'];
const suggestChips = () => `<div class="chips"><span>Prova:</span>${SUGGEST.map(s => `<a href="#/cerca/${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>`;

function tile(I) {
  const years = ROM.map((r, i) => {
    const ps = I.progs.filter(d => d.n === i + 1);
    if (!ps.length) return `<span class="off" title="Classe ${r}: non pubblicata">${r}</span>`;
    return `<span title="Classe ${r}: ${esc([...new Set(ps.map(d => d.mat))].join(', '))}">${r}</span>`;
  }).join('');
  return `<a class="tile ${I.S.key}" href="#/${I.S.key}/${I.ck}">
    <span class="code">${esc(I.code)}</span>
    <div><div class="tile-name">${esc(I.ind)}</div><div class="tile-type">${esc(I.tipo)}</div></div>
    <span class="go">${ICON.right}</span>
    <div class="years" aria-label="Classi pubblicate">${years}</div>
  </a>`;
}

function pageHome() {
  document.title = 'Programmi di Matematica e Fisica · Giovanni Paolo II, Nasta, Pertini';
  const schools = ORDER.map(ist => {
    const S = SCHOOLS[ist];
    const inds = [...INDS.values()].filter(I => I.ist === ist);
    return `<section class="school ${S.key}" aria-labelledby="h-${S.key}">
      <div class="school-h">
        <span class="mono" aria-hidden="true">${S.mono}</span>
        <div class="school-txt">
          <p class="kicker">${S.city}</p>
          <h2 id="h-${S.key}">${S.title}</h2>
          <p class="addr">${S.addr}</p>
          <a class="site" href="${S.site}" target="_blank" rel="noopener">${S.siteLbl}${ICON.ext}</a>
        </div>
      </div>
      <div class="tiles">${inds.map(tile).join('')}</div>
    </section>`;
  }).join('');
  app.innerHTML = `<div class="fade">
    <section class="hero wrap">
      <p class="eyebrow">Matematica e Fisica · istituti paritari</p>
      <h1>I programmi del <em>Giovanni&nbsp;Paolo&nbsp;II</em>, del <em>Nasta</em> e del <em>Pertini</em>, classe per classe</h1>
      <p class="lead">Gli argomenti pubblicati da tre scuole paritarie, riordinati per indirizzo, classe e blocco tematico. Ogni programma rimanda al PDF originale.</p>
      ${searchForm('', false)}
      ${suggestChips()}
      <div class="stats">
        <div><b>${ORDER.length}</b>istituti</div><div><b>${INDS.size}</b>indirizzi</div>
        <div><b>${DATA.length}</b>programmi</div><div><b>${TOTAL_TOPICS.toLocaleString('it-IT')}</b>argomenti</div>
      </div>
    </section>
    <div class="wrap schools">${schools}</div>
  </div>`;
}

function blocksHtml(d, rx) {
  if (!d.blocks.length) return '';
  const titlesOnly = d.topics === 0;
  let h = '', group = null, open = false;
  const openGrid = () => { h += `<div class="blocks${titlesOnly ? ' titles' : ''}">`; open = true; };
  d.blocks.forEach(b => {
    if (b.group !== group) {
      if (open) h += '</div>';
      open = false;
      group = b.group;
      if (group) h += `<div class="group"><h3>${hl(group, rx)}</h3></div>`;
    }
    if (!open) openGrid();
    const wide = b.leaves > 14 || (d.blocks.length === 1 && b.leaves > 6);
    const li = x => x.sub
      ? `<li class="has-sub"><b>${hl(x.t, rx)}</b><ul class="sub">${x.sub.map(s => `<li>${hl(s, rx)}</li>`).join('')}</ul></li>`
      : `<li>${hl(x.t, rx)}</li>`;
    const body = titlesOnly ? '' : b.list.length
      ? '<ul>' + b.list.map(li).join('') + '</ul>'
      : '<p class="empty">Solo il titolo: il PDF non elenca argomenti.</p>';
    h += `<article class="block${wide ? ' wide' : ''}">
      <div class="block-h">${b.label ? `<span class="num">${esc(b.label)}</span>` : ''}<h4>${hl(b.title, rx)}</h4></div>
      ${body}
    </article>`;
  });
  if (open) h += '</div>';
  return h;
}

function pageInd(I, n, pk, q) {
  const classes = [...new Set(I.progs.map(d => d.n))].sort();
  if (!classes.includes(n)) n = classes[0];
  const inClass = I.progs.filter(d => d.n === n);
  const d = inClass.find(p => p.pk === pk) || inClass[0];
  const rx = rxFor(q);
  document.title = `${I.code} · ${classLabel(d)} · ${d.mat} — ${I.S.short}`;

  const tabs = ROM.map((r, i) => {
    const c = i + 1;
    if (!classes.includes(c)) return `<span title="Classe ${r}: non pubblicata" aria-disabled="true">${r}</span>`;
    const target = I.progs.filter(p => p.n === c);
    const same = target.find(p => p.pk === d.pk) || target.find(p => p.cat === d.cat) || target[0];
    return `<a href="${href(same)}" ${c === n ? 'aria-current="page"' : ''} title="Classe ${r}">${r}</a>`;
  }).join('');
  const pills = inClass.length > 1
    ? `<div class="pick-row"><span class="lbl">Materia</span><div class="pills" role="navigation" aria-label="Materia">${inClass.map(p => `<a href="${href(p)}" ${p === d ? 'aria-current="page"' : ''}><span class="dot"></span>${esc(progLabel(p))}</a>`).join('')}</div></div>`
    : '';

  const meta = d.topics
    ? `${plural(d.blocks.length, 'blocco', 'blocchi')} · ${plural(d.topics, 'argomento', 'argomenti')}`
    : d.blocks.length ? `${plural(d.blocks.length, 'titolo', 'titoli')}, senza argomenti nel PDF` : 'Programma non disponibile';
  const twins = (d.uguale || []).map(name => {
    const T = [...INDS.values()].find(J => J.ist === I.ist && J.ind === name);
    const t = T && T.progs.find(p => p.n === d.n && p.mat === d.mat);
    return t ? `<a href="${href(t)}">${esc(name)}</a>` : esc(name);
  });
  const same = twins.length ? `<div class="same">Stesso programma pubblicato anche per: ${twins.join(', ')}</div>` : '';
  const agg = d.agg ? ` · PDF caricato a ${MESI[+d.agg.slice(5, 7) - 1]} ${d.agg.slice(0, 4)}` : '';
  const note = d.note ? `<div class="note${d.moduli.length ? '' : ' big'}">${ICON.info}<div>${d.warn ? '<b>Da verificare.</b> ' : '<b>Nota.</b> '}${hl(d.note, rx)}</div></div>` : '';

  const ci = classes.indexOf(n);
  const near = c => { const t = I.progs.filter(p => p.n === c); return t.find(p => p.pk === d.pk) || t.find(p => p.cat === d.cat) || t[0]; };
  const prev = ci > 0 ? near(classes[ci - 1]) : null;
  const next = ci < classes.length - 1 ? near(classes[ci + 1]) : null;
  const pager = `<nav class="pager" aria-label="Altre classi">
    ${prev ? `<a href="${href(prev)}"><small>${ICON.left} Classe precedente</small><b>${esc(classLabel(prev))} · ${esc(prev.mat)}</b></a>` : ''}
    ${next ? `<a class="next" href="${href(next)}"><small>Classe successiva ${ICON.right}</small><b>${esc(classLabel(next))} · ${esc(next.mat)}</b></a>` : ''}
  </nav>`;

  app.innerHTML = `<div class="wrap ${I.S.key}">
    <nav class="crumbs" aria-label="Percorso"><a href="#/">Programmi</a>${ICON.chev}<span>${I.S.name}</span>${ICON.chev}<span>${esc(I.code)}</span></nav>
    <header class="ind-head">
      <span class="code">${esc(I.code)}</span>
      <h1>${esc(I.ind)}</h1>
      <p class="sub">${esc(I.tipo)} · ${I.S.name}</p>
    </header>
    <div class="picker" id="picker"><div class="picker-in">
      <div class="pick-row"><span class="lbl">Classe</span><div class="tabs" role="navigation" aria-label="Classe">${tabs}</div></div>
      ${pills}
    </div></div>
    <section class="prog fade" id="prog" aria-labelledby="h-prog">
      <div class="prog-head">
        <div><h2 id="h-prog"><small>${esc(classLabel(d))}</small>${esc(d.mat)}</h2><div class="meta">${meta}${agg}</div>${same}</div>
        <div class="prog-actions">
          <a class="btn ghost" href="${esc(d.url)}" target="_blank" rel="noopener">${ICON.doc}PDF originale</a>
          <button class="btn ghost" type="button" data-print>${ICON.print}Stampa</button>
        </div>
      </div>
      ${note}
      ${blocksHtml(d, rx)}
    </section>
    ${pager}
  </div>`;
  return { ind: I.key };
}

function resultsHtml(q) {
  const rx = rxFor(q);
  if (!rx) return `<p class="hint">Scrivi almeno due lettere. La ricerca guarda i titoli dei blocchi e i singoli argomenti di tutti i ${DATA.length} programmi, senza badare ad accenti e maiuscole.</p>${suggestChips()}`;
  const nq = norm(q).trim();
  let nHits = 0;
  const res = [];
  DATA.forEach(d => {
    const hits = [];
    d.blocks.forEach(b => {
      if (norm(b.raw).includes(nq)) hits.push({ t: b.title, kind: 'blocco' });
      b.list.forEach(x => {
        if (norm(x.t).includes(nq)) hits.push({ t: x.t, in: b.title });
        (x.sub || []).forEach(s => { if (norm(s).includes(nq)) hits.push({ t: s, in: x.t }); });
      });
    });
    if (hits.length) { res.push({ d, hits }); nHits += hits.length; }
  });
  if (!res.length) return `<p class="res-count">Nessun argomento contiene «${esc(q.trim())}». Prova con una parola più corta o più generica.</p>${suggestChips()}`;
  return `<p class="res-count">${plural(nHits, 'argomento trovato', 'argomenti trovati')} in ${plural(res.length, 'programma', 'programmi')}</p>
  <div class="results">${res.map(({ d, hits }) => `<a class="res ${d.sk}" href="${href(d, q.trim())}">
    <div class="res-h"><span class="code">${esc(d.code)}</span><b>${esc(classLabel(d))} · ${esc(d.mat)}</b><span class="where">${d.S.short} · ${esc(d.ind)}</span></div>
    <ul>${hits.slice(0, 4).map(h => `<li>${hl(h.t, rx)}${h.kind ? ' <span>(titolo di blocco)</span>' : h.in ? ` <span>— ${esc(h.in)}</span>` : ''}</li>`).join('')}</ul>
    ${hits.length > 4 ? `<div class="more">e altri ${hits.length - 4}</div>` : ''}
  </a>`).join('')}</div>`;
}

function pageSearch(q) {
  document.title = (q ? `«${q}» · ` : '') + 'Cerca · Programmi di matematica e fisica';
  app.innerHTML = `<section class="search-page wrap fade">
    <h1>Cerca un argomento</h1>
    ${searchForm(q, true)}
    <div id="res">${resultsHtml(q)}</div>
  </section>`;
  const inp = app.querySelector('input[type=search]');
  if (inp) { inp.focus(); const v = inp.value; inp.value = ''; inp.value = v; }
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const v = inp.value;
      try { history.replaceState(null, '', '#/cerca' + (v.trim() ? '/' + encodeURIComponent(v) : '')); } catch (_) {}
      document.getElementById('res').innerHTML = resultsHtml(v);
      document.title = (v.trim() ? `«${v.trim()}» · ` : '') + 'Cerca · Programmi di matematica e fisica';
    }, 140);
  });
}

/* ---------- instradamento ---------- */
let lastInd = null;
function route() {
  let h = location.hash.slice(1);
  try { h = decodeURIComponent(h); } catch (_) {}
  // i vecchi collegamenti alle schede (#pertini-afm-3-mat) portano alla pagina nuova
  if (h && h[0] !== '/') {
    const old = DATA.find(d => d.oldId === h.toLowerCase());
    if (old) { location.replace(href(old)); return; }
    h = '/';
  }
  const [path, qs] = (h || '/').split('?');
  const q = new URLSearchParams(qs || '').get('q') || '';
  const parts = path.split('/').filter(Boolean);
  const bs = document.querySelector('.bar-search');
  if (parts[0] === 'cerca') bs.setAttribute('aria-current', 'page'); else bs.removeAttribute('aria-current');

  let info = null;
  if (!parts.length) pageHome();
  else if (parts[0] === 'cerca') pageSearch(parts.slice(1).join('/'));
  else {
    const I = INDS.get(parts[0] + '/' + parts[1]);
    if (!I) { pageHome(); lastInd = null; window.scrollTo(0, 0); return; }
    info = pageInd(I, +parts[2] || 0, parts[3] || '', q);
  }

  const sameInd = info && info.ind === lastInd;
  lastInd = info ? info.ind : null;
  if (info && q) {
    const m = app.querySelector('.block mark, .note mark');
    if (m) { m.scrollIntoView({ block: 'center' }); return; }
  }
  if (sameInd) {
    // cambio di classe o materia: resto dove sono, ma se ho già passato l'inizio del programma ci torno
    const prog = document.getElementById('prog'), pick = document.getElementById('picker');
    const top = prog.getBoundingClientRect().top + scrollY - pick.offsetHeight - 66;
    if (scrollY > top) window.scrollTo(0, top);
  } else {
    window.scrollTo(0, 0);
    if (parts.length) app.focus({ preventScroll: true });
  }
  stick();
}

function stick() {
  const p = document.getElementById('picker');
  if (p) p.classList.toggle('stuck', p.getBoundingClientRect().top <= 60 && scrollY > 80);
}

document.addEventListener('submit', e => {
  const f = e.target.closest('[data-search]');
  if (!f) return;
  e.preventDefault();
  const v = f.q.value.trim();
  location.hash = '#/cerca' + (v ? '/' + encodeURIComponent(v) : '');
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-print]')) window.print();
  if (e.target.closest('[data-theme-toggle]')) setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('programmi-tema', t); } catch (_) {}
  const b = document.querySelector('[data-theme-toggle]');
  if (b) b.setAttribute('aria-label', t === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro');
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = t === 'dark' ? '#13161c' : '#f7f5f0';
}
setTheme(document.documentElement.getAttribute('data-theme') || 'light');
addEventListener('scroll', stick, { passive: true });
addEventListener('hashchange', route);
route();
})();
