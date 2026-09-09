/* =====================================================================
   Worker của lop-hoc-online.
   - Mọi đường dẫn bình thường: Cloudflare vẫn phục vụ file tĩnh trong web/ như cũ.
   - /api/*: vài việc cần quyền quản trị Supabase mà trình duyệt KHÔNG được phép làm:
       POST /api/tao-tai-khoan     tạo tài khoản sinh viên + ghi danh vào lớp, trả mật khẩu tạm
       POST /api/cap-lai-mat-khau  đặt mật khẩu tạm mới cho một sinh viên
       POST /api/stream/token      sinh viên xin link xem video (Cloudflare Stream, ký RS256, hết hạn, gắn IP)
       POST /api/stream/danh-sach  giảng viên: danh sách video trên Stream
       POST /api/stream/chon       giảng viên: khoá link video (requireSignedURLs + allowedOrigins)
       POST /api/stream/tai-len    giảng viên: xin link tải video thẳng lên Stream (≤ 200 MB)
       POST /api/stream/tai-len-lon giảng viên: xin chỗ tải video lớn (tới 30 GB) theo giao thức tus, rớt mạng nối tiếp được
   Stream cần thêm hai secret: CF_ACCOUNT_ID và CF_STREAM_TOKEN (API token quyền Stream:Edit). Khoá ký video
   được tạo một lần rồi cất trong bảng cau_hinh_he_thong của Supabase (chỉ service role đọc được).
   Khoá SUPABASE_SERVICE_ROLE_KEY là *secret* của Worker (dán trong Cloudflare → Settings → Variables and Secrets).
   Nó không nằm trong mã, không nằm trong trình duyệt, không nằm trong kho GitHub.
   Ai gọi /api/* phải gửi access token Supabase của mình; Worker kiểm tra hồ sơ phải là giảng viên/quản trị.
   ===================================================================== */
const SUPABASE_URL = 'https://euyrrodppbpnkmificbs.supabase.co';
const ANON_KEY = 'sb_publishable_wYan8ql2gDukI261zLrXeA_fUCG9bnP';
const ORIGINS = ['https://lop-hoc-online.giangduonghoahoc.workers.dev', 'http://localhost:8765', 'http://127.0.0.1:8765'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
    /* GET /api/trang-thai: Worker đã thấy khoá chưa — chỉ trả có/không và TÊN các biến, không bao giờ trả giá trị */
    if (url.pathname === '/api/trang-thai') {
      const k = env.SUPABASE_SERVICE_ROLE_KEY || '';
      /* Phân loại khoá mà KHÔNG lộ giá trị: chỉ nói nó thuộc kiểu nào và dài bao nhiêu. */
      const kieu = !k ? 'khong_co'
        : (k.indexOf('sb_publishable_') === 0 ? 'CONG_KHAI_dan_nham'
        : (k.indexOf('sb_secret_') === 0 ? 'bi_mat_kieu_moi'
        : (k.indexOf('eyJ') === 0 ? 'jwt_kieu_cu' : 'la')));
      let thu = { status: 0, so_dong: -1 };
      if (k) {
        try {
          const t = await fetch(SUPABASE_URL + '/rest/v1/profiles?select=id&limit=1', { headers: adminHeaders(env) });
          const b = t.ok ? await t.json() : [];
          thu = { status: t.status, so_dong: Array.isArray(b) ? b.length : -1 };
        } catch (e) { thu = { status: -1, so_dong: -1 }; }
      }
      /* Đã chạy file SQL nào rồi: hỏi thẳng máy chủ, khỏi đoán. */
      const sql = k ? await kiemSchema(env) : null;
      /* Thử một lệnh CHỈ ĐỌC lên Stream để biết gói và khoá có dùng được không */
      let thuStream = null;
      if (streamSan(env)) {
        try {
          const rs = await fetch(CF_API + env.CF_ACCOUNT_ID + '/stream?per_page=1', { headers: { Authorization: 'Bearer ' + env.CF_STREAM_TOKEN } });
          const tx = await rs.text();
          let loi = '';
          try { const d = JSON.parse(tx); if (d.success === false) loi = ((d.errors || []).map(function (x) { return (x.code ? x.code + ': ' : '') + (x.message || ''); }).join(' | ')) || ''; } catch (e) { loi = ''; }
          if (!loi && !rs.ok) loi = tx.slice(0, 200);
          thuStream = { status: rs.status, loi: loi || undefined };
        } catch (e) { thuStream = { status: -1, loi: String(e && e.message || e) }; }
      }
      return json({ ok: true, co_khoa: !!k, kieu_khoa: kieu, do_dai: k.length, doc_ho_so: thu, stream: streamSan(env), thu_stream: thuStream, sql: sql, bien: Object.keys(env).filter(function (x) { return x !== 'ASSETS'; }) }, 200, request);
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
    if (request.method !== 'POST') return json({ ok: false, reason: 'chi_post' }, 405, request);
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, reason: 'chua_cau_hinh' }, 503, request);
    try {
      let body = {};
      try { body = await request.json(); } catch (e) { body = {}; }
      if (url.pathname === '/api/stream/token') return await streamToken(body, request, env);
      const ai = await nguoiGoi(request, env);
      if (ai.loi) return json({ ok: false, reason: ai.loi, chi_tiet: ai.email ? (ai.email + (ai.vai_tro ? ' — vai trò máy chủ thấy: ' + ai.vai_tro : '')) : undefined }, 401, request);
      if (url.pathname === '/api/tao-tai-khoan') return await taoTaiKhoan(body, ai, env, request);
      if (url.pathname === '/api/cap-lai-mat-khau') return await capLaiMatKhau(body, ai, env, request);
      if (url.pathname === '/api/stream/danh-sach') return await streamDanhSach(env, request);
      if (url.pathname === '/api/stream/chon') return await streamChon(body, env, request);
      if (url.pathname === '/api/stream/tai-len') return await streamTaiLen(body, env, request);
      if (url.pathname === '/api/stream/tai-len-lon') return await streamTaiLenLon(body, env, request);
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
  if (ho.active === false) return { loi: 'tai_khoan_da_tat', email: u.email };
  if (ho.role !== 'teacher' && ho.role !== 'admin') return { loi: 'khong_phai_giang_vien', email: u.email, vai_tro: ho.role || '(chưa có hồ sơ ở bảng profiles)' };
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

/* =====================================================================
   VIDEO — Cloudflare Stream
   Video nằm trên Stream, bật requireSignedURLs nên không có link cố định. Mỗi lần sinh viên mở, Worker kiểm
   quyền (đúng lớp, buổi đã mở, tới giờ) rồi ký một token RS256 sống 4 giờ, gắn với IP đang xem.
   ===================================================================== */
const CF_API = 'https://api.cloudflare.com/client/v4/accounts/';
let khoaKyCache = null;
function streamSan(env) { return !!(env.CF_STREAM_TOKEN && env.CF_ACCOUNT_ID); }
async function cfStream(env, path, method, body) {
  const r = await fetch(CF_API + env.CF_ACCOUNT_ID + '/stream' + path, {
    method: method || 'GET',
    headers: { Authorization: 'Bearer ' + env.CF_STREAM_TOKEN, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json().catch(function () { return {}; });
  if (!r.ok || d.success === false) {
    const e = (d.errors && d.errors[0]) || {};
    throw new Error('Cloudflare Stream: ' + (e.message || ('HTTP ' + r.status)) + (e.code ? ' (mã ' + e.code + ')' : ''));
  }
  return d.result;
}
async function restOne(env, path) {
  const r = await fetch(SUPABASE_URL + '/rest/v1' + path, { headers: adminHeaders(env) });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows[0] || null;
}
/* cấu hình hệ thống nằm trong Supabase, bảng cau_hinh_he_thong (schema_v14_video.sql) */
async function docCauHinh(env, khoa) { const r = await restOne(env, '/cau_hinh_he_thong?khoa=eq.' + encodeURIComponent(khoa) + '&select=gia_tri'); return r ? r.gia_tri : null; }
async function ghiCauHinh(env, khoa, giaTri) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/cau_hinh_he_thong?on_conflict=khoa', {
    method: 'POST', headers: adminHeaders(env, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ khoa: khoa, gia_tri: giaTri, updated_at: new Date().toISOString() })
  });
  if (!r.ok) throw new Error('Chưa lưu được cấu hình (' + r.status + '). Đã chạy schema_v14_video.sql chưa?');
}
/* Khoá ký: tạo một lần bằng API Stream, cất vào Supabase; các lần sau đọc lại (và nhớ trong bộ nhớ Worker). */
async function layKhoaKy(env) {
  if (khoaKyCache) return khoaKyCache;
  let k = await docCauHinh(env, 'stream_key');
  if (!k || !k.id || !k.jwk) {
    const res = await cfStream(env, '/keys', 'POST', {});
    k = { id: res.id, jwk: res.jwk, created: res.created };
    await ghiCauHinh(env, 'stream_key', k);
  }
  khoaKyCache = k;
  return k;
}
function b64url(buf) {
  const s = typeof buf === 'string' ? buf : String.fromCharCode.apply(null, new Uint8Array(buf));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlUtf8(obj) { return b64url(new TextEncoder().encode(JSON.stringify(obj))); }
async function kyTokenStream(khoa, uid, ttl, ipRule) {
  const jwk = JSON.parse(atob(khoa.jwk));
  delete jwk.key_ops; delete jwk.use; jwk.alg = 'RS256';
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: khoa.id };
  const payload = { sub: uid, kid: khoa.id, nbf: now - 60, exp: now + ttl };
  if (ipRule) payload.accessRules = [{ type: 'ip.src', ip: [ipRule], action: 'allow' }, { type: 'any', action: 'block' }];
  const data = b64urlUtf8(header) + '.' + b64urlUtf8(payload);
  const sig = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, key, new TextEncoder().encode(data));
  return data + '.' + b64url(sig);
}
/* IPv4 → /32; IPv6 → /64 (cùng mạng thì đổi đuôi vẫn xem được) */
function luatIp(ip) {
  if (!ip) return '';
  if (ip.indexOf(':') < 0) return ip + '/32';
  let parts = ip.split('::');
  let head = parts[0] ? parts[0].split(':') : [];
  let tail = parts[1] ? parts[1].split(':') : [];
  while (head.length + tail.length < 8) head.push('0');
  const full = head.concat(tail).slice(0, 8);
  return full.slice(0, 4).join(':') + '::/64';
}
/* Ai đang xem? Bất kỳ tài khoản còn active; staff = giảng viên/quản trị. */
async function nguoiDung(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { loi: 'chua_dang_nhap' };
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + token } });
  if (!r.ok) return { loi: 'phien_het_han' };
  const u = await r.json();
  if (!u || !u.id) return { loi: 'phien_het_han' };
  const ho = await restOne(env, '/profiles?id=eq.' + u.id + '&select=role,active') || {};
  if (ho.active === false) return { loi: 'tai_khoan_da_tat' };
  return { id: u.id, email: u.email, staff: ho.role === 'teacher' || ho.role === 'admin' };
}

/* POST /api/stream/token  { material_id } → { token, embed, host, duration } */
/* true = chỉ ứng dụng máy tính mới xin được vé xem video (khớp BAT_BUOC_APP trong web/index.html). */
const APP_CHO_VIDEO = true;

async function streamToken(body, request, env) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const nd = await nguoiDung(request, env);
  if (nd.loi) return json({ ok: false, reason: nd.loi }, 401, request);
  const mid = String(body.material_id || '');
  if (!UUID.test(mid)) return json({ ok: false, reason: 'thieu_tai_lieu' }, 400, request);
  const m = await restOne(env, '/materials?id=eq.' + mid + '&select=id,open_at,gioi_han_giay,session_id,sessions(class_id,published)');
  if (!m) return json({ ok: false, reason: 'khong_thay' }, 404, request);
  const c = await restOne(env, '/material_contents?material_id=eq.' + mid + '&select=url');
  const u = String((c && c.url) || '');
  if (u.indexOf('stream:') !== 0) return json({ ok: false, reason: 'khong_phai_stream' }, 400, request);
  const uid = u.slice(7).trim();
  if (!/^[0-9a-f]{32}$/i.test(uid)) return json({ ok: false, reason: 'uid_sai' }, 400, request);
  if (!nd.staff) {
    /* Video bài giảng chỉ phát trong ứng dụng máy tính. Trang web tự chặn trước, đây là chốt thật:
       không có app thì máy chủ không ký vé, dù có gọi thẳng vào địa chỉ này. */
    if (APP_CHO_VIDEO && (request.headers.get('user-agent') || '').indexOf('LopHocApp/') < 0) {
      return json({ ok: false, reason: 'can_app' }, 403, request);
    }
    const s = m.sessions || {};
    if (!s.published) return json({ ok: false, reason: 'chua_mo' }, 403, request);
    if (m.open_at && new Date(m.open_at).getTime() > Date.now()) return json({ ok: false, reason: 'chua_toi_gio' }, 403, request);
    const e = await restOne(env, '/enrollments?class_id=eq.' + s.class_id + '&student=eq.' + nd.id + '&select=student');
    if (!e) return json({ ok: false, reason: 'khong_trong_lop' }, 403, request);
  }

  /* Quỹ thời gian xem: hết quỹ thì không cấp vé nữa. Giảng viên không bị trừ. */
  const quy = Math.max(0, Number(m.gioi_han_giay) || 0);
  let conLai = 0;
  if (quy > 0 && !nd.staff) {
    const ve = await restOne(env, '/view_events?user_id=eq.' + nd.id + '&material_id=eq.' + mid + '&select=tong_giay,quy_them');
    const daXem = Math.max(0, Number(ve && ve.tong_giay) || 0);
    /* giảng viên có thể nới thêm cho riêng em này */
    const quyTong = quy + Math.max(0, Number(ve && ve.quy_them) || 0);
    if (daXem >= quyTong) {
      return json({ ok: false, reason: 'het_luot', da_xem: daXem, gioi_han: quyTong }, 403, request);
    }
    conLai = quyTong - daXem;
    /* Phí mở: mỗi lần xin vé trừ sẵn 2 phút, để máy nào không gửi nhật ký xem cũng bị trừ dần. */
    try {
      await fetch(SUPABASE_URL + '/rest/v1/view_events?user_id=eq.' + nd.id + '&material_id=eq.' + mid, {
        method: 'PATCH', headers: adminHeaders(env, { Prefer: 'return=minimal' }),
        body: JSON.stringify({ tong_giay: Math.min(quyTong, daXem + 120) })
      });
    } catch (e) {}
  }
  const v = await cfStream(env, '/' + uid);
  if (!v.readyToStream) return json({ ok: false, reason: 'chua_san_sang', pct: v.status && v.status.pctComplete }, 409, request);
  const host = new URL(v.playback.hls).host;
  const khoa = await layKhoaKy(env);
  /* Vé chỉ sống đúng phần quỹ còn lại (thêm 10 phút dư), tối đa 4 giờ. */
  const song = conLai > 0 ? Math.min(4 * 3600, conLai + 600) : 4 * 3600;
  const token = await kyTokenStream(khoa, uid, song, luatIp(request.headers.get('CF-Connecting-IP') || ''));
  return json({ ok: true, token: token, host: host, embed: 'https://' + host + '/' + token + '/iframe',
    duration: v.duration, gioi_han: quy || undefined, con_lai: quy ? conLai : undefined }, 200, request);
}

/* POST /api/stream/danh-sach → { videos: [...] } (giảng viên) */
async function streamDanhSach(env, request) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const list = await cfStream(env, '?per_page=200');
  const videos = (list || []).map(function (v) {
    return { uid: v.uid, ten: (v.meta && v.meta.name) || v.filename || v.uid, giay: Math.round(v.duration || 0), anh: v.thumbnail || '',
      san_sang: !!v.readyToStream, pct: v.status && v.status.pctComplete, ky: !!v.requireSignedURLs, ngay: v.created, kich_thuoc: v.size || 0 };
  }).sort(function (a, b) { return String(b.ngay).localeCompare(String(a.ngay)); });
  return json({ ok: true, videos: videos }, 200, request);
}
/* POST /api/stream/chon { uid } → khoá link: chỉ mở bằng token, chỉ nhúng được từ trang này */
async function streamChon(body, env, request) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const uid = String(body.uid || '');
  if (!/^[0-9a-f]{32}$/i.test(uid)) return json({ ok: false, reason: 'uid_sai' }, 400, request);
  const host = new URL(request.url).host;
  const v = await cfStream(env, '/' + uid, 'POST', { requireSignedURLs: true, allowedOrigins: [host] });
  return json({ ok: true, uid: v.uid, ten: (v.meta && v.meta.name) || v.filename || v.uid, san_sang: !!v.readyToStream }, 200, request);
}
/* POST /api/stream/tai-len { name } → { uploadURL, uid } — trình duyệt gửi tệp thẳng lên Cloudflare (≤ 200 MB) */
async function streamTaiLen(body, env, request) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const host = new URL(request.url).host;
  const ten = String(body.name || 'video').slice(0, 120);
  const r = await cfStream(env, '/direct_upload', 'POST', { maxDurationSeconds: 21600, requireSignedURLs: true, allowedOrigins: [host], meta: { name: ten } });
  return json({ ok: true, uploadURL: r.uploadURL, uid: r.uid }, 200, request);
}

/* Kiểm xem các file schema_v*.sql đã chạy chưa, bằng cách thử đọc đúng cột / bảng tương ứng. */
async function coCot(env, bang, cot) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + bang + '?select=' + cot + '&limit=1', { headers: adminHeaders(env) });
    return r.ok;
  } catch (e) { return false; }
}
async function kiemSchema(env) {
  const [v9a, v9b, v9c, v10, v11, v12, v14, v16a, v16b, v17, v18] = await Promise.all([
    coCot(env, 'sessions', 'pinned,starts_at'),
    coCot(env, 'classes', 'notice'),
    coCot(env, 'view_events', 'progress'),
    coCot(env, 'profiles', 'gender,major,must_change_pw'),
    coCot(env, 'profiles', 'avatar'),
    coCot(env, 'profiles', 'avatar_path'),
    coCot(env, 'cau_hinh_he_thong', 'khoa'),
    coCot(env, 'materials', 'gioi_han_giay'),
    coCot(env, 'view_events', 'tong_giay'),
    coCot(env, 'view_events', 'quy_them'),
    coCot(env, 'dung_luong_thang', 'giay_phat')
  ]);
  return {
    v9_hom_nay: v9a && v9b && v9c,
    v10_ho_so: v10,
    v11_giao_dien: v11,
    v12_anh_dai_dien: v12,
    v14_video: v14,
    v16_gioi_han: v16a && v16b,
    v17_noi_quy: v17,
    v18_hoa_don: v18
  };
}

/* POST /api/stream/tai-len-lon { name, size } → { endpoint, uid }
   Cloudflare trả một địa chỉ tus dùng một lần; trình duyệt đẩy tệp lên từng khúc, đứt mạng thì nối tiếp
   đúng chỗ dở. Khoá tài khoản không bao giờ rời Worker. */
async function streamTaiLenLon(body, env, request) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const ten = String(body.name || 'video').slice(0, 120);
  const size = Math.floor(Number(body.size) || 0);
  if (!size || size > 30 * 1024 * 1024 * 1024) return json({ ok: false, reason: 'kich_thuoc_sai' }, 400, request);
  const host = new URL(request.url).host;
  const b64 = function (s) { return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(s))); };
  const meta = [
    'name ' + b64(ten),
    'requiresignedurls',
    'allowedorigins ' + b64(host),
    'maxdurationseconds ' + b64('21600')
  ].join(',');
  const r = await fetch(CF_API + env.CF_ACCOUNT_ID + '/stream?direct_user=true', {
    method: 'POST',
    body: '',   /* gửi Content-Length: 0 — một số máy chủ từ chối POST không có thân (411) */
    headers: {
      Authorization: 'Bearer ' + env.CF_STREAM_TOKEN,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(size),
      'Upload-Metadata': meta
    }
  });
  if (!r.ok) {
    const t = await r.text();
    /* Đường tus hay trả lỗi rỗng, thông tin nằm ở các đầu mục — ghi hết lại để dò */
    const dauMuc = [];
    r.headers.forEach(function (v, k2) { if (/^(tus-|upload-|stream-|cf-|content-type)/i.test(k2)) dauMuc.push(k2 + '=' + v); });
    const chiTiet = 'HTTP ' + r.status
      + (t ? ' — ' + (locLoi(t) || t.slice(0, 200)) : ' (không có thân trả lời)')
      + (dauMuc.length ? ' [' + dauMuc.join('; ') + ']' : '');
    return json({ ok: false, reason: 'khong_xin_duoc_cho', chi_tiet: chiTiet, da_gui: { size: size, meta: meta.replace(/[A-Za-z0-9+/=]{20,}/g, '…') } }, 502, request);
  }
  const endpoint = r.headers.get('Location');
  const uid = r.headers.get('stream-media-id');
  if (!endpoint || !uid) return json({ ok: false, reason: 'cloudflare_thieu_dia_chi' }, 502, request);
  return json({ ok: true, endpoint: endpoint, uid: uid }, 200, request);
}
