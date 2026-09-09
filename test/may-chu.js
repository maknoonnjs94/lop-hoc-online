/* Máy chủ tĩnh nhỏ, chỉ chạy tại máy (127.0.0.1:8765), để xem thử trang học.
   Bấm đúp chay-thu.cmd là xong; muốn chạy tay thì: node may-chu.js
   Đóng cửa sổ đen hoặc bấm Ctrl + C là tắt. */
const http = require('http'), fs = require('fs'), path = require('path'), { exec } = require('child_process');

const web = path.join(__dirname, '..', 'web');
const cong = 8765;
const trang = '/_test_index.html';

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.gif': 'image/gif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf'
};

http.createServer(function (req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = trang;
  const f = path.join(web, p);
  if (!f.startsWith(web)) { res.writeHead(403); res.end('403'); return; }   /* chặn ../ */
  fs.readFile(f, function (err, data) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Không có tệp: ' + p); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(cong, '127.0.0.1', function () {
  const goc = 'http://127.0.0.1:' + cong + trang;
  console.log('');
  console.log('  Trang học đang chạy tại máy:  ' + goc);
  console.log('');
  console.log('  Thêm vào sau địa chỉ để thử từng luồng:');
  console.log('    ?onb=1        lần đầu đăng nhập: đổi mật khẩu → khai hồ sơ');
  console.log('    ?g=nam        vào luôn với hồ sơ nam (mặc định là nữ)');
  console.log('    ?het=1        đã học xong hết → xem màn hình chúc mừng');
  console.log('    ?trong=1      lớp chưa có buổi nào → xem màn hình trống');
  console.log('    ?quy=het      video đã hết quỹ thời lượng xem → video bị ẩn');
  console.log('    ?st=1         tài liệu video lấy từ Cloudflare Stream');
  console.log('    ?nop=roi      đã nộp bài, chờ chấm · ?nop=cham đã được chấm điểm');
  console.log('    ?han=het      quá hạn nộp → nút nộp đóng lại');
  console.log('    ?hoi=trong    chưa có câu hỏi nào');
  console.log('  Ghép nhiều cái bằng dấu &, ví dụ: ' + trang + '?g=nam&het=1');
  console.log('');
  console.log('  Đóng cửa sổ này (hoặc Ctrl + C) là tắt máy chủ.');
  console.log('');
  if (process.argv.indexOf('--khong-mo') < 0) exec('start "" "' + goc + '"');
}).on('error', function (e) {
  if (e.code === 'EADDRINUSE') console.error('\n  Cổng ' + cong + ' đang bận — có thể m đã mở sẵn một cửa sổ khác rồi.\n  Vào thẳng http://127.0.0.1:' + cong + trang + '\n');
  else console.error(e);
});
