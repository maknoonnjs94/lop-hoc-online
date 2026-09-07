-- =====================================================================
--  KIỂM TRA VÀ ĐỔI QUYỀN TÀI KHOẢN
--  Chạy trong Supabase → SQL Editor. Dùng khi cần nhìn nhanh toàn bộ,
--  còn việc thường ngày làm ở trang quản trị (tab Sinh viên) cho tiện.
--
--  Quy tắc: tài khoản tạo mới LUÔN là 'student'. Không phải làm gì thêm.
--  Chỉ khi nào cố ý chạy lệnh nâng quyền thì mới thành teacher/admin.
-- =====================================================================

-- 1) Xem toàn bộ tài khoản và quyền
select
  coalesce(nullif(p.full_name, ''), '(chưa đặt tên)') as ten,
  p.email,
  p.role as quyen,
  case when p.active then 'đang dùng' else 'đã khoá' end as tinh_trang,
  p.created_at
from public.profiles p
order by
  case p.role when 'admin' then 1 when 'teacher' then 2 else 3 end,
  p.email;

-- 2) Đếm theo quyền — số 'admin' phải đúng bằng số người m tin tưởng
select role as quyen, count(*) as so_tai_khoan
from public.profiles group by role order by 1;

-- ---------------------------------------------------------------------
-- 3) Hạ một tài khoản về sinh viên (bỏ dấu -- rồi sửa email)
-- update public.profiles set role = 'student' where email = 'ai-do@example.com';

-- 4) Nâng một tài khoản lên giáo viên: mở được trang quản trị và Sổ Bài Tập
-- update public.profiles set role = 'teacher' where email = 'dong-nghiep@example.com';

-- 5) Khoá tạm một tài khoản mà không xoá (nghỉ học, nợ học phí…)
-- update public.profiles set active = false where email = 'sinhvien@example.com';
-- update public.profiles set active = true  where email = 'sinhvien@example.com';   -- mở lại

-- 6) Xem một sinh viên đang ở những lớp nào
-- select c.name as lop, e.joined_at
-- from public.enrollments e join public.classes c on c.id = e.class_id
-- where e.student = (select id from public.profiles where email = 'sinhvien@example.com');
