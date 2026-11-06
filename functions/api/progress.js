// حفظ تقدم الطالبة في قاعدة بيانات D1 (الربط باسم DB)
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  let b;
  try { b = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const name = String(b?.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const chapter = int(b?.chapter, 1, 6);
  if (name.split(" ").length < 2 || !chapter) return json({ error: "bad_request" }, 400);
  const total = int(b.total, 1, 10) || 1;
  const done = int(b.done, 0, total) ?? 0;
  const final = b.final === null || b.final === undefined ? null : int(b.final, 0, 100);
  const max = int(b.max, 0, 500) || 0;
  const stars = int(b.stars, 0, max || 500) ?? 0;
  await env.DB.prepare(
    `INSERT INTO progress (name, chapter, lessons_done, lessons_total, final_score, stars, max_stars, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))
     ON CONFLICT(name, chapter) DO UPDATE SET
       lessons_done = MAX(progress.lessons_done, excluded.lessons_done),
       lessons_total = excluded.lessons_total,
       final_score = CASE WHEN excluded.final_score IS NULL THEN progress.final_score
                          WHEN progress.final_score IS NULL THEN excluded.final_score
                          ELSE MAX(progress.final_score, excluded.final_score) END,
       stars = MAX(progress.stars, excluded.stars),
       max_stars = excluded.max_stars,
       updated_at = datetime('now')`
  ).bind(name, chapter, done, total, final, stars, max).run();
  return json({ ok: true });
}
