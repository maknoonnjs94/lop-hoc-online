/* Dựng web/_test_hoc.html — bản sao của trang học sinh viên (web/hoc.html), nhưng Supabase được thay
   bằng một bản giả chạy ngay trong trình duyệt. Không cần mạng, không cần đăng nhập,
   không đụng vào dữ liệu thật. Dữ liệu chỉ nằm trong bộ nhớ: tải lại trang là về như cũ.

   Chạy: node tao-ban-thu.js   (hoặc bấm đúp chay-thu.cmd, nó tự chạy file này) */
const fs = require('fs'), path = require('path');
const web = path.join(__dirname, '..', 'web');

let h = fs.readFileSync(path.join(web, 'hoc.html'), 'utf8');

const stub = `<script>
(function(){
  var P = new URLSearchParams(location.search), now = Date.now(), d = function(ms){ return new Date(now + ms).toISOString(); };
  var g = P.get('g') || 'nu', onb = P.get('onb') === '1';
  /* Từ 11/9: học chỉ trong app. Bản thử giả lập app (mã máy giả) để vào được lớp; ?web=1 = như mở bằng trình duyệt → màn "cần app". */
  if (P.get('web') !== '1') window.lopHocApp = { getMachineId: function(){ return Promise.resolve('thu-may-' + g); } };
  /* ?o=1 — phiếu buổi 5 có sẵn 4 ô trả lời đặt trên PDF, máy chấm đúng/sai */
  var coO = P.get('o') === '1';
  /* toạ độ khoanh trên phiếu mẫu web/_test_phieu.png (794×1123) */
  /* Đo thẳng trên trang PDF đã vẽ: quét các nét gạch chân rồi quy ra phần trăm. */
  var O_PHIEU = [{ id:'oa', trang:1, x:29.3, y:18.0, w:18.2, h:2.4 },{ id:'ob', trang:1, x:15.0, y:25.9, w:18.2, h:2.4 },{ id:'oc', trang:1, x:15.0, y:33.8, w:11.4, h:2.4 },{ id:'od', trang:1, x:15.0, y:41.7, w:11.4, h:2.4 }];
  /* od: đáp án dạng khoa học — gõ 1,74×10⁻⁵ hay 1.74e-5 hay 0,0000174 đều phải 'dung' */
  var DAP_AN = { oa:{ dap_an:'0,08', sai_so:0.001 }, ob:{ dap_an:'phenolphtalein|phenolphthalein' }, oc:{ dap_an:'H2SO4' }, od:{ dap_an:'1,74×10⁻⁵' } };
  /* Bản giả của chuan_dap / so_khoa_hoc (schema_v24): hiểu ⁻ ⁺ × · và mọi kiểu viết a×10^b */
  function chuanDap(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[₀-₉]/g, function (c) { return String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)); })
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { return String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)); })
      .replace(/,/g, '.').replace(/[⁻−]/g, '-').replace(/⁺/g, '+').replace(/[×·⋅]/g, '*').replace(/\\s+/g, '');
  }
  function soKhoaHoc(s) {
    if (!s) return null;
    if (/^-?[0-9]+(\\.[0-9]+)?$/.test(s)) return parseFloat(s);
    var m = /^(-?[0-9]+(?:\\.[0-9]+)?)?\\*?(?:10\\^?\\(?(-?[0-9]+)\\)?|e(-?[0-9]+))$/.exec(s);
    if (!m) return null;
    return (m[1] ? parseFloat(m[1]) : 1) * Math.pow(10, parseInt(m[2] != null ? m[2] : m[3], 10));
  }
  function chamMotO(sv, dung, ss) {
    var a = chuanDap(sv), b = chuanDap(dung);
    if (!a) return 'sai';
    if (String(dung).indexOf('|') >= 0 && String(dung).split('|').some(function (t) { return chuanDap(t) === a; })) return 'dung';
    if (a === b) return 'dung';
    var x = soKhoaHoc(a), y = soKhoaHoc(b);
    if (x != null && y != null) {
      var s2 = Math.max(ss || 0, Math.abs(y) * 0.005);
      if (Math.abs(x - y) <= s2) return 'dung';
      if (y !== 0 && Math.abs(x - y) <= Math.max(s2 * 5, Math.abs(y) * 0.02)) return 'gan';
      return 'sai';
    }
    return a.replace(/[^a-z0-9]/g, '') === b.replace(/[^a-z0-9]/g, '') ? 'gan' : 'sai';
  }

  var profile = { id:'u1', full_name: onb ? '' : (g === 'nu' ? 'Nguyễn Minh Anh' : 'Trần Quốc Bảo'), role:'student', active:true, gender: onb ? '' : g, theme:'', major: onb ? '' : 'Hóa dược', birth_year: onb ? null : 2005, student_no:'23001234', must_change_pw: onb, onboarded_at: onb ? null : d(-30*864e5) };
  var classes = [{ id:'c1', name:'Hóa phân tích K68', subject:'Hóa phân tích', archived:false, notice:'Tuần này học bù sáng thứ 7 (13/9). Mang máy tính cầm tay.' }];
  /* ?hp=chua_han|qua_han|da_dong|bao — học phí lớp c1 (v26); ?lop2=1 thêm lớp c2 không thu để thấy khoá theo từng lớp */
  var hpKieu = P.get('hp') || '';
  if (P.get('lop2') === '1') classes.push({ id:'c2', name:'Hóa hữu cơ K68', subject:'Hóa hữu cơ', archived:false, notice:'' });
  function ngayCong(n){ var t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); }
  var hpDong = { class_id:'c1', ten:'Hóa phân tích K68', hoc_phi:1500000, han: hpKieu === 'qua_han' ? ngayCong(-3) : ngayCong(5), da_dong_at: hpKieu === 'da_dong' ? d(-864e5) : null, so_tien: hpKieu === 'da_dong' ? 1500000 : null, mien:false, bao_chuyen_at: hpKieu === 'bao' ? d(-36e5) : null, trang_thai: hpKieu === 'da_dong' ? 'da_dong' : (hpKieu === 'qua_han' ? 'qua_han' : 'chua_han'), mssv:'23001234', ngan_hang:{ bin:'970422', ma:'MB', ten_nh:'MB Bank', stk:'0123456789', ten_tk:'PHAM ANH NGOC', co_qr_anh:false } };
  var sessions = [
    { id:'s1', class_id:'c1', no:5, title:'Chuẩn độ axit – bazơ', published:true, pinned:true, starts_at:d(2*36e5), held_on:null, note:'Đọc trước mục 5.2, làm câu 1–6 phiếu bài tập.', created_at:d(-2*864e5), materials:[
      { id:'m4', session_id:'s1', kind:'lecture', title:'Bài giảng: chỉ thị màu và điểm tương đương', order_no:0, created_at:d(-2*864e5) },
      { id:'m1', session_id:'s1', kind:'pdf', title:'Phiếu bài tập buổi 5', order_no:1, created_at:d(-36e5), nhan_bai:true, han_nop: P.get('han') === 'het' ? d(-864e5) : (P.get('han') === 'gap' ? d(2*36e5) : d(3*864e5)), o_tra_loi: coO ? O_PHIEU : [], cho_tai: P.get('tai') === '1' },
      { id:'m2', session_id:'s1', kind:'video', title:'Video: dựng đường cong chuẩn độ', order_no:2, created_at:d(-864e5), gioi_han_giay:3600 },
      { id:'m3', session_id:'s1', kind:'answer', title:'Đáp án phiếu 5', order_no:3, open_at: P.get('mo') === '1' ? null : d(3*864e5), created_at:d(-36e5), cho_tai:true } ] },
    { id:'s2', class_id:'c1', no:4, title:'Cân bằng tạo phức', published:true, pinned:false, held_on:'2026-09-01', created_at:d(-7*864e5), materials:[
      { id:'m5', session_id:'s2', kind:'pdf', title:'Phiếu bài tập buổi 4', order_no:1, created_at:d(-7*864e5) },
      { id:'m6', session_id:'s2', kind:'text', title:'Ghi chú nhanh: hằng số bền', order_no:2, created_at:d(-7*864e5) } ] },
    { id:'s3', class_id:'c1', no:3, title:'Cân bằng axit – bazơ trong dung dịch', published:true, pinned:false, held_on:'2026-08-25', created_at:d(-14*864e5), materials:[
      { id:'m7', session_id:'s3', kind:'pdf', title:'Phiếu bài tập buổi 3', order_no:1, created_at:d(-14*864e5) } ] } ];
  var views = [
    { material_id:'m2', session_id:'s1', last_at:d(-36e5), opens:2, progress:{ seconds:600, duration:1500 }, tong_giay: P.get('quy') === 'het' ? 3600 : 900 },
    { material_id:'m5', session_id:'s2', last_at:d(-6*864e5), opens:1, progress:{ page:3, pages:3, done:true } },
    { material_id:'m7', session_id:'s3', last_at:d(-10*864e5), opens:1, progress:{ page:1, pages:2 } } ];
  /* ?het=1: mọi tài liệu đang mở đều đã xem xong → xem màn hình "đã xong hết" */
  if (P.get('het') === '1') { views = []; sessions.forEach(function (s) { s.materials.forEach(function (m) { if (!m.open_at) views.push({ material_id: m.id, session_id: s.id, last_at: d(-36e5), opens: 1, progress: { done: true, page: 2, pages: 2 } }); }); }); }
  /* ?trong=1: lớp chưa có buổi nào → xem màn hình trống của sinh viên mới vào lớp */
  if (P.get('trong') === '1') { sessions = []; views = []; classes[0].notice = ''; }
  /* ?nop=roi đã nộp chưa chấm · ?nop=cham đã chấm · ?han=het quá hạn */
  var chuong = P.get('chuong') === '1', bayGio = new Date().toISOString();
  var nop = chuong ? 'cham' : P.get('nop'), baiNop = [];
  if (nop === 'roi' || nop === 'cham') baiNop = [{ material_id:'m1', nop_luc:d(-2*36e5), loi_nhan:'Em chưa chắc câu 4 ạ.',
    tep:[{ path:'m1/u1/bai-lam.jpg', ten:'bai-lam.jpg', co:820000 }],
    cham_luc: nop === 'cham' ? (chuong ? bayGio : d(-36e5)) : null, diem: nop === 'cham' ? '8,5' : null,
    nhan_xet: nop === 'cham' ? 'Câu 4 sai dấu khi cân bằng, còn lại tốt. Xem lại mục 5.2 nhé.' : '' }];
  /* ?hoi=trong không câu nào · ?hoi=chuaghim chưa ghim câu thường gặp nào */
  var hoiCh = P.get('hoi'), cauHoi = hoiCh === 'trong' ? [] : [
    /* --- mục Câu hỏi thường gặp: giảng viên ghim, không gắn tài liệu nào --- */
    { id:'f1', material_id:null, class_id:'c1', user_id:'gv', ghim:true, ghim_stt:1, chu_de:'Bài tập & nộp bài',
      noi_dung:'Nộp bài muộn có bị trừ điểm không ạ?', tao_luc:d(-20*864e5),
      tra_loi:'Quá hạn thì hệ thống vẫn nhận nhưng đánh dấu là nộp muộn. Muộn dưới một ngày cô không trừ; muộn hơn thì nhắn cho cô biết lý do trước khi nộp.', tra_luc:d(-20*864e5) },
    { id:'f2', material_id:null, class_id:'c1', user_id:'gv', ghim:true, ghim_stt:2, chu_de:'Bài tập & nộp bài',
      noi_dung:'Em nộp nhầm ảnh thì làm sao ạ?', tao_luc:d(-19*864e5),
      tra_loi:'Bấm Rút bài rồi nộp lại, miễn là cô chưa chấm. Cô chấm rồi thì nhắn cho cô.', tra_luc:d(-19*864e5) },
    { id:'f3', material_id:null, class_id:'c1', user_id:'gv', ghim:true, ghim_stt:3, chu_de:'Video bài giảng',
      noi_dung:'Video xem lại được mấy lần ạ?', tao_luc:d(-18*864e5),
      tra_loi:'Mỗi video có một quỹ giờ xem. Xem hết quỹ mà vẫn cần xem lại thì nhắn cô, cô nới thêm cho.', tra_luc:d(-18*864e5) },
    { id:'f4', material_id:'m1', class_id:'c1', user_id:'u9', ghim:true, ghim_stt:4, chu_de:'Thi cử',
      noi_dung:'Cuối kỳ có thi phần chuẩn độ tạo phức không ạ?', tao_luc:d(-9*864e5),
      tra_loi:'Có, trọng số khoảng 20%. Đề bám sát phiếu bài tập buổi 4 và buổi 5.', tra_luc:d(-8*864e5) },

    /* --- câu hỏi chung của lớp, chưa ghim --- */
    { id:'q0', material_id:null, class_id:'c1', user_id:'u1', ghim:false,
      noi_dung:'Buổi bù sáng thứ 7 học ở phòng nào ạ?', tao_luc:d(-3*36e5), tra_loi:null, tra_luc:null },

    /* --- hỏi dưới từng phiếu --- */
    { id:'q1', material_id:'m1', class_id:'c1', user_id:'u1', ghim:false, noi_dung:'Chỗ điểm tương đương và điểm cuối chuẩn độ khác nhau thế nào ạ?', tao_luc:d(-5*36e5),
      tra_loi:'Điểm tương đương là điểm lý thuyết khi số mol vừa đủ; điểm cuối là lúc chỉ thị đổi màu, thường lệch một chút. Sai số đó gọi là sai số chỉ thị.', tra_luc: chuong ? bayGio : d(-4*36e5) },
    { id:'q2', material_id:'m1', class_id:'c1', user_id:'u1', ghim:false, noi_dung:'Cô ơi bài 3 em ra 0,12 M có đúng không ạ?', tao_luc:d(-36e5), tra_loi:null, tra_luc:null },
    { id:'q3', material_id:'m1', class_id:'c1', user_id:'u9', ghim:false, noi_dung:'Vì sao phải tráng buret bằng chính dung dịch chuẩn ạ?', tao_luc:d(-2*864e5),
      tra_loi:'Để nước còn đọng trong buret không pha loãng dung dịch chuẩn, làm nồng độ thực tế thấp hơn.', tra_luc:d(-2*864e5) },
    { id:'q4', material_id:'m2', class_id:'c1', user_id:'u9', ghim:false, noi_dung:'Phút 12 video cô viết 0,1 hay 0,01 ạ, em nhìn không rõ.', tao_luc:d(-30*36e5),
      tra_loi:'0,01 M nhé. Cô sẽ ghi đè lại chú thích ở bản sau.', tra_luc:d(-29*36e5) },
    { id:'q5', material_id:'m5', class_id:'c1', user_id:'u9', ghim:false, noi_dung:'Hằng số bền điều kiện khác hằng số bền ở chỗ nào ạ?', tao_luc:d(-6*864e5), tra_loi:null, tra_luc:null }
  ];
  if (hoiCh === 'chuaghim') cauHoi = cauHoi.filter(function (c) { return !c.ghim; });
  var hoiSo = 0;
  /* cau_hoi: gửi câu hỏi mới thì phải thấy nó xuất hiện thật, không thì không thử được luồng */
  function qHoi(){
    var o = q(cauHoi);
    o.insert = function (row) {
      cauHoi.unshift(Object.assign({ id:'qz' + (++hoiSo), class_id:'c1', material_id:null, ghim:false,
        tao_luc:new Date().toISOString(), tra_loi:null, tra_luc:null }, row));
      return q(null);
    };
    return o;
  }
  function q(data){ var o = {}; ['select','eq','order','maybeSingle','upsert','update','insert','not','is','in','limit','single'].forEach(function(k){ o[k] = function(){ return o; }; }); o.then = function(a, b){ return Promise.resolve({ data:data, error:null }).then(a, b); }; return o; }
  window.supabase = { createClient: function(){ return {
    auth: { getSession: function(){ return Promise.resolve({ data:{ session:{ user:{ id:'u1', email:'minhanh@vnu.edu.vn' } } } }); }, onAuthStateChange: function(){}, signOut: function(){ alert('Đây là bản thử — thật thì sẽ đăng xuất.'); return Promise.resolve({}); }, signInWithPassword: function(){ return Promise.resolve({ data:{ user:{ id:'u1', email:'minhanh@vnu.edu.vn' } }, error:null }); }, updateUser: function(){ return Promise.resolve({ data:{}, error:null }); }, resetPasswordForEmail: function(){ return Promise.resolve({ error:null }); } },
    from: function(t){ if (t === 'profiles') return q(profile); if (t === 'classes') return q(classes); if (t === 'sessions') return q(sessions); if (t === 'view_events') return q(views); if (t === 'bai_nop') return q(baiNop); if (t === 'cau_hoi') return qHoi(); if (t === 'trang_cong_khai') return q({ noi_dung:{ zalo:'0912 345 678' } }); if (t === 'sessions' && hpKieu === 'qua_han' && false) return q([]); if (t === 'material_contents') return q(P.get('st') === '1' ? { body:null, url:'stream:00000000000000000000000000000000', storage_path:null } : (coO ? { body:null, url:null, storage_path:'phieu5.pdf' } : { body:'Nội dung thử nghiệm của tài liệu.', url:null, storage_path:null })); return q([]); },
    rpc: function(name, a){ if (name === 'hoan_tat_ho_so') { Object.assign(profile, { full_name:a.p_full_name, gender:a.p_gender, birth_year:a.p_birth_year, major:a.p_major, onboarded_at:new Date().toISOString(), theme: a.p_gender === 'nu' ? 'peach' : 'mint' }); } if (name === 'da_doi_mat_khau') profile.must_change_pw = false; if (name === 'dat_anh_dai_dien') profile.avatar_path = a.p_path;
      if (name === 'nop_bai') { baiNop = [{ material_id:a.p_material, nop_luc:new Date().toISOString(), loi_nhan:a.p_loi_nhan, tep:a.p_tep, cham_luc:null, diem:null, nhan_xet:'' }]; }
      if (name === 'rut_bai') baiNop = [];
      if (name === 'hoc_phi_cua_toi') return Promise.resolve({ data: hpKieu ? [hpDong].concat(P.get('lop2') === '1' ? [{ class_id:'c2', ten:'Hóa hữu cơ K68', hoc_phi:0, han:null, trang_thai:'mien', mssv:'23001234', ngan_hang:null }] : []) : [], error:null });
      if (name === 'bao_da_chuyen') { hpDong.bao_chuyen_at = new Date().toISOString(); return Promise.resolve({ data:null, error:null }); }
      if (name === 'anh_qr_hoc_phi') return Promise.resolve({ data:'', error:null });
      if (name === 'nop_bai_o') {
        var ket = {}, dg = 0, gan = 0, soO = O_PHIEU.length;
        O_PHIEU.forEach(function (o) {
          var k = DAP_AN[o.id];
          var t = k ? chamMotO((a.p_tra_loi || {})[o.id], k.dap_an, k.sai_so) : 'chua';
          if (t === 'dung') dg++; if (t === 'gan') gan++;
          ket[o.id] = t;
        });
        baiNop = [{ material_id:a.p_material, nop_luc:new Date().toISOString(), loi_nhan:'', tep:[],
          tra_loi:a.p_tra_loi, chi_tiet:ket, may_cham:true, cham_luc:new Date().toISOString(),
          diem: dg + '/' + soO, nhan_xet:'' }];
        return Promise.resolve({ data:{ ok:true, so_o:soO, so_dung:dg, so_gan:gan, chi_tiet:ket }, error:null });
      } return Promise.resolve({ data:{ ok:true }, error:null }); },
    channel: function(){ var c = { on: function(){ return c; }, subscribe: function(){ return c; } }; return c; }, removeChannel: function(){},
    storage: { from: function(ten){ return { createSignedUrl: function(){ return Promise.resolve(ten === 'bainop' ? { data:null, error:{ message:'bản thử không có tệp thật' } } : (ten === 'tailieu' ? { data:{ signedUrl:'/_test_phieu.pdf' }, error:null } : { data:{ signedUrl: window.__anh || '' }, error:null })); }, upload: function(p, b){ window.__anh = URL.createObjectURL(b); return Promise.resolve({ data:{ path:p }, error:null }); }, remove: function(){ window.__anh = ''; return Promise.resolve({ data:[], error:null }); } }; } }
  }; } };
  /* dải nhắc nhỏ ở góc, để khỏi nhầm bản thử với bản thật; không chặn thao tác */
  document.addEventListener('DOMContentLoaded', function () {
    var n = document.createElement('div');
    n.textContent = 'BẢN THỬ TẠI MÁY · dữ liệu giả';
    n.setAttribute('style', 'position:fixed;top:8px;right:10px;z-index:99999;pointer-events:none;'
      + 'background:#1f2937;color:#fff;font:700 11px/1 system-ui;letter-spacing:.04em;'
      + 'padding:6px 10px;border-radius:99px;opacity:.72');
    document.body.appendChild(n);
  });
})();
</script>`;

h = h.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\/dist\/umd\/supabase\.js"><\/script>/, stub);
if (h.indexOf('window.supabase = {') < 0) throw new Error('Không thay được thẻ supabase trong web/hoc.html — kiểm lại địa chỉ script.');

fs.writeFileSync(path.join(web, '_test_hoc.html'), h);
console.log('Đã dựng web/_test_hoc.html —', h.length, 'ký tự.');
