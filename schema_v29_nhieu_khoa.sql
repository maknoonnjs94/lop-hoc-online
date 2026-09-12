-- =====================================================================
-- v29 — MỘT TÀI KHOẢN HỌC NHIỀU KHOÁ: bỏ luật cũ "một tài khoản một khoá" (2026-09-12)
-- =====================================================================
-- schema_v4_mot_khoa.sql (2026-09-08) đặt trigger trg_one_class chặn sinh viên ghi danh vào lớp thứ hai,
-- để chống một người mua rồi cho mượn. Từ 12/9 hệ thống đã đổi: một tài khoản học nhiều khoá, mỗi khoá
-- tính học phí riêng, khoá riêng, và tài khoản gắn một máy thật (app) — nên luật cũ thành vật cản:
-- duyệt đăng ký nhiều khoá bị "Tài khoản này đang học khóa …", không ghi danh được.
-- Tệp này bỏ trigger (giữ hàm để tra cứu). Chạy lại được.
-- Kiểm: /api/trang-thai → "v29_nhieu_khoa": true

drop trigger if exists trg_one_class on public.enrollments;

-- cờ để Worker báo trạng thái
create or replace function public.nhieu_khoa_ok()
returns boolean language sql stable as $$
  select not exists (select 1 from pg_trigger where tgname = 'trg_one_class');
$$;
grant execute on function public.nhieu_khoa_ok() to authenticated, anon;

-- Tự kiểm: phải ra true
select public.nhieu_khoa_ok() as nhieu_khoa_ok;
