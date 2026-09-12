/* Chữ cố định trên trang công khai (index.html) — một nơi duy nhất, dùng chung cho trang công khai
   (để hiện) và trang quản trị (để sửa). Mỗi dòng: [khoá, nhãn ở quản trị, chữ mặc định].
   Giảng viên sửa ở Quản trị → Trang công khai → "Chữ trên trang"; lưu trong trang_cong_khai.chu.
   Để trống = dùng chữ mặc định ở đây; gõ đúng một dấu gạch "-" = bỏ trống hẳn. */
window.CHU_CONG_KHAI = [
  { nhom: 'Đầu trang', ds: [
    ['hero_eyebrow', 'Dòng nhỏ phía trên tên trang', 'Lớp học online · GV. Phạm Anh Ngọc'],
    ['hero_tag', 'Nhãn nổi trên ảnh', '▶ Học trong ứng dụng riêng của lớp'],
    ['hero_fine', 'Dòng nhỏ dưới các nút tải', 'Đã có ứng dụng? Mở lên là vào lớp. Chưa có tài khoản? Đăng ký ở mục bên dưới, nhận tài khoản trong ngày.']
  ]},
  { nhom: 'Mục "được gì" (6 thẻ, biểu tượng cố định)', ds: [
    ['dg_eyebrow', 'Nhãn mục', 'Học ở đây, bạn có gì'],
    ['dg_h2', 'Tiêu đề mục', 'Mọi thứ của lớp, gọn một chỗ'],
    ['dg1_t', 'Thẻ 1 — tiêu đề', 'Bài giảng video'],
    ['dg1_p', 'Thẻ 1 — mô tả', 'Xem lại chỗ chưa hiểu. Đóng máy rồi mở lại, video chạy tiếp đúng chỗ đang dở.'],
    ['dg2_t', 'Thẻ 2 — tiêu đề', 'Trang “Hôm nay”'],
    ['dg2_p', 'Thẻ 2 — mô tả', 'Mở lên là biết hôm nay học gì, buổi nào sắp tới, bài nào cần làm, hạn nộp còn bao lâu.'],
    ['dg3_t', 'Thẻ 3 — tiêu đề', 'Phiếu bài tập có máy chấm'],
    ['dg3_p', 'Thẻ 3 — mô tả', 'Điền đáp án thẳng vào phiếu, biết đúng sai ngay. Gõ 10⁻⁵ hay 1e-5 đều được chấm như nhau.'],
    ['dg4_t', 'Thẻ 4 — tiêu đề', 'Hỏi bài, có lời giải đáp'],
    ['dg4_p', 'Thẻ 4 — mô tả', 'Hỏi ẩn danh ngay dưới buổi học. Câu hay được giảng viên ghim thành mục hỏi đáp cho cả lớp.'],
    ['dg5_t', 'Thẻ 5 — tiêu đề', 'Chuông báo bài mới'],
    ['dg5_p', 'Thẻ 5 — mô tả', 'Có tài liệu, video hay lời giải mới là báo ngay. Không lỡ buổi nào.'],
    ['dg6_t', 'Thẻ 6 — tiêu đề', 'Không gian của riêng bạn'],
    ['dg6_p', 'Thẻ 6 — mô tả', '4 giao diện màu, 8 nhân vật 3D, ảnh đại diện của chính bạn. Máy chủ riêng của lớp, không quảng cáo.']
  ]},
  { nhom: 'Mục Khoá học', ds: [
    ['khoa_eyebrow', 'Nhãn mục (cũng là chữ trên menu)', 'Khoá học'],
    ['khoa_h2', 'Tiêu đề mục', 'Đang mở và sắp mở'],
    ['khoa_p', 'Câu dẫn dưới tiêu đề', 'Mỗi khoá là một giảng đường riêng: buổi học, phiếu bài tập và bảng điểm của lớp đó.'],
    ['khoa_danhcho', 'Nhãn "Dành cho" trong thẻ', 'Dành cho'],
    ['khoa_lich', 'Nhãn "Lịch" trong thẻ', 'Lịch'],
    ['tt_dang_mo', 'Trạng thái: đang mở', 'Đang mở'],
    ['tt_sap_mo', 'Trạng thái: sắp mở', 'Sắp mở'],
    ['tt_ket_thuc', 'Trạng thái: đã kết thúc', 'Đã kết thúc'],
    ['nut_zalo_khoa', 'Nút vào Zalo của khoá (khi thẻ không đặt chữ riêng)', 'Zalo khoá học'],
    ['nut_nhan_gv', 'Nút phụ nhắn giảng viên', 'Nhắn giảng viên'],
    ['nut_dangky', 'Nút Đăng ký (mở form)', 'Đăng ký'],
    ['khoa_trong', 'Khi chưa đăng khoá nào', 'Chưa có khoá nào được đăng.']
  ]},
  { nhom: 'Mục Đăng ký (form)', ds: [
    ['dk_eyebrow', 'Nhãn mục (menu)', 'Đăng ký'],
    ['dk_h2', 'Tiêu đề mục', 'Đăng ký khoá học'],
    ['dk_p', 'Câu dẫn', 'Điền vài dòng. Giảng viên nhắn Zalo gửi tài khoản trong ngày, sau đó bạn tải app và vào lớp.'],
    ['dk_gui', 'Chữ trên nút gửi', 'Gửi đăng ký'],
    ['dk_hd', 'Nút mở ảnh hướng dẫn đăng ký', 'Cách đăng ký từng bước'],
    ['dk_xong', 'Lời cảm ơn sau khi gửi', 'Đã nhận đăng ký của bạn! Giảng viên sẽ nhắn Zalo trong ngày để gửi tài khoản. Trong lúc chờ, bạn tải app trước cho sẵn.'],
    ['dk_da_gui', 'Khi đã gửi trước đó', 'Bạn đã gửi đăng ký cho khoá này rồi — giảng viên sẽ liên hệ sớm.']
  ]},
  { nhom: 'Mục Cách học', ds: [
    ['cach_eyebrow', 'Nhãn mục (menu)', 'Cách học'],
    ['cach_h2', 'Tiêu đề mục', 'Bốn bước để bắt đầu'],
    ['cach_note_t', 'Ghi chú cuối mục — phần đậm', 'Một tài khoản, một chỗ:'],
    ['cach_note', 'Ghi chú cuối mục — nội dung (gõ "-" để bỏ cả ghi chú)', 'buổi học, bài giảng, phiếu bài tập, điểm và câu hỏi của bạn đều nằm trong ứng dụng — mở lên là thấy hôm nay học gì.']
  ]},
  { nhom: 'Mục Hỏi đáp nhanh', ds: [
    ['hoi_eyebrow', 'Nhãn mục (menu)', 'Hỏi đáp nhanh'],
    ['hoi_h2', 'Tiêu đề mục', 'Những câu hay được hỏi'],
    ['hoi_trong', 'Khi chưa có câu nào', 'Chưa có câu hỏi nào.']
  ]},
  { nhom: 'Mục Liên hệ', ds: [
    ['lien_eyebrow', 'Nhãn mục (menu)', 'Liên hệ'],
    ['lien_h2', 'Tiêu đề mục', 'Nhận tài khoản và vào lớp'],
    ['lien_zalo_nhan', 'Nhãn thẻ Zalo', 'Zalo giảng viên'],
    ['nut_nhan_zalo', 'Nút nhắn Zalo', 'Nhắn Zalo'],
    ['lien_qr_chu', 'Chữ dưới mã QR', 'Quét bằng Zalo để nhắn'],
    ['lien_ghi_t', 'Thẻ phải — tiêu đề', 'Khi nhắn, ghi giúp'],
    ['lien_ghi_p', 'Thẻ phải — nội dung', 'Họ tên · ngành, năm · khoá muốn học. Tài khoản gửi lại qua Zalo hoặc email trong ngày.'],
    ['lien_app', 'Thẻ phải — dòng "Ứng dụng"', 'Tải cho Windows / macOS']
  ]},
  { nhom: 'Chân trang', ds: [
    ['chan_trang', 'Chữ sau năm ©', 'Giảng đường Hóa học · GV. Phạm Anh Ngọc']
  ]}
];
/* tra chữ: T(khoá, bản ghi đè) — trống → mặc định; "-" → rỗng */
window.chuCongKhai = function (chu, k) {
  var mac = '';
  for (var i = 0; i < window.CHU_CONG_KHAI.length; i++) {
    var ds = window.CHU_CONG_KHAI[i].ds;
    for (var j = 0; j < ds.length; j++) if (ds[j][0] === k) { mac = ds[j][2]; break; }
  }
  var v = chu && chu[k] != null ? String(chu[k]).trim() : '';
  if (!v) return mac;
  return v === '-' ? '' : v;
};
