-- =====================================================================
-- v25b — Đổi giọng trang công khai (2026-09-11): phô cái tốt, che rào cản
-- =====================================================================
-- Bản seed v25 đầu tiên có nhắc "một tài khoản một máy" và "chưa ký số". M đã chạy v25 trước khi
-- sửa chữ, nên hai mảnh cach_dung / hoi_dap trên máy chủ vẫn là bản cũ. Tệp này chỉ thay hai mảnh đó,
-- và CHỈ khi chúng vẫn còn chữ cũ (m đã sửa tay ở Quản trị thì không đụng). Chạy lại bao nhiêu lần cũng được.

update public.trang_cong_khai set noi_dung = jsonb_build_array(
  jsonb_build_object('tieu_de', 'Nhận tài khoản', 'mo_ta', 'Nhắn Zalo cho giảng viên: họ tên, ngành, khoá muốn học. Bạn nhận về email đăng nhập và mật khẩu tạm.'),
  jsonb_build_object('tieu_de', 'Cài ứng dụng', 'mo_ta', 'Tải bản Windows hoặc macOS ở trang này, cài một lần. Ứng dụng tự cập nhật khi có bản mới.'),
  jsonb_build_object('tieu_de', 'Đăng nhập lần đầu', 'mo_ta', 'Đặt mật khẩu của riêng bạn, khai họ tên và ngành — giao diện tự chọn màu và nhân vật theo bạn, đổi lại lúc nào cũng được.'),
  jsonb_build_object('tieu_de', 'Học', 'mo_ta', 'Trang chủ báo hôm nay học gì. Xem bài giảng, đọc tài liệu, điền đáp án vào phiếu và biết đúng sai ngay, nộp ảnh bài làm, hỏi bài ở mục Hỏi đáp.')
), updated_at = now()
where khoa = 'cach_dung' and noi_dung::text like '%gắn với đúng chiếc máy%';

update public.trang_cong_khai set noi_dung = jsonb_build_array(
  jsonb_build_object('hoi', 'Học trên máy nào?', 'dap', 'Ứng dụng có bản Windows và macOS. Cài một lần, tự cập nhật; mở lên là vào lớp, không cần gõ địa chỉ.'),
  jsonb_build_object('hoi', 'Tài liệu và bài giảng có xem lại được không?', 'dap', 'Được, bất cứ lúc nào trong thời gian khoá học. Video nhớ chỗ đang dở, phiếu bài tập giữ lại đáp án bạn đã điền và kết quả chấm.'),
  jsonb_build_object('hoi', 'Không hiểu bài thì hỏi ở đâu?', 'dap', 'Mục Hỏi đáp ngay dưới mỗi buổi học — hỏi ẩn danh, giảng viên trả lời, cả lớp cùng xem. Câu hay được ghim thành hỏi đáp chung.'),
  jsonb_build_object('hoi', 'Quên mật khẩu thì làm sao?', 'dap', 'Trong ứng dụng, ở màn đăng nhập gõ email rồi bấm "Quên mật khẩu" — thư có link đặt mật khẩu mới. Hoặc nhắn giảng viên, cấp lại trong ngày.')
), updated_at = now()
where khoa = 'hoi_dap' and noi_dung::text like '%chứng chỉ ký số%';

-- Tự kiểm: hai dòng dưới phải ra 0
select (select count(*) from public.trang_cong_khai where noi_dung::text like '%một máy%') as con_mot_may,
       (select count(*) from public.trang_cong_khai where noi_dung::text like '%ký số%') as con_ky_so;