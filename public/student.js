/* نافذة الترحيب وملف الطالبة — مشترك بين الصفحة الرئيسة والفصول الستة
   يُحفظ الملف محليًا للعرض السريع، ويُسجَّل مركزيًا في قاعدة بيانات D1 عبر /api/student */
(function () {
  const KEY = 'chem22-student', LATER = 'chem22-welcome-later';
  const GRADES = ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];
  const SECTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const listeners = [];

  function get() { try { const p = JSON.parse(localStorage.getItem(KEY) || 'null'); return p && p.name ? p : null; } catch (e) { return null; } }
  function set(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} listeners.forEach(f => { try { f(p); } catch (e) {} }); renderChip(); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

  const css = `
  .wm-ov{position:fixed;inset:0;z-index:1000;background:rgba(20,14,40,.45);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;transition:opacity .25s}
  .wm-ov.on{opacity:1}
  .wm{direction:rtl;font-family:"IBM Plex Sans Arabic",system-ui,"Segoe UI",Tahoma,sans-serif;background:#fff;color:#1E1636;width:100%;max-width:440px;border-radius:24px;box-shadow:0 24px 60px rgba(30,15,80,.25);padding:26px 24px 20px;transform:translateY(14px) scale(.98);transition:transform .25s;max-height:calc(100vh - 36px);overflow:auto}
  .wm-ov.on .wm{transform:none}
  .wm-ic{width:62px;height:62px;border-radius:18px;background:linear-gradient(135deg,#2F6FE4,#7C4DD6);display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 10px;box-shadow:0 10px 22px rgba(47,111,228,.3)}
  .wm h2{font-family:"Noto Kufi Arabic","IBM Plex Sans Arabic",sans-serif;font-size:22px;text-align:center;margin:0 0 6px}
  .wm p.wm-t{text-align:center;color:#5F5878;font-size:15px;line-height:1.8;margin:0 0 16px}
  .wm label{display:block;font-weight:600;font-size:14px;margin:10px 0 5px}
  .wm input,.wm select{width:100%;font:inherit;font-size:16px;color:#1E1636;background:#F8F5FE;border:1.5px solid #E2D9F3;border-radius:14px;padding:11px 14px;outline:none;transition:border-color .2s,box-shadow .2s}
  .wm input:focus,.wm select:focus{border-color:#2F6FE4;box-shadow:0 0 0 4px rgba(47,111,228,.15)}
  .wm .wm-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .wm .wm-err{color:#C7362A;font-size:13px;min-height:1.2em;margin-top:4px}
  .wm .wm-bad{border-color:#C7362A}
  .wm .wm-btns{display:flex;gap:10px;margin-top:16px}
  .wm .wm-save{flex:1;border:0;border-radius:999px;padding:12px;font:inherit;font-weight:700;font-size:16px;background:#2763D8;color:#fff;cursor:pointer}
  .wm .wm-save:disabled{opacity:.6;cursor:wait}
  .wm .wm-later{border:1.5px solid #E2D9F3;background:#fff;color:#5F5878;border-radius:999px;padding:12px 20px;font:inherit;font-weight:600;cursor:pointer}
  .wm .wm-note{font-size:12.5px;color:#8a83a3;text-align:center;margin:12px 0 0}
  .st-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(124,77,214,.1);border:1px solid rgba(124,77,214,.25);color:inherit;border-radius:999px;padding:4px 6px 4px 12px;font:inherit;font-size:13.5px;font-weight:600;max-width:320px}
  .st-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .st-chip button{border:0;background:rgba(124,77,214,.18);color:inherit;border-radius:999px;padding:2px 9px;font:inherit;font-size:12.5px;cursor:pointer}
  .st-chip button.st-logout{background:rgba(199,54,42,.12);color:#C7362A}
  .st-chip button.st-logout:hover{background:rgba(199,54,42,.22)}
  .st-chip.empty{background:#2763D8;color:#fff;border-color:#2763D8;cursor:pointer;padding:5px 14px}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .wm{background:#211A3A;color:#EEE9FB}:root:not([data-theme="light"]) .wm input,:root:not([data-theme="light"]) .wm select{background:#1B1531;color:#EEE9FB;border-color:#3A3060}:root:not([data-theme="light"]) .wm .wm-later{background:transparent;color:#B4ABD0;border-color:#3A3060}:root:not([data-theme="light"]) .wm p.wm-t{color:#B4ABD0}}
  :root[data-theme="dark"] .wm{background:#211A3A;color:#EEE9FB}:root[data-theme="dark"] .wm input,:root[data-theme="dark"] .wm select{background:#1B1531;color:#EEE9FB;border-color:#3A3060}:root[data-theme="dark"] .wm .wm-later{background:transparent;color:#B4ABD0;border-color:#3A3060}:root[data-theme="dark"] .wm p.wm-t{color:#B4ABD0}
  @media (prefers-reduced-motion:reduce){.wm-ov,.wm{transition:none}}
  @media (max-width:420px){.wm{padding:22px 16px 16px}.wm .wm-row{grid-template-columns:1fr}}`;

  function injectCss() { if (document.getElementById('wm-css')) return; const s = document.createElement('style'); s.id = 'wm-css'; s.textContent = css; document.head.appendChild(s); }

  async function register(p, old) {
    try {
      const r = await fetch('/api/student', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name, grade: p.grade, section: p.section, old: old || null }) });
      return r.ok;
    } catch (e) { return false; }
  }

  function open(opts) {
    opts = opts || {};
    injectCss();
    if (document.querySelector('.wm-ov')) return;
    const cur = get();
    const ov = document.createElement('div');
    ov.className = 'wm-ov';
    ov.innerHTML = `<div class="wm" role="dialog" aria-modal="true" aria-labelledby="wmT">
      <div class="wm-ic" aria-hidden="true">⚗️</div>
      <h2 id="wmT">${cur ? 'تعديل بياناتي' : 'مرحباً بكِ في رحلتك الكيميائية'}</h2>
      <p class="wm-t">أدخلي اسمك الثلاثي ؛ لنسجل تقدمك في الدروس والاختبارات ونتابع معكِ رحلة التعلم</p>
      <label for="wmName">الاسم الثلاثي</label>
      <input id="wmName" type="text" autocomplete="name" maxlength="60" placeholder="مثال: سارة محمد العتيبي" value="${cur ? esc(cur.name) : ''}">
      <div class="wm-err" id="wmNameErr"></div>
      <div class="wm-row">
        <div><label for="wmGrade">الصف</label><select id="wmGrade"><option value="">اختاري الصف</option>${GRADES.map(g => `<option ${cur && cur.grade === g ? 'selected' : (!cur && g === 'الثاني الثانوي' ? 'selected' : '')}>${g}</option>`).join('')}</select></div>
        <div><label for="wmSec">الشعبة</label><select id="wmSec"><option value="">اختاري الشعبة</option>${SECTIONS.map(s => `<option value="${s}" ${cur && cur.section === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="wm-err" id="wmSelErr"></div>
      <div class="wm-btns"><button type="button" class="wm-save" id="wmSave">حفظ</button><button type="button" class="wm-later" id="wmLater">${cur ? 'إلغاء' : 'لاحقاً'}</button></div>
      <p class="wm-note">🔒 يُستعمل اسمك لمتابعة تقدمك فقط، وتطّلع عليه معلمتك. استعملي البيانات نفسها على أي جهاز لتجدي تقدمك.</p>
    </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('on'));
    const $ = id => ov.querySelector('#' + id);
    const prevFocus = document.activeElement;
    setTimeout(() => $('wmName').focus(), 60);
    const close = () => { ov.classList.remove('on'); document.removeEventListener('keydown', onKey); setTimeout(() => { ov.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); }, 220); };
    const onKey = e => {
      if (e.key === 'Escape') { later(); }
      if (e.key === 'Tab') { const f = [...ov.querySelectorAll('input,select,button')]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    };
    document.addEventListener('keydown', onKey);
    const later = () => { if (!cur) { try { sessionStorage.setItem(LATER, '1'); } catch (e) {} } close(); };
    $('wmLater').addEventListener('click', later);
    ov.addEventListener('click', e => { if (e.target === ov) later(); });
    $('wmName').addEventListener('keydown', e => { if (e.key === 'Enter') $('wmSave').click(); });
    $('wmName').addEventListener('input', () => { $('wmName').classList.remove('wm-bad'); $('wmNameErr').textContent = ''; });
    ['wmGrade', 'wmSec'].forEach(id => $(id).addEventListener('change', () => { $(id).classList.remove('wm-bad'); if ($('wmGrade').value && $('wmSec').value) $('wmSelErr').textContent = ''; }));
    $('wmSave').addEventListener('click', async () => {
      const name = clean($('wmName').value), grade = $('wmGrade').value, section = $('wmSec').value;
      let ok = true;
      $('wmName').classList.remove('wm-bad'); $('wmGrade').classList.remove('wm-bad'); $('wmSec').classList.remove('wm-bad');
      $('wmNameErr').textContent = ''; $('wmSelErr').textContent = '';
      if (!name) { $('wmNameErr').textContent = 'يُرجى كتابة اسمك الثلاثي.'; $('wmName').classList.add('wm-bad'); ok = false; }
      else if (name.split(' ').length < 3) { $('wmNameErr').textContent = 'اكتبي الاسم ثلاثيًا: اسمك واسم الأب واسم العائلة.'; $('wmName').classList.add('wm-bad'); ok = false; }
      else if (!/^[\u0600-\u06FFa-zA-Z\s\-']+$/.test(name)) { $('wmNameErr').textContent = 'استعملي الحروف فقط في الاسم.'; $('wmName').classList.add('wm-bad'); ok = false; }
      if (!grade || !section) { $('wmSelErr').textContent = 'اختاري الصف والشعبة.'; if (!grade) $('wmGrade').classList.add('wm-bad'); if (!section) $('wmSec').classList.add('wm-bad'); ok = false; }
      if (!ok) return;
      const p = { name, grade, section, savedAt: Date.now() };
      $('wmSave').disabled = true; $('wmSave').textContent = 'جارٍ الحفظ…';
      const old = cur && (cur.name !== name || cur.grade !== grade || cur.section !== section) ? { name: cur.name, grade: cur.grade, section: cur.section } : null;
      const online = await register(p, old);
      p.synced = online;
      set(p);
      try { sessionStorage.removeItem(LATER); } catch (e) {}
      close();
      if (typeof window.toast === 'function') window.toast(online ? 'حُفظت بياناتك ✓' : 'حُفظت بياناتك على هذا الجهاز، وستُرسل عند توفر الاتصال');
    });
  }

  function logout() {
    if (!confirm('هل تريدين تسجيل الخروج؟')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { sessionStorage.removeItem(LATER); } catch (e) {}
    listeners.forEach(f => { try { f(null); } catch (e) {} });
    renderChip();
    if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html') || window.location.pathname.includes('/ch')) {
      window.location.href = '/?login=1';
    } else {
      setTimeout(() => open(), 200);
    }
  }

  function renderChip() {
    const slots = document.querySelectorAll('[data-student-slot]');
    const p = get();
    slots.forEach(slot => {
      slot.innerHTML = p
        ? `<span class="st-chip" title="${esc(p.grade)} · الشعبة ${esc(p.section)}"><span>👩‍🎓 ${esc(p.name.split(' ').slice(0, 2).join(' '))}</span><button type="button" data-st-edit aria-label="تعديل بياناتي">✏️ تعديل</button><button type="button" class="st-logout" data-st-logout aria-label="تسجيل الخروج">خروج</button></span>`
        : `<button type="button" class="st-chip empty" data-st-edit>👩‍🎓 سجّلي اسمك</button>`;
      const editBtn = slot.querySelector('[data-st-edit]');
      if (editBtn) editBtn.addEventListener('click', () => open());
      const logoutBtn = slot.querySelector('[data-st-logout]');
      if (logoutBtn) logoutBtn.addEventListener('click', logout);
    });
  }

  function mountChipInHeader() {
    const tools = document.querySelector('.top-tools');
    if (tools && !tools.querySelector('[data-student-slot]')) { const s = document.createElement('span'); s.setAttribute('data-student-slot', ''); tools.prepend(s); }
  }

  // إعادة إرسال التسجيل إن حُفظ دون اتصال
  async function retry() {
    const p = get();
    if (p && !p.synced) {
      const ok = await register(p);
      if (ok) {
        p.synced = true;
        try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
      }
    }
  }

  function init() {
    injectCss(); mountChipInHeader(); renderChip(); retry();
    window.addEventListener('online', retry);
    const urlParams = new URLSearchParams(window.location.search);
    const forceLogin = urlParams.get('login') === '1';
    let later = false; try { later = sessionStorage.getItem(LATER) === '1'; } catch (e) {}
    if (!get() && (forceLogin || !later)) {
      if (forceLogin) {
        history.replaceState(null, '', window.location.pathname);
      }
      setTimeout(() => open(), 400);
    }
  }

  window.Chem22Student = { get, set, open, logout, onChange: f => listeners.push(f), key: p => p ? [clean(p.name), p.grade, p.section].join('|') : '' };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
