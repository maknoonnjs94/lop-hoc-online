/* Rà soát tĩnh hai trang web: bắt loại lỗi chỉ nổ lúc chạy, kiểu "ngayGio is not defined".
 *
 *   node ra-soat.js        (chạy từ thư mục test)
 *
 * Kiểm ba thứ:
 *   1. id trùng nhau trong HTML thật
 *   2. $('id') trỏ vào id không có ở đâu cả
 *   3. hàm được gọi mà không thấy định nghĩa trong cùng tệp
 */
const fs = require('fs');
const path = require('path');
const web = path.join(__dirname, '..', 'web');

/* Có sẵn của trình duyệt hoặc thư viện ngoài — gọi mà không định nghĩa là bình thường */
const NGOAI = new Set((
  'alert confirm prompt fetch setTimeout setInterval clearTimeout clearInterval requestAnimationFrame ' +
  'parseInt parseFloat isFinite isNaN encodeURIComponent decodeURIComponent escape unescape ' +
  'require import eval structuredClone queueMicrotask reportError ' +
  'addEventListener removeEventListener dispatchEvent getComputedStyle matchMedia ' +
  'querySelector querySelectorAll getElementById createElement createTextNode ' +
  'open close focus blur scrollTo scrollIntoView print btoa atob'
).split(/\s+/));

const TUKHOA = new Set(
  'if for while switch catch return typeof instanceof new delete void do else try function await yield in of'.split(' ')
);

/* THỨ TỰ QUAN TRỌNG: bỏ CHUỖI trước, rồi mới bỏ ghi chú.
   Làm ngược lại thì "https://…" nằm trong chuỗi bị coi là mở đầu ghi chú dòng,
   nuốt luôn phần còn lại của dòng — mất cả định nghĩa hàm nằm cùng dòng đó.
   (Chính cái bẫy này làm bản rà đầu tiên báo nhầm 9 hàm.) */
function locChu(s) {
  return s
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ');
}

function ra(ten) {
  /* Nhận cả đường dẫn tuyệt đối, để tự kiểm công cụ trên một bản cũ có lỗi thật. */
  const duong = path.isAbsolute(ten) ? ten : path.join(web, ten);
  const h = fs.readFileSync(duong, 'utf8');
  const loi = [];
  let m, r;

  const re = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g;
  let js = '';
  while ((m = re.exec(h))) js += '\n' + m[1];
  const sach = locChu(js);
  /* HTML thật: bỏ hẳn phần script, vì mẫu hộp thoại nằm trong chuỗi JS chứ không phải DOM */
  const htmlThat = h.replace(/<script[\s\S]*?<\/script>/g, ' ');

  /* --- 1. id trùng --- */
  const ids = {};
  r = /\sid="([^"]+)"/g;
  while ((m = r.exec(htmlThat))) ids[m[1]] = (ids[m[1]] || 0) + 1;
  Object.keys(ids).forEach(function (k) {
    if (ids[k] > 1) loi.push('id trùng ' + ids[k] + ' lần trong HTML: #' + k);
  });

  /* --- 2. $('id') trỏ vào id không tồn tại (kể cả id do JS dựng ra) --- */
  const idJs = {};
  r = /id="([A-Za-z0-9_-]+)"/g;          while ((m = r.exec(js))) idJs[m[1]] = true;
  r = /\.id\s*=\s*'([A-Za-z0-9_-]+)'/g;  while ((m = r.exec(js))) idJs[m[1]] = true;
  r = /\$\('([A-Za-z0-9_-]+)'\)/g;
  const daBao = {};
  while ((m = r.exec(js))) {
    const k = m[1];
    if (!ids[k] && !idJs[k] && !daBao[k]) { daBao[k] = true; loi.push("$('" + k + "') nhưng không thấy id này ở đâu cả"); }
  }

  /* --- 3. hàm gọi mà không có định nghĩa --- */
  const co = new Set();
  r = /function\s+([A-Za-z_$][\w$]*)/g;           while ((m = r.exec(sach))) co.add(m[1]);
  r = /(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g;  while ((m = r.exec(sach))) co.add(m[1]);
  r = /([A-Za-z_$][\w$]*)\s*:\s*function/g;       while ((m = r.exec(sach))) co.add(m[1]);
  r = /function[^(]*\(([^)]*)\)/g;
  while ((m = r.exec(sach))) m[1].split(',').forEach(function (p) {
    p = p.trim().split('=')[0].trim().replace(/^\.\.\./, '');
    if (p) co.add(p);
  });
  r = /\(?\s*([A-Za-z_$][\w$,\s]*?)\s*\)?\s*=>/g;
  while ((m = r.exec(sach))) m[1].split(',').forEach(function (p) {
    p = p.trim(); if (p) co.add(p);
  });

  const goi = new Set();
  r = /(^|[^\w$.])([a-z_$][\w$]*)\s*\(/g;
  while ((m = r.exec(sach))) goi.add(m[2]);
  [...goi].sort().forEach(function (k) {
    if (co.has(k) || NGOAI.has(k) || TUKHOA.has(k)) return;
    loi.push('gọi ' + k + '() nhưng không thấy định nghĩa trong tệp');
  });

  return loi;
}

let tong = 0;
const canRa = process.argv.slice(2);
(canRa.length ? canRa : ['index.html', 'quan-tri.html']).forEach(function (t) {
  const loi = ra(t);
  tong += loi.length;
  console.log('\n=== ' + t + ' — ' + (loi.length ? loi.length + ' chỗ đáng ngờ' : 'sạch') + ' ===');
  loi.forEach(function (x) { console.log('  · ' + x); });
});
console.log('\nTổng: ' + tong);
process.exit(tong ? 1 : 0);
