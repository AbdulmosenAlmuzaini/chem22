// تسجيل الطالبة (الاسم الثلاثي والصف والشعبة) واسترجاع تقدمها على أي جهاز
import { json, student } from "../../lib/student.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  let b;
  try { b = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const s = student(b);
  if (!s) return json({ error: "bad_request" }, 400);
  const stmts = [
    env.DB.prepare(`INSERT INTO students (student_key, name, grade, section, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))
      ON CONFLICT(student_key) DO UPDATE SET name = excluded.name, updated_at = datetime('now')`).bind(s.key, s.name, s.grade, s.section),
  ];
  // عند تعديل البيانات: نقل التقدم المسجل بالبيانات القديمة إلى البيانات الجديدة
  const o = b.old ? student(b.old) : null;
  if (o && o.key !== s.key) {
    stmts.push(env.DB.prepare(`INSERT INTO student_progress (student_key, chapter, name, grade, section, lessons_done, lessons_total, done_list, pre_score, final_score, stars, max_stars, updated_at)
      SELECT ?1, chapter, ?2, ?3, ?4, lessons_done, lessons_total, done_list, pre_score, final_score, stars, max_stars, datetime('now') FROM student_progress WHERE student_key = ?5
      ON CONFLICT(student_key, chapter) DO UPDATE SET lessons_done = MAX(student_progress.lessons_done, excluded.lessons_done),
        pre_score = CASE WHEN student_progress.pre_score IS NOT NULL AND student_progress.pre_score >= 0 THEN student_progress.pre_score ELSE excluded.pre_score END,
        final_score = MAX(COALESCE(student_progress.final_score, -1), COALESCE(excluded.final_score, -1)), stars = MAX(student_progress.stars, excluded.stars)`).bind(s.key, s.name, s.grade, s.section, o.key));
    stmts.push(env.DB.prepare("DELETE FROM student_progress WHERE student_key = ?1").bind(o.key));
    stmts.push(env.DB.prepare("DELETE FROM students WHERE student_key = ?1").bind(o.key));
  }
  await env.DB.batch(stmts);
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  const u = new URL(request.url);
  const s = student({ name: u.searchParams.get("name"), grade: u.searchParams.get("grade"), section: u.searchParams.get("section") });
  if (!s) return json({ error: "bad_request" }, 400);
  const ch = parseInt(u.searchParams.get("chapter") || "0", 10);
  const q = ch
    ? env.DB.prepare("SELECT chapter, lessons_done, lessons_total, done_list, pre_score, final_score, stars FROM student_progress WHERE student_key = ?1 AND chapter = ?2").bind(s.key, ch)
    : env.DB.prepare("SELECT chapter, lessons_done, lessons_total, done_list, pre_score, final_score, stars FROM student_progress WHERE student_key = ?1").bind(s.key);
  const { results } = await q.all();
  return json({
    rows: (results || []).map((r) => ({
      ...r,
      pre_score: r.pre_score == null || r.pre_score < 0 ? null : r.pre_score,
      final_score: r.final_score == null || r.final_score < 0 ? null : r.final_score
    }))
  });
}
