# Colpo Perfetto — versione Cloud Railway

Questa versione salva le giocate nel database PostgreSQL di Railway invece che solo nel browser.

## Su Railway
1. Nel servizio del sito aggiungi come Variable Reference la variabile `DATABASE_URL` del servizio Postgres.
2. Fai deploy di questo progetto.
3. Apri `/api/health` sul dominio Railway: deve rispondere con `database: true`.

Da questo momento le giocate nuove saranno sincronizzate tra PC, telefono e altri dispositivi.
