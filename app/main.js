/* =====================================================================
   ỨNG DỤNG LỚP HỌC — bọc trang web của lớp trong một cửa sổ được hệ điều hành bảo vệ.

   Điểm cốt lõi nằm ở đúng một dòng: win.setContentProtection(true).
     - Windows: WDA_EXCLUDEFROMCAPTURE — cửa sổ hiện ĐEN trong PrintScreen, Snipping Tool,
       Game Bar, OBS, Zoom/Teams chia sẻ màn hình, mọi phần mềm quay màn hình.
     - macOS: NSWindowSharingNone — Cmd+Shift+3/4/5, QuickTime, Zoom đều không thấy cửa sổ.
   Sinh viên vẫn nhìn bình thường. Chỉ camera điện thoại chĩa vào màn hình và card ghi hình
   phần cứng là ngoài tầm — dấu chìm tên trên trang lo phần đó.

   Ngoài ra: không có DevTools, không in, không mở trang ngoài tên miền lớp, không cho trang
   xin chia sẻ màn hình, chỉ chạy một bản.
   ===================================================================== */
const { app, BrowserWindow, Menu, session, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

/* ---------------------------------------------------------------------
   DÒ PHẦN MỀM QUAY / CHỤP MÀN HÌNH ĐANG CHẠY
   Hệ điều hành không báo cho app biết ai đang quay. Nhưng phần mềm quay là một tiến trình có tên.
   Mỗi 4 giây liệt kê tiến trình; thấy tên quen là báo cho trang (trang ghi sự kiện + cảnh báo đỏ).
   Bản quay vẫn đen dù có dò được hay không — đây là lớp "dọa" thêm, không phải lớp chặn.
   --------------------------------------------------------------------- */
const RECORDERS_WIN = [
  'bcastdvr.exe', 'gamebar.exe',        /* Xbox Game Bar: mở lên (Win+G) hoặc đang ghi (Win+Alt+R) */
  'screenclippinghost.exe',             /* Win+Shift+S */
  'snippingtool.exe',                   /* Snipping Tool (quay hoặc chụp) */
  'obs64.exe', 'obs32.exe', 'streamlabs obs.exe', 'xsplit.core.exe',
  'cpthost.exe',                        /* Zoom đang chia sẻ màn hình */
  'sharex.exe', 'bdcam.exe', 'camtasiastudio.exe', 'camtasia.exe', 'camrec.exe',
  'screenrec.exe', 'action.exe', 'fbrecorder.exe', 'fraps.exe', 'licecap.exe', 'screentogif.exe',
  'loom.exe', 'screenpresso.exe', 'apowerrec.exe', 'icecreamscreenrecorder.exe', 'democreator.exe'
];
const RECORDERS_MAC = [
  'screencaptureui', 'screencapture',   /* Cmd+Shift+3/4/5 */
  'quicktime player', 'obs', 'loom', 'cleanshot x', 'kap', 'screenflow', 'snagit', 'snagithelper',
  'caphost'                             /* Zoom đang chia sẻ màn hình */
];
let dangQuay = new Set();
function doPhanMemQuay(win) {
  const isWin = process.platform === 'win32';
  execFile(isWin ? 'tasklist' : 'ps', isWin ? ['/FO', 'CSV', '/NH'] : ['-Ao', 'comm='],
    { windowsHide: true, timeout: 5000, maxBuffer: 4 * 1024 * 1024 }, (err, out) => {
      if (err || !out || win.isDestroyed()) return;
      const names = new Set();
      String(out).split(/\r?\n/).forEach(line => {
        let n = isWin ? (line.split('","')[0] || '').replace(/^"/, '') : line.split('/').pop();
        n = n.trim().toLowerCase();
        if (n) names.add(n);
      });
      const thay = (isWin ? RECORDERS_WIN : RECORDERS_MAC).filter(x => names.has(x));
      const moi = thay.filter(x => !dangQuay.has(x));
      dangQuay = new Set(thay);
      if (moi.length) win.webContents.send('lophoc:recorder', moi);
    });
}
ipcMain.handle('lophoc:recorders', () => Array.from(dangQuay));

/* ---------------------------------------------------------------------
   TỰ CẬP NHẬT (Windows). Lúc mở và mỗi 30 phút app hỏi kho R2 (latest.yml, cấu hình "publish" trong
   package.json — GitHub chập chờn ở Việt Nam nên không hỏi GitHub nữa); có bản mới thì tải ngầm,
   xong hỏi "Khởi động lại để cập nhật?" — không thì lần đóng app sẽ tự thay.
   macOS: bản chưa ký số nên hệ điều hành không cho tự thay; Mac tải tay từ Releases
   (khi nào ký số thì bỏ điều kiện win32 là chạy).
   --------------------------------------------------------------------- */
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { autoUpdater = null; }
function batTuCapNhat(win) {
  if (!autoUpdater || process.platform !== 'win32' || !app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', (info) => {
    if (win.isDestroyed()) return;
    dialog.showMessageBox(win, {
      type: 'info', title: 'Có bản mới',
      message: 'Đã tải xong bản ' + info.version + '.',
      detail: 'Khởi động lại để cập nhật ngay, hoặc để sau — lần đóng app sẽ tự cập nhật.',
      buttons: ['Cập nhật ngay', 'Để sau'], defaultId: 0, cancelId: 1
    }).then(r => { if (r.response === 0) autoUpdater.quitAndInstall(); });
  });
  autoUpdater.on('error', () => {});                     /* mạng lỗi thì im lặng, lần sau thử lại */
  const kiem = () => { try { autoUpdater.checkForUpdates().catch(() => {}); } catch (e) {} };
  setTimeout(kiem, 8000);
  setInterval(kiem, 30 * 60 * 1000);
}
ipcMain.handle('lophoc:version', () => app.getVersion());

/* ---------------------------------------------------------------------
   MÃ MÁY — để khoá "một tài khoản một máy" không bị mất khi cập nhật app,
   cài lại app, đổi tên miền hay xoá dữ liệu duyệt web.
   Nguồn: Windows lấy MachineGuid trong registry, macOS lấy IOPlatformUUID của phần cứng.
   Không gửi nguyên mã máy đi: băm SHA-256 kèm một chuỗi riêng của app rồi lấy 32 ký tự đầu.
   Máy nào không đọc được thì rơi về một mã ngẫu nhiên cất trong thư mục dữ liệu của app.
   --------------------------------------------------------------------- */
const crypto = require('crypto');
const fs = require('fs');
let maMayCache = null;
function chayLenh(file, args) {
  return new Promise(function (res) {
    try {
      execFile(file, args, { timeout: 4000, windowsHide: true }, function (e, out) { res(e ? '' : String(out || '')); });
    } catch (e) { res(''); }
  });
}
async function docMaMayGoc() {
  if (process.platform === 'win32') {
    const out = await chayLenh('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid']);
    const m = out.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]{30,})/);
    if (m) return m[1].trim();
  } else if (process.platform === 'darwin') {
    const out = await chayLenh('/usr/sbin/ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice']);
    const m = out.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
    if (m) return m[1].trim();
  }
  /* không đọc được: dùng một mã ngẫu nhiên, cất trong thư mục dữ liệu của app */
  try {
    const p = path.join(app.getPath('userData'), 'may.txt');
    if (fs.existsSync(p)) { const v = fs.readFileSync(p, 'utf8').trim(); if (v) return v; }
    const v = crypto.randomUUID();
    fs.writeFileSync(p, v, 'utf8');
    return v;
  } catch (e) { return ''; }
}
async function maMay() {
  if (maMayCache) return maMayCache;
  const goc = await docMaMayGoc();
  if (!goc) return '';
  maMayCache = crypto.createHash('sha256').update('giang-duong-hoa-hoc:' + goc).digest('hex').slice(0, 32);
  return maMayCache;
}
ipcMain.handle('lophoc:ma-may', () => maMay());
/* bấm tay từ menu tài khoản trên trang: trả lời ngay là có bản mới hay không; có thì tải ngầm luôn */
ipcMain.handle('lophoc:check-update', async () => {
  const hienTai = app.getVersion();
  if (!autoUpdater || !app.isPackaged) return { ok: false, reason: 'khong_ho_tro', hienTai };
  if (process.platform !== 'win32') return { ok: false, reason: 'mac_tai_tay', hienTai };
  try {
    const r = await autoUpdater.checkForUpdates();
    const v = r && r.updateInfo && r.updateInfo.version;
    return { ok: true, hienTai, moi: !!(v && v !== hienTai), version: v || hienTai };
  } catch (e) {
    return { ok: false, reason: String((e && e.message) || e).slice(0, 120), hienTai };
  }
});

/* Địa chỉ trang lớp học. Bản ≤ 1.0.16 trỏ lop-hoc-online.giangduonghoahoc.workers.dev (vẫn chạy song song).
   Từ bản sau trỏ tên miền riêng — TRƯỚC KHI phát hành: quản trị → Kho tệp → 🔒 Khoá lại video một lần,
   để video tải lên từ trước cũng phát được ở địa chỉ mới. */
const SITE_URL = 'https://giangduonghoahoc.com/';
const APP_TAG = 'LopHocApp/' + app.getVersion();     /* trang web nhận ra mình đang chạy trong app nhờ chuỗi này */

app.setName('Lớp học');

/* chỉ một cửa sổ, mở lần hai thì đưa cửa sổ cũ lên */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
}

function taoMenu() {
  /* macOS cần menu ứng dụng để Cmd+Q, Cmd+C/V, Cmd+W hoạt động; Windows thì ẩn hẳn */
  if (process.platform !== 'darwin') { Menu.setApplicationMenu(null); return; }
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Lớp học', submenu: [{ role: 'about', label: 'Về Lớp học' }, { type: 'separator' }, { role: 'hide', label: 'Ẩn' }, { role: 'quit', label: 'Thoát' }] },
    { label: 'Sửa', submenu: [{ role: 'undo', label: 'Hoàn tác' }, { role: 'redo', label: 'Làm lại' }, { type: 'separator' }, { role: 'cut', label: 'Cắt' }, { role: 'copy', label: 'Chép' }, { role: 'paste', label: 'Dán' }, { role: 'selectAll', label: 'Chọn tất cả' }] },
    { label: 'Cửa sổ', submenu: [{ role: 'minimize', label: 'Thu nhỏ' }, { role: 'zoom', label: 'Phóng to' }, { role: 'togglefullscreen', label: 'Toàn màn hình' }] }
  ]));
}

function taoCuaSo() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    title: 'Lớp học',
    backgroundColor: '#f3f6f8',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      spellcheck: false
    }
  });

  /* ---- cái lõi: cửa sổ vô hình với mọi công cụ chụp / quay ---- */
  win.setContentProtection(true);

  win.setMenuBarVisibility(false);
  win.webContents.setUserAgent(win.webContents.getUserAgent() + ' ' + APP_TAG);

  const goc = new URL(SITE_URL).origin;

  /* chỉ đi trong tên miền của lớp; link ngoài (YouTube, Drive…) mở bằng trình duyệt thường */
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(goc)) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(goc)) return { action: 'allow' };
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  /* chặn in, lưu, mở DevTools bằng phím */
  win.webContents.on('before-input-event', (e, input) => {
    const k = String(input.key || '').toLowerCase();
    const mod = input.control || input.meta;
    if (mod && (k === 'p' || k === 's' || k === 'u')) e.preventDefault();
    if (k === 'f12' || (mod && input.shift && (k === 'i' || k === 'j' || k === 'c'))) e.preventDefault();
  });
  win.webContents.on('devtools-opened', () => win.webContents.closeDevTools());

  win.webContents.on('did-fail-load', (e, code, desc) => {
    if (code === -3) return;                                   /* huỷ tải, không phải lỗi */
    dialog.showMessageBox(win, {
      type: 'warning', title: 'Không mở được lớp học',
      message: 'Không kết nối được tới trang lớp học.',
      detail: 'Kiểm tra mạng rồi bấm Thử lại. (' + desc + ')',
      buttons: ['Thử lại', 'Thoát']
    }).then(r => { if (r.response === 0) win.loadURL(SITE_URL); else app.quit(); });
  });

  win.loadURL(SITE_URL);

  /* dò phần mềm quay mỗi 4 giây, dừng khi đóng cửa sổ */
  const nhip = setInterval(() => doPhanMemQuay(win), 4000);
  win.on('closed', () => clearInterval(nhip));
  return win;
}

app.whenReady().then(() => {
  /* trang không được xin quyền chia sẻ màn hình, micro, camera, vị trí… — chỉ giữ những gì cần để học */
  const choPhep = new Set(['fullscreen', 'clipboard-sanitized-write', 'clipboard-read', 'notifications']);
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(choPhep.has(permission)));
  session.defaultSession.setPermissionCheckHandler((wc, permission) => choPhep.has(permission));
  if (session.defaultSession.setDisplayMediaRequestHandler) {
    session.defaultSession.setDisplayMediaRequestHandler((req, cb) => cb(null));   /* cấm getDisplayMedia */
  }

  taoMenu();
  const win = taoCuaSo();
  batTuCapNhat(win);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) taoCuaSo(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
