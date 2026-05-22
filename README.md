# 🎯 Colpo Perfetto — Tracker

Tracker web per la gestione della puntata progressiva con accantonamento.

## Come usarlo

1. Apri `index.html` nel browser (oppure visita la GitHub Pages)
2. Imposta **Cassa**, **Stake %** e **% Commissione** per ogni Colpo Perfetto
3. Aggiungi le giocate con descrizione, quota suggerita, quota reale ed esito
4. Il **Magazzino** si aggiorna automaticamente con i profitti accantonati
5. Quando hai finito una sessione, vai su **Taccuino** e chiudi il CP
6. Il **Bilancio** mostra il riepilogo totale dei 3 colpi perfetti

## Struttura

- `index.html` — struttura della pagina
- `style.css` — stile grafico
- `app.js` — logica di calcolo e gestione stato

## Funzionalità

- ✅ 3 Colpo Perfetto separati (CP1, CP2, CP3)
- ✅ Calcolo automatico stake, gain lordo/netto, magazzino
- ✅ Gestione commissioni bookmaker
- ✅ Bilancio generale con totale magazzino
- ✅ Taccuino storico con profitto/perdita cumulato
- ✅ Salvataggio automatico in localStorage
- ✅ Responsive su mobile e desktop

## GitHub Pages

Per pubblicare su GitHub Pages:
1. Vai su Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Salva — dopo qualche minuto il sito sarà online!
