// أدوات مشتركة لتعريف الطالبة في قاعدة البيانات
export const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
export const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);
const GRADES = ["الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"];
// توحيد الاسم للمطابقة فقط (أ/إ/آ → ا، ة → ه، ى → ي، حذف التطويل)
export const norm = (s) => clean(s).replace(/\u0640/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
export function student(b) {
  const name = clean(b?.name), grade = clean(b?.grade), section = clean(b?.section).slice(0, 4);
  if (name.split(" ").length < 3 || !GRADES.includes(grade) || !/^\d{1,2}$/.test(section)) return null;
  return { name, grade, section, key: `${norm(name)}|${grade}|${section}` };
}
