-- جداول بيانات الطالبات وتقدمهن — نفّذي هذا الملف كاملًا في Console قاعدة البيانات D1
-- آمن للتنفيذ أكثر من مرة: لا يحذف أي بيانات موجودة.

CREATE TABLE IF NOT EXISTS students (
  student_key  TEXT PRIMARY KEY,           -- الاسم الموحَّد | الصف | الشعبة
  name         TEXT NOT NULL,              -- الاسم الثلاثي كما كتبته الطالبة
  grade        TEXT NOT NULL,              -- الصف
  section      TEXT NOT NULL,              -- الشعبة
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_progress (
  student_key    TEXT    NOT NULL,
  chapter        INTEGER NOT NULL,
  name           TEXT    NOT NULL,
  grade          TEXT    NOT NULL,
  section        TEXT    NOT NULL,
  lessons_done   INTEGER NOT NULL DEFAULT 0,
  lessons_total  INTEGER NOT NULL DEFAULT 0,
  done_list      TEXT    NOT NULL DEFAULT '',   -- أرقام الدروس المنجزة مثل 1,3
  final_score    INTEGER NOT NULL DEFAULT -1,   -- -1 = لم يُنجز الاختبار الختامي
  stars          INTEGER NOT NULL DEFAULT 0,
  max_stars      INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_key, chapter)
);

CREATE INDEX IF NOT EXISTS idx_students_class ON students (grade, section);
