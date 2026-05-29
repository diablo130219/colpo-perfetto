// ===== COLPO PERFETTO — Cloud Sync Railway/PostgreSQL =====
// Sincronizza i dati principali tra browser diversi usando il backend /api/state.
(function(){
  const KEYS = ['cp_v4', 'cp_taccuino_v1', 'cp_cassa_iniziale'];
  let ready = false;
  let timer = null;

  const origSet = Storage.prototype.setItem;
  const origRemove = Storage.prototype.removeItem;

  function snapshot() {
    const state = {};
    KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      state[k] = v === null ? null : v;
    });
    return state;
  }

  async function pushState() {
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: snapshot() })
      });
    } catch(e) {
      console.warn('Cloud save fallito, resto in locale', e);
    }
  }

  function schedulePush() {
    if (!ready) return;
    clearTimeout(timer);
    timer = setTimeout(pushState, 350);
  }

  Storage.prototype.setItem = function(key, value) {
    origSet.apply(this, arguments);
    if (KEYS.includes(key)) schedulePush();
  };

  Storage.prototype.removeItem = function(key) {
    origRemove.apply(this, arguments);
    if (KEYS.includes(key)) schedulePush();
  };

  window.CP_CLOUD_SAVE_NOW = pushState;

  window.CP_CLOUD_READY = (async function(){
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      const remote = data.state || {};
      KEYS.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(remote, k) && remote[k] !== null && remote[k] !== undefined) {
          origSet.call(localStorage, k, remote[k]);
        }
      });
      ready = true;
      document.documentElement.classList.add('cloud-ready');
    } catch(e) {
      ready = true;
      document.documentElement.classList.add('cloud-offline');
      console.warn('Cloud load non disponibile, uso dati locali', e);
    }
  })();
})();
