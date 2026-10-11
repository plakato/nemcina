-- Answers marked "I had it right" by a learner, for Claude to review.
-- status: open -> accepted (answer added / rule fixed) or no_reason (left as is); note says why.
CREATE TABLE disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  word_id TEXT NOT NULL,
  typed TEXT NOT NULL,
  created INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  note TEXT
);
