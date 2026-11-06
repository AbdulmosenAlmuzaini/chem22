-- جدول تقدم الطالبات — نفّذيه مرة واحدة في Console قاعدة البيانات D1
CREATE TABLE IF NOT EXISTS progress (
  name           TEXT    NOT NULL,
  chapter        INTEGER NOT NULL,
  lessons_done   INTEGER NOT NULL DEFAULT 0,
  lessons_total  INTEGER NOT NULL DEFAULT 0,
  final_score    INTEGER,
  stars          INTEGER NOT NULL DEFAULT 0,
  max_stars      INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (name, chapter)
);
