/* =====================================================================
   CẦU NỐI SUPABASE CHO BẢN WEB CỦA SỔ BÀI TẬP
   -------------------------------------------------------------------
   Sổ Bài Tập vốn chạy trong khung Artifact của Claude và gọi ba thứ:
       claude.use('db')  ·  claude.use('downloads')  ·  claude.use('sample')
   File này dựng sẵn một window.claude giả có đúng ba thứ đó, nhưng:
       db        → bảng public.notebook trên Supabase (chỉ giáo viên, chỉ dữ liệu của mình)
       downloads → tải file thẳng bằng trình duyệt (Word, sao lưu chạy được ở mọi máy)
       sample    → null (không có AI; app tự hiện thông báo, các phần khác vẫn chạy)
   Nhờ vậy mã của app KHÔNG phải sửa một dòng nào.
   ===================================================================== */
(function () {
  'use strict';

  /* ---- CẤU HÌNH: hai giá trị công khai của dự án Supabase ---- */
  var SUPABASE_URL = 'https://euyrrodppbpnkmificbs.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_wYan8ql2gDukI261zLrXeA_fUCG9bnP';
  var TABLE = 'notebook';

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  var me = null;
  var dbResolve, dbReady = new Promise(function (r) { dbResolve = r; });

  /* ================= màn hình đăng nhập phủ toàn trang ================= */
  var css = document.createElement('style');
  css.textContent =
    '#sbtGate{position:fixed;inset:0;z-index:99999;background:#eef2f6;display:flex;align-items:center;justify-content:center;padding:16px;' +
    'font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1b2734}' +
    '#sbtGate.done{display:none}' +
    '#sbtGate .box{width:min(390px,100%);background:#fff;border:1px solid #dfe6ee;border-radius:14px;padding:20px;box-shadow:0 10px 40px rgba(16,32,48,.12)}' +
    '#sbtGate h1{margin:0 0 4px;font-size:19px}' +
    '#sbtGate p{margin:0 0 16px;font-size:13px;color:#6b7a8a}' +
    '#sbtGate label{display:block;margin-bottom:11px;font-size:12.5px;font-weight:600;color:#6b7a8a}' +
    '#sbtGate input{display:block;width:100%;margin-top:5px;padding:10px 12px;border:1px solid #dfe6ee;border-radius:9px;font:inherit;font-size:15px;background:#f5f7fa;color:#1b2734}' +
    '#sbtGate button{width:100%;padding:11px;border:0;border-radius:9px;background:#1888c9;color:#fff;font:inherit;font-weight:700;cursor:pointer}' +
    '#sbtGate button:disabled{opacity:.6;cursor:default}' +
    '#sbtGate .err{margin-top:10px;padding:9px 11px;border-radius:9px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;font-size:13px;display:none}' +
    '#sbtGate .err.show{display:block}' +
    '#sbtBadge{position:fixed;right:10px;bottom:10px;z-index:9999;padding:7px 13px;border:0;border-radius:999px;background:rgba(27,39,52,.9);color:#fff;' +
    'font:12px system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25)}' +
    '#sbtBadge:hover{background:#1b2734}' +
    '#sbtMenu{position:fixed;right:10px;bottom:50px;z-index:9999;min-width:210px;padding:6px;border-radius:12px;background:#fff;' +
    'border:1px solid #dfe6ee;box-shadow:0 14px 40px rgba(16,32,48,.22);font:13.5px system-ui,sans-serif;color:#1b2734}' +
    '#sbtMenu[hidden]{display:none}' +
    '#sbtMenu .who{padding:7px 10px 9px;font-size:11.5px;color:#6b7a8a;border-bottom:1px solid #eef2f6;margin-bottom:4px;word-break:break-all}' +
    '#sbtMenu a,#sbtMenu button{display:block;width:100%;text-align:left;padding:9px 10px;border:0;border-radius:8px;background:none;' +
    'color:inherit;font:inherit;cursor:pointer;text-decoration:none}' +
    '#sbtMenu a:hover,#sbtMenu button:hover{background:#f1f5f9}' +
    '#sbtMenu button.out{color:#c0392b}' +
    '@media print{#sbtBadge,#sbtMenu,#sbtSend{display:none!important}}' +
    '#sbtSend{position:fixed;inset:0;z-index:99998;background:rgba(12,18,24,.55);display:flex;align-items:center;justify-content:center;padding:16px;' +
    'font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1b2734}' +
    '#sbtSend[hidden]{display:none}' +
    '#sbtSend .box{width:min(480px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
    '#sbtSend h2{margin:0 0 3px;font-size:18px}' +
    '#sbtSend .lead{margin:0 0 15px;font-size:13px;color:#6b7a8a}' +
    '#sbtSend label{display:block;margin-bottom:12px;font-size:12.5px;font-weight:600;color:#6b7a8a}' +
    '#sbtSend input,#sbtSend select{display:block;width:100%;margin-top:5px;padding:10px 12px;border:1px solid #dfe6ee;border-radius:9px;' +
    'font:inherit;font-size:14.5px;background:#f5f7fa;color:#1b2734}' +
    '#sbtSend .row{display:flex;gap:8px}#sbtSend .row>*{flex:1}' +
    '#sbtSend .foot{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}' +
    '#sbtSend .btn{padding:10px 15px;border:1px solid #dfe6ee;border-radius:9px;background:#fff;font:inherit;font-weight:600;cursor:pointer}' +
    '#sbtSend .btn.go{background:#1888c9;border-color:#1888c9;color:#fff}' +
    '#sbtSend .btn:disabled{opacity:.55;cursor:default}' +
    '#sbtSend .note{margin-top:10px;padding:9px 11px;border-radius:9px;font-size:12.5px;display:none}' +
    '#sbtSend .note.show{display:block}' +
    '#sbtSend .note.err{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca}' +
    '#sbtSend .note.ok{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}' +
    '#sbtSend .note.wait{background:#fffbeb;color:#b45309;border:1px solid #fde68a}';
  document.head.appendChild(css);

  var gate = document.createElement('div');
  gate.id = 'sbtGate';
  gate.innerHTML =
    '<form class="box" id="sbtForm">' +
    '<h1>Sổ Bài Tập</h1>' +
    '<p>Bản trên web. Đăng nhập bằng tài khoản giáo viên.</p>' +
    '<label>Email<input type="email" id="sbtEmail" autocomplete="username" required></label>' +
    '<label>Mật khẩu<input type="password" id="sbtPass" autocomplete="current-password" required></label>' +
    '<button type="submit" id="sbtGo">Mở sổ</button>' +
    '<div class="err" id="sbtErr"></div>' +
    '</form>';
  function mountGate() { (document.body || document.documentElement).appendChild(gate); }
  if (document.body) mountGate(); else document.addEventListener('DOMContentLoaded', mountGate);

  function showErr(t) {
    var e = document.getElementById('sbtErr');
    if (e) { e.textContent = t; e.className = t ? 'err show' : 'err'; }
  }
  function badge(name, email) {
    var b = document.getElementById('sbtBadge');
    if (!b) {
      b = document.createElement('button');
      b.id = 'sbtBadge';
      b.type = 'button';
      b.className = 'no-print';
      document.body.appendChild(b);
      var menu = document.createElement('div');
      menu.id = 'sbtMenu';
      menu.className = 'no-print';
      menu.hidden = true;
      menu.innerHTML =
        '<div class="who" id="sbtWho"></div>' +
        '<button type="button" id="sbtGiao">📤 Giao tài liệu này cho lớp</button>' +
        '<a href="quan-tri.html">▦ Trang quản trị lớp</a>' +
        '<a href="index.html" target="_blank" rel="noopener">👁 Trang học (xem như sinh viên)</a>' +
        '<button type="button" class="out" id="sbtOut">⎋ Đăng xuất</button>';
      document.body.appendChild(menu);
      b.addEventListener('click', function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; });
      document.addEventListener('click', function () { menu.hidden = true; });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu.hidden = true; });
      menu.querySelector('#sbtGiao').addEventListener('click', function () { menu.hidden = true; openSend(); });
      menu.querySelector('#sbtOut').addEventListener('click', async function () {
        await sb.auth.signOut();
        location.reload();
      });
    }
    b.textContent = '☁ ' + name;
    b.title = 'Tài khoản, chuyển trang, đăng xuất';
    var who = document.getElementById('sbtWho');
    if (who) who.textContent = 'Đang đăng nhập: ' + (email || '');
  }

  async function afterLogin(user) {
    var pr = await sb.from('profiles').select('full_name, role, active').eq('id', user.id).maybeSingle();
    var p = pr.data || {};
    if (p.role !== 'admin' && p.role !== 'teacher') {
      showErr('Tài khoản này không có quyền mở sổ. Chỉ giáo viên mới vào được.');
      await sb.auth.signOut();
      return false;
    }
    me = user;
    gate.className = 'done';
    badge(p.full_name || user.email, user.email);
    dbResolve(makeDb());
    return true;
  }

  document.addEventListener('submit', async function (e) {
    if (!e.target || e.target.id !== 'sbtForm') return;
    e.preventDefault();
    var btn = document.getElementById('sbtGo');
    btn.disabled = true; btn.textContent = 'Đang mở…'; showErr('');
    var r = await sb.auth.signInWithPassword({
      email: document.getElementById('sbtEmail').value.trim(),
      password: document.getElementById('sbtPass').value
    });
    btn.disabled = false; btn.textContent = 'Mở sổ';
    if (r.error) {
      showErr(r.error.message === 'Invalid login credentials' ? 'Sai email hoặc mật khẩu.' : r.error.message);
      return;
    }
    if (!(await afterLogin(r.data.user))) return;
  });

  sb.auth.getSession().then(function (r) { if (r.data.session) afterLogin(r.data.session.user); });

  /* ================= cầu nối cơ sở dữ liệu ================= */
  function fail(r) { if (r && r.error) throw new Error(r.error.message); return r; }
  function splitPath(path) {
    var s = String(path || '');
    var i = s.lastIndexOf('/');
    return i < 0 ? { c: s, id: '' } : { c: s.slice(0, i), id: s.slice(i + 1) };
  }
  function snapOne(id, row) {
    return {
      id: id,
      exists: !!row,
      data: function () { return row ? row.data : undefined; },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  function snapMany(rows) {
    var docs = (rows || []).map(function (r) { return snapOne(r.doc_id, r); });
    return {
      docs: docs, size: docs.length, empty: !docs.length,
      docChanges: function () { return []; },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  /* Nghe thay đổi từ máy khác. Không bật được Realtime thì chỉ nạp một lần, app vẫn chạy. */
  function listen(collection, run) {
    var chan = null;
    try {
      chan = sb.channel('nb-' + collection + '-' + Math.random().toString(36).slice(2, 7))
        .on('postgres_changes',
            { event: '*', schema: 'public', table: TABLE, filter: 'collection=eq.' + collection },
            function () { run(); })
        .subscribe();
    } catch (e) { chan = null; }
    return function () { try { if (chan) sb.removeChannel(chan); } catch (e) {} };
  }

  function docRef(collection, id) {
    return {
      id: id,
      path: collection + '/' + id,
      get: function () {
        return sb.from(TABLE).select('doc_id, data').eq('collection', collection).eq('doc_id', id)
          .maybeSingle().then(function (r) { return snapOne(id, r.data); });
      },
      set: function (data) {
        return sb.from(TABLE).upsert({
          owner: me.id, collection: collection, doc_id: id,
          data: JSON.parse(JSON.stringify(data == null ? {} : data)),
          updated_at: new Date().toISOString()
        }, { onConflict: 'owner,collection,doc_id' }).then(fail).then(function () {});
      },
      update: function (patch) {
        return this.get().then(function (s) {
          var cur = s.exists ? s.data() : {};
          return docRef(collection, id).set(Object.assign({}, cur, patch));
        });
      },
      delete: function () {
        return sb.from(TABLE).delete().eq('collection', collection).eq('doc_id', id).then(fail).then(function () {});
      },
      onSnapshot: function (next, onErr) {
        var self = this, alive = true;
        function run() {
          self.get().then(function (s) { if (alive) next(s); })
            .catch(function (e) { if (onErr) onErr(e); });
        }
        run();
        var off = listen(collection, run);
        return function () { alive = false; off(); };
      },
      collection: function (sub) { return collectionRef(collection + '/' + id + '/' + sub); }
    };
  }

  function collectionRef(collection) {
    var filters = [];
    var q = {
      doc: function (id) {
        return docRef(collection, id || ('auto-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)));
      },
      /* app tự sắp xếp lại sau khi nạp nên hai cái này chỉ cần nhận rồi bỏ qua */
      orderBy: function () { return q; },
      limit: function () { return q; },
      where: function (field, op, value) { filters.push([field, value]); return q; },
      get: function () { return run(); },
      onSnapshot: function (next, onErr) {
        var alive = true;
        function go() { run().then(function (s) { if (alive) next(s); }).catch(function (e) { if (onErr) onErr(e); }); }
        go();
        var off = listen(collection, go);
        return function () { alive = false; off(); };
      }
    };
    function run() {
      var sel = sb.from(TABLE).select('doc_id, data').eq('collection', collection);
      filters.forEach(function (f) { sel = sel.filter('data->>' + f[0], 'eq', String(f[1])); });
      return sel.then(function (r) { fail(r); return snapMany(r.data); });
    }
    return q;
  }

  function makeDb() {
    return {
      doc: function (path) { var p = splitPath(path); return docRef(p.c, p.id); },
      collection: function (name) { return collectionRef(name); }
    };
  }

  /* ================= tải file xuống ================= */
  var downloads = {
    save: function (req) {
      if (sendCatch) {                       /* đang giao cho lớp: giữ tệp lại, không tải xuống máy */
        var c = sendCatch; sendCatch = null;
        c.res(req);
        return Promise.resolve({ status: 'saved' });
      }
      return new Promise(function (resolve, reject) {
        try {
          var data = req && req.data;
          var blob = (data instanceof Blob) ? data : new Blob([data], { type: 'application/octet-stream' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = req.filename || 'tai-ve';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 20000);
          resolve({ status: 'saved' });
        } catch (e) { reject(e); }
      });
    }
  };

  /* ================= giao tài liệu thẳng cho lớp =================
     Bấm nút → chọn lớp và buổi → sổ tự dựng PDF như khi In → cầu nối bắt lấy tệp đó,
     đẩy lên kho rồi tạo dòng tài liệu trong buổi. Không có file nào rơi xuống máy. */
  var sendCatch = null;                     /* đang chờ tệp PDF từ sổ */
  function q(id) { return document.getElementById(id); }
  function sendNote(t, kind) {
    var n = q('sbtNote');
    if (n) { n.textContent = t || ''; n.className = t ? ('note show ' + (kind || 'err')) : 'note'; }
  }
  function buildSendUI() {
    if (q('sbtSend')) return;
    var d = document.createElement('div');
    d.id = 'sbtSend';
    d.hidden = true;
    d.innerHTML =
      '<div class="box">' +
      '<h2>Giao cho lớp</h2>' +
      '<p class="lead">Sổ sẽ tự dựng bản PDF của tài liệu đang mở rồi đẩy thẳng lên lớp. Không tải gì về máy.</p>' +
      '<label>Lớp<select id="sbtCls"></select></label>' +
      '<label>Buổi<select id="sbtSes"></select></label>' +
      '<div id="sbtNewSes" style="display:none"><div class="row">' +
      '<label>Buổi số<input id="sbtNo" type="number" min="1"></label>' +
      '<label>Tên buổi<input id="sbtSesName" placeholder="Nồng độ dung dịch"></label>' +
      '</div></div>' +
      '<label>Gửi bản nào<select id="sbtKind">' +
      '<option value="hs">Bản học sinh — ẩn đáp án, chừa chỗ làm bài</option>' +
      '<option value="gv">Bản có đáp án và lời giải</option>' +
      '</select></label>' +
      '<label>Tên hiển thị cho sinh viên<input id="sbtTitle"></label>' +
      '<label>Mở lúc (để trống là mở ngay)<input id="sbtOpen" type="datetime-local"></label>' +
      '<div class="foot"><button type="button" class="btn" id="sbtCancel">Huỷ</button>' +
      '<button type="button" class="btn go" id="sbtGo2">Gửi lên lớp</button></div>' +
      '<div class="note" id="sbtNote"></div>' +
      '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d) d.hidden = true; });
    q('sbtCancel').addEventListener('click', function () { d.hidden = true; });
    q('sbtCls').addEventListener('change', loadSesList);
    q('sbtSes').addEventListener('change', function () {
      q('sbtNewSes').style.display = this.value === '__new__' ? '' : 'none';
    });
    q('sbtKind').addEventListener('change', function () {
      var t = q('sbtTitle');
      if (this.value === 'gv' && !/đáp án/i.test(t.value)) t.value = 'Đáp án · ' + t.value;
      if (this.value === 'hs') t.value = t.value.replace(/^Đáp án · /, '');
    });
    q('sbtGo2').addEventListener('click', doSend);
  }
  async function loadSesList() {
    var sel = q('sbtSes');
    sel.innerHTML = '<option>Đang tải…</option>';
    var r = await sb.from('sessions').select('id, no, title').eq('class_id', q('sbtCls').value).order('no', { ascending: false });
    var opts = (r.data || []).map(function (x) {
      return '<option value="' + x.id + '">Buổi ' + (x.no != null ? x.no : '?') + ' · ' + (x.title || '') + '</option>';
    });
    sel.innerHTML = opts.join('') + '<option value="__new__">＋ Tạo buổi mới…</option>';
    if (!opts.length) sel.value = '__new__';
    q('sbtNewSes').style.display = sel.value === '__new__' ? '' : 'none';
    var nxt = (r.data || []).reduce(function (m, x) { return Math.max(m, x.no || 0); }, 0) + 1;
    q('sbtNo').value = nxt;
  }
  function docTitleNow() {
    var el = document.querySelector('#sheet .hero-title, #sheet .exam-title');
    var t = el ? el.textContent.trim() : '';
    return t || 'Tài liệu';
  }
  async function openSend() {
    buildSendUI();
    if (!document.querySelector('#sheet .problem, #sheet .lec-page')) {
      alert('Mở một tài liệu trong sổ trước đã, rồi mới giao cho lớp.');
      return;
    }
    sendNote('');
    q('sbtTitle').value = docTitleNow();
    q('sbtOpen').value = '';
    q('sbtGo2').disabled = false;
    q('sbtGo2').textContent = 'Gửi lên lớp';
    var r = await sb.from('classes').select('id, name').eq('archived', false).order('name');
    var cls = r.data || [];
    if (!cls.length) {
      alert('Chưa có lớp nào. Vào Trang quản trị lớp tạo một lớp trước đã.');
      return;
    }
    q('sbtCls').innerHTML = cls.map(function (c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    await loadSesList();
    q('sbtSend').hidden = false;
  }
  /* chờ sổ đưa tệp PDF ra */
  function catchPdf() {
    return new Promise(function (res, rej) {
      sendCatch = { res: res };
      setTimeout(function () { if (sendCatch) { sendCatch = null; rej(new Error('dựng PDF quá lâu')); } }, 180000);
    });
  }
  async function doSend() {
    var btn = q('sbtGo2');
    btn.disabled = true;
    sendNote('Đang chuẩn bị…', 'wait');
    try {
      var sesId = q('sbtSes').value;
      if (sesId === '__new__') {
        var ins = await sb.from('sessions').insert({
          class_id: q('sbtCls').value,
          no: Number(q('sbtNo').value) || null,
          title: q('sbtSesName').value.trim() || docTitleNow(),
          published: true
        }).select('id').single();
        if (ins.error) throw new Error(ins.error.message);
        sesId = ins.data.id;
      }
      var wantGV = q('sbtKind').value === 'gv';
      var modeBtn = document.querySelector('#modeSwitch button.on');
      var wasGV = modeBtn && modeBtn.dataset.mode === 'teacher';
      if (wantGV !== wasGV) {
        var b = document.querySelector('#modeSwitch button[data-mode="' + (wantGV ? 'teacher' : 'student') + '"]');
        if (b) { b.click(); await new Promise(function (r) { setTimeout(r, 700); }); }
      }
      sendNote('Đang dựng PDF, việc này mất khoảng mươi giây…', 'wait');
      var waiter = catchPdf();
      var pb = document.getElementById('printBtn');
      if (!pb) throw new Error('không thấy nút xuất PDF của sổ');
      pb.click();
      var req = await waiter;
      sendNote('Đang đẩy lên lớp…', 'wait');
      var blob = (req.data instanceof Blob) ? req.data : new Blob([req.data], { type: 'application/pdf' });
      var safe = (req.filename || 'tai-lieu.pdf').replace(/[^\w.\-]+/g, '_');
      var pathName = sesId + '/' + Date.now() + '_' + safe;
      var up = await sb.storage.from('tailieu').upload(pathName, blob, { contentType: 'application/pdf' });
      if (up.error) throw new Error(up.error.message);
      var openAt = q('sbtOpen').value ? new Date(q('sbtOpen').value).toISOString() : null;
      var mi = await sb.from('materials').insert({
        session_id: sesId,
        kind: wantGV ? 'answer' : 'pdf',
        title: q('sbtTitle').value.trim() || docTitleNow(),
        open_at: openAt,
        order_no: wantGV ? 50 : 10
      }).select('id').single();
      if (mi.error) throw new Error(mi.error.message);
      var ci = await sb.from('material_contents').insert({ material_id: mi.data.id, storage_path: pathName });
      if (ci.error) throw new Error(ci.error.message);
      if (wantGV !== wasGV) {
        var back = document.querySelector('#modeSwitch button[data-mode="' + (wasGV ? 'teacher' : 'student') + '"]');
        if (back) back.click();
      }
      sendNote('Xong. Sinh viên trong lớp đã thấy tài liệu này.' + (openAt ? ' Nội dung mở theo giờ đã đặt.' : ''), 'ok');
      btn.textContent = 'Gửi tiếp';
      btn.disabled = false;
    } catch (e) {
      sendCatch = null;
      sendNote('Không gửi được: ' + (e && e.message || e), 'err');
      btn.disabled = false;
    }
  }

  /* ================= window.claude giả ================= */
  window.claude = {
    use: function (name) {
      if (name === 'db') return dbReady;
      if (name === 'downloads') return Promise.resolve(downloads);
      return Promise.resolve(null);      /* sample: không có AI ở bản web */
    }
  };
})();
