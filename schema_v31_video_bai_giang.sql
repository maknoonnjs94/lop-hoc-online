-- =====================================================================
-- v31 — VIDEO BÀI GIẢNG: Chủ đề → Module, tách khỏi Buổi học; link HTML "chỉ cho xem" (2026-09-15)
-- =====================================================================
-- Mục "🎬 Video bài giảng" là mục MỚI, tách hẳn khỏi "Buổi học" (buổi = điểm danh, tài liệu, bài tập
-- của từng buổi lên lớp) — dùng cho video quay sẵn xếp theo giáo trình: Chủ đề 1, 2, 3…, mỗi chủ đề có
-- vài Module nhỏ (mỗi module thường 1 video, có thể kèm 1 link bài giảng HTML).
--
-- Kỹ thuật: KHÔNG tạo bảng "module" riêng — một Module chính là một dòng trong bảng sessions có sẵn,
-- đánh dấu la_bai_giang = true và gắn topic_id. Nhờ vậy Module dùng lại NGUYÊN VẸN toàn bộ hạ tầng
-- materials/video Cloudflare Stream/quỹ giờ xem/RLS đã có — không phải xây lại từ đầu, không rủi ro
-- cho "Buổi học" đang chạy (mọi RLS của sessions/materials/material_contents giữ nguyên, chỉ thêm cột).
--
-- Chạy: Supabase → SQL Editor → dán cả tệp → Run. Chạy lại được.
-- Kiểm: /api/trang-thai → "v31_video_bai_giang": true

-- ---------- Chủ đề: nhóm các module theo giáo trình, thuộc 1 lớp ----------
create table if not exists public.lecture_topics (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes on delete cascade,
  name       text not null default '',
  order_no   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists lecture_topics_class_idx on public.lecture_topics (class_id, order_no);

alter table public.lecture_topics enable row level security;
drop policy if exists lt_staff on public.lecture_topics;
create policy lt_staff on public.lecture_topics for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists lt_read on public.lecture_topics;
create policy lt_read on public.lecture_topics for select to authenticated
  using (public.is_staff() or (public.is_active() and public.in_class(class_id)));

-- ---------- sessions: đánh dấu "buổi ảo" dùng làm Module, gắn 1 chủ đề ----------
alter table public.sessions add column if not exists la_bai_giang boolean not null default false;
alter table public.sessions add column if not exists topic_id uuid references public.lecture_topics on delete set null;
create index if not exists sessions_topic_idx on public.sessions (topic_id) where topic_id is not null;

-- ---------- materials: cờ "chỉ cho xem trong trang" cho link ngoài (bài giảng HTML) ----------
-- Không thêm kind mới — dùng lại kind='link' sẵn có, chỉ thêm cờ đổi cách trang học hiển thị:
-- bật thì nhúng khung xem trong app, ẩn nút "Mở tab mới" (đỡ lộ link gốc để tải).
alter table public.materials add column if not exists xem_khong_tai boolean not null default false;

-- Tự kiểm: phải ra true
select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'sessions' and column_name = 'la_bai_giang'
) as v31_video_bai_giang;
