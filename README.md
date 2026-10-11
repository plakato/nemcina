# Němčina – slovíčka

Czech → German vocabulary practice for our German class, live at https://nemcina.brezinovi.sk.

The words come from the teacher's Google Sheet (every tab). A Cloudflare Worker re-reads it every day at 04:00 UTC,
splits rows into cards, and stores them in D1 together with each learner's progress (saved under the name typed at
the top of the page).

- `public/index.html` – the practice page (strict checking: spelling, capitals and articles must be right)
- `src/worker.js` – API, sheet parsing and the daily cron
- `src/overrides.js` – hand corrections for rows the automatic splitting gets wrong, missing articles,
  and extra answers accepted after reviewing "Měl/a jsem to dobře" clicks
- `migrations/` – D1 tables

## Develop and deploy

The sheet ID is kept out of the repo: put `SHEET_ID=<id>` in `.dev.vars` for local dev, and set it once in
production with `wrangler secret put SHEET_ID`.

```sh
wrangler d1 migrations apply nemcina --local
wrangler dev --test-scheduled          # http://localhost:8787, trigger the sync at /__scheduled
wrangler deploy                        # publishes to nemcina.brezinovi.sk
```
