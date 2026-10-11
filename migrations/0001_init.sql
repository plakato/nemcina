-- Key/value store for the vocab list and when it was last checked.
CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- One row per person (name typed at the top of the page).
CREATE TABLE people (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- One row per person per word they have answered.
-- known = 1 once answered correctly (never shown again); misses counts wrong answers.
CREATE TABLE progress (
  slug TEXT NOT NULL,
  word_id TEXT NOT NULL,
  known INTEGER NOT NULL DEFAULT 0,
  misses INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL,
  PRIMARY KEY (slug, word_id)
);
