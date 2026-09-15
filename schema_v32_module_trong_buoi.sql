-- =====================================================================
-- v32 — MODULE TRONG BUỔI: video → HTML → bài tập → đáp án, mở theo ngày (2026-09-15)
-- =====================================================================
-- t nghĩ lại: video vẫn nên nằm TRONG từng buổi (không tách mục riêng như v31) để sinh viên theo đúng
-- mạch — xem video xong → đọc HTML hiểu bài → làm bài tập thử sức → xem đáp án. Vẫn giữ khái niệm
-- "Module" (gom vài tài liệu thành một cụm nhỏ trong buổi) và link HTML "chỉ cho xem"
-- (materials.xem_khong_tai, đã có từ v31) — chỉ đổi CHỖ Module sống: trong buổi thật, không phải mục
-- tách riêng nữa.
--
-- session_modules: một buổi chia thành vài module nhỏ (VD: "1. Vì sao cần chuẩn độ"). Mỗi module gom
-- vài tài liệu theo đúng mạch trên — không ép cứng ở DB (vẫn nhiều kind/nhiều tài liệu được), Quản trị
-- chỉ GỢI Ý đúng 4 ô (Video/HTML/Bài tập/Đáp án) cho quen mắt. materials.module_id = null vẫn là tài
-- liệu rời như trước, không đổi gì (Buổi học cũ không hỏng).
--
-- "Mở lúc" (open_at, đã có sẵn ở materials từ trước) giờ cho đặt ở MỌI loại tài liệu, không chỉ
-- pdf/lecture/answer như trước — video và link cũng đặt ngày mở được (sửa ở web/quan-tri.html, không
-- cần đổi gì ở DB).
--
-- (v31's lecture_topics / sessions.la_bai_giang / sessions.topic_id không dùng nữa — để nguyên, không
-- xoá, phòng khi m đã tạo dữ liệu thật ở đó; không ảnh hưởng gì tới phần này.)
--
-- Chạy: Supabase → SQL Editor → dán cả tệp → Run. Chạy lại được.
-- Kiểm: /api/trang-thai → "v32_module_trong_buoi": true

create table if not exists public.session_modules (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  title      text not null default '',
  order_no   int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists session_modules_session_idx on public.session_modules (session_id, order_no);

alter table public.session_modules enable row level security;
drop policy if exists sm_staff on public.session_modules;
create policy sm_staff on public.session_modules for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists sm_read on public.session_modules;
create policy sm_read on public.session_modules for select to authenticated
  using (public.is_staff() or (deleted_at is null and exists (
    select 1 from public.sessions s
    where s.id = session_id and s.published and s.deleted_at is null
      and public.is_active() and public.in_class(s.class_id) and public.hoc_phi_ok(s.class_id))));

alter table public.materials add column if not exists module_id uuid references public.session_modules on delete set null;
create index if not exists materials_module_idx on public.materials (module_id) where module_id is not null;

-- Tự kiểm: phải ra true
select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'materials' and column_name = 'module_id'
) as v32_module_trong_buoi;
