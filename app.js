// ===== COLPO PERFETTO — app.js =====

const QSUGG = [
  1.35, 1.35, 1.40, 1.35, 1.35, 1.35, 1.45, 1.65, 1.65, 1.80,
  1.40, 1.45, 1.50, 1.50, 1.40, 1.40, 1.40, 1.45, 1.45, 1.55,
  1.55, 1.55, 1.65, 1.65, 2.46
];
const N = 25;
const STORAGE_KEY = 'colpo_perfetto_state';

let steps = [];

function initSteps() {
  steps = [];
  for (let i = 0; i < N; i++) {
    steps.push({ desc: '', qSugg: QSUGG[i], qGioc: null, esito: null });
  }
}

// ---- Persistenza locale ----
function saveState() {
  const state = {
    stakeIniz: document.getElementById('stakeIniz').value,
    stepAzz:   document.getElementById('stepAzz').value,
    commP:     document.getElementById('commP').value,
    pctV:      document.getElementById('pctV').value,
    steps:     steps
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    document.getElementById('stakeIniz').value = state.stakeIniz || 3;
    document.getElementById('stepAzz').value   = state.stepAzz   || 3;
    document.getElementById('commP').value     = state.commP     || 0;
    document.getElementById('pctV').value      = state.pctV      || 40;
    steps = state.steps || [];
    while (steps.length < N) steps.push({ desc: '', qSugg: QSUGG[steps.length], qGioc: null, esito: null });
    return true;
  } catch(e) { return false; }
}

// ---- Formattazione ----
function fn(v) { return v.toFixed(2).replace('.', ','); }
function fe(v) { return fn(v) + ' €'; }

// ---- Calcolo principale ----
function recalc() {
  const stakeIniz = parseFloat(document.getElementById('stakeIniz').value) || 3;
  const commP     = parseFloat(document.getElementById('commP').value) || 0;
  const stepAzz   = parseInt(document.getElementById('stepAzz').value) || 3;
  const pctV      = parseFloat(document.getElementById('pctV').value) / 100;
  const pctR      = 1 - pctV;

  document.getElementById('pctVdisp').textContent  = Math.round(pctV * 100);
  document.getElementById('pctRdisp').textContent  = Math.round(pctR * 100);
  document.getElementById('pctRdisp2').textContent = Math.round(pctR * 100);
  document.getElementById('pctRest').textContent   = Math.round(pctR * 100);

  let stakeCur  = stakeIniz;
  let magCum    = 0;
  let returnCur = 0;
  let doneCount = 0;
  const rows = [];

  for (let i = 0; i < N; i++) {
    const s = steps[i];
    const isFase1 = (i < stepAzz);
    const stake = parseFloat(stakeCur.toFixed(2));

    let gainLordo = null, gainNetto = null, gainMag = null, returnNew = null;

    if (s.esito === 'ok' && s.qGioc) {
      const qg = s.qGioc;
      gainLordo = parseFloat((stake * qg).toFixed(2));
      const comm = parseFloat((gainLordo * commP / 100).toFixed(2));
      gainNetto = parseFloat((gainLordo - stake - comm).toFixed(2));

      if (isFase1) {
        // Fase 1: tutto in magazzino, stake invariato
        gainMag   = gainNetto;
        stakeCur  = stake;
      } else {
        // Fase 2: gain diviso tra magazzino e reinvestimento
        gainMag  = parseFloat((gainNetto * pctV).toFixed(2));
        const reinvest = parseFloat((gainNetto - gainMag).toFixed(2));
        stakeCur = parseFloat((stake + reinvest).toFixed(2));
      }

      magCum    = parseFloat((magCum + gainMag).toFixed(2));
      returnCur = parseFloat((returnCur + gainNetto).toFixed(2));
      doneCount++;

    } else if (s.esito === 'ko') {
      gainLordo = 0;
      gainNetto = parseFloat((-stake).toFixed(2));
      gainMag   = 0;
      returnCur = parseFloat((returnCur - stake).toFixed(2));
      doneCount++;
    }

    rows.push({
      i, isFase1, stake,
      qSugg: s.qSugg || QSUGG[i],
      qGioc: s.qGioc,
      gainLordo, gainNetto, gainMag, magCum, returnCur,
      esito: s.esito
    });
  }

  const rischio = parseFloat((stakeIniz * stepAzz - magCum).toFixed(2));
  const np = rows.find(r => r.esito === null);

  // Aggiorna summary
  document.getElementById('magTot').textContent = fe(magCum);
  document.getElementById('mi1').textContent    = doneCount + ' step completati';
  document.getElementById('mi2').textContent    = 'Stake prossimo: ' + (np ? fe(np.stake) : '—');
  document.getElementById('s0').textContent     = fe(stakeIniz);
  document.getElementById('s1').textContent     = np ? fe(np.stake) : '—';
  document.getElementById('s2').textContent     = doneCount + ' / ' + N;
  document.getElementById('s3').textContent     = fe(magCum);
  document.getElementById('s5').textContent     = fe(Math.max(0, rischio));
  document.getElementById('s6').textContent     = fe(returnCur);

  // Costruisci tabella
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    if (r.esito === 'ok') tr.classList.add('ok-r');
    if (r.esito === 'ko') tr.classList.add('ko-r');
    if (idx === stepAzz)  tr.classList.add('phase-sep');

    const gnClass = r.gainNetto === null ? 'mu' : (r.gainNetto >= 0 ? 'gp' : 'gng');
    const gnText  = r.gainNetto !== null ? fe(r.gainNetto) : '—';

    tr.innerHTML = `
      <td style="font-size:10px;color:#6b7599">${r.i + 1}${r.isFase1 ? '<span class="fb">F1</span>' : ''}</td>
      <td style="font-weight:600">${fe(r.stake)}</td>
      <td class="dsc">
        <input type="text" placeholder="Evento..." value="${escHtml(steps[idx].desc)}"
          onchange="steps[${idx}].desc=this.value;saveState()"/>
      </td>
      <td>
        <input class="qs-inp" type="number" value="${r.qSugg}" step="0.05" min="1"
          onchange="steps[${idx}].qSugg=parseFloat(this.value)||1.35;recalc();saveState()"/>
      </td>
      <td>
        ${r.esito !== null
          ? `<span class="qg-badge">${r.qGioc ? r.qGioc.toFixed(2) : '?'}</span>`
          : `<input type="number" value="${steps[idx].qGioc || ''}" step="0.05" min="1" placeholder="—"
               onchange="steps[${idx}].qGioc=parseFloat(this.value)||null;recalc()"/>`
        }
      </td>
      <td class="mu">${r.gainLordo !== null ? fe(r.gainLordo) : '—'}</td>
      <td class="${gnClass}">${gnText}</td>
      <td class="mgv">${r.gainMag !== null && r.esito === 'ok' ? fe(r.gainMag) : '<span class="mu">—</span>'}</td>
      <td class="mgc">${r.esito !== null ? fe(r.magCum) : '<span class="mu">—</span>'}</td>
      <td class="ret-v">${r.esito !== null ? fe(r.returnCur) : '<span class="mu">—</span>'}</td>
      <td>
        ${r.esito === 'ok'
          ? '<span class="eok">OK</span>'
          : r.esito === 'ko'
          ? '<span class="eko">KO</span>'
          : `<div class="bw">
               <button class="bok" onclick="setEsito(${idx},'ok')">OK</button>
               <button class="bko" onclick="setEsito(${idx},'ko')">KO</button>
             </div>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });

  saveState();
}

function setEsito(idx, val) {
  if (val === 'ok') {
    const rows = document.querySelectorAll('#tbody tr');
    const inp  = rows[idx] ? rows[idx].querySelector('td:nth-child(5) input') : null;
    const q    = inp ? parseFloat(inp.value) : null;
    if (!q || q < 1) {
      alert('Inserisci la quota giocata prima di segnare OK');
      return;
    }
    steps[idx].qGioc = q;
  }
  steps[idx].esito = val;
  recalc();
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---- Event listeners ----
document.addEventListener('DOMContentLoaded', () => {
  if (!loadState()) initSteps();

  ['stakeIniz', 'stepAzz', 'commP', 'pctV'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => { recalc(); saveState(); });
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (confirm('Vuoi resettare tutti gli step? I dati non potranno essere recuperati.')) {
      initSteps();
      try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
      recalc();
    }
  });

  recalc();
});
