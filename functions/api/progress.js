// حفظ تقدم الطالبة في قاعدة بيانات D1 (الربط باسم DB)
import { json, student } from "../../lib/student.js";
const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  let b;
  try { b = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const s = student(b);
  const chapter = int(b?.chapter, 1, 6);
  if (!s || !chapter) return json({ error: "bad_request" }, 400);
  const total = int(b.total, 1, 10) || 1;
  const list = Array.isArray(b.done_list) ? [...new Set(b.done_list.map((x) => int(x, 1, total)).filter(Boolean))].sort((a, c) => a - c) : [];
  const done = Math.max(int(b.done, 0, total) ?? 0, list.length);
  const final = b.final === null || b.final === undefined ? -1 : int(b.final, 0, 100);
  const max = int(b.max, 0, 500) || 0;
  const stars = int(b.stars, 0, max || 500) ?? 0;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO students (student_key, name, grade, section, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))
      ON CONFLICT(student_key) DO UPDATE SET updated_at = datetime('now')`).bind(s.key, s.name, s.grade, s.section),
    env.DB.prepare(`INSERT INTO student_progress (student_key, chapter, name, grade, section, lessons_done, lessons_total, done_list, final_score, stars, max_stars, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'))
      ON CONFLICT(student_key, chapter) DO UPDATE SET
        name = excluded.name,
        lessons_total = excluded.lessons_total,
        done_list = CASE WHEN length(excluded.done_list) >= length(COALESCE(student_progress.done_list,'')) THEN excluded.done_list ELSE student_progress.done_list END,
        lessons_done = MAX(student_progress.lessons_done, excluded.lessons_done),
        final_score = MAX(COALESCE(student_progress.final_score, -1), excluded.final_score),
        stars = MAX(student_progress.stars, excluded.stars),
        max_stars = excluded.max_stars,
        updated_at = datetime('now')`).bind(s.key, chapter, s.name, s.grade, s.section, done, total, list.join(","), final, stars, max),
  ]);
  return json({ ok: true });
}
