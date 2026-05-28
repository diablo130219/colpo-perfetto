# Colpo Perfetto 🎯
### La scalata a quota 1000

Tracker web per il sistema di scommesse progressivo **Colpo Perfetto**.  
Funziona direttamente nel browser — nessuna installazione richiesta.

---

## Come si usa

1. Apri `index.html` nel browser  
   *(oppure deploya su GitHub Pages / Railway)*

2. Imposta i parametri in alto:
   - **Stake iniziale** — la tua puntata di partenza (es. 3€)
   - **Step azzeramento** — quanti step fissi prima di giocare gratis (default 3)
   - **Commissioni %** — se il bookmaker applica commissioni
   - **% gain → magazzino (Fase 2)** — quanto del gain vai ad accantonare

3. Per ogni step:
   - Scrivi l'evento
   - Imposta la quota giocata reale
   - Clicca **OK** (vinto) o **KO** (perso)

---

## La logica del sistema

### Fase 1 — Azzeramento rischio (step F1)
- Stake **fisso** uguale per tutti gli step
- **100% del gain** va in magazzino
- Dopo questi step hai recuperato la tua puntata iniziale
- Dal passo successivo giochi con i **soldi del bookmaker**

### Fase 2 — Scalata
- Lo stake **cresce** ad ogni step vinto
- Il gain si divide automaticamente:
  - **% impostata** → accantonata in magazzino (al sicuro)
  - **Resto** → reinvestita, si somma allo stake successivo
- Formula: `Stake(n+1) = Stake(n) + GainNetto × (1 - %magazzino)`

---

## Dati salvati automaticamente

I dati vengono salvati nel `localStorage` del browser — sopravvivono alla chiusura della pagina.  
Il tasto **Reset** cancella tutto e riparte da zero.

---

## Deploy su GitHub Pages

1. Crea un repository su GitHub
2. Carica i 3 file: `index.html`, `style.css`, `app.js`
3. Vai su **Settings → Pages → Branch: main → Save**
4. La tua app è online!

---

## File
```
colpo_perfetto/
├── index.html   — struttura della pagina
├── style.css    — stile dark theme
├── app.js       — logica calcoli + localStorage
├── taccuino.js  — storico sessioni
├── assets/      — loghi personalizzati per CP1, CP2, CP3
└── README.md    — questo file
```


## Loghi inclusi
- CP1: logo giallo/oro
- CP2: logo verde/acqua
- CP3: logo viola


## Etichette aggiornate
- CP1: SEGNO FISSO
- CP2: Over 1.5 Casa / Over 1.5 Ospite
- CP3: G/G
