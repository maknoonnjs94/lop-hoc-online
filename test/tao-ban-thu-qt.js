/* Dựng web/_test_quan-tri.html — bản sao trang quản trị với Supabase giả chạy trong trình duyệt.
   Khác bản của sinh viên ở chỗ: cái này có ghi thật vào bộ nhớ, nên bấm Lưu / Chấm / Trả lời
   là dữ liệu đổi luôn và tải lại tab thấy kết quả. Tắt trang là mất hết.

   Chạy: node tao-ban-thu-qt.js   (chay-thu.cmd tự chạy cả hai bản) */
const fs = require('fs'), path = require('path');
const web = path.join(__dirname, '..', 'web');

let h = fs.readFileSync(path.join(web, 'quan-tri.html'), 'utf8');

const stub = `<script>
(function(){
  var now = Date.now(), d = function(ms){ return new Date(now + ms).toISOString(); };
  var ID = 0, moiId = function(p){ return p + (++ID); };

  /* ---------------- kho dữ liệu giả, có thật trong bộ nhớ ---------------- */
  var DB = {
    profiles: [
      { id:'gv1', full_name:'Phạm Anh Ngọc', email:'gv@vnu.edu.vn', role:'admin', active:true },
      { id:'u1', full_name:'Nguyễn Minh Anh', email:'minhanh@vnu.edu.vn', role:'student', active:true, student_no:'23001234', gender:'nu', major:'Hóa dược', birth_year:2005, onboarded_at:d(-30*864e5), must_change_pw:false, avatar_path:'' },
      { id:'u2', full_name:'Trần Quốc Bảo', email:'quocbao@vnu.edu.vn', role:'student', active:true, student_no:'23001235', gender:'nam', major:'Hóa học', birth_year:2005, onboarded_at:d(-20*864e5), must_change_pw:false, avatar_path:'' },
      { id:'u3', full_name:'Lê Thu Hà', email:'thuha@vnu.edu.vn', role:'student', active:true, student_no:'23001236', gender:'nu', major:'Hóa dược', birth_year:2004, onboarded_at:null, must_change_pw:true, avatar_path:'' }
    ],
    classes: [{ id:'c1', name:'Hóa phân tích K68', subject:'Hóa phân tích', archived:false, notice:'Tuần này học bù sáng thứ 7 (13/9).', owner:'gv1', created_at:d(-60*864e5) }],
    sessions: [
      { id:'s1', class_id:'c1', no:5, title:'Chuẩn độ axit – bazơ', published:true, pinned:true, starts_at:d(2*36e5), held_on:null, note:'Đọc trước mục 5.2.', created_at:d(-2*864e5) },
      { id:'s2', class_id:'c1', no:4, title:'Cân bằng tạo phức', published:true, pinned:false, starts_at:null, held_on:'2026-09-01', note:'', created_at:d(-7*864e5) },
      { id:'s3', class_id:'c1', no:3, title:'Buổi nháp chưa mở', published:false, pinned:false, starts_at:null, held_on:null, note:'', created_at:d(-1*864e5) }
    ],
    materials: [
      { id:'m4', session_id:'s1', kind:'lecture', title:'Bài giảng: chỉ thị màu', order_no:0, open_at:null, created_at:d(-2*864e5), gioi_han_giay:0, nhan_bai:false, han_nop:null },
      { id:'m1', session_id:'s1', kind:'pdf', title:'Phiếu bài tập buổi 5', order_no:1, open_at:null, created_at:d(-36e5), gioi_han_giay:0, nhan_bai:true, han_nop:d(3*864e5) },
      { id:'m2', session_id:'s1', kind:'video', title:'Video: đường cong chuẩn độ', order_no:2, open_at:null, created_at:d(-864e5), gioi_han_giay:3600, nhan_bai:false, han_nop:null },
      { id:'m3', session_id:'s1', kind:'answer', title:'Đáp án phiếu 5', order_no:3, open_at:d(3*864e5), created_at:d(-36e5), gioi_han_giay:0, nhan_bai:false, han_nop:null },
      { id:'m5', session_id:'s2', kind:'pdf', title:'Phiếu bài tập buổi 4', order_no:1, open_at:null, created_at:d(-7*864e5), gioi_han_giay:0, nhan_bai:true, han_nop:d(-864e5) }
    ],
    material_contents: [
      { material_id:'m1', url:null, storage_path:'s1/phieu5.pdf', body:null },
      { material_id:'m2', url:'stream:0123456789abcdef0123456789abcdef', storage_path:null, body:null },
      { material_id:'m3', url:null, storage_path:null, body:'Đáp án thử nghiệm.' },
      { material_id:'m4', url:null, storage_path:'s1/baigiang.pdf', body:null },
      { material_id:'m5', url:null, storage_path:'s2/phieu4.pdf', body:null }
    ],
    enrollments: [
      { class_id:'c1', student:'u1', joined_at:d(-30*864e5) },
      { class_id:'c1', student:'u2', joined_at:d(-30*864e5) },
      { class_id:'c1', student:'u3', joined_at:d(-5*864e5) }
    ],
    view_events: [
      { user_id:'u1', class_id:'c1', material_id:'m2', session_id:'s1', last_at:d(-36e5), opens:2, progress:{ seconds:900, duration:1500 }, tong_giay:2100, quy_them:0 },
      { user_id:'u2', class_id:'c1', material_id:'m2', session_id:'s1', last_at:d(-2*36e5), opens:5, progress:{ seconds:1500, duration:1500 }, tong_giay:3600, quy_them:0 },
      { user_id:'u1', class_id:'c1', material_id:'m1', session_id:'s1', last_at:d(-4*36e5), opens:1, progress:{ page:3, pages:3, done:true }, tong_giay:0, quy_them:0 }
    ],
    screenshot_events: [
      { id:'e1', user_id:'u2', kind:'printscreen', material_id:'m1', material_title:'Phiếu bài tập buổi 5', at:d(-6*36e5), ua:'Mozilla/5.0 LopHocApp/1.0.16' }
    ],
    device_bindings: [{ user_id:'u1', device_id:'app:abc123', bound_at:d(-10*864e5) }],
    dung_luong_thang: [{ thang: new Date().toISOString().slice(0,7), giay_phat: 74000 }],
    bai_nop: [
      { id:'b1', material_id:'m1', user_id:'u1', loi_nhan:'Em chưa chắc câu 4 ạ.', tep:[{ path:'m1/u1/bai-lam.jpg', ten:'bai-lam.jpg', co:820000 }], nop_luc:d(-2*36e5), cham_luc:null, diem:null, nhan_xet:'' },
      { id:'b2', material_id:'m1', user_id:'u2', loi_nhan:'', tep:[{ path:'m1/u2/trang1.jpg', ten:'trang1.jpg', co:640000 },{ path:'m1/u2/trang2.jpg', ten:'trang2.jpg', co:610000 }], nop_luc:d(-5*36e5), cham_luc:d(-36e5), diem:'9', nhan_xet:'Trình bày sạch, chuẩn.' },
      { id:'b3', material_id:'m5', user_id:'u2', loi_nhan:'Em nộp muộn ạ.', tep:[{ path:'m5/u2/bai4.pdf', ten:'bai4.pdf', co:1200000 }], nop_luc:d(-3*864e5), cham_luc:null, diem:null, nhan_xet:'' }
    ],
    cau_hoi: [
      { id:'q1', material_id:'m1', user_id:'u1', noi_dung:'Chỗ điểm tương đương và điểm cuối chuẩn độ khác nhau thế nào ạ?', tao_luc:d(-5*36e5), tra_loi:null, tra_luc:null, an:false },
      { id:'q2', material_id:'m2', user_id:'u2', noi_dung:'Phút 12 của video cô viết nhầm số 0,1 thành 0,01 phải không ạ?', tao_luc:d(-2*36e5), tra_loi:null, tra_luc:null, an:false },
      { id:'q3', material_id:'m1', user_id:'u3', noi_dung:'Vì sao phải tráng buret bằng chính dung dịch chuẩn ạ?', tao_luc:d(-2*864e5), tra_loi:'Để nước còn đọng không pha loãng dung dịch chuẩn.', tra_luc:d(-1*864e5), an:false }
    ]
  };
  var TEN = {}; DB.profiles.forEach(function (p) { TEN[p.id] = p; });

  /* ---------------- máy truy vấn giả ---------------- */
  function hop(r) { return JSON.parse(JSON.stringify(r)); }
  function khop(r, dk) { return dk.every(function (c) { return String(r[c[0]]) === String(c[1]); }); }
  function doc(ten, dk) {
    var rows = (DB[ten] || []).filter(function (r) { return khop(r, dk); }).map(hop);
    if (ten === 'sessions') rows.forEach(function (s) {
      s.materials = DB.materials.filter(function (m) { return m.session_id === s.id; }).map(hop);
    });
    if (ten === 'enrollments') rows.forEach(function (e) { e.profiles = hop(TEN[e.student] || {}); });
    if (ten === 'screenshot_events') rows.forEach(function (e) { e.profiles = hop(TEN[e.user_id] || {}); });
    return rows;
  }
  function ghi(ten, dk, hd, tai) {
    var kho = DB[ten] = DB[ten] || [];
    if (hd === 'insert' || (hd === 'upsert' && ten === 'material_contents')) {
      var ds = [].concat(tai), ra = [];
      ds.forEach(function (r) {
        r = hop(r);
        if (ten === 'material_contents') {
          var cu = kho.filter(function (x) { return x.material_id === r.material_id; })[0];
          if (cu) { Object.assign(cu, r); ra.push(hop(cu)); return; }
        }
        if (!r.id && ten !== 'enrollments' && ten !== 'material_contents' && ten !== 'view_events') r.id = moiId(ten.slice(0, 2));
        kho.push(r); ra.push(hop(r));
      });
      return ra;
    }
    if (hd === 'update') {
      var sua = kho.filter(function (r) { return khop(r, dk); });
      sua.forEach(function (r) { Object.assign(r, hop(tai)); });
      return sua.map(hop);
    }
    if (hd === 'delete') {
      var giu = kho.filter(function (r) { return !khop(r, dk); });
      DB[ten] = giu;
      return [];
    }
    return [];
  }
  function truyVan(ten) {
    var dk = [], hd = null, tai = null, mot = false, sapXep = null;
    var o = {};
    ['limit','range','is','in','not','neq','gte','lte','filter','contains','abortSignal','returns'].forEach(function (k) { o[k] = function () { return o; }; });
    o.select = function () { return o; };
    o.order = function (c, x) { sapXep = [c, !x || x.ascending !== false]; return o; };
    o.eq = function (c, v) { dk.push([c, v]); return o; };
    o.insert = function (r) { hd = 'insert'; tai = r; return o; };
    o.update = function (r) { hd = 'update'; tai = r; return o; };
    o.upsert = function (r) { hd = 'upsert'; tai = r; return o; };
    o.delete = function () { hd = 'delete'; return o; };
    o.single = function () { mot = true; return o; };
    o.maybeSingle = function () { mot = true; return o; };
    o.then = function (a, b) {
      var rows = hd ? ghi(ten, dk, hd, tai) : doc(ten, dk);
      if (sapXep && !hd) rows.sort(function (x, y) {
        var p = x[sapXep[0]], q2 = y[sapXep[0]];
        if (p == null) p = ''; if (q2 == null) q2 = '';
        return (p < q2 ? -1 : p > q2 ? 1 : 0) * (sapXep[1] ? 1 : -1);
      });
      var data = mot ? (rows[0] || null) : rows;
      return Promise.resolve({ data: data, error: null, count: rows.length }).then(a, b);
    };
    return o;
  }

  /* ---------------- các hàm RPC ---------------- */
  function rpcChay(ten, a) {
    a = a || {};
    if (ten === 'bang_bai_nop') {
      var ra = [];
      DB.materials.filter(function (m) { return m.nhan_bai; }).forEach(function (m) {
        var s = DB.sessions.filter(function (x) { return x.id === m.session_id; })[0] || {};
        if (s.class_id !== a.p_class) return;
        DB.enrollments.filter(function (e) { return e.class_id === a.p_class; }).forEach(function (e) {
          var p = TEN[e.student] || {}, b = DB.bai_nop.filter(function (x) { return x.material_id === m.id && x.user_id === e.student; })[0];
          ra.push({ material_id:m.id, tai_lieu:m.title, session_no:s.no, buoi:s.title || ('Buổi ' + s.no), han_nop:m.han_nop,
            user_id:p.id, ho_ten:p.full_name, email:p.email,
            bai_id: b ? b.id : null, nop_luc: b ? b.nop_luc : null, loi_nhan: b ? b.loi_nhan : null, tep: b ? b.tep : null,
            cham_luc: b ? b.cham_luc : null, diem: b ? b.diem : null, nhan_xet: b ? b.nhan_xet : null });
        });
      });
      return ra;
    }
    if (ten === 'bang_cau_hoi') {
      return DB.cau_hoi.map(function (c) {
        var m = DB.materials.filter(function (x) { return x.id === c.material_id; })[0] || {};
        var s = DB.sessions.filter(function (x) { return x.id === m.session_id; })[0] || {};
        var p = TEN[c.user_id] || {};
        return { id:c.id, material_id:c.material_id, tai_lieu:m.title, buoi:s.title || ('Buổi ' + s.no),
          ho_ten:p.full_name, email:p.email, noi_dung:c.noi_dung, tao_luc:c.tao_luc, tra_loi:c.tra_loi, tra_luc:c.tra_luc, an:c.an };
      }).filter(function (x) {
        var m = DB.materials.filter(function (y) { return y.id === x.material_id; })[0] || {};
        var s = DB.sessions.filter(function (y) { return y.id === m.session_id; })[0] || {};
        return s.class_id === a.p_class;
      }).sort(function (x, y) { return (!!x.tra_loi) - (!!y.tra_loi) || (x.tao_luc < y.tao_luc ? 1 : -1); });
    }
    if (ten === 'cham_bai') {
      var b = DB.bai_nop.filter(function (x) { return x.id === a.p_id; })[0];
      if (!b) return { ok:false, reason:'khong_thay' };
      var diem = String(a.p_diem || '').trim(), nx = String(a.p_nhan_xet || '').trim();
      b.diem = diem || null; b.nhan_xet = a.p_nhan_xet || '';
      b.cham_luc = (!diem && !nx) ? null : new Date().toISOString();
      return { ok:true };
    }
    if (ten === 'tra_loi_cau_hoi') {
      var c = DB.cau_hoi.filter(function (x) { return x.id === a.p_id; })[0];
      if (!c) return { ok:false, reason:'khong_thay' };
      var t = String(a.p_tra_loi || '').trim();
      c.tra_loi = t || null; c.tra_luc = t ? new Date().toISOString() : null;
      if (a.p_an != null) c.an = !!a.p_an;
      return { ok:true };
    }
    if (ten === 'enroll_by_email') {
      var p2 = DB.profiles.filter(function (x) { return x.email === a.p_email; })[0];
      if (!p2) return { ok:false, reason:'khong_thay_tai_khoan' };
      if (!DB.enrollments.some(function (e) { return e.class_id === a.p_class && e.student === p2.id; }))
        DB.enrollments.push({ class_id:a.p_class, student:p2.id, joined_at:new Date().toISOString() });
      return { ok:true };
    }
    if (ten === 'reset_device') { DB.device_bindings = DB.device_bindings.filter(function (x) { return x.user_id !== a.p_user; }); return { ok:true }; }
    if (ten === 'noi_quy_xem') {
      var v = DB.view_events.filter(function (x) { return x.user_id === a.p_user && x.material_id === a.p_material; })[0];
      if (v) v.quy_them = (Number(v.quy_them) || 0) + (Number(a.p_phut) || 0) * 60;
      return { ok:true };
    }
    return { ok:true };
  }

  /* ---------------- kho tệp giả ---------------- */
  var KHO = {
    tailieu: [
      { name:'s1', id:null }, { name:'s2', id:null }
    ],
    tailieu_s1: [
      { name:'phieu5.pdf', id:'f1', metadata:{ size: 1240000 } },
      { name:'baigiang.pdf', id:'f2', metadata:{ size: 3400000 } }
    ],
    tailieu_s2: [{ name:'phieu4.pdf', id:'f3', metadata:{ size: 980000 } }],
    avatars: [{ name:'u1.jpg', id:'a1', metadata:{ size: 42000 } }]
  };

  /* ---------------- Worker giả ---------------- */
  var fetchThat = window.fetch.bind(window);
  window.fetch = function (u, o) {
    var s = String(u && u.url ? u.url : u);
    if (s.indexOf('/api/') < 0) return fetchThat(u, o);
    var body = {}; try { body = JSON.parse((o && o.body) || '{}'); } catch (e) {}
    var tra = { ok:true };
    if (s.indexOf('/api/stream/danh-sach') >= 0) tra = { ok:true, videos:[
      { uid:'0123456789abcdef0123456789abcdef', ten:'Video: đường cong chuẩn độ', giay:1500, san_sang:true, pct:100, ky:'2026-09-01', ngay:'2026-09-01', kich_thuoc: 310000000, anh:'' },
      { uid:'abcdef0123456789abcdef0123456789', ten:'Buổi 1 - Nồng độ', giay:2700, san_sang:true, pct:100, ky:'2026-08-20', ngay:'2026-08-20', kich_thuoc: 520000000, anh:'' }
    ] };
    if (s.indexOf('/api/tao-tai-khoan') >= 0) tra = { ok:true, email: body.email, mat_khau:'Thu1234@', da_co:false };
    if (s.indexOf('/api/cap-lai-mat-khau') >= 0) tra = { ok:true, mat_khau:'Moi5678@' };
    return Promise.resolve({ ok:true, status:200, json: function () { return Promise.resolve(tra); } });
  };

  /* ---------------- Supabase giả ---------------- */
  window.supabase = { createClient: function () { return {
    auth: {
      getSession: function () { return Promise.resolve({ data:{ session:{ access_token:'gia', user:{ id:'gv1', email:'gv@vnu.edu.vn' } } } }); },
      onAuthStateChange: function () {},
      signInWithPassword: function () { return Promise.resolve({ data:{ user:{ id:'gv1', email:'gv@vnu.edu.vn' } }, error:null }); },
      signOut: function () { alert('Đây là bản thử — thật thì sẽ đăng xuất.'); return Promise.resolve({}); }
    },
    from: truyVan,
    rpc: function (ten, a) { return Promise.resolve({ data: rpcChay(ten, a), error: null }); },
    channel: function () { var c = { on: function () { return c; }, subscribe: function () { return c; } }; return c; },
    removeChannel: function () {},
    storage: { from: function (kho) { return {
      list: function (duong) {
        var k = duong ? kho + '_' + duong : kho;
        return Promise.resolve({ data: KHO[k] || [], error: null });
      },
      createSignedUrl: function () { return Promise.resolve({ data:null, error:{ message:'bản thử tại máy không có tệp thật' } }); },
      upload: function (p) { return Promise.resolve({ data:{ path:p }, error:null }); },
      remove: function () { return Promise.resolve({ data:[], error:null }); }
    }; } }
  }; } };

  /* dải nhắc ở góc */
  document.addEventListener('DOMContentLoaded', function () {
    var n = document.createElement('div');
    n.textContent = 'BẢN THỬ QUẢN TRỊ · dữ liệu giả';
    n.setAttribute('style', 'position:fixed;bottom:10px;right:12px;z-index:99999;pointer-events:none;'
      + 'background:#1f2937;color:#fff;font:700 11px/1 system-ui;letter-spacing:.04em;padding:7px 11px;border-radius:99px;opacity:.75');
    document.body.appendChild(n);
  });
})();
</script>`;

h = h.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/dist\/umd\/supabase\.js"><\/script>/, stub);
if (h.indexOf('window.supabase = {') < 0) throw new Error('Không thay được thẻ supabase trong web/quan-tri.html.');

fs.writeFileSync(path.join(web, '_test_quan-tri.html'), h);
console.log('Đã dựng web/_test_quan-tri.html —', h.length, 'ký tự.');
