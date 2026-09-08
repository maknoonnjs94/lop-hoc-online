/* =====================================================================
   Worker của lop-hoc-online.
   - Mọi đường dẫn bình thường: Cloudflare vẫn phục vụ file tĩnh trong web/ như cũ.
   - /api/*: vài việc cần quyền quản trị Supabase mà trình duyệt KHÔNG được phép làm:
       POST /api/tao-tai-khoan     tạo tài khoản sinh viên + ghi danh vào lớp, trả mật khẩu tạm
       POST /api/cap-lai-mat-khau  đặt mật khẩu tạm mới cho một sinh viên
   Khoá SUPABASE_SERVICE_ROLE_KEY là *secret* của Worker (dán trong Cloudflare → Settings → Variables and Secrets).
   Nó không nằm trong mã, không nằm trong trình duyệt, không nằm trong kho GitHub.
   Ai gọi /api/* phải gửi access token Supabase của mình; Worker kiểm tra hồ sơ phải là giảng viên/quản trị.
   ===================================================================== */
const SUPABASE_URL = 'https://euyrrodppbpnkmificbs.supabase.co';
const ANON_KEY = 'sb_publishable_wYan8ql2gDukI261zLrXeA_fUCG9bnP';
const ORIGINS = ['https://lop-hoc-online.maknoonnjs94.workers.dev', 'http://localhost:8765', 'http://127.0.0.1:8765'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
    /* GET /api/trang-thai: Worker đã thấy khoá chưa — chỉ trả có/không và TÊN các biến, không bao giờ trả giá trị */
    if (url.pathname === '/api/trang-thai') return json({ ok: true, co_khoa: !!env.SUPABASE_SERVICE_ROLE_KEY, bien: Object.keys(env).filter(function (k) { return k !== 'ASSETS'; }) }, 200, request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
    if (request.method !== 'POST') return json({ ok: false, reason: 'chi_post' }, 405, request);
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, reason: 'chua_cau_hinh' }, 503, request);
    try {
      let body = {};
      try { body = await request.json(); } catch (e) { body = {}; }
      const ai = await nguoiGoi(request, env);
      if (ai.loi) return json({ ok: false, reason: ai.loi }, 401, request);
      if (url.pathname === '/api/tao-tai-khoan') return await taoTaiKhoan(body, ai, env, request);
      if (url.pathname === '/api/cap-lai-mat-khau') return await capLaiMatKhau(body, ai, env, request);
      return json({ ok: false, reason: 'khong_co_duong_nay' }, 404, request);
    } catch (e) {
      return json({ ok: false, reason: 'loi_may_chu', chi_tiet: String(e && e.message || e).slice(0, 200) }, 500, request);
    }
  }
};

/* ---------- tiện ích ---------- */
function cors(request) {
  const o = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.indexOf(o) >= 0 ? o : ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin'
  };
}
function json(obj, status, request) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, cors(request))
  });
}
function adminHeaders(env, extra) {
  return Object.assign({
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  }, extra || {});
}
function locLoi(t) {
  try { const d = JSON.parse(t); return String(d.message || d.msg || d.error_description || d.error || d.hint || t).slice(0, 220); }
  catch (e) { return String(t || '').slice(0, 220); }
}
/* Mật khẩu tạm: 10 ký tự dễ đọc (không có 0/O, 1/l/I), có gạch giữa cho dễ chép. */
function sinhMatKhau() {
  const bo = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const a = new Uint8Array(10); crypto.getRandomValues(a);
  let s = '';
  for (let i = 0; i < 10; i++) { s += bo[a[i] % bo.length]; if (i === 4) s += '-'; }
  return s;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Ai đang gọi? Token của người gọi → auth.users; rồi hồ sơ phải là teacher/admin và còn active. */
async function nguoiGoi(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { loi: 'chua_dang_nhap' };
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token } });
  if (!r.ok) return { loi: 'phien_het_han' };
  const u = await r.json();
  if (!u || !u.id) return { loi: 'phien_het_han' };
  const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + u.id + '&select=role,active', { headers: adminHeaders(env) });
  const rows = p.ok ? await p.json() : [];
  const ho = rows[0] || {};
  if (ho.active === false) return { loi: 'tai_khoan_da_tat' };
  if (ho.role !== 'teacher' && ho.role !== 'admin') return { loi: 'khong_phai_giang_vien' };
  return { id: u.id, email: u.email, role: ho.role, token: token };
}

/* POST /api/tao-tai-khoan  { class_id, students: [{ email, full_name, student_no }] }  (tối đa 60 người một lần) */
async function taoTaiKhoan(body, ai, env, request) {
  const classId = String(body.class_id || '');
  const ds = Array.isArray(body.students) ? body.students.slice(0, 60) : [];
  if (!UUID.test(classId)) return json({ ok: false, reason: 'thieu_lop' }, 400, request);
  if (!ds.length) return json({ ok: false, reason: 'trong' }, 400, request);
  const c = await fetch(SUPABASE_URL + '/rest/v1/classes?id=eq.' + classId + '&select=id,name,archived', { headers: adminHeaders(env) });
  const cl = c.ok ? await c.json() : [];
  if (!cl[0]) return json({ ok: false, reason: 'khong_thay_lop' }, 404, request);

  const out = [];
  for (const sv of ds) {
    const email = String(sv.email || '').trim().toLowerCase();
    const ten = String(sv.full_name || '').trim().slice(0, 120);
    const mssv = String(sv.student_no || '').trim().slice(0, 40);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { out.push({ email: email, ok: false, reason: 'email_sai' }); continue; }
    const mk = sinhMatKhau();
    const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
      method: 'POST', headers: adminHeaders(env),
      body: JSON.stringify({ email: email, password: mk, email_confirm: true, user_metadata: { full_name: ten } })
    });
    const d = await r.json().catch(function () { return {}; });
    if (!r.ok) {
      const m = String(d.msg || d.message || d.error_description || d.error || '');
      if ((r.status === 422 || r.status === 400) && /already|registered|exist/i.test(m)) {
        /* Đã có tài khoản với email này → chỉ ghi danh, dùng hàm sẵn có chạy với quyền của chính giảng viên. */
        const e = await fetch(SUPABASE_URL + '/rest/v1/rpc/enroll_by_email', {
          method: 'POST', headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ai.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_class: classId, p_email: email })
        });
        const et = await e.text();
        out.push(e.ok ? { email: email, ok: true, da_co: true } : { email: email, ok: false, reason: 'da_co_tai_khoan', chi_tiet: locLoi(et) });
      } else {
        out.push({ email: email, ok: false, reason: 'khong_tao_duoc', chi_tiet: m.slice(0, 200) || ('HTTP ' + r.status) });
      }
      continue;
    }
    const uid = d.id;
    /* Hồ sơ: tên, mã SV, sinh viên, lần đầu vào phải đổi mật khẩu. Trigger đã tạo dòng; upsert cho chắc. */
    const ph = await fetch(SUPABASE_URL + '/rest/v1/profiles?on_conflict=id', {
      method: 'POST', headers: adminHeaders(env, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ id: uid, full_name: ten, student_no: mssv, role: 'student', active: true, must_change_pw: true })
    });
    let canhBao = '';
    if (!ph.ok) canhBao = 'Tạo được tài khoản nhưng chưa ghi tên vào hồ sơ: ' + locLoi(await ph.text());
    /* Ghi danh vào lớp (trigger "một tài khoản một khoá" vẫn chạy). */
    const en = await fetch(SUPABASE_URL + '/rest/v1/enrollments', {
      method: 'POST', headers: adminHeaders(env, { Prefer: 'return=minimal' }),
      body: JSON.stringify({ class_id: classId, student: uid })
    });
    if (!en.ok && en.status !== 409) canhBao += (canhBao ? ' ' : '') + 'Tạo được tài khoản nhưng chưa ghi danh vào lớp: ' + locLoi(await en.text());
    out.push({ email: email, ok: true, password: mk, full_name: ten, canh_bao: canhBao || undefined });
  }
  return json({ ok: true, lop: cl[0].name, ket_qua: out }, 200, request);
}

/* POST /api/cap-lai-mat-khau  { user_id }  → mật khẩu tạm mới; sinh viên đăng nhập lần tới phải tự đổi. */
async function capLaiMatKhau(body, ai, env, request) {
  const uid = String(body.user_id || '');
  if (!UUID.test(uid)) return json({ ok: false, reason: 'thieu_id' }, 400, request);
  const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + uid + '&select=role,full_name', { headers: adminHeaders(env) });
  const rows = p.ok ? await p.json() : [];
  if (!rows[0]) return json({ ok: false, reason: 'khong_thay' }, 404, request);
  if (rows[0].role !== 'student' && ai.role !== 'admin') return json({ ok: false, reason: 'chi_sinh_vien' }, 403, request);
  if (uid === ai.id) return json({ ok: false, reason: 'tu_doi_o_menu' }, 400, request);
  const mk = sinhMatKhau();
  const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + uid, { method: 'PUT', headers: adminHeaders(env), body: JSON.stringify({ password: mk }) });
  if (!r.ok) return json({ ok: false, reason: 'khong_doi_duoc', chi_tiet: locLoi(await r.text()) }, 502, request);
  await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + uid, {
    method: 'PATCH', headers: adminHeaders(env, { Prefer: 'return=minimal' }), body: JSON.stringify({ must_change_pw: true })
  });
  return json({ ok: true, password: mk, full_name: rows[0].full_name || '' }, 200, request);
}
