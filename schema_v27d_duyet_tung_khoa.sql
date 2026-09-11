-- =====================================================================
-- v27d — Duyệt TỪNG khoá trong một đơn đăng ký (2026-09-12)
-- =====================================================================
-- Đơn đăng ký nhiều khoá: giảng viên duyệt khoá nào thì khoá đó, khoá còn lại vẫn nằm ở hàng chờ.
-- khoa_da_duyet: mảng tên khoá đã duyệt. Khi mọi khoá đều duyệt (hoặc từ chối) thì đơn mới rời hàng chờ.
-- Chạy: Supabase → SQL Editor → dán → Run. Chạy lại được.

alter table public.dang_ky add column if not exists khoa_da_duyet jsonb not null default '[]'::jsonb;

-- Tự kiểm
select count(*) as co_cot from information_schema.columns where table_name = 'dang_ky' and column_name = 'khoa_da_duyet';
