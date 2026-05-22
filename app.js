const state = {
  cp1: { rows: [], cassa: 35, stake: 10, comm: 0 },
  cp2: { rows: [], cassa: 0, stake: 10, comm: 0 },
  cp3: { rows: [], cassa: 0, stake: 10, comm: 0 },
  taccuino: []
};

function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const tabs = ['cp1', 'cp2', 'cp3', 'bilancio', 'taccuino'];
  document.querySelectorAll('.tab')[tabs.indexOf(id)].classList.add('active');
  if (id === 'bilancio') updateBilancio();
  if (id === 'taccuino') renderTaccuino();
}

function addRow(cp) {
  const desc = document.getElementById(cp + '-desc').value.trim();
  const qsugg = parseFloat(document.getElementById(cp + '-qsugg').value) || 0;
  const quota = parseFloat(document.getElementById(cp + '-quota').value) || 0;
  const esito = document.getElementById(cp + '-esito').value;

  if (!desc) { alert('Inserisci la descrizione evento'); return; }
  if (!quota) { alert('Inserisci la quota'); return; }

  state[cp].rows.push({ desc, qsugg, quota, esito });
  document.getElementById(cp + '-desc').value = '';
  document.getElementById(cp + '-qsugg').value = '';
  document.getElementById(cp + '-quota').value = '';
  calcCP(cp);
  saveToStorage();
}

function removeRow(cp, idx) {
  if (!confirm('Rimuovere questa giocata?')) return;
  state[cp].rows.splice(idx, 1);
  calcCP(cp);
  saveToStorage();
}

function calcCP(cp) {
  const cassa = parseFloat(document.getElementById(cp + '-cassa').value) || 0;
  const stakePerc = parseFloat(document.getElementById(cp + '-stake').value) || 0;
  const comm = parseFloat(document.getElementById(cp + '-comm').value) || 0;

  state[cp].cassa = cassa;
  state[cp].stake = stakePerc;
  state[cp].comm = comm;

  const stakeVal = cassa * stakePerc / 100;
  let magazzino = 0;
  let returnVal = stakeVal;

  state[cp].rows.forEach(r => {
    if (r.esito === 'OK') {
      const gainLordo = returnVal * r.quota;
      const gainNetto = gainLordo - returnVal;
      const gainNettoComm = gainNetto * (1 - comm / 100);
      magazzino += gainNettoComm;
      r._gainLordo = gainLordo;
      r._gainNetto = gainNettoComm;
      returnVal = gainLordo;
    } else {
      r._gainLordo = 0;
      r._gainNetto = -returnVal;
      returnVal = stakeVal;
    }
  });

  const profLoss = magazzino - stakeVal;
  const resa = stakeVal > 0 ? (profLoss / stakeVal * 100) : 0;

  document.getElementById(cp + '-magazzino').textContent = '€ ' + magazzino.toFixed(2);
  document.getElementById(cp + '-stake-val').textContent = '€ ' + stakeVal.toFixed(2);
  document.getElementById(cp + '-return').textContent = '€ ' + returnVal.toFixed(2);

  const plEl = document.getElementById(cp + '-pl');
  plEl.textContent = '€ ' + profLoss.toFixed(2);
  plEl.className = 'm-value ' + (profLoss > 0 ? 'pos' : profLoss < 0 ? 'neg' : '');

  document.getElementById(cp + '-resa').textContent = resa.toFixed(2) + '%';

  renderRows(cp, stakeVal);
  updateBilancio();
}

function renderRows(cp, stakeVal) {
  const tbody = document.getElementById(cp + '-rows');
  const rows = state[cp].rows;

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Aggiungi giocate qui sotto</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.desc}</td>
      <td>${r.qsugg > 0 ? r.qsugg.toFixed(2) : '-'}</td>
      <td><strong>${r.quota.toFixed(2)}</strong></td>
      <td>${r._gainLordo > 0 ? '€ ' + r._gainLordo.toFixed(2) : '-'}</td>
      <td class="${r.esito === 'OK' ? 'esito-ok' : 'esito-ko'}">
        € ${r._gainNetto !== undefined ? r._gainNetto.toFixed(2) : '0.00'}
      </td>
      <td class="${r.esito === 'OK' ? 'esito-ok' : 'esito-ko'}">${r.esito}</td>
      <td><button class="btn-remove" onclick="removeRow('${cp}', ${i})">✕</button></td>
    </tr>
  `).join('');
}

function updateBilancio() {
  ['cp1', 'cp2', 'cp3'].forEach((cp, i) => {
    const cassa = state[cp].cassa;
    const stakeVal = cassa * state[cp].stake / 100;
    let magazzino = 0;
    let returnVal = stakeVal;

    state[cp].rows.forEach(r => {
      if (r.esito === 'OK') {
        const gl = returnVal * r.quota;
        magazzino += gl - returnVal;
        returnVal = gl;
      } else {
        returnVal = stakeVal;
      }
    });

    const pl = magazzino - stakeVal;
    const el = document.getElementById('bil-cp' + (i + 1));
    el.textContent = '€ ' + pl.toFixed(2);
    el.className = pl >= 0 ? 'pos' : 'neg';

    document.getElementById('bil-mag' + (i + 1)).textContent = '€ ' + magazzino.toFixed(2);
  });

  const vals = [1, 2, 3].map(n => {
    const txt = document.getElementById('bil-cp' + n).textContent;
    return parseFloat(txt.replace('€ ', '')) || 0;
  });
  const tot = vals.reduce((a, b) => a + b, 0);
  const totEl = document.getElementById('bil-tot');
  totEl.textContent = '€ ' + tot.toFixed(2);
  totEl.className = tot >= 0 ? 'pos' : 'neg';

  const mags = [1, 2, 3].map(n => {
    const txt = document.getElementById('bil-mag' + n).textContent;
    return parseFloat(txt.replace('€ ', '')) || 0;
  });
  document.getElementById('bil-mag-tot').textContent = '€ ' + mags.reduce((a, b) => a + b, 0).toFixed(2);
}

function chiudiCP(cp) {
  if (state[cp].rows.length === 0) {
    alert('Nessuna giocata da registrare in ' + cp.toUpperCase());
    return;
  }
  if (!confirm('Vuoi chiudere e registrare ' + cp.toUpperCase() + ' nel taccuino?')) return;

  const cassa = state[cp].cassa;
  const stakeVal = cassa * state[cp].stake / 100;
  let magazzino = 0;
  let returnVal = stakeVal;

  state[cp].rows.forEach(r => {
    if (r.esito === 'OK') {
      const gl = returnVal * r.quota;
      magazzino += gl - returnVal;
      returnVal = gl;
    } else {
      returnVal = stakeVal;
    }
  });

  const pl = magazzino - stakeVal;
  const oggi = new Date().toLocaleDateString('it-IT');
  const prev = state.taccuino.reduce((a, r) => a + r.pl, 0);

  state.taccuino.push({
    data: oggi,
    cp: cp.toUpperCase(),
    pl,
    cumul: prev + pl
  });

  renderTaccuino();
  resetCP(cp);
  saveToStorage();
  showTab('taccuino');
}

function renderTaccuino() {
  const tbody = document.getElementById('taccuino-rows');
  if (state.taccuino.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nessuna sessione chiusa ancora. Aggiungi giocate e chiudi una sessione.</td></tr>';
    return;
  }
  tbody.innerHTML = state.taccuino.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.data}</td>
      <td><strong>${r.cp}</strong></td>
      <td class="${r.pl >= 0 ? 'esito-ok' : 'esito-ko'}">€ ${r.pl.toFixed(2)}</td>
      <td class="${r.cumul >= 0 ? 'esito-ok' : 'esito-ko'}"><strong>€ ${r.cumul.toFixed(2)}</strong></td>
    </tr>
  `).join('');
}

function resetCP(cp) {
  state[cp].rows = [];
  calcCP(cp);
  saveToStorage();
}

function saveToStorage() {
  try {
    localStorage.setItem('colpo-perfetto', JSON.stringify(state));
  } catch(e) {}
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('colpo-perfetto');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      ['cp1', 'cp2', 'cp3'].forEach(cp => {
        if (state[cp]) {
          document.getElementById(cp + '-cassa').value = state[cp].cassa || 0;
          document.getElementById(cp + '-stake').value = state[cp].stake || 10;
          document.getElementById(cp + '-comm').value = state[cp].comm || 0;
          calcCP(cp);
        }
      });
      renderTaccuino();
    }
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  calcCP('cp1');
  calcCP('cp2');
  calcCP('cp3');
});
