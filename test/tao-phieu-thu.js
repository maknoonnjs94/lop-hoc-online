/* Chép phiếu mẫu vào web/_test_phieu.pdf cho bản chạy thử.
   Phiếu gốc là test/phieu-mau.pdf — một trang A4 in ra từ trình duyệt, có 4 chỗ trống.
   Muốn đổi phiếu mẫu thì thay hẳn tệp phieu-mau.pdf, nhưng nhớ khoanh lại toạ độ ô
   trong test/tao-ban-thu.js (biến O_PHIEU). */
const fs = require('fs'), path = require('path');
const goc = path.join(__dirname, 'phieu-mau.pdf');
const ra = path.join(__dirname, '..', 'web', '_test_phieu.pdf');
if (!fs.existsSync(goc)) { console.error('Không thấy test/phieu-mau.pdf'); process.exit(1); }
fs.copyFileSync(goc, ra);
const gocAnh = path.join(__dirname, 'phieu-mau.png');
const raAnh = path.join(__dirname, '..', 'web', '_test_phieu.png');
if (fs.existsSync(gocAnh)) fs.copyFileSync(gocAnh, raAnh);
console.log('Đã chép phiếu mẫu → web/_test_phieu.pdf và _test_phieu.png');
