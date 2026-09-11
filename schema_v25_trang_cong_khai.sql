-- =====================================================================
-- v25 — TRANG CÔNG KHAI giangduonghoahoc.com (2026-09-11)
-- =====================================================================
-- Từ 11/9 địa chỉ gốc là trang giới thiệu ai cũng xem được: khoá học, cách dùng,
-- hỏi đáp nhanh, liên hệ Zalo, nút tải app. Việc học chỉ diễn ra trong app (/hoc).
-- Nội dung trang do giảng viên sửa ở Quản trị → tab "Trang công khai", lưu ở bảng này:
-- mỗi khoá (khoa) một mảnh JSON, ai cũng đọc được (kể cả chưa đăng nhập), chỉ giảng
-- viên/quản trị sửa được. Không có gì nhạy cảm trong bảng này — đừng để nhầm khoá,
-- email riêng của sinh viên hay mật khẩu vào đây.
--
-- Chạy: Supabase → SQL Editor → dán cả tệp → Run. Chạy lại được, không mất dữ liệu đã sửa.
-- Kiểm: /api/trang-thai → "v25_trang_cong_khai": true

create table if not exists public.trang_cong_khai (
  khoa        text primary key,
  noi_dung    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.trang_cong_khai enable row level security;

drop policy if exists tck_doc on public.trang_cong_khai;
create policy tck_doc on public.trang_cong_khai for select using (true);

drop policy if exists tck_sua on public.trang_cong_khai;
create policy tck_sua on public.trang_cong_khai for all
  using (public.is_staff()) with check (public.is_staff());

grant select on public.trang_cong_khai to anon, authenticated;
grant insert, update, delete on public.trang_cong_khai to authenticated;

-- Nội dung mẫu: chỉ chèn khi chưa có (on conflict do nothing), sửa ở Quản trị là giữ nguyên.
insert into public.trang_cong_khai (khoa, noi_dung) values
('gioi_thieu', jsonb_build_object(
  'khau_hieu', 'Hóa học khó, có Phạm Ngọc lo',
  'mo_ta', 'Giảng đường riêng của lớp: bài giảng video, tài liệu, bài tập có máy chấm và mục hỏi đáp — gọn trong một ứng dụng trên máy tính. Không nhóm chat, không tệp Drive thất lạc.'
)),
('khoa_hoc', jsonb_build_array(
  jsonb_build_object('ten', 'Hóa phân tích', 'mo_ta', 'Cân bằng acid–base, tạo phức, kết tủa, oxy hoá–khử và các phương pháp chuẩn độ; mỗi dạng bài có phiếu bài tập kèm máy chấm.', 'doi_tuong', 'Sinh viên năm 2–3 các ngành Hóa, Hóa dược, Sư phạm Hóa', 'lich', 'Kì 1 · 2026–2027', 'trang_thai', 'dang_mo'),
  jsonb_build_object('ten', 'Hóa hữu cơ', 'mo_ta', 'Cấu tạo, cơ chế phản ứng, tổng hợp và nhận biết các nhóm chức chính; đề mẫu theo đúng cấu trúc thi.', 'doi_tuong', 'Sinh viên năm 1–2', 'lich', 'Sắp mở', 'trang_thai', 'sap_mo')
)),
('cach_dung', jsonb_build_array(
  jsonb_build_object('tieu_de', 'Nhận tài khoản', 'mo_ta', 'Nhắn Zalo cho giảng viên: họ tên, ngành, khoá muốn học. Bạn nhận về email đăng nhập và mật khẩu tạm.'),
  jsonb_build_object('tieu_de', 'Cài ứng dụng', 'mo_ta', 'Tải bản Windows hoặc macOS ở trang này, cài một lần. Ứng dụng tự cập nhật khi có bản mới.'),
  jsonb_build_object('tieu_de', 'Đăng nhập lần đầu', 'mo_ta', 'Đặt mật khẩu của riêng bạn, khai họ tên và ngành. Tài khoản gắn với đúng chiếc máy này — đổi máy thì nhắn giảng viên gỡ.'),
  jsonb_build_object('tieu_de', 'Học', 'mo_ta', 'Trang chủ báo hôm nay học gì. Xem bài giảng, đọc tài liệu, điền đáp án vào phiếu và biết đúng sai ngay, nộp ảnh bài làm, hỏi bài ở mục Hỏi đáp.')
)),
('hoi_dap', jsonb_build_array(
  jsonb_build_object('hoi', 'Học trên điện thoại được không?', 'dap', 'Chưa. Ứng dụng có bản Windows và macOS; bài giảng và tài liệu chỉ mở trong ứng dụng để bảo vệ nội dung của lớp.'),
  jsonb_build_object('hoi', 'Quên mật khẩu thì làm sao?', 'dap', 'Trong ứng dụng, ở màn đăng nhập gõ email rồi bấm "Quên mật khẩu" — thư có link đặt mật khẩu mới. Hoặc nhắn giảng viên cấp lại.'),
  jsonb_build_object('hoi', 'Đổi máy tính thì sao?', 'dap', 'Mỗi tài khoản chỉ dùng trên một máy. Đổi máy hay cài lại Windows thì nhắn giảng viên gỡ máy cũ, mười giây là xong.'),
  jsonb_build_object('hoi', 'Windows báo "Windows protected your PC" khi cài?', 'dap', 'Bấm "More info" rồi "Run anyway". Ứng dụng chưa mua chứng chỉ ký số nên Windows hỏi cho chắc.')
)),
('lien_he', jsonb_build_object(
  'zalo', '',
  'zalo_link', '',
  'email', '',
  'facebook', '',
  'ghi_chu', 'Nhắn Zalo là nhanh nhất — nhận tài khoản trong ngày.'
))
on conflict (khoa) do nothing;

-- Tự kiểm
select khoa, jsonb_typeof(noi_dung) as kieu, updated_at from public.trang_cong_khai order by khoa;
