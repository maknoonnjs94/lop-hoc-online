-- =====================================================================
--  GHI SỰ KIỆN CHỤP MÀN HÌNH / IN / LƯU TỪ TRANG HỌC
--
--  Dán TOÀN BỘ file này vào Supabase → SQL Editor → Run. Chạy một lần,
--  chạy lại cũng không sao.
--
--  Trang học ghi vào đây khi sinh viên bấm PrintScreen, Ctrl+P, Ctrl+S.
--  Trang quản trị đọc ra và nhận báo tức thì (Realtime) khi có dòng mới.
-- =====================================================================

create table if not exists public.screenshot_events (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users on delete cascade,
  kind           text not null check (kind in ('printscreen','in','luu')),
  material_id    uuid,                 -- tài liệu đang mở lúc đó (nếu có)
  material_title text default '',
  ua             text default '',
  at             timestamptz not null default now()
);

create index if not exists screenshot_events_at_idx on public.screenshot_events (at desc);

alter table public.screenshot_events enable row level security;

drop policy if exists shot_sv_ghi   on public.screenshot_events;
drop policy if exists shot_gv_doc   on public.screenshot_events;
drop policy if exists shot_gv_xoa   on public.screenshot_events;

-- Sinh viên chỉ được GHI dòng mang đúng tên mình, không đọc, không sửa, không xoá
create policy shot_sv_ghi on public.screenshot_events
  for insert with check (user_id = auth.uid());

-- Giáo viên đọc hết và dọn được
create policy shot_gv_doc on public.screenshot_events
  for select using (public.is_staff());

create policy shot_gv_xoa on public.screenshot_events
  for delete using (public.is_staff());

-- Cho Realtime phát dòng mới tới trang quản trị (bỏ qua nếu đã có sẵn)
do $$
begin
  alter publication supabase_realtime add table public.screenshot_events;
exception when duplicate_object then null;
end $$;

-- Xem thử: 30 sự kiện gần nhất
select e.at, p.full_name, p.email, e.kind, e.material_title
from public.screenshot_events e
left join public.profiles p on p.id = e.user_id
order by e.at desc
limit 30;
