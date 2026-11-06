// عرض نتائج الطالبات للمعلمة وحذفها — محمي بكلمة مرور
// TEACHER_PASSWORD من: Settings > Variables and Secrets (إن لم تُضف تكون 123456)
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const authed = (request, env) => (request.headers.get("x-teacher-password") || "") === String(env.TEACHER_PASSWORD || "123456");

export async function onRequestGet({ request, env }) {
  if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  const { results } = await env.DB.prepare(
    "SELECT name, chapter, lessons_done, lessons_total, final_score, stars, max_stars, updated_at FROM progress ORDER BY name, chapter"
  ).all();
  return json({ rows: results || [] });
}

export async function onRequestDelete({ request, env }) {
  if (!authed(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "db_not_bound" }, 500);
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (name) await env.DB.prepare("DELETE FROM progress WHERE name = ?1").bind(name).run();
  else if (url.searchParams.get("all") === "1") await env.DB.prepare("DELETE FROM progress").run();
  else return json({ error: "bad_request" }, 400);
  return json({ ok: true });
}
