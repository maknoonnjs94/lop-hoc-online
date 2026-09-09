/* Dựng web/_test_index.html — bản sao của trang học sinh viên, nhưng Supabase được thay
   bằng một bản giả chạy ngay trong trình duyệt. Không cần mạng, không cần đăng nhập,
   không đụng vào dữ liệu thật. Dữ liệu chỉ nằm trong bộ nhớ: tải lại trang là về như cũ.

   Chạy: node tao-ban-thu.js   (hoặc bấm đúp chay-thu.cmd, nó tự chạy file này) */
const fs = require('fs'), path = require('path');
const web = path.join(__dirname, '..', 'web');

let h = fs.readFileSync(path.join(web, 'index.html'), 'utf8');

const stub = `<script>
(function(){
  var P = new URLSearchParams(location.search), now = Date.now(), d = function(ms){ return new Date(now + ms).toISOString(); };
  var g = P.get('g') || 'nu', onb = P.get('onb') === '1';
  var profile = { id:'u1', full_name: onb ? '' : (g === 'nu' ? 'Nguyễn Minh Anh' : 'Trần Quốc Bảo'), role:'student', active:true, gender: onb ? '' : g, theme:'', major: onb ? '' : 'Hóa dược', birth_year: onb ? null : 2005, student_no:'23001234', must_change_pw: onb, onboarded_at: onb ? null : d(-30*864e5) };
  var classes = [{ id:'c1', name:'Hóa phân tích K68', subject:'Hóa phân tích', archived:false, notice:'Tuần này học bù sáng thứ 7 (13/9). Mang máy tính cầm tay.' }];
  var sessions = [
    { id:'s1', class_id:'c1', no:5, title:'Chuẩn độ axit – bazơ', published:true, pinned:true, starts_at:d(2*36e5), held_on:null, note:'Đọc trước mục 5.2, làm câu 1–6 phiếu bài tập.', created_at:d(-2*864e5), materials:[
      { id:'m4', session_id:'s1', kind:'lecture', title:'Bài giảng: chỉ thị màu và điểm tương đương', order_no:0, created_at:d(-2*864e5) },
      { id:'m1', session_id:'s1', kind:'pdf', title:'Phiếu bài tập buổi 5', order_no:1, created_at:d(-36e5), nhan_bai:true, han_nop: P.get('han') === 'het' ? d(-864e5) : d(3*864e5) },
      { id:'m2', session_id:'s1', kind:'video', title:'Video: dựng đường cong chuẩn độ', order_no:2, created_at:d(-864e5), gioi_han_giay:3600 },
      { id:'m3', session_id:'s1', kind:'answer', title:'Đáp án phiếu 5', order_no:3, open_at:d(3*864e5), created_at:d(-36e5) } ] },
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
  var cauHoi = P.get('hoi') === 'trong' ? [] : [
    { id:'q1', material_id:'m1', user_id:'u1', noi_dung:'Chỗ điểm tương đương và điểm cuối chuẩn độ khác nhau thế nào ạ?', tao_luc:d(-5*36e5),
      tra_loi:'Điểm tương đương là điểm lý thuyết khi số mol vừa đủ; điểm cuối là lúc chỉ thị đổi màu, thường lệch một chút. Sai số đó gọi là sai số chỉ thị.', tra_luc: chuong ? bayGio : d(-4*36e5) },
    { id:'q2', material_id:'m1', user_id:'u1', noi_dung:'Cô ơi bài 3 em ra 0,12 M có đúng không ạ?', tao_luc:d(-36e5), tra_loi:null, tra_luc:null },
    { id:'q3', material_id:'m1', user_id:'u9', noi_dung:'Vì sao phải tráng buret bằng chính dung dịch chuẩn ạ?', tao_luc:d(-2*864e5),
      tra_loi:'Để nước còn đọng trong buret không pha loãng dung dịch chuẩn, làm nồng độ thực tế thấp hơn.', tra_luc:d(-2*864e5) }
  ];
  function q(data){ var o = {}; ['select','eq','order','maybeSingle','upsert','update','insert','not','is','in','limit','single'].forEach(function(k){ o[k] = function(){ return o; }; }); o.then = function(a, b){ return Promise.resolve({ data:data, error:null }).then(a, b); }; return o; }
  window.supabase = { createClient: function(){ return {
    auth: { getSession: function(){ return Promise.resolve({ data:{ session:{ user:{ id:'u1', email:'minhanh@vnu.edu.vn' } } } }); }, onAuthStateChange: function(){}, signOut: function(){ alert('Đây là bản thử — thật thì sẽ đăng xuất.'); return Promise.resolve({}); }, signInWithPassword: function(){ return Promise.resolve({ data:{ user:{ id:'u1', email:'minhanh@vnu.edu.vn' } }, error:null }); }, updateUser: function(){ return Promise.resolve({ data:{}, error:null }); }, resetPasswordForEmail: function(){ return Promise.resolve({ error:null }); } },
    from: function(t){ if (t === 'profiles') return q(profile); if (t === 'classes') return q(classes); if (t === 'sessions') return q(sessions); if (t === 'view_events') return q(views); if (t === 'bai_nop') return q(baiNop); if (t === 'cau_hoi') return q(cauHoi); if (t === 'material_contents') return q(P.get('st') === '1' ? { body:null, url:'stream:00000000000000000000000000000000', storage_path:null } : { body:'Nội dung thử nghiệm của tài liệu.', url:null, storage_path:null }); return q([]); },
    rpc: function(name, a){ if (name === 'hoan_tat_ho_so') { Object.assign(profile, { full_name:a.p_full_name, gender:a.p_gender, birth_year:a.p_birth_year, major:a.p_major, onboarded_at:new Date().toISOString(), theme: a.p_gender === 'nu' ? 'peach' : 'mint' }); } if (name === 'da_doi_mat_khau') profile.must_change_pw = false; if (name === 'dat_anh_dai_dien') profile.avatar_path = a.p_path;
      if (name === 'nop_bai') { baiNop = [{ material_id:a.p_material, nop_luc:new Date().toISOString(), loi_nhan:a.p_loi_nhan, tep:a.p_tep, cham_luc:null, diem:null, nhan_xet:'' }]; }
      if (name === 'rut_bai') baiNop = []; return Promise.resolve({ data:{ ok:true }, error:null }); },
    channel: function(){ var c = { on: function(){ return c; }, subscribe: function(){ return c; } }; return c; }, removeChannel: function(){},
    storage: { from: function(ten){ return { createSignedUrl: function(){ return Promise.resolve(ten === 'bainop' ? { data:null, error:{ message:'bản thử không có tệp thật' } } : { data:{ signedUrl: window.__anh || '' }, error:null }); }, upload: function(p, b){ window.__anh = URL.createObjectURL(b); return Promise.resolve({ data:{ path:p }, error:null }); }, remove: function(){ window.__anh = ''; return Promise.resolve({ data:[], error:null }); } }; } }
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
if (h.indexOf('window.supabase = {') < 0) throw new Error('Không thay được thẻ supabase trong web/index.html — kiểm lại địa chỉ script.');

fs.writeFileSync(path.join(web, '_test_index.html'), h);
console.log('Đã dựng web/_test_index.html —', h.length, 'ký tự.');
