// ===== COLPO PERFETTO — app.js v2 (6 tab) =====

const QSUGG = [
  1.35,1.35,1.40,1.35,1.35,1.35,1.45,1.65,1.65,1.80,
  1.40,1.45,1.50,1.50,1.40,1.40,1.40,1.45,1.45,1.55,
  1.55,1.55,1.65,1.65,2.46
];
const N = 25;
const TABS = ['cp1','cp2','cp3','cp4','cp5','cp6'];
const TAB_NAMES = {
  cp1: 'MG CASA / MG OSPITE',
  cp2: 'OVER 1.5 CASA',
  cp3: 'OVER 1.5 OSPITE',
  cp4: 'OVER 2.5',
  cp5: 'G/G',
  cp6: 'SEGNO FISSO 1'
};

const state = {};
TABS.forEach(t => { state[t] = { steps:[] }; });
let prevMag = {};
TABS.forEach(t => { prevMag[t] = 0; });

function g(id)  { return document.getElementById(id); }
function fn(v)  { return (+v).toFixed(2).replace('.', ','); }
function fe(v)  { return fn(v) + ' \u20ac'; }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function initSteps(tab) {
  state[tab].steps = [];
  state[tab].terminated = false;
  for (var i = 0; i < N; i++)
    state[tab].steps.push({ desc:'', qGioc:null, esito:null });
}

function saveAll() {
  try {
    var save = {};
    TABS.forEach(function(t) { save[t] = { cfg: getConfig(t), steps: state[t].steps }; });
    localStorage.setItem('cp_v6', JSON.stringify(save));
  } catch(e) {}
}

function loadAll() {
  try {
    var raw = localStorage.getItem('cp_v6');
    if (!raw) return false;
    var save = JSON.parse(raw);
    TABS.forEach(function(t) {
      if (!save[t]) return;
      var c = save[t].cfg || {};
      if (g('cassa-'+t))     g('cassa-'+t).value     = c.cassa     !== undefined ? c.cassa     : 100;
      if (g('stakeIniz-'+t)) g('stakeIniz-'+t).value = c.stakeIniz !== undefined ? c.stakeIniz : 3;
      if (g('stepAzz-'+t))   g('stepAzz-'+t).value   = c.stepAzz   !== undefined ? c.stepAzz   : 3;
      if (g('pctV-'+t))      g('pctV-'+t).value       = c.pctV      !== undefined ? c.pctV      : 40;
      if (g('commP-'+t))     g('commP-'+t).value      = c.commP     !== undefined ? c.commP     : 0;
      state[t].steps = (save[t].steps || []).slice(0, N);
      while (state[t].steps.length < N)
        state[t].steps.push({ desc:'', qGioc:null, esito:null });
      state[t].terminated = state[t].steps.some(function(s){ return s.esito === 'ko'; });
    });
    return true;
  } catch(e) { return false; }
}

function getConfig(tab) {
  return {
    cassa:     parseFloat(g('cassa-'+tab)     ? g('cassa-'+tab).value     : 100) || 100,
    stakeIniz: parseFloat(g('stakeIniz-'+tab) ? g('stakeIniz-'+tab).value : 3)   || 3,
    stepAzz:   parseInt(  g('stepAzz-'+tab)   ? g('stepAzz-'+tab).value   : 3)   || 3,
    pctV:      parseFloat(g('pctV-'+tab)      ? g('pctV-'+tab).value      : 40)  || 40,
    commP:     parseFloat(g('commP-'+tab)     ? g('commP-'+tab).value     : 0)   || 0
  };
}

function buildPage(tab) {
  var num = tab.replace('cp','');
  var pid = 'page-'+tab;
  var page = g(pid);
  if (!page) return;

  var wasActive = page.classList.contains('active');
  page.className = 'page theme-'+tab+(wasActive?' active':'');

  var logoByTab = {
    cp1: 'logo-cp1-yellow.png',
    cp2: 'logo-cp2-green.png',
    cp3: 'logo-cp3-violet.png',
    cp4: 'logo-cp2-green.png',
    cp5: 'logo-cp3-violet.png',
    cp6: 'logo-cp1-yellow.png'
  };

  var name = TAB_NAMES[tab];
  var logo = logoByTab[tab];

  page.innerHTML =
    '<header class="hero">' +
    '  <div class="hero-left hero-left-logo">' +
    '    <div class="hero-brand"><img src="' + logo + '" class="hero-logo" alt="' + name + '"/></div>' +
    '    <div class="hero-copy">' +
    '      <div class="hero-badge">Sistema operativo</div>' +
    '      <h1 class="hero-display">' + name + '</h1>' +
    '      <div class="hero-sub hero-sub-logo">Sessione <strong>' + num + '</strong> &middot; La scalata a quota <strong>1000</strong></div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="hero-mag">' +
    '    <div class="mag-ring"><div class="mag-inner">' +
    '      <div class="mag-label-top">MAGAZZINO</div>' +
    '      <div class="mag-amount" id="magTot-'+tab+'">0,00 \u20ac</div>' +
    '      <div class="mag-label-bot" id="mi1-'+tab+'">0 step</div>' +
    '    </div></div>' +
    '  </div>' +
    '</header>' +

    '<div class="settings-bar">' +
    '  <div class="setting-group"><label>Cassa iniziale</label>' +
    '    <div class="input-wrap"><input type="number" id="cassa-'+tab+'" value="100" min="1" step="1"><span class="unit">\u20ac</span></div></div>' +
    '  <div class="setting-group"><label>Stake iniziale</label>' +
    '    <div class="input-wrap"><input type="number" id="stakeIniz-'+tab+'" value="3" min="0.1" step="0.1"><span class="unit">\u20ac</span></div></div>' +
    '  <div class="setting-group"><label>Step Fase 1</label>' +
    '    <div class="input-wrap"><input type="number" id="stepAzz-'+tab+'" value="3" min="1" max="10" step="1"><span class="unit">#</span></div></div>' +
    '  <div class="setting-group"><label>% Magazzino F2</label>' +
    '    <div class="input-wrap"><input type="number" id="pctV-'+tab+'" value="40" min="0" max="100" step="5"><span class="unit">%</span></div></div>' +
    '  <div class="setting-group"><label>Commissioni</label>' +
    '    <div class="input-wrap"><input type="number" id="commP-'+tab+'" value="0" min="0" max="10" step="0.5"><span class="unit">%</span></div></div>' +
    '  <button class="btn-reset" data-tab="'+tab+'">&#8635; Reset sessione</button>' +
    '</div>' +

    '<div class="stats-grid">' +
    '  <div class="stat-card"><div class="stat-icon">\u25c8</div><div class="stat-body"><div class="stat-label">Cassa iniziale</div><div class="stat-value" id="sc-cassa-'+tab+'">100,00 \u20ac</div></div></div>' +
    '  <div class="stat-card"><div class="stat-icon">\u25ce</div><div class="stat-body"><div class="stat-label">Stake prossimo</div><div class="stat-value" id="sc-stake-'+tab+'">3,00 \u20ac</div></div></div>' +
    '  <div class="stat-card"><div class="stat-icon">\u25a4</div><div class="stat-body"><div class="stat-label">Step completati</div><div class="stat-value" id="sc-step-'+tab+'">0 / 25</div></div></div>' +
    '  <div class="stat-card accent"><div class="stat-icon">\u25c6</div><div class="stat-body"><div class="stat-label">Magazzino</div><div class="stat-value gold" id="sc-mag-'+tab+'">0,00 \u20ac</div></div></div>' +
    '  <div class="stat-card"><div class="stat-icon">\u25c7</div><div class="stat-body"><div class="stat-label">Rischio netto</div><div class="stat-value" id="sc-rischio-'+tab+'">3,00 \u20ac</div></div></div>' +
    '  <div class="stat-card"><div class="stat-icon">\u25b2</div><div class="stat-body"><div class="stat-label">Return totale</div><div class="stat-value green" id="sc-return-'+tab+'">0,00 \u20ac</div></div></div>' +
    '</div>' +

    '<div class="phase-strip">' +
    '  <div class="phase-pill"><span class="pill-dot red"></span>Fase 1 &mdash; Stake fisso, tutto il gain in magazzino</div>' +
    '  <div class="phase-divider">&rarr;</div>' +
    '  <div class="phase-pill"><span class="pill-dot gold"></span>Fase 2 &mdash; <span id="pctVd-'+tab+'">40</span>% magazzino &middot; <span id="pctRd-'+tab+'">60</span>% reinvestito</div>' +
    '</div>' +

    '<div class="table-wrap"><table>' +
    '<thead><tr>' +
    '<th class="col-n">#</th>' +
    '<th class="col-stk">Stake</th>' +
    '<th class="col-dsc">Evento + mercato</th>' +
    '<th class="col-stkcol">Stake usato</th>' +
    '<th class="col-qg">Q. giocata</th>' +
    '<th class="col-gl">Gain lordo</th>' +
    '<th class="col-gn">Gain netto</th>' +
    '<th class="col-gm">&rarr; Mag.</th>' +
    '<th class="col-mc">Mag. cumul.</th>' +
    '<th class="col-rt">Return</th>' +
    '<th class="col-es">Esito</th>' +
    '</tr></thead>' +
    '<tbody id="tbody-'+tab+'"></tbody>' +
    '</table></div>' +

    '<div class="formula-note">' +
    '  <span class="fn-label">Formula Fase 2:</span>' +
    '  Stake<sub>n+1</sub> = Stake<sub>n</sub> + GainNetto &times; (1 &minus; %mag)' +
    '  &nbsp;&middot;&nbsp; <span id="mi2-'+tab+'">Prossimo stake: &mdash;</span>' +
    '</div>' +
    '<div id="ko-container-'+tab+'"></div>';
}

function calcTab(tab) {
  var cfg = getConfig(tab);
  var stakeIniz = cfg.stakeIniz, stepAzz = cfg.stepAzz, commP = cfg.commP;
  var pctV = cfg.pctV / 100;
  var stakeCur = stakeIniz, magCum = 0, returnCur = 0, doneCount = 0;
  var rows = [];
  for (var i = 0; i < N; i++) {
    var s = state[tab].steps[i];
    var isFase1 = (i < stepAzz);
    var stake = parseFloat(stakeCur.toFixed(2));
    var gainLordo = null, gainNetto = null, gainMag = null;
    if (s.esito === 'ok' && s.qGioc) {
      gainLordo = parseFloat((stake * s.qGioc).toFixed(2));
      var comm = parseFloat((gainLordo * commP/100).toFixed(2));
      gainNetto = parseFloat((gainLordo - stake - comm).toFixed(2));
      if (isFase1) { gainMag = gainNetto; stakeCur = stake; }
      else { gainMag = parseFloat((gainNetto*pctV).toFixed(2)); stakeCur = parseFloat((stake+gainNetto-gainMag).toFixed(2)); }
      magCum = parseFloat((magCum+gainMag).toFixed(2));
      returnCur = parseFloat((returnCur+gainNetto).toFixed(2));
      doneCount++;
    } else if (s.esito === 'ko') {
      gainLordo = 0; gainNetto = parseFloat((-stake).toFixed(2)); gainMag = 0;
      returnCur = parseFloat((returnCur-stake).toFixed(2)); doneCount++;
    }
    rows.push({ i:i, isFase1:isFase1, stake:stake, qGioc:s.qGioc, gainLordo:gainLordo, gainNetto:gainNetto, gainMag:gainMag, magCum:magCum, returnCur:returnCur, esito:s.esito });
  }
  var rischio = Math.max(0, parseFloat((stakeIniz*stepAzz-magCum).toFixed(2)));
  var np = null;
  for (var j=0; j<rows.length; j++) { if (rows[j].esito===null) { np=rows[j]; break; } }
  return { rows:rows, magCum:magCum, returnCur:returnCur, doneCount:doneCount, rischio:rischio, np:np, cfg:cfg };
}

function recalc(tab) {
  var res = calcTab(tab);
  var rows=res.rows, magCum=res.magCum, returnCur=res.returnCur, doneCount=res.doneCount, rischio=res.rischio, np=res.np, cfg=res.cfg;
  var pctV = cfg.pctV/100;

  if (g('pctVd-'+tab)) g('pctVd-'+tab).textContent = Math.round(pctV*100);
  if (g('pctRd-'+tab)) g('pctRd-'+tab).textContent = Math.round((1-pctV)*100);

  animCounter(g('magTot-'+tab), prevMag[tab]||0, magCum, 500);
  prevMag[tab] = magCum;

  if (g('mi1-'+tab))      g('mi1-'+tab).textContent      = doneCount+' step completati';
  if (g('mi2-'+tab))      g('mi2-'+tab).textContent      = 'Prossimo stake: '+(np ? fe(np.stake) : '\u2014');
  if (g('sc-cassa-'+tab)) g('sc-cassa-'+tab).textContent = fe(cfg.cassa);
  if (g('sc-stake-'+tab)) g('sc-stake-'+tab).textContent = np ? fe(np.stake) : '\u2014';
  if (g('sc-step-'+tab))  g('sc-step-'+tab).textContent  = doneCount+' / '+N;
  if (g('sc-mag-'+tab))   g('sc-mag-'+tab).textContent   = fe(magCum);

  var rischioEl = g('sc-rischio-'+tab);
  if (rischioEl) {
    rischioEl.textContent = fe(rischio);
    rischioEl.className = 'stat-value ' + (rischio > 0 ? 'red' : 'green');
  }
  var returnEl = g('sc-return-'+tab);
  if (returnEl) {
    returnEl.textContent = (returnCur >= 0 ? '+' : '') + fe(returnCur);
    returnEl.className = 'stat-value ' + (returnCur >= 0 ? 'green' : 'red');
  }

  var tbody = g('tbody-'+tab);
  if (!tbody) return;
  tbody.innerHTML = '';
  var stepAzz = cfg.stepAzz;
  var terminated = state[tab].terminated;

  rows.forEach(function(r, idx) {
    var tr = document.createElement('tr');
    if (r.esito==='ok') tr.classList.add('ok-r');
    if (r.esito==='ko') tr.classList.add('ko-r');
    if (idx===stepAzz)  tr.classList.add('phase-sep');
    if (terminated && r.esito===null) tr.classList.add('blocked-row');
    var gnClass = r.gainNetto===null ? 'mu' : r.gainNetto>=0 ? 'gp' : 'gng';

    var descVal = esc(state[tab].steps[idx].desc);
    var qVal = state[tab].steps[idx].qGioc ? state[tab].steps[idx].qGioc.toFixed(2).replace('.',',') : '';

    var qgCell;
    if (r.esito !== null) {
      qgCell = '<span class="qg-badge">' + (r.qGioc ? r.qGioc.toFixed(2).replace('.',',') : '?') + '</span>';
    } else {
      qgCell = '<input type="text" inputmode="decimal" value="' + qVal + '" placeholder="es. 1,60" class="qg-inp" data-tab="' + tab + '" data-idx="' + idx + '">';
    }

    var esitoCell;
    if (r.esito === 'ok') {
      esitoCell = '<span class="eok">OK</span>';
    } else if (r.esito === 'ko') {
      esitoCell = '<span class="eko">KO</span>';
    } else if (terminated) {
      esitoCell = '<span class="esito-blocked">\u2014</span>';
    } else {
      esitoCell = '<div class="bw"><button class="bok" data-tab="' + tab + '" data-idx="' + idx + '" data-val="ok">OK</button><button class="bko" data-tab="' + tab + '" data-idx="' + idx + '" data-val="ko">KO</button></div>';
    }

    tr.innerHTML =
      '<td>'+(r.i+1)+(r.isFase1?'<span class="fb">F1</span>':'')+'</td>'+
      '<td><span class="stk-val'+(r.isFase1?' fase1':'')+'">'+fe(r.stake)+'</span></td>'+
      '<td class="col-dsc"><input type="text" placeholder="Inserisci evento..." value="'+descVal+'" data-tab="'+tab+'" data-idx="'+idx+'" class="desc-inp"></td>'+
      '<td><span class="stk-col">'+fe(r.stake)+'</span></td>'+
      '<td>'+qgCell+'</td>'+
      '<td class="mu">'+(r.gainLordo!==null ? fe(r.gainLordo) : '\u2014')+'</td>'+
      '<td class="'+gnClass+'">'+(r.gainNetto!==null ? fe(r.gainNetto) : '\u2014')+'</td>'+
      '<td class="mgv">'+(r.gainMag!==null&&r.esito==='ok' ? fe(r.gainMag) : '<span class="mu">\u2014</span>')+'</td>'+
      '<td class="mgc">'+(r.esito!==null ? fe(r.magCum) : '<span class="mu">\u2014</span>')+'</td>'+
      '<td class="ret">'+(r.esito!==null ? fe(r.returnCur) : '<span class="mu">\u2014</span>')+'</td>'+
      '<td>'+esitoCell+'</td>';
    tbody.appendChild(tr);
  });

  saveAll();
}

// Evento unico delegato per tutti gli input
document.addEventListener('input', function(e) {
  if (e.target.classList.contains('desc-inp')) {
    var tab = e.target.dataset.tab;
    var idx = parseInt(e.target.dataset.idx);
    state[tab].steps[idx].desc = e.target.value;
    saveAll();
  }
});

document.addEventListener('change', function(e) {
  if (e.target.classList.contains('qg-inp')) {
    var tab = e.target.dataset.tab;
    var idx = parseInt(e.target.dataset.idx);
    var v = parseFloat(e.target.value.replace(',','.'));
    if (!isNaN(v) && v >= 1) {
      state[tab].steps[idx].qGioc = v;
      recalc(tab);
    } else {
      e.target.value = '';
    }
  }
  // settings inputs
  TABS.forEach(function(tab) {
    ['cassa-','stakeIniz-','stepAzz-','pctV-','commP-'].forEach(function(prefix) {
      if (e.target.id === prefix+tab) { recalc(tab); saveAll(); }
    });
  });
});

function setEsito(tab, idx, val) {
  var tbody = g('tbody-'+tab);
  var rows = tbody ? tbody.querySelectorAll('tr') : [];
  var inp = rows[idx] ? rows[idx].querySelector('.qg-inp') : null;
  var raw = inp ? inp.value.replace(',','.').trim() : '';
  var q = parseFloat(raw);

  if (val === 'ok') {
    if (!q || q < 1) { alert('Inserisci una quota valida (es. 1,60) prima di segnare OK'); return; }
    state[tab].steps[idx].qGioc = q;
    state[tab].steps[idx].esito = 'ok';
  } else {
    if (!isNaN(q) && q >= 1) state[tab].steps[idx].qGioc = q;
    state[tab].steps[idx].esito = 'ko';
    state[tab].terminated = true;
  }
  recalc(tab);
  if (val === 'ko') setTimeout(function(){ showKoBanner(tab); }, 50);
}

function showKoBanner(tab) {
  var container = g('ko-container-'+tab);
  if (!container) return;
  var res = calcTab(tab);
  var magCum=res.magCum, doneCount=res.doneCount, rischio=res.rischio;
  container.innerHTML =
    '<div class="ko-banner">' +
    '<div class="ko-banner-icon">\u26d4</div>' +
    '<div class="ko-banner-body">' +
    '<div class="ko-banner-title">Sessione terminata</div>' +
    '<div class="ko-banner-sub">Hai perso la cassa del bookmaker. Il magazzino \u00e8 al sicuro.</div>' +
    '<div class="ko-banner-stats">' +
    '<div class="ko-stat"><span>Step raggiunto</span><strong>'+doneCount+' / 25</strong></div>' +
    '<div class="ko-stat"><span>Magazzino salvato</span><strong class="gold">'+fe(magCum)+'</strong></div>' +
    '<div class="ko-stat"><span>Rischio netto</span><strong class="red">'+fe(rischio)+'</strong></div>' +
    '</div></div>' +
    '<button class="ko-banner-btn" data-reset="'+tab+'">&#8635; Salva nel Taccuino e ricomincia</button>' +
    '</div>';
  container.scrollIntoView({ behavior:'smooth', block:'center' });
}

function doReset(tab) {
  var res = calcTab(tab);
  taccuinoAdd(tab, { magCum:res.magCum, returnCur:res.returnCur, doneCount:res.doneCount, rischio:res.rischio, stakeIniz:res.cfg.stakeIniz, cassa:res.cfg.cassa, stepAzz:res.cfg.stepAzz });
  initSteps(tab);
  prevMag[tab] = 0;
  var container = g('ko-container-'+tab);
  if (container) container.innerHTML = '';
  recalc(tab);
  saveAll();
}

function buildBilancio() {
  var grid = g('bil-grid');
  var tots = g('bil-totals');
  if (!grid||!tots) return;
  var totalMag=0, totalReturn=0, totalCassa=0;
  grid.innerHTML = '';
  TABS.forEach(function(tab) {
    var res = calcTab(tab);
    var magCum=res.magCum, returnCur=res.returnCur, doneCount=res.doneCount, rischio=res.rischio, cfg=res.cfg;
    totalMag    += magCum;
    totalReturn += returnCur;
    totalCassa  += cfg.cassa;
    var pos = returnCur >= 0;
    grid.innerHTML +=
      '<div class="bil-card '+tab+'">' +
      '<div class="bil-card-title">'+TAB_NAMES[tab]+'</div>' +
      '<div class="bil-rows">' +
      '<div class="bil-row"><span class="bil-row-label">Cassa iniziale</span><span class="bil-row-val">'+fe(cfg.cassa)+'</span></div>' +
      '<div class="bil-row"><span class="bil-row-label">Stake iniziale</span><span class="bil-row-val">'+fe(cfg.stakeIniz)+'</span></div>' +
      '<div class="bil-row"><span class="bil-row-label">Step completati</span><span class="bil-step-badge">'+doneCount+' / 25</span></div>' +
      '<div class="bil-row"><span class="bil-row-label">Magazzino accumulato</span><span class="bil-row-val gold">'+fe(magCum)+'</span></div>' +
      '<div class="bil-row"><span class="bil-row-label">Return totale</span><span class="bil-row-val '+(pos?'green':'red')+'">'+(returnCur>=0?'+':'')+fe(returnCur)+'</span></div>' +
      '<div class="bil-row"><span class="bil-row-label">Rischio netto</span><span class="bil-row-val">'+fe(rischio)+'</span></div>' +
      '</div></div>';
  });
  tots.innerHTML =
    '<div class="bil-tot-item"><div class="bil-tot-label">Cassa totale investita</div><div class="bil-tot-val">'+fe(totalCassa)+'</div></div>'+
    '<div class="bil-tot-item"><div class="bil-tot-label">Magazzino totale</div><div class="bil-tot-val gold">'+fe(totalMag)+'</div></div>'+
    '<div class="bil-tot-item"><div class="bil-tot-label">Return cumulato</div><div class="bil-tot-val '+(totalReturn>=0?'green':'red')+'">'+(totalReturn>=0?'+':'')+fe(totalReturn)+'</div></div>';
}

function animCounter(el, from, to, dur) {
  if (!el) return;
  var start = performance.now();
  function tick(now) {
    var t = Math.min((now-start)/dur, 1);
    var ease = 1-Math.pow(1-t,3);
    el.textContent = fn(from+(to-from)*ease)+' \u20ac';
    if (t<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab===tab); });
  document.querySelectorAll('.page').forEach(function(p){ p.classList.toggle('active', p.id==='page-'+tab); });
  if (tab==='bilancio') buildBilancio();
  else if (tab==='taccuino') buildTaccuino();
  else {
    recalc(tab);
    if (state[tab].terminated) showKoBanner(tab);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  TABS.forEach(function(tab){ initSteps(tab); buildPage(tab); });
  loadAll();

  // OK/KO buttons (delegated)
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.bok, .bko');
    if (btn && btn.dataset.tab && btn.dataset.idx !== undefined && btn.dataset.val) {
      setEsito(btn.dataset.tab, parseInt(btn.dataset.idx), btn.dataset.val);
    }
  });

  // Reset buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-reset')) {
      var tab = e.target.dataset.tab;
      if (!tab) return;
      if (!confirm('Salvare la sessione nel Taccuino e resettare '+TAB_NAMES[tab]+'?')) return;
      doReset(tab);
    }
    // KO banner reset
    if (e.target.dataset && e.target.dataset.reset) {
      doReset(e.target.dataset.reset);
    }
  });

  // Tab buttons
  document.querySelectorAll('.tab').forEach(function(btn){
    btn.addEventListener('click', function(){ switchTab(btn.dataset.tab); });
  });

  // Initial render
  TABS.forEach(function(tab){
    recalc(tab);
    if (state[tab].terminated) showKoBanner(tab);
  });
});
