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
const ORIGINS = ['https://lop-hoc-online.giangduonghoahoc.workers.dev', 'https://giangduonghoahoc.com', 'https://www.giangduonghoahoc.com', 'http://localhost:8765', 'http://127.0.0.1:8765'];
/* Tên miền riêng: đặt biến TEN_MIEN trên Cloudflare (Settings → Variables), ví dụ "hoc.giangduonghoahoc.vn".
   Nhận cả tên miền đó lẫn mọi tên con của nó. Không đặt thì chỉ nhận danh sách trên. */
let TEN_MIEN_RIENG = null;
function nguonHopLe(o) {
  if (ORIGINS.indexOf(o) >= 0) return true;
  if (!TEN_MIEN_RIENG || !o) return false;
  try {
    const u = new URL(o);
    return u.protocol === 'https:' && (u.hostname === TEN_MIEN_RIENG || u.hostname.endsWith('.' + TEN_MIEN_RIENG));
  } catch (e) { return false; }
}
/* Danh sách host được nhúng video Stream: host đang gọi + workers.dev + tên miền riêng (và mọi tên con).
   Nhờ vậy video tải lên ở địa chỉ nào cũng phát được ở địa chỉ kia — đổi tên miền không phải khoá lại video. */
function nguonStream(request) {
  const ds = [new URL(request.url).host].concat(ORIGINS.filter(function (o) { return o.indexOf('https://') === 0; }).map(function (o) { return new URL(o).host; }));
  if (TEN_MIEN_RIENG) ds.push(TEN_MIEN_RIENG, '*.' + TEN_MIEN_RIENG);
  return ds.filter(function (x, i) { return ds.indexOf(x) === i; });
}

export default {
  async fetch(request, env) {
    TEN_MIEN_RIENG = (env.TEN_MIEN || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      if (!env.ASSETS) return new Response('Not found', { status: 404 });
      /* Từ 11/9/2026 địa chỉ gốc là trang công khai; trang học nằm ở /hoc. App bản ≤ 1.0.16 vẫn mở "/"
         → nhận ra app qua User-Agent (LopHocApp/…) và trả thẳng trang học, sinh viên không phải cập nhật. */
      if ((url.pathname === '/' || url.pathname === '/index.html') && /LopHocApp\//.test(request.headers.get('User-Agent') || '')) {
        const u2 = new URL(request.url); u2.pathname = '/hoc';
        return env.ASSETS.fetch(new Request(u2.toString(), request));
      }
      return env.ASSETS.fetch(request);
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
      if (url.pathname === '/api/dang-ky') return await dangKy(body, request, env);   /* công khai: form trên trang giới thiệu */
      const ai = await nguoiGoi(request, env);
      if (ai.loi) return json({ ok: false, reason: ai.loi, chi_tiet: ai.email ? (ai.email + (ai.vai_tro ? ' — vai trò máy chủ thấy: ' + ai.vai_tro : '')) : undefined }, 401, request);
      if (url.pathname === '/api/tao-tai-khoan') return await taoTaiKhoan(body, ai, env, request);
      if (url.pathname === '/api/cap-lai-mat-khau') return await capLaiMatKhau(body, ai, env, request);
      if (url.pathname === '/api/stream/danh-sach') return await streamDanhSach(env, request);
      if (url.pathname === '/api/stream/chon') return await streamChon(body, env, request);
      if (url.pathname === '/api/stream/tai-len') return await streamTaiLen(body, env, request);
      if (url.pathname === '/api/stream/tai-len-lon') return await streamTaiLenLon(body, env, request);
      if (url.pathname === '/api/stream/khoa-lai') return await streamKhoaLai(env, request);
      if (url.pathname === '/api/sao-luu') return json(await saoLuuNgay(env, 'tay'), 200, request);
      if (url.pathname === '/api/sao-luu/danh-sach') return json(await saoLuuDanhSach(env), 200, request);
      return json({ ok: false, reason: 'khong_co_duong_nay' }, 404, request);
    } catch (e) {
      return json({ ok: false, reason: 'loi_may_chu', chi_tiet: String(e && e.message || e).slice(0, 200) }, 500, request);
    }
  },
  /* Lịch (wrangler.jsonc → triggers.crons): mỗi tuần một bản sao lưu, không cần ai bấm */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(saoLuuNgay(env, 'lich'));
  }
};

/* ================= SAO LƯU TỰ ĐỘNG (v28) =================
   Gom các bảng qua REST bằng khoá quản trị → một tệp JSON → kho Supabase Storage 'sao-luu' (riêng tư, giảng viên
   tải ở Quản trị) + kho R2 nếu có binding SAO_LUU. Giữ 8 bản gần nhất ở mỗi kho. Tệp PDF/ảnh/video không kèm. */
const BANG_SAO_LUU = ['classes', 'sessions', 'materials', 'material_contents', 'enrollments', 'profiles', 'view_events',
  'bai_nop', 'cau_hoi', 'dap_an_o', 'device_bindings', 'screenshot_events', 'dung_luong_thang', 'trang_cong_khai', 'dang_ky'];
const GIU_BAN = 8;
async function layHetBang(env, bang) {
  const dong = []; let tu = 0;
  for (let k = 0; k < 200; k++) {
    /* không order theo cột (mỗi bảng khoá khác nhau) — PostgREST vẫn phân trang ổn định trong cùng một lượt đọc như bản sao lưu tay */
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + bang + '?select=*&limit=1000&offset=' + tu, { headers: adminHeaders(env) });
    if (!r.ok) return { loi: 'HTTP ' + r.status + ' ' + locLoi(await r.text()), dong: dong };
    const ds = await r.json();
    ds.forEach(function (x) { dong.push(x); });
    if (ds.length < 1000) break;
    tu += 1000;
  }
  return { dong: dong };
}
async function saoLuuNgay(env, nguon) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, reason: 'chua_cau_hinh' };
  const luc = new Date(), kho = { _meta: { he_thong: 'Giảng đường Hóa học', luc: luc.toISOString(), nguon: nguon, ghi_chu: 'Bản sao dữ liệu tự động. KHÔNG gồm tệp PDF/ảnh (kho Supabase) và video (Cloudflare Stream) — chỉ có đường dẫn.' }, bang: {} };
  const dem = {}, loi = [];
  for (const b of BANG_SAO_LUU) {
    const kq = await layHetBang(env, b);
    kho.bang[b] = kq.dong; dem[b] = kq.dong.length;
    if (kq.loi) loi.push(b + ': ' + kq.loi);
  }
  kho._meta.so_dong = dem; if (loi.length) kho._meta.bang_khong_doc_duoc = loi;
  const ten = 'sao-luu-' + luc.toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
  const than = JSON.stringify(kho);
  const ra = { ok: true, ten: ten, kich_thuoc: than.length, so_dong: dem, loi: loi, noi: [] };
  /* 1. kho Supabase Storage (riêng tư) */
  const up = await fetch(SUPABASE_URL + '/storage/v1/object/sao-luu/' + ten, {
    method: 'POST', headers: adminHeaders(env, { 'Content-Type': 'application/json', 'x-upsert': 'true' }), body: than });
  if (up.ok) { ra.noi.push('supabase'); await donKhoSaoLuu(env); }
  else ra.loi_kho = locLoi(await up.text());
  /* 2. R2 nếu có binding (tuỳ chọn, tạo bucket + thêm r2_buckets vào wrangler.jsonc) */
  if (env.SAO_LUU && typeof env.SAO_LUU.put === 'function') {
    try {
      await env.SAO_LUU.put(ten, than, { httpMetadata: { contentType: 'application/json' } });
      ra.noi.push('r2');
      const ds = await env.SAO_LUU.list({ prefix: 'sao-luu-' });
      const cu = (ds.objects || []).map(function (o) { return o.key; }).sort().reverse().slice(GIU_BAN);
      for (const k of cu) await env.SAO_LUU.delete(k);
    } catch (e) { ra.loi_r2 = String(e && e.message || e).slice(0, 120); }
  }
  /* dọn nhật ký lỗi cũ (hàm có từ v28; thiếu thì bỏ qua) */
  try { await fetch(SUPABASE_URL + '/rest/v1/rpc/don_loi_khach', { method: 'POST', headers: adminHeaders(env), body: '{}' }); } catch (e) {}
  return ra;
}
/* giữ GIU_BAN bản gần nhất trong kho Supabase */
async function donKhoSaoLuu(env) {
  const ds = await saoLuuDanhSach(env);
  const cu = (ds.ban || []).map(function (o) { return o.ten; }).sort().reverse().slice(GIU_BAN);
  if (!cu.length) return;
  await fetch(SUPABASE_URL + '/storage/v1/object/sao-luu', { method: 'DELETE', headers: adminHeaders(env), body: JSON.stringify({ prefixes: cu }) });
}
async function saoLuuDanhSach(env) {
  const r = await fetch(SUPABASE_URL + '/storage/v1/object/list/sao-luu', {
    method: 'POST', headers: adminHeaders(env), body: JSON.stringify({ prefix: '', limit: 100, sortBy: { column: 'name', order: 'desc' } }) });
  if (!r.ok) return { ok: false, reason: r.status === 404 || r.status === 400 ? 'chua_co_kho' : 'khong_doc_duoc', chi_tiet: locLoi(await r.text()) };
  const ds = await r.json();
  return { ok: true, ban: (Array.isArray(ds) ? ds : []).filter(function (o) { return /^sao-luu-.*\.json$/.test(o.name); }).map(function (o) { return { ten: o.name, luc: o.created_at || o.updated_at, kich_thuoc: (o.metadata && o.metadata.size) || 0 }; }), co_r2: !!env.SAO_LUU };
}

/* ---------- tiện ích ---------- */
function cors(request) {
  const o = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': nguonHopLe(o) ? o : ORIGINS[0],
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

/* POST /api/dang-ky  { ho_ten, email, sdt, khoa, ghi_chu, web }  — từ trang công khai, không cần đăng nhập.
   Ghi vào bảng dang_ky bằng khoá quản trị (anon không có quyền insert). Giảng viên duyệt ở Quản trị.
   Chống spam nhẹ: ô "web" là bẫy (người thật không thấy, máy điền là bỏ), mỗi IP tối đa 5 đơn/giờ trong một isolate. */
const DANG_KY_IP = new Map();
async function dangKy(body, request, env) {
  if (String(body.web || '').trim()) return json({ ok: true }, 200, request);   /* máy điền bẫy → giả vờ ok, không ghi */
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const now = Date.now(), ds = (DANG_KY_IP.get(ip) || []).filter(function (t) { return now - t < 3600e3; });
  if (ds.length >= 5) return json({ ok: false, reason: 'qua_nhieu' }, 429, request);
  const hoTen = String(body.ho_ten || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
  const sdt = String(body.sdt || '').replace(/[^0-9+ ]/g, '').trim().slice(0, 20);
  /* khoá: mảng (form tick nhiều) hoặc chuỗi cũ; gộp thành "A · B" để hiện + chống trùng, giữ mảng riêng ở khoa_ds */
  const khoaDs = (Array.isArray(body.khoa) ? body.khoa : String(body.khoa || '').split(/\s*[·;|]\s*/))
    .map(function (k) { return String(k || '').trim().slice(0, 120); }).filter(function (k, i, a) { return k && a.indexOf(k) === i; }).slice(0, 8);
  const khoa = khoaDs.join(' · ');
  const mssv = String(body.mssv || '').trim().replace(/\s+/g, '').slice(0, 40);
  const ghiChu = String(body.ghi_chu || '').trim().slice(0, 500);
  if (hoTen.length < 2) return json({ ok: false, reason: 'thieu_ten' }, 400, request);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, reason: 'email_sai' }, 400, request);
  if (sdt.replace(/[^0-9]/g, '').length < 8) return json({ ok: false, reason: 'sdt_sai' }, 400, request);
  if (!khoa) return json({ ok: false, reason: 'thieu_khoa' }, 400, request);
  if (mssv.replace(/[^A-Za-z0-9]/g, '').length < 4) return json({ ok: false, reason: 'mssv_sai' }, 400, request);
  /* Thử lần lượt: đủ cột (v27c) → không khoa_ds (v27b) → không mssv, mã SV ghi vào ghi chú (v27). 400 = thiếu cột. */
  const goiDs = [
    { ho_ten: hoTen, email: email, sdt: sdt, khoa: khoa, khoa_ds: khoaDs, ghi_chu: ghiChu, mssv: mssv },
    { ho_ten: hoTen, email: email, sdt: sdt, khoa: khoa, ghi_chu: ghiChu, mssv: mssv },
    { ho_ten: hoTen, email: email, sdt: sdt, khoa: khoa, ghi_chu: ('MSSV ' + mssv + (ghiChu ? ' — ' + ghiChu : '')).slice(0, 500) }
  ];
  let r = null;
  for (const goi of goiDs) {
    r = await fetch(SUPABASE_URL + '/rest/v1/dang_ky', { method: 'POST', headers: adminHeaders(env, { Prefer: 'return=minimal' }), body: JSON.stringify(goi) });
    if (r.status !== 400) break;
  }
  if (r.status === 409) return json({ ok: true, da_gui: true }, 200, request);   /* đã có đơn chờ cho khoá này */
  if (!r.ok) {
    const t = await r.text();
    if (/dang_ky/.test(t) && /not find|does not exist|schema cache/i.test(t)) return json({ ok: false, reason: 'chua_mo_dang_ky' }, 503, request);
    return json({ ok: false, reason: 'khong_ghi_duoc', chi_tiet: locLoi(t) }, 502, request);
  }
  ds.push(now); DANG_KY_IP.set(ip, ds);
  return json({ ok: true }, 200, request);
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
    /* Mật khẩu khởi tạo = mã sinh viên (dễ nhớ, sinh viên tự khai khi đăng ký); mã ngắn hơn 6 ký tự (Supabase không nhận) thì sinh ngẫu nhiên. */
    const mkMssv = mssv.replace(/\s+/g, '');
    const mk = mkMssv.length >= 6 ? mkMssv : sinhMatKhau();
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
        if (!e.ok) { out.push({ email: email, ok: false, reason: 'da_co_tai_khoan', chi_tiet: locLoi(et) }); continue; }
        /* Tài khoản có từ trước: mật khẩu giữ nguyên (không được tự đổi của người đang học). Trả user_id để quản trị
           có thể bấm "Đặt lại = mã SV" nếu em quên; mã SV trong hồ sơ còn trống thì điền luôn cho khớp nội dung chuyển khoản. */
        const hp = await fetch(SUPABASE_URL + '/rest/v1/profiles?email=eq.' + encodeURIComponent(email) + '&select=id,student_no,onboarded_at', { headers: adminHeaders(env) });
        const ho = hp.ok ? (await hp.json())[0] : null;
        if (ho && !String(ho.student_no || '').trim() && mssv) {
          await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + ho.id, { method: 'PATCH', headers: adminHeaders(env, { Prefer: 'return=minimal' }), body: JSON.stringify({ student_no: mssv }) });
        }
        out.push({ email: email, ok: true, da_co: true, user_id: ho ? ho.id : undefined, chua_vao: !!(ho && !ho.onboarded_at), full_name: ten });
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
    out.push({ email: email, ok: true, password: mk, la_mssv: mk === mkMssv, full_name: ten, canh_bao: canhBao || undefined });
  }
  return json({ ok: true, lop: cl[0].name, ket_qua: out }, 200, request);
}

/* POST /api/cap-lai-mat-khau  { user_id }  → mật khẩu tạm mới; sinh viên đăng nhập lần tới phải tự đổi. */
async function capLaiMatKhau(body, ai, env, request) {
  const uid = String(body.user_id || '');
  if (!UUID.test(uid)) return json({ ok: false, reason: 'thieu_id' }, 400, request);
  const p = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + uid + '&select=role,full_name,student_no', { headers: adminHeaders(env) });
  const rows = p.ok ? await p.json() : [];
  if (!rows[0]) return json({ ok: false, reason: 'khong_thay' }, 404, request);
  if (rows[0].role !== 'student' && ai.role !== 'admin') return json({ ok: false, reason: 'chi_sinh_vien' }, 403, request);
  if (uid === ai.id) return json({ ok: false, reason: 'tu_doi_o_menu' }, 400, request);
  /* dung_mssv: đặt mật khẩu tạm = mã sinh viên trong hồ sơ (≥ 6 ký tự); không thì sinh ngẫu nhiên */
  const mssvHoSo = String(rows[0].student_no || '').replace(/\s+/g, '');
  const laMssv = !!body.dung_mssv && mssvHoSo.length >= 6;
  const mk = laMssv ? mssvHoSo : sinhMatKhau();
  const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + uid, { method: 'PUT', headers: adminHeaders(env), body: JSON.stringify({ password: mk }) });
  if (!r.ok) return json({ ok: false, reason: 'khong_doi_duoc', chi_tiet: locLoi(await r.text()) }, 502, request);
  await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + uid, {
    method: 'PATCH', headers: adminHeaders(env, { Prefer: 'return=minimal' }), body: JSON.stringify({ must_change_pw: true })
  });
  return json({ ok: true, password: mk, la_mssv: laMssv, full_name: rows[0].full_name || '' }, 200, request);
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
/* v26: trạng thái học phí của một ghi danh — gọi hàm trang_thai_hoc_phi bằng khoá quản trị; lỗi/vắng hàm thì coi như ổn */
async function quaHanHocPhi(env, classId, userId) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/trang_thai_hoc_phi', {
      method: 'POST', headers: adminHeaders(env), body: JSON.stringify({ p_class: classId, p_student: userId }) });
    if (!r.ok) return false;
    const t = await r.json();
    return t === 'qua_han';
  } catch (e) { return false; }
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
    /* v26: quá hạn chưa đóng học phí → không cấp vé (chưa chạy v26 thì hàm vắng → cho qua) */
    if (await quaHanHocPhi(env, s.class_id, nd.id)) return json({ ok: false, reason: 'hoc_phi' }, 403, request);
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
  const v = await cfStream(env, '/' + uid, 'POST', { requireSignedURLs: true, allowedOrigins: nguonStream(request) });
  return json({ ok: true, uid: v.uid, ten: (v.meta && v.meta.name) || v.filename || v.uid, san_sang: !!v.readyToStream }, 200, request);
}
/* POST /api/stream/khoa-lai → khoá lại MỌI video cho đủ các địa chỉ hiện có (workers.dev + tên miền riêng).
   Dùng một lần sau khi gắn tên miền, hoặc trước khi phát hành app trỏ địa chỉ mới. */
async function streamKhoaLai(env, request) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const nguon = nguonStream(request);
  const list = await cfStream(env, '?per_page=200');
  let xong = 0, loi = [];
  for (const v of (list || [])) {
    try { await cfStream(env, '/' + v.uid, 'POST', { requireSignedURLs: true, allowedOrigins: nguon }); xong++; }
    catch (e) { loi.push(((v.meta && v.meta.name) || v.uid) + ': ' + String(e.message || e).slice(0, 80)); }
  }
  return json({ ok: true, so_video: xong, nguon: nguon, loi: loi }, 200, request);
}
/* POST /api/stream/tai-len { name } → { uploadURL, uid } — trình duyệt gửi tệp thẳng lên Cloudflare (≤ 200 MB) */
async function streamTaiLen(body, env, request) {
  if (!streamSan(env)) return json({ ok: false, reason: 'stream_chua_cau_hinh' }, 503, request);
  const ten = String(body.name || 'video').slice(0, 120);
  const r = await cfStream(env, '/direct_upload', 'POST', { maxDurationSeconds: 21600, requireSignedURLs: true, allowedOrigins: nguonStream(request), meta: { name: ten } });
  return json({ ok: true, uploadURL: r.uploadURL, uid: r.uid }, 200, request);
}

/* Kiểm xem các file schema_v*.sql đã chạy chưa, bằng cách thử đọc đúng cột / bảng tương ứng. */
async function coCot(env, bang, cot) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + bang + '?select=' + cot + '&limit=1', { headers: adminHeaders(env) });
    return r.ok;
  } catch (e) { return false; }
}
/* Kho tệp riêng có tồn tại chưa (phần dễ hỏng nhất của v19: vài dự án Supabase khoá storage.objects). */
async function coKho(env, ten) {
  try {
    const r = await fetch(SUPABASE_URL + '/storage/v1/bucket/' + ten, { headers: adminHeaders(env) });
    return r.ok;
  } catch (e) { return false; }
}
/* Hàm RPC đã có chưa. Phải gửi ĐÚNG TÊN THAM SỐ: PostgREST chọn hàm theo tên tham số,
   gửi thân rỗng là nó đi tìm bản không tham số rồi trả 404 dù hàm vẫn tồn tại. */
async function coHam(env, ten, than) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + ten, {
      method: 'POST', headers: adminHeaders(env), body: than || '{}' });
    return r.status !== 404;
  } catch (e) { return false; }
}
/* hàm RPC không tham số trả boolean: có và trả true mới tính */
async function goiRpcTrue(env, ten) {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + ten, { method: 'POST', headers: adminHeaders(env), body: '{}' });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch (e) { return false; }
}
async function kiemSchema(env) {
  const [v9a, v9b, v9c, v10, v11, v12, v14, v16a, v16b, v17, v18, v19a, v19b, v19c, v19d, v20a, v20b, v21, v22, v23a, v23b, v24a, v24b, v25, v26, v27, v27b, v27c, v27d, v28a, v28b, v29] = await Promise.all([
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
    coCot(env, 'dung_luong_thang', 'giay_phat'),
    coCot(env, 'materials', 'nhan_bai,han_nop'),
    coCot(env, 'bai_nop', 'tep,cham_luc'),
    coCot(env, 'cau_hoi', 'noi_dung,tra_loi'),
    coKho(env, 'bainop'),
    coCot(env, 'materials', 'o_tra_loi'),
    coCot(env, 'dap_an_o', 'dap_an'),
    coCot(env, 'materials', 'cho_tai'),
    coHam(env, 'thong_ke_o', JSON.stringify({ p_class: null })),
    coCot(env, 'cau_hoi', 'class_id,ghim,chu_de'),
    coHam(env, 'luu_faq', JSON.stringify({ p_id: null, p_class: null, p_hoi: null, p_dap: null })),
    coCot(env, 'sessions', 'deleted_at'),
    coHam(env, 'so_khoa_hoc', JSON.stringify({ s: '1' })),
    coCot(env, 'trang_cong_khai', 'khoa'),
    coCot(env, 'enrollments', 'da_dong_at,mien,han_dong'),
    coCot(env, 'dang_ky', 'trang_thai'),
    coCot(env, 'dang_ky', 'mssv'),
    coCot(env, 'dang_ky', 'khoa_ds'),
    coCot(env, 'dang_ky', 'khoa_da_duyet'),
    coKho(env, 'sao-luu'),
    coCot(env, 'loi_khach', 'thong_diep'),
    goiRpcTrue(env, 'nhieu_khoa_ok')
  ]);
  return {
    v9_hom_nay: v9a && v9b && v9c,
    v10_ho_so: v10,
    v11_giao_dien: v11,
    v12_anh_dai_dien: v12,
    v14_video: v14,
    v16_gioi_han: v16a && v16b,
    v17_noi_quy: v17,
    v18_hoa_don: v18,
    v19_nop_bai: v19a && v19b && v19c,
    v19_kho_bai_nop: v19d,
    v20_o_tra_loi: v20a && v20b,
    v21_cho_tai: v21,
    v22_xem_bai: v22,
    v23_hoi_dap_rieng: v23a && v23b,
    v24_thung_rac_bo_go: v24a && v24b,
    v25_trang_cong_khai: v25,
    v26_hoc_phi: v26,
    v27_dang_ky: v27,
    v27b_mssv: v27b,
    v27c_khoa_ds: v27c,
    v27d_duyet_tung_khoa: v27d,
    v28_sao_luu_loi_khach: v28a && v28b,
    v29_nhieu_khoa: v29,
    ten_mien_rieng: TEN_MIEN_RIENG || null
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
  const b64 = function (s) { return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(s))); };
  const meta = [
    'name ' + b64(ten),
    'requiresignedurls',
    'allowedorigins ' + b64(nguonStream(request).join(',')),
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
