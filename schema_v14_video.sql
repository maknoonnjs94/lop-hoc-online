-- =====================================================================
--  VIDEO (Cloudflare Stream): bảng cấu hình hệ thống cho Worker.
--  Worker cất khoá ký video (tạo một lần) và vài giá trị khác ở đây.
--  Bật RLS mà KHÔNG có luật nào → sinh viên và giảng viên trên trình duyệt đều không đọc được,
--  chỉ Worker (dùng khoá service_role) đọc/ghi.
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

create table if not exists public.cau_hinh_he_thong (
  khoa       text primary key,
  gia_tri    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.cau_hinh_he_thong enable row level security;
revoke all on public.cau_hinh_he_thong from anon, authenticated;

comment on table public.cau_hinh_he_thong is 'Cấu hình do Worker ghi (khoá ký video Stream…). Không có luật RLS: chỉ service role truy cập.';

-- Xem thử (trong SQL Editor bạn là chủ dự án nên vẫn xem được)
select khoa, updated_at from public.cau_hinh_he_thong;
