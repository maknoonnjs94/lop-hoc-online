-- =====================================================================
--  TRANG "HÔM NAY" · ĐÃ XEM / TIẾP TỤC · THÔNG BÁO TỨC THÌ
--  Dán TOÀN BỘ file vào Supabase → SQL Editor → Run. Chạy một lần, chạy lại cũng không sao.
--
--  Nguyên tắc: thời gian là TUỲ CHỌN. Buổi không cần số, không cần ngày; giao bài lúc nào
--  cũng được. Giảng viên chỉ có hai nút lái: ghim một buổi làm "đang học", và một ô thông báo tự do.
-- =====================================================================

-- 1. Buổi: ghim (tuỳ chọn) + giờ bắt đầu (tuỳ chọn, chỉ để nhắc trước 30 phút)
alter table public.sessions add column if not exists pinned    boolean not null default false;
alter table public.sessions add column if not exists starts_at timestamptz;

-- 2. Lớp: thông báo tự do hiện trên đầu trang học (trống = không hiện)
alter table public.classes add column if not exists notice text not null default '';

-- 3. Lượt xem: mỗi sinh viên × mỗi tài liệu một dòng — đã xem chưa, xem tới đâu (trang / phút)
create table if not exists public.view_events (
  user_id     uuid not null references auth.users on delete cascade,
  material_id uuid not null references public.materials on delete cascade,
  session_id  uuid,
  class_id    uuid,
  first_at    timestamptz not null default now(),
  last_at     timestamptz not null default now(),
  opens       int not null default 1,
  progress    jsonb not null default '{}'::jsonb,   -- {page, pages, seconds, duration, done}
  primary key (user_id, material_id)
);
create index if not exists view_events_session_idx on public.view_events (session_id);
create index if not exists view_events_class_idx   on public.view_events (class_id);

alter table public.view_events enable row level security;

drop policy if exists ve_sv_doc  on public.view_events;
drop policy if exists ve_sv_ghi  on public.view_events;
drop policy if exists ve_sv_sua  on public.view_events;
drop policy if exists ve_gv_doc  on public.view_events;
drop policy if exists ve_gv_xoa  on public.view_events;

create policy ve_sv_doc on public.view_events for select using (user_id = auth.uid());
create policy ve_sv_ghi on public.view_events for insert with check (user_id = auth.uid());
create policy ve_sv_sua on public.view_events for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ve_gv_doc on public.view_events for select using (public.is_staff());
create policy ve_gv_xoa on public.view_events for delete using (public.is_staff());

-- 4. Realtime: sinh viên đang mở app nhận ngay khi giảng viên giao bài / mở buổi / đổi thông báo
do $$ begin alter publication supabase_realtime add table public.materials; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.sessions;  exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.classes;   exception when duplicate_object then null; end $$;

-- Xem thử: lượt xem gần nhất
select p.full_name, m.title, v.opens, v.last_at, v.progress
from public.view_events v
join public.profiles p on p.id = v.user_id
join public.materials m on m.id = v.material_id
order by v.last_at desc
limit 20;
