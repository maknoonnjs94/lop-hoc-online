-- =====================================================================
-- v27c — Một đơn đăng ký chọn được NHIỀU khoá (2026-09-12)
-- =====================================================================
-- Form trên trang công khai cho tick nhiều khoá. Cột `khoa` (text) vẫn giữ chuỗi "A · B" để hiện
-- và để khoá trùng; `khoa_ds` là mảng JSON từng khoá để quản trị gợi ý đúng từng lớp khi duyệt.
-- Chạy: Supabase → SQL Editor → dán → Run. Chạy lại được.

alter table public.dang_ky add column if not exists khoa_ds jsonb not null default '[]'::jsonb;

-- Tự kiểm
select count(*) as co_cot_khoa_ds from information_schema.columns where table_name = 'dang_ky' and column_name = 'khoa_ds';
