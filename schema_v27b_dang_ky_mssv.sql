-- =====================================================================
-- v27b — Đơn đăng ký có MÃ SINH VIÊN (2026-09-12)
-- =====================================================================
-- Form trên trang công khai thêm ô "Mã sinh viên" (điền chính xác để cấp tài khoản đúng).
-- Khi duyệt, mã này được điền sẵn vào hồ sơ (profiles.student_no) — cũng là mã dùng trong
-- nội dung chuyển khoản học phí "HP <mã SV> …", nên đúng ngay từ đầu là đỡ đối chiếu sau.
-- Chạy: Supabase → SQL Editor → dán → Run. Chạy lại được.

alter table public.dang_ky add column if not exists mssv text not null default '';

-- Tự kiểm
select count(*) as co_cot_mssv from information_schema.columns where table_name = 'dang_ky' and column_name = 'mssv';
