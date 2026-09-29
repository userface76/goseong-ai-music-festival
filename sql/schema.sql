CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  age_group TEXT,
  region TEXT,
  theme TEXT NOT NULL,
  story TEXT NOT NULL,
  keywords TEXT,
  desired_title TEXT,
  genre TEXT,
  mood TEXT,
  vocal_type TEXT,
  bpm TEXT,
  instruments TEXT,
  event_participation INTEGER NOT NULL DEFAULT 0,
  aimion_nickname TEXT,
  privacy_consent INTEGER NOT NULL DEFAULT 0,
  music_use_consent INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT '접수',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_receipt_no
ON submissions(receipt_no);

CREATE INDEX IF NOT EXISTS idx_submissions_status
ON submissions(status);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at
ON submissions(created_at);
