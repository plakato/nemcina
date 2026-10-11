// Vocabulary practice: serves the API for public/index.html and refreshes
// the word list from the teacher's Google Sheet once a day.

import OVERRIDES, { ARTICLES, EXTRA_ANSWERS } from "./overrides.js";

// ---------- reading the Google Sheet ----------

// Every tab of the spreadsheet, newest first, as listed in its HTML view.
// The sheet ID is the SHEET_ID secret (wrangler secret put SHEET_ID; .dev.vars locally), so it stays out of the repo.
async function listSheets(sheetId) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
  if (!res.ok) throw new Error(`htmlview ${res.status}`);
  const html = await res.text();
  const out = [];
  for (const m of html.matchAll(/\{name: "((?:[^"\\]|\\.)*)", pageUrl: "[^"]*", gid: "(\d+)"/g)) {
    out.push({ name: JSON.parse(`"${m[1]}"`), gid: m[2] });
  }
  return out;
}

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const clean = (v) => (v || "").replace(/\s+/g, " ").trim() || null;
// The teacher puts parallel examples on separate lines or separated by wide spacing.
// Wide spacing around "/" or "=" just joins alternatives, a bracketed note stays with
// the word before it, and spacing inside brackets never splits.
function splitWide(line, minSpaces) {
  line = line.replace(/[ \u00a0]+([/=])[ \u00a0]+/g, " $1 ")
    .replace(/(^|\s)([res])[ \u00a0]{2,}(?=\p{L})/gu, "$1$2 "); // "s  Langarmhemd"
  const out = [];
  let cur = "", depth = 0, spaces = 0;
  for (const ch of line + " ".repeat(minSpaces)) {
    if (ch === " " || ch === "\u00a0") { spaces++; continue; }
    if (spaces) { if (depth === 0 && spaces >= minSpaces) { out.push(cur); cur = ""; } else cur += " "; spaces = 0; }
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    cur += ch;
  }
  out.push(cur);
  return out;
}
const groups = (v, minSpaces) => (v || "").split("\n")
  .flatMap((l) => splitWide(l, minSpaces)).map(clean).filter(Boolean)
  .reduce((out, g) => (/^\(.*\)$/.test(g) && out.length ? out.push(out.pop() + " " + g) : out.push(g), out), []);
const CZ = new Set("ěščřžýůťďňĚŠČŘŽÝŮŤĎŇ"), DE = new Set("äöüßÄÖÜ");
const score = (s, set) => [...s].filter((ch) => set.has(ch)).length;
// Sentences often have no umlauts ("Verkaufst du das Haus / es?" | "Prodáš ten dům?"), so also look at common words.
const GERMAN_WORDS = /(?<![\p{L}])(ich|du|er|sie|es|wir|ihr|der|die|das|dem|des|ist|sind|nicht|und|ein|eine|einen|ihn|mich|dich|mit|auf)(?![\p{L}])/iu;
const CZECH_WORDS = /(?<![\p{L}])(to|ten|ta|tu|je|se|si|mi|ho|ji|jsem|ne)(?![\p{L}])/iu;
const looksCzech = (s) => /[ěščřžýůťďňáéíóú]/i.test(s) || CZECH_WORDS.test(s);
const swapped = (de, cs) =>
  (score(de, CZ) > score(de, DE) && score(cs, DE) > score(cs, CZ)) ||
  (GERMAN_WORDS.test(cs) && !GERMAN_WORDS.test(de) && looksCzech(de));
export const isDate = (v) => /^\d{1,2}\.\s*\d{1,2}\.?$/.test((v || "").trim());
// pronunciation hints like "schwer   / švééér /" or "čteme / i dé e /" (never "er / sie / es hat")
const stripHints = (v) => (v || "").split("\n")
  .map((l) => l.replace(/(?:čteme[ \u00a0]*)?\/[^/]+\/(?=[ \u00a0]{3,}|[ \u00a0]*$)/g, "")).join("\n");
const bare = (w) => w.replace(/[.,!?]+$/, "");

// "Je mi zima / teplo / horko." -> ["Je mi zima.", "Je mi teplo.", "Je mi horko."]
// Words before the first "/" and after the last one are shared by every option.
// Returns [s] when the line has no " / ".
export function expandSlashes(s) {
  const end = (s.match(/[.!?]+$/) || [""])[0]; // final punctuation belongs to every option
  const parts = s.slice(0, s.length - end.length).split(/\s+\/\s+/);
  if (parts.length < 2 || parts.some((p) => !p.trim())) return [s];
  const words = parts.map((p) => p.trim().split(" "));
  const first = words[0], last = words[words.length - 1], middle = words.slice(1, -1);
  const finish = (w) => { const t = w.join(" "); return /[.!?]$/.test(t) ? t : t + end; };
  // options written out in full: "gute Laune / schlechte Laune", "Ano, mám televizor. / Ne, nemám televizor."
  if (first.length > 1 && first.length === last.length && bare(first.at(-1)) === bare(last.at(-1))) return words.map(finish);
  let prefix, options, suffix = [];
  // an option starts where the last one's first word (or any article, for "r Lohn / s Gehalt") appears
  const article = (w) => /^(der|die|das|den|dem|des|ein|eine|einen|einem|r|e|s)$/.test(w);
  let anchor = first.lastIndexOf(last[0]);
  if (anchor < 0 && article(last[0])) anchor = first.findLastIndex(article);
  if (anchor >= 0 && first.length > 1) {
    // options start with the same word: "Co si dáte k jídlu / k pití?", "auf etwas / auf jemanden hören"
    prefix = first.slice(0, anchor);
    const opt = first.slice(anchor);
    if (middle.length || last.length < opt.length) options = [opt, ...middle, last]; // "aus Tschechien / ... / aus der Ukraine"
    else { options = [opt, last.slice(0, opt.length)]; suffix = last.slice(opt.length); }
  } else {
    // how many words one option takes: from the middle options when there are any
    const mid = middle.map((w) => w.length);
    const width = mid.length && mid.every((n) => n === mid[0]) ? mid[0] : 1;
    if (first.length < width || last.length < width) return [s];
    prefix = first.slice(0, first.length - width);
    suffix = last.slice(width);
    options = [first.slice(-width), ...middle, last.slice(0, width)];
  }
  return options.map((o) => finish([...prefix, ...o, ...suffix]));
}

// Yield [de, cs] pairs from one row of the sheet.
export function* pairs(a, b) {
  const fixed = OVERRIDES[`${clean(a)}|${clean(b)}`];
  if (fixed) { for (const [cs, de] of fixed) yield [de, cs]; return; }
  a = stripHints(a); b = stripHints(b);
  // split where both sides have the same number of parts: on 2+ spaces, else on 3+ spaces
  let cand = [[clean(a), clean(b)]];
  for (const n of [2, 3]) {
    const ga = groups(a, n), gb = groups(b, n);
    if (ga.length > 1 && ga.length === gb.length) { cand = ga.map((x, i) => [x, gb[i]]); break; }
  }
  // several German nouns for one Czech word are synonyms: "s Zeug, -e      e Sache, -n" | "věc"
  const ga = groups(a, 2);
  if (cand.length === 1 && ga.length > 1 && groups(b, 2).length === 1 && ga.every((g) => /^\(?[res]\)? \p{Lu}/u.test(g)))
    cand = [[ga.join(" = "), clean(b)]];
  for (let [de, cs] of cand) {
    if (!de || !cs) continue;
    if (swapped(de, cs)) [de, cs] = [cs, de]; // columns swapped
    // lists like "rád - raději - nejraději" | "gern - lieber - am liebsten" -> one card each
    // "–" lists are pronunciation drills of bare words ("Hamburg – Haus – haben"), not vocab
    if (de.split(/\s+–\s+/).length >= 3) continue;
    const ld = de.split(/\s+-\s+/), lc = cs.split(/\s+-\s+/);
    if (ld.length >= 3 && ld.length === lc.length) { yield* ld.map((d, i) => [d, lc[i]]); continue; }
    // same number of "/" options on both sides -> one card per option
    const ed = expandSlashes(de), ec = expandSlashes(cs);
    if (ed.length > 1 && ed.length === ec.length) yield* ed.map((d, i) => [d, ec[i]]);
    else yield [de, cs];
  }
}

export function isPair(de, cs) {
  if (!de || !cs || de === cs) return false;
  if (![de, cs].every((s) => /\p{L}{2}/u.test(s))) return false; // dates, numbers, "x"
  if ([de, cs].some((s) => /\s\+\s/.test(s))) return false; // patterns like "Anfang + název měsíce"
  if ([de, cs].some((s) => /^(http|www\.)/i.test(s) || s.includes("@"))) return false;
  if (de.length > 90 || cs.length > 90) return false; // long rows are explanations, not vocab
  if ([de, cs].some((s) => s.endsWith(":") || s.startsWith("-"))) return false;
  return true;
}

async function wordId(de, cs) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`${de}|${cs}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 10);
}

async function readSheet(sheetId, { name, gid }) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const items = [], seen = new Set();
  let started = false;
  for (const row of parseCsv(await res.text())) {
    // skip contacts + student list: words start after the first lesson date ("1. 10.") or a year row (" ,2026")
    if (!started) { started = isDate(row[0]) || row.slice(0, 2).some((c) => /^\s*20\d\d\s*$/.test(c || "")); continue; }
    for (let [de, cs] of pairs(row[0], row[1])) {
      if (!isPair(de, cs)) continue;
      de = ARTICLES[de] || de;
      const id = await wordId(de, cs);
      if (seen.has(id)) continue;
      seen.add(id);
      items.push(EXTRA_ANSWERS[id] ? [id, cs, de, EXTRA_ANSWERS[id]] : [id, cs, de]);
    }
  }
  return items;
}

async function refreshVocab(env) {
  if (!env.SHEET_ID) throw new Error("SHEET_ID is not set");
  const sheets = [];
  for (const s of await listSheets(env.SHEET_ID)) {
    const items = await readSheet(env.SHEET_ID, s);
    if (items.length) sheets.push({ id: s.gid, sheet: s.name, items });
  }
  if (!sheets.length) throw new Error("no vocabulary found in the sheet");
  const vocab = JSON.stringify({ sheets, checkedAt: Date.now() });
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('vocab', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1")
    .bind(vocab).run();
  return vocab;
}

// ---------- API ----------

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

const slugify = (n) =>
  n.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

async function api(request, env, path) {
  const db = env.DB;

  if (path === "/api/vocab" && request.method === "GET") {
    const row = await db.prepare("SELECT value FROM meta WHERE key = 'vocab'").first();
    const body = row ? row.value : await refreshVocab(env); // first run before the cron has fired
    return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  }

  // answers people marked as correct, for review (read-only; resolved with wrangler d1 execute)
  if (path === "/api/disputes" && request.method === "GET") {
    const { results } = await db.prepare(
      "SELECT id, name, word_id, typed, created, status, note FROM disputes ORDER BY id DESC LIMIT 500").all();
    return json(results);
  }

  if (path === "/api/people" && request.method === "GET") {
    const { results } = await db.prepare("SELECT name FROM people ORDER BY name").all();
    return json(results.map((r) => r.name));
  }

  const m = path.match(/^\/api\/progress\/([a-z0-9-]{1,40})$/);
  if (!m) return json({ error: "not found" }, 404);
  const slug = m[1];

  if (request.method === "GET") {
    const { results } = await db.prepare("SELECT word_id, known, misses FROM progress WHERE slug = ?1").bind(slug).all();
    const known = {}, missed = {};
    for (const r of results) { if (r.known) known[r.word_id] = 1; else if (r.misses) missed[r.word_id] = r.misses; }
    return json({ known, missed });
  }

  if (request.method === "POST") {
    // {name, answers: [{id, ok}]} — one or more answers since the last save
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 40) : "";
    const answers = Array.isArray(body?.answers) ? body.answers.slice(0, 200) : [];
    if (!name || slugify(name) !== slug) return json({ error: "bad name" }, 400);
    const now = Date.now();
    const stmts = [db.prepare("INSERT INTO people (slug, name) VALUES (?1, ?2) ON CONFLICT(slug) DO UPDATE SET name = ?2").bind(slug, name)];
    for (const a of answers) {
      if (typeof a?.id !== "string" || !/^[0-9a-f]{10}$/.test(a.id)) continue;
      stmts.push(a.ok
        ? db.prepare(`INSERT INTO progress (slug, word_id, known, misses, updated) VALUES (?1, ?2, 1, 0, ?3)
                      ON CONFLICT(slug, word_id) DO UPDATE SET known = 1, misses = 0, updated = ?3`).bind(slug, a.id, now)
        : db.prepare(`INSERT INTO progress (slug, word_id, known, misses, updated) VALUES (?1, ?2, 0, 1, ?3)
                      ON CONFLICT(slug, word_id) DO UPDATE SET known = 0, misses = misses + 1, updated = ?3`).bind(slug, a.id, now));
    // "I had it right": keep what was typed so Claude can review it later
    if (a.ok && a.disputed && typeof a.typed === "string" && a.typed.trim()) {
      stmts.push(db.prepare("INSERT INTO disputes (slug, name, word_id, typed, created) VALUES (?1, ?2, ?3, ?4, ?5)")
        .bind(slug, name, a.id, a.typed.trim().slice(0, 200), now));
    }
    }
    await db.batch(stmts);
    return json({ ok: true });
  }

  if (request.method === "DELETE") {
    await db.prepare("DELETE FROM progress WHERE slug = ?1").bind(slug).run();
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) {
      try { return await api(request, env, path); }
      catch (e) { return json({ error: String(e?.message || e) }, 500); }
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshVocab(env));
  },
};
