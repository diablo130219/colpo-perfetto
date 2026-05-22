// ===== COLPO PERFETTO — app.js =====

const QSUGG = [
  1.35,1.35,1.40,1.35,1.35,1.35,1.45,1.65,1.65,1.80,
  1.40,1.45,1.50,1.50,1.40,1.40,1.40,1.45,1.45,1.55,
  1.55,1.55,1.65,1.65,2.46
];
const N = 25;
const TABS = ['cp1','cp2','cp3'];
const TAB_NAMES = { cp1:'Colpo Perfetto 1', cp2:'Colpo Perfetto 2', cp3:'Colpo Perfetto 3' };
const TAB_COLORS = { cp1:'cp1', cp2:'cp2', cp3:'cp3' };

// Stato per ciascun tab
const state = {};
TABS.forEach(t => { state[t] = { steps: [] }; });

let activeTab = 'cp1';
let prevMag = { cp1:0, cp2:0, cp3:0 };

// ── Helpers ──
function g(id)    { return document.getElementById(id); }
function fn(v)    { return (+v).toFixed(2).replace('.', ','); }
function fe(v)    { return fn(v) + ' €'; }
function esc(s)   { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Init steps ──
function initSteps(tab) {
  state[tab].steps = [];
  for (let i = 0; i < N; i++)
    state[tab].steps.push({ desc:'', qSugg:QSUGG[i], qGioc:null, esito:null });
}

// ── Persist ──
function saveAll() {
  try {
    const save = {};
    TABS.forEach(t => {
      const cfg = getConfig(t);
      save[t] = { cfg, steps: state[t].steps };
    });
    localStorage.setItem('cp_v3', JSON.stringify(save));
  } catch(e) {}
}

function loadAll() {
  try {
    const raw = localStorage.getItem('cp_v3');
    if (!raw) return false;
    const save = JSON.parse(raw);
    TABS.forEach(t => {
      if (save[t]) {
        if (save[t].cfg) {
          const c = save[t].cfg;
          if (g(`cassa-${t}`))     g(`cassa-${t}`).value     = c.cassa     ?? 100;
          if (g(`stakeIniz-${t}`)) g(`stakeIniz-${t}`).value = c.stakeIniz ?? 3;
          if (g(`stepAzz-${t}`))   g(`stepAzz-${t}`).value   = c.stepAzz   ?? 3;
          if (g(`pctV-${t}`))      g(`pctV-${t}`).value      = c.pctV      ?? 40;
          if (g(`commP-${t}`))     g(`commP-${t}`).value     = c.commP     ?? 0;
        }
        state[t].steps = save[t].steps || [];
        while (state[t].steps.length < N)
          state[t].steps.push({ desc:'', qSugg:QSUGG[state[t].steps.length], qGioc:null, esito:null });
      }
    });
    return true;
  } catch(e) { return false; }
}

function getConfig(tab) {
  return {
    cassa:     parseFloat(g(`cassa-${tab}`)?.value)     || 100,
    stakeIniz: parseFloat(g(`stakeIniz-${tab}`)?.value) || 3,
    stepAzz:   parseInt(g(`stepAzz-${tab}`)?.value)     || 3,
    pctV:      parseFloat(g(`pctV-${tab}`)?.value)      || 40,
    commP:     parseFloat(g(`commP-${tab}`)?.value)     || 0,
  };
}

// ── Build page HTML ──
function buildPage(tab) {
  const name = TAB_NAMES[tab];
  const num  = tab.replace('cp','');
  return `
  <header class="hero">
    <div class="hero-left">
      <div class="hero-eyebrow">Sistema Progressivo · Sessione ${num}</div>
      <h1 class="hero-title">Colpo <span>Perfetto</span> <span style="color:var(--text2);font-size:.55em">${num}</span></h1>
      <div class="hero-sub">La scalata a quota <strong>1000</strong></div>
    </div>
    <div class="hero-mag">
      <div class="mag-ring">
        <div class="mag-inner">
          <div class="mag-label-top">MAGAZZINO</div>
          <div class="mag-amount" id="magTot-${tab}">0,00 €</div>
          <div class="mag-label-bot" id="mi1-${tab}">0 step</div>
        </div>
      </div>
    </div>
  </header>

  <div class="settings-bar">
    <div class="setting-group">
      <label>Cassa iniziale</label>
      <div class="input-wrap"><input type="number" id="cassa-${tab}" value="100" min="1" step="1"><span class="unit">€</span></div>
    </div>
    <div class="setting-group">
      <label>Stake iniziale</label>
      <div class="input-wrap"><input type="number" id="stakeIniz-${tab}" value="3" min="0.1" step="0.1"><span class="unit">€</span></div>
    </div>
    <div class="setting-group">
      <label>Step Fase 1</label>
      <div class="input-wrap"><input type="number" id="stepAzz-${tab}" value="3" min="1" max="10" step="1"><span class="unit">#</span></div>
    </div>
    <div class="setting-group">
      <label>% Magazzino F2</label>
      <div class="input-wrap"><input type="number" id="pctV-${tab}" value="40" min="0" max="100" step="5"><span class="unit">%</span></div>
    </div>
    <div class="setting-group">
      <label>Commissioni</label>
      <div class="input-wrap"><input type="number" id="commP-${tab}" value="0" min="0" max="10" step="0.5"><span class="unit">%</span></div>
    </div>
    <button class="btn-reset" data-tab="${tab}">↺ Reset</button>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">◈</div>
      <div class="stat-body">
        <div class="stat-label">Cassa iniziale</div>
        <div class="stat-value" id="sc-cassa-${tab}">100,00 €</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">◎</div>
      <div class="stat-body">
        <div class="stat-label">Stake prossimo</div>
        <div class="stat-value" id="sc-stake-${tab}">3,00 €</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">▤</div>
      <div class="stat-body">
        <div class="stat-label">Step completati</div>
        <div class="stat-value" id="sc-step-${tab}">0 / 25</div>
      </div>
    </div>
    <div class="stat-card accent">
      <div class="stat-icon">◆</div>
      <div class="stat-body">
        <div class="stat-label">Magazzino</div>
        <div class="stat-value gold" id="sc-mag-${tab}">0,00 €</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">◇</div>
      <div class="stat-body">
        <div class="stat-label">Rischio netto</div>
        <div class="stat-value" id="sc-rischio-${tab}">3,00 €</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">▲</div>
      <div class="stat-body">
        <div class="stat-label">Return totale</div>
        <div class="stat-value green" id="sc-return-${tab}">0,00 €</div>
      </div>
    </div>
  </div>

  <div class="phase-strip">
    <div class="phase-pill p1">
      <span class="pill-dot red"></span>
      Fase 1 — Azzeramento rischio: stake fisso, tutto il gain va in magazzino
    </div>
    <div class="phase-divider">→</div>
    <div class="phase-pill p2">
      <span class="pill-dot gold"></span>
      Fase 2 — Scalata: <span id="pctVd-${tab}">40</span>% magazzino · <span id="pctRd-${tab}">60</span>% reinvestito nello stake
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="col-n">#</th>
          <th class="col-stk">Stake</th>
          <th class="col-dsc">Evento + mercato</th>
          <th class="col-stkcol">Stake usato</th>
          <th class="col-qg">Q. giocata</th>
          <th class="col-gl">Gain lordo</th>
          <th class="col-gn">Gain netto</th>
          <th class="col-gm">→ Mag.</th>
          <th class="col-mc">Mag. cumul.</th>
          <th class="col-rt">Return</th>
          <th class="col-es">Esito</th>
        </tr>
      </thead>
      <tbody id="tbody-${tab}"></tbody>
    </table>
  </div>

  <div class="formula-note">
    <span class="fn-label">Formula Fase 2:</span>
    Stake<sub>n+1</sub> = Stake<sub>n</sub> + GainNetto × (1 − %mag) &nbsp;·&nbsp;
    <span id="mi2-${tab}">Prossimo stake: —</span>
  </div>
  `;
}

// ── Recalc ──
function recalc(tab) {
  const cfg = getConfig(tab);
  const { cassa, stakeIniz, stepAzz, commP } = cfg;
  const pctV = cfg.pctV / 100;
  const pctR = 1 - pctV;

  if (g(`pctVd-${tab}`)) g(`pctVd-${tab}`).textContent = Math.round(pctV * 100);
  if (g(`pctRd-${tab}`)) g(`pctRd-${tab}`).textContent = Math.round(pctR * 100);

  let stakeCur  = stakeIniz;
  let magCum    = 0;
  let returnCur = 0;
  let doneCount = 0;
  const rows = [];

  for (let i = 0; i < N; i++) {
    const s = state[tab].steps[i];
    const isFase1 = (i < stepAzz);
    const stake = parseFloat(stakeCur.toFixed(2));
    let gainLordo=null, gainNetto=null, gainMag=null;

    if (s.esito === 'ok' && s.qGioc) {
      gainLordo = parseFloat((stake * s.qGioc).toFixed(2));
      const comm = parseFloat((gainLordo * commP / 100).toFixed(2));
      gainNetto = parseFloat((gainLordo - stake - comm).toFixed(2));
      if (isFase1) {
        gainMag  = gainNetto;
        stakeCur = stake;
      } else {
        gainMag  = parseFloat((gainNetto * pctV).toFixed(2));
        stakeCur = parseFloat((stake + gainNetto - gainMag).toFixed(2));
      }
      magCum    = parseFloat((magCum + gainMag).toFixed(2));
      returnCur = parseFloat((returnCur + gainNetto).toFixed(2));
      doneCount++;
    } else if (s.esito === 'ko') {
      gainLordo = 0; gainNetto = parseFloat((-stake).toFixed(2)); gainMag = 0;
      returnCur = parseFloat((returnCur - stake).toFixed(2));
      doneCount++;
    }
    rows.push({ i, isFase1, stake, qGioc: s.qGioc, gainLordo, gainNetto, gainMag, magCum, returnCur, esito: s.esito });
  }

  const rischio = Math.max(0, parseFloat((stakeIniz * stepAzz - magCum).toFixed(2)));
  const np = rows.find(r => r.esito === null);

  // Animate magazzino
  animCounter(g(`magTot-${tab}`), prevMag[tab]||0, magCum, 500);
  prevMag[tab] = magCum;

  if (g(`mi1-${tab}`))        g(`mi1-${tab}`).textContent       = doneCount + ' step completati';
  if (g(`mi2-${tab}`))        g(`mi2-${tab}`).textContent       = 'Prossimo stake: ' + (np ? fe(np.stake) : '—');
  if (g(`sc-cassa-${tab}`))   g(`sc-cassa-${tab}`).textContent  = fe(cassa);
  if (g(`sc-stake-${tab}`))   g(`sc-stake-${tab}`).textContent  = np ? fe(np.stake) : '—';
  if (g(`sc-step-${tab}`))    g(`sc-step-${tab}`).textContent   = doneCount + ' / ' + N;
  if (g(`sc-mag-${tab}`))     g(`sc-mag-${tab}`).textContent    = fe(magCum);
  if (g(`sc-rischio-${tab}`)) g(`sc-rischio-${tab}`).textContent= fe(rischio);
  if (g(`sc-return-${tab}`))  g(`sc-return-${tab}`).textContent = fe(returnCur);

  const tbody = g(`tbody-${tab}`);
  if (!tbody) return { magCum, returnCur, doneCount, stakeIniz, cassa };
  tbody.innerHTML = '';

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    if (r.esito === 'ok') tr.classList.add('ok-r');
    if (r.esito === 'ko') tr.classList.add('ko-r');
    if (idx === stepAzz)  tr.classList.add('phase-sep');
    const gnClass = r.gainNetto===null ? 'mu' : r.gainNetto>=0 ? 'gp' : 'gng';

    tr.innerHTML = `
      <td>${r.i+1}${r.isFase1?'<span class="fb">F1</span>':''}</td>
      <td><span class="stk-val${r.isFase1?' fase1':''}">${fe(r.stake)}</span></td>
      <td class="col-dsc">
        <input type="text" placeholder="Inserisci evento..."
          value="${esc(state[tab].steps[idx].desc)}"
          onchange="state['${tab}'].steps[${idx}].desc=this.value;saveAll()"/>
      </td>
      <td><span class="stk-col">${fe(r.stake)}</span></td>
      <td>
        ${r.esito!==null
          ? `<span class="qg-badge">${r.qGioc?r.qGioc.toFixed(2):'?'}</span>`
          : `<input type="number" value="${state[tab].steps[idx].qGioc||''}" step="0.05" min="1" placeholder="—"
               onchange="state['${tab}'].steps[${idx}].qGioc=parseFloat(this.value)||null;recalc('${tab}')"/>`
        }
      </td>
      <td class="mu">${r.gainLordo!==null?fe(r.gainLordo):'—'}</td>
      <td class="${gnClass}">${r.gainNetto!==null?fe(r.gainNetto):'—'}</td>
      <td class="mgv">${r.gainMag!==null&&r.esito==='ok'?fe(r.gainMag):'<span class="mu">—</span>'}</td>
      <td class="mgc">${r.esito!==null?fe(r.magCum):'<span class="mu">—</span>'}</td>
      <td class="ret">${r.esito!==null?fe(r.returnCur):'<span class="mu">—</span>'}</td>
      <td>
        ${r.esito==='ok' ? '<span class="eok">OK</span>'
        : r.esito==='ko' ? '<span class="eko">KO</span>'
        : `<div class="bw">
             <button class="bok" onclick="setEsito('${tab}',${idx},'ok')">OK</button>
             <button class="bko" onclick="setEsito('${tab}',${idx},'ko')">KO</button>
           </div>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  saveAll();
  return { magCum, returnCur, doneCount, stakeIniz, cassa };
}

function setEsito(tab, idx, val) {
  if (val === 'ok') {
    const rows = document.querySelectorAll(`#tbody-${tab} tr`);
    const inp  = rows[idx] && rows[idx].querySelector('td:nth-child(5) input');
    const q    = inp ? parseFloat(inp.value) : null;
    if (!q || q < 1) { alert('Inserisci la quota giocata prima di segnare OK'); return; }
    state[tab].steps[idx].qGioc = q;
  }
  state[tab].steps[idx].esito = val;
  recalc(tab);
}

// ── Bilancio ──
function buildBilancio() {
  const grid = g('bil-grid');
  const tots = g('bil-totals');
  if (!grid || !tots) return;

  let totalMag = 0, totalReturn = 0, totalCassa = 0;
  grid.innerHTML = '';

  TABS.forEach(tab => {
    const cfg = getConfig(tab);
    const res = recalcSilent(tab);
    totalMag    += res.magCum;
    totalReturn += res.returnCur;
    totalCassa  += cfg.cassa;

    const profitLoss = res.returnCur;
    const plClass = profitLoss >= 0 ? 'green' : 'red';

    grid.innerHTML += `
      <div class="bil-card ${TAB_COLORS[tab]}">
        <div class="bil-card-title">${TAB_NAMES[tab]}</div>
        <div class="bil-rows">
          <div class="bil-row">
            <span class="bil-row-label">Cassa iniziale</span>
            <span class="bil-row-val">${fe(cfg.cassa)}</span>
          </div>
          <div class="bil-row">
            <span class="bil-row-label">Stake iniziale</span>
            <span class="bil-row-val">${fe(cfg.stakeIniz)}</span>
          </div>
          <div class="bil-row">
            <span class="bil-row-label">Step completati</span>
            <span class="bil-step-badge">${res.doneCount} / ${N}</span>
          </div>
          <div class="bil-row">
            <span class="bil-row-label">Magazzino accumulato</span>
            <span class="bil-row-val gold">${fe(res.magCum)}</span>
          </div>
          <div class="bil-row">
            <span class="bil-row-label">Return totale</span>
            <span class="bil-row-val ${plClass}">${profitLoss>=0?'+':''}${fe(profitLoss)}</span>
          </div>
          <div class="bil-row">
            <span class="bil-row-label">Rischio netto</span>
            <span class="bil-row-val">${fe(Math.max(0, cfg.stakeIniz * cfg.stepAzz - res.magCum))}</span>
          </div>
        </div>
      </div>
    `;
  });

  tots.innerHTML = `
    <div class="bil-tot-item">
      <div class="bil-tot-label">Cassa totale investita</div>
      <div class="bil-tot-val">${fe(totalCassa)}</div>
    </div>
    <div class="bil-tot-item">
      <div class="bil-tot-label">Magazzino totale</div>
      <div class="bil-tot-val gold">${fe(totalMag)}</div>
    </div>
    <div class="bil-tot-item">
      <div class="bil-tot-label">Return cumulato</div>
      <div class="bil-tot-val ${totalReturn>=0?'green':'red'}">${totalReturn>=0?'+':''}${fe(totalReturn)}</div>
    </div>
  `;
}

// Recalc senza aggiornare DOM tabella (per bilancio)
function recalcSilent(tab) {
  const cfg = getConfig(tab);
  const { stakeIniz, stepAzz, commP } = cfg;
  const pctV = cfg.pctV / 100;
  let stakeCur=stakeIniz, magCum=0, returnCur=0, doneCount=0;
  for (let i = 0; i < N; i++) {
    const s = state[tab].steps[i];
    const isFase1 = (i < stepAzz);
    const stake = parseFloat(stakeCur.toFixed(2));
    if (s.esito==='ok' && s.qGioc) {
      const gl = parseFloat((stake*s.qGioc).toFixed(2));
      const comm = parseFloat((gl*commP/100).toFixed(2));
      const gn = parseFloat((gl-stake-comm).toFixed(2));
      const gm = isFase1 ? gn : parseFloat((gn*pctV).toFixed(2));
      stakeCur  = isFase1 ? stake : parseFloat((stake+gn-gm).toFixed(2));
      magCum    = parseFloat((magCum+gm).toFixed(2));
      returnCur = parseFloat((returnCur+gn).toFixed(2));
      doneCount++;
    } else if (s.esito==='ko') {
      returnCur = parseFloat((returnCur-stake).toFixed(2));
      doneCount++;
    }
  }
  return { magCum, returnCur, doneCount, stakeIniz, cassa: cfg.cassa };
}

// ── Counter animation ──
function animCounter(el, from, to, dur) {
  if (!el) return;
  const start = performance.now();
  const tick = now => {
    const t = Math.min((now-start)/dur, 1);
    const ease = 1-Math.pow(1-t, 3);
    el.textContent = fn(from+(to-from)*ease)+' €';
    if (t<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Tab switching ──
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${tab}`);
  });
  if (tab === 'bilancio') {
    buildBilancio();
  } else {
    recalc(tab);
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Build CP pages
  TABS.forEach(tab => {
    const page = g(`page-${tab}`);
    if (page) page.innerHTML = buildPage(tab);
    initSteps(tab);
  });

  // Load saved state
  loadAll();

  // Settings change listeners (delegated)
  document.addEventListener('change', e => {
    const el = e.target;
    TABS.forEach(tab => {
      const ids = [`cassa-${tab}`,`stakeIniz-${tab}`,`stepAzz-${tab}`,`pctV-${tab}`,`commP-${tab}`];
      if (ids.includes(el.id)) { recalc(tab); saveAll(); }
    });
  });

  // Reset buttons (delegated)
  document.addEventListener('click', e => {
    if (e.target.classList.contains('btn-reset')) {
      const tab = e.target.dataset.tab;
      if (tab && confirm(`Resettare ${TAB_NAMES[tab]}?`)) {
        initSteps(tab);
        prevMag[tab] = 0;
        recalc(tab);
        saveAll();
      }
    }
  });

  // Tab buttons
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Initial render
  TABS.forEach(tab => recalc(tab));
});
