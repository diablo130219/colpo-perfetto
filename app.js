// ===== COLPO PERFETTO — app.js =====

const QSUGG = [
  1.35,1.35,1.40,1.35,1.35,1.35,1.45,1.65,1.65,1.80,
  1.40,1.45,1.50,1.50,1.40,1.40,1.40,1.45,1.45,1.55,
  1.55,1.55,1.65,1.65,2.46
];
const N = 25;
const STORAGE_KEY = 'colpo_perfetto_v2';

let steps = [];

function initSteps() {
  steps = [];
  for (let i = 0; i < N; i++)
    steps.push({ desc: '', qSugg: QSUGG[i], qGioc: null, esito: null });
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stakeIniz: g('stakeIniz').value,
      stepAzz:   g('stepAzz').value,
      commP:     g('commP').value,
      pctV:      g('pctV').value,
      steps
    }));
  } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    g('stakeIniz').value = s.stakeIniz || 3;
    g('stepAzz').value   = s.stepAzz   || 3;
    g('commP').value     = s.commP     || 0;
    g('pctV').value      = s.pctV      || 40;
    steps = s.steps || [];
    while (steps.length < N)
      steps.push({ desc: '', qSugg: QSUGG[steps.length], qGioc: null, esito: null });
    return true;
  } catch(e) { return false; }
}

function g(id) { return document.getElementById(id); }
function fn(v) { return (+v).toFixed(2).replace('.', ','); }
function fe(v) { return fn(v) + ' €'; }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function animCounter(el, from, to, duration) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = from + (to - from) * ease;
    el.textContent = fn(val) + ' €';
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

let prevMag = 0;

function recalc() {
  const stakeIniz = parseFloat(g('stakeIniz').value) || 3;
  const commP     = parseFloat(g('commP').value) || 0;
  const stepAzz   = parseInt(g('stepAzz').value) || 3;
  const pctV      = parseFloat(g('pctV').value) / 100;
  const pctR      = 1 - pctV;

  g('pctVdisp').textContent = Math.round(pctV * 100);
  g('pctRdisp').textContent = Math.round(pctR * 100);

  let stakeCur  = stakeIniz;
  let magCum    = 0;
  let returnCur = 0;
  let doneCount = 0;
  const rows = [];

  for (let i = 0; i < N; i++) {
    const s = steps[i];
    const isFase1 = (i < stepAzz);
    const stake = parseFloat(stakeCur.toFixed(2));
    let gainLordo = null, gainNetto = null, gainMag = null;

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

    rows.push({ i, isFase1, stake, qSugg: s.qSugg || QSUGG[i], qGioc: s.qGioc,
                gainLordo, gainNetto, gainMag, magCum, returnCur, esito: s.esito });
  }

  const rischio = Math.max(0, parseFloat((stakeIniz * stepAzz - magCum).toFixed(2)));
  const np = rows.find(r => r.esito === null);

  // Animate magazzino
  const magEl = g('magTot');
  animCounter(magEl, prevMag, magCum, 600);
  prevMag = magCum;

  g('mi1').textContent = doneCount + ' step completati';
  g('mi2').textContent = 'Prossimo stake: ' + (np ? fe(np.stake) : '—');
  g('s1').textContent  = np ? fe(np.stake) : '—';
  g('s2').textContent  = doneCount + ' / ' + N;
  g('s3').textContent  = fe(magCum);
  g('s5').textContent  = fe(rischio);
  g('s6').textContent  = fe(returnCur);

  // Build table rows
  const tbody = g('tbody');
  tbody.innerHTML = '';

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    if (r.esito === 'ok') tr.classList.add('ok-r');
    if (r.esito === 'ko') tr.classList.add('ko-r');
    if (idx === stepAzz)  tr.classList.add('phase-sep');

    const gnClass = r.gainNetto === null ? 'mu' : r.gainNetto >= 0 ? 'gp' : 'gng';

    tr.innerHTML = `
      <td>${r.i+1}${r.isFase1 ? '<span class="fb">F1</span>' : ''}</td>
      <td><span class="stk-val${r.isFase1?' fase1':''}">${fe(r.stake)}</span></td>
      <td class="col-dsc">
        <input type="text" placeholder="Inserisci evento..."
          value="${esc(steps[idx].desc)}"
          onchange="steps[${idx}].desc=this.value;saveState()"/>
      </td>
      <td>
        <input class="qs-inp" type="number" value="${r.qSugg}" step="0.05" min="1"
          onchange="steps[${idx}].qSugg=parseFloat(this.value)||1.35;recalc();saveState()"/>
      </td>
      <td>
        ${r.esito !== null
          ? `<span class="qg-badge">${r.qGioc ? r.qGioc.toFixed(2) : '?'}</span>`
          : `<input type="number" value="${steps[idx].qGioc||''}" step="0.05" min="1"
               placeholder="—" style="width:52px"
               onchange="steps[${idx}].qGioc=parseFloat(this.value)||null;recalc()"/>`
        }
      </td>
      <td class="mu">${r.gainLordo !== null ? fe(r.gainLordo) : '—'}</td>
      <td class="${gnClass}">${r.gainNetto !== null ? fe(r.gainNetto) : '—'}</td>
      <td class="mgv">${r.gainMag !== null && r.esito === 'ok' ? fe(r.gainMag) : '<span class="mu">—</span>'}</td>
      <td class="mgc">${r.esito !== null ? fe(r.magCum) : '<span class="mu">—</span>'}</td>
      <td class="ret">${r.esito !== null ? fe(r.returnCur) : '<span class="mu">—</span>'}</td>
      <td>
        ${r.esito === 'ok' ? '<span class="eok">OK</span>'
        : r.esito === 'ko' ? '<span class="eko">KO</span>'
        : `<div class="bw">
             <button class="bok" onclick="setEsito(${idx},'ok')">OK</button>
             <button class="bko" onclick="setEsito(${idx},'ko')">KO</button>
           </div>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  saveState();
}

function setEsito(idx, val) {
  if (val === 'ok') {
    const rows = document.querySelectorAll('#tbody tr');
    const inp  = rows[idx] && rows[idx].querySelector('td:nth-child(5) input');
    const q    = inp ? parseFloat(inp.value) : null;
    if (!q || q < 1) { alert('Inserisci la quota giocata prima di segnare OK'); return; }
    steps[idx].qGioc = q;
  }
  steps[idx].esito = val;
  recalc();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!loadState()) initSteps();

  ['stakeIniz','stepAzz','commP','pctV'].forEach(id =>
    g(id).addEventListener('change', () => { recalc(); saveState(); })
  );

  g('btnReset').addEventListener('click', () => {
    if (confirm('Resettare tutti gli step?')) {
      initSteps();
      try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
      prevMag = 0;
      recalc();
    }
  });

  recalc();
});
