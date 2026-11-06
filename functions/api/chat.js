// دالة «اسألي مساعدك الكيميائي» على Cloudflare Pages
// المتغيرات تُضاف من: Workers & Pages > المشروع > Settings > Variables and Secrets
//   OPENROUTER_API_KEY  (مطلوب لتفعيل المساعد)  مفتاح OpenRouter — أضيفيه من نوع Secret
//   OPENROUTER_MODEL    (اختياري) الافتراضي anthropic/claude-haiku-4.5
import { RULES } from "../../lib/rules.js";

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

export async function onRequestPost({ request, env }) {
  const key = env.OPENROUTER_API_KEY;
  if (!key) return json({ error: "not_configured" }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad_request" }, 400); }
  const ch = parseInt(body?.ch, 10);
  const rules = RULES[ch] || RULES[1];
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .slice(-10)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "bad_request" }, 400);
  const lesson = typeof body.lesson === "string" ? body.lesson.slice(0, 80) : "";
  const system = rules + (lesson ? `\n(الطالبة الآن في الدرس ${lesson}.)` : "");
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Chemistry 2-2 Advisor" },
      body: JSON.stringify({ model: env.OPENROUTER_MODEL || DEFAULT_MODEL, messages: [{ role: "system", content: system }, ...messages], max_tokens: 900, temperature: 0.4 }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return json({ error: r.status === 429 ? "rate_limited" : "upstream" }, 502);
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return json({ error: "empty" }, 502);
    return json({ text });
  } catch (e) {
    return json({ error: "upstream" }, 502);
  }
}
