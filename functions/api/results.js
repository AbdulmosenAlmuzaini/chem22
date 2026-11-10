// عرض نتائج الطالبات للمعلمة وحذفها — محمي بكلمة مرور
// TEACHER_PASSWORD من: Settings > Variables and Secrets (إن لم تُضف تكون 123456)
import { json } from "../../lib/student.js";
const authed = (request, env) => (request.headers.get("x-teacher-password") || "") === String(env.TEACHER_PASSWORD || "123456");

export async function onRequestGet({ request, env }) {
  if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  const { results } = await env.DB.prepare(
    `SELECT s.student_key, s.name, s.grade, s.section, s.created_at,
            p.chapter, p.lessons_done, p.lessons_total, p.pre_score, p.final_score, p.stars, p.max_stars, p.updated_at
     FROM students s LEFT JOIN student_progress p ON p.student_key = s.student_key
     ORDER BY s.grade, s.section, s.name, p.chapter`
  ).all();
  return json({
    rows: (results || []).map((r) => ({
      ...r,
      pre_score: r.pre_score == null || r.pre_score < 0 ? null : r.pre_score,
      final_score: r.final_score == null || r.final_score < 0 ? null : r.final_score
    }))
  });
}

export async function onRequestDelete({ request, env }) {
  if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (key) await env.DB.batch([env.DB.prepare("DELETE FROM student_progress WHERE student_key = ?1").bind(key), env.DB.prepare("DELETE FROM students WHERE student_key = ?1").bind(key)]);
  else if (url.searchParams.get("all") === "1") await env.DB.batch([env.DB.prepare("DELETE FROM student_progress"), env.DB.prepare("DELETE FROM students")]);
  else return json({ error: "bad_request" }, 400);
  return json({ ok: true });
}
