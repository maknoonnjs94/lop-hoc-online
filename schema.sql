-- =====================================================================
--  HỌC ONLINE — cấu trúc dữ liệu + luật truy cập (Supabase / PostgreSQL)
--  Dán toàn bộ file này vào Supabase → SQL Editor → Run. Chạy lại được nhiều lần.
--
--  Thứ tự bắt buộc: TẤT CẢ bảng trước, rồi mới tới hàm phụ. Postgres kiểm tra thân
--  hàm ngôn ngữ sql ngay lúc tạo, nên hàm gọi bảng chưa tồn tại sẽ báo
--  'relation ... does not exist'.
--
--  Nguyên tắc: MỌI quyền đọc đều chặn ở máy chủ bằng Row Level Security.
--  Sinh viên nghịch trình duyệt cũng không lấy được dữ liệu ngoài phần được giao.
--  - Kho câu hỏi, bản giáo viên: KHÔNG nằm trong cơ sở dữ liệu này.
--  - Đáp án mở sau: nội dung nằm ở bảng riêng (material_contents), khoá theo giờ máy chủ.
-- =====================================================================

-- =====================================================================
--  PHẦN 1 — BẢNG
-- =====================================================================

-- ---------- 1.1 Hồ sơ người dùng ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text not null default '',
  student_no text default '',                 -- mã sinh viên, tuỳ chọn
  role       text not null default 'student' check (role in ('student','teacher','admin')),
  active     boolean not null default true,   -- tắt là chặn vào, không cần xoá tài khoản
  created_at timestamptz not null default now()
);

-- ---------- 1.2 Lớp và ghi danh ----------
create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,                   -- ví dụ: Hóa phân tích K68 - lớp tối 3-5
  subject    text not null default '',
  owner      uuid not null default auth.uid() references auth.users on delete cascade,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  class_id  uuid not null references public.classes on delete cascade,
  student   uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student)
);

-- ---------- 1.3 Buổi học ----------
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes on delete cascade,
  no         int,                             -- buổi số mấy
  title      text not null default '',
  held_on    date,
  note       text not null default '',
  published  boolean not null default false,  -- chưa bật thì sinh viên không thấy gì
  created_at timestamptz not null default now()
);
create index if not exists sessions_class_idx on public.sessions (class_id, no);

-- ---------- 1.4 Tài liệu: phần mô tả (sinh viên thấy tên, kể cả đáp án chưa mở) ----------
--  kind: pdf (phiếu bài tập) | lecture (bài giảng viết tay) | video | link | answer | text
create table if not exists public.materials (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  kind       text not null check (kind in ('pdf','lecture','video','link','answer','text')),
  title      text not null default '',
  open_at    timestamptz,                     -- null = mở ngay; đặt ngày để khoá đáp án
  order_no   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists materials_session_idx on public.materials (session_id, order_no);

-- ---------- 1.5 Tài liệu: phần nội dung (khoá theo giờ máy chủ) ----------
create table if not exists public.material_contents (
  material_id  uuid primary key references public.materials on delete cascade,
  url          text,        -- link ngoài: YouTube, Drive, Bunny…
  storage_path text,        -- tệp trong kho: '<session_id>/<tên tệp>'
  body         text         -- chữ, dùng cho kind='text'
);

-- =====================================================================
--  PHẦN 2 — HÀM PHỤ (đặt SAU bảng; security definer để luật không gọi vòng)
-- =====================================================================
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and active and role in ('teacher','admin'));
$$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.in_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments
                 where class_id = cid and student = auth.uid());
$$;

-- Ai được tạo tài khoản cũng có hồ sơ, mặc định là sinh viên chưa vào lớp nào
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  PHẦN 3 — LUẬT TRUY CẬP
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.classes           enable row level security;
alter table public.enrollments       enable row level security;
alter table public.sessions          enable row level security;
alter table public.materials         enable row level security;
alter table public.material_contents enable row level security;

-- profiles: tự đọc hồ sơ mình; giáo viên đọc hết; sinh viên chỉ sửa tên của chính mình
drop policy if exists p_self on public.profiles;
create policy p_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
drop policy if exists p_self_upd on public.profiles;
create policy p_self_upd on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = 'student');
drop policy if exists p_staff_all on public.profiles;
create policy p_staff_all on public.profiles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- classes: sinh viên chỉ thấy lớp mình có tên trong danh sách
drop policy if exists c_read on public.classes;
create policy c_read on public.classes for select to authenticated
  using (public.is_staff() or (public.is_active() and public.in_class(id)));
drop policy if exists c_staff on public.classes;
create policy c_staff on public.classes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- enrollments: sinh viên chỉ thấy dòng của chính mình (không thấy bạn cùng lớp)
drop policy if exists e_read on public.enrollments;
create policy e_read on public.enrollments for select to authenticated
  using (public.is_staff() or student = auth.uid());
drop policy if exists e_staff on public.enrollments;
create policy e_staff on public.enrollments for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- sessions: buổi đã bật, thuộc lớp mình
drop policy if exists s_read on public.sessions;
create policy s_read on public.sessions for select to authenticated
  using (public.is_staff() or (published and public.is_active() and public.in_class(class_id)));
drop policy if exists s_staff on public.sessions;
create policy s_staff on public.sessions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- materials: thấy TÊN tài liệu của buổi đọc được (kể cả đáp án chưa mở, để biết mà chờ)
drop policy if exists m_read on public.materials;
create policy m_read on public.materials for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.sessions s
    where s.id = session_id and s.published and public.is_active() and public.in_class(s.class_id)));
drop policy if exists m_staff on public.materials;
create policy m_staff on public.materials for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- material_contents: NỘI DUNG chỉ trả về khi đã tới giờ mở
drop policy if exists mc_read on public.material_contents;
create policy mc_read on public.material_contents for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.materials m
    join public.sessions s on s.id = m.session_id
    where m.id = material_id and s.published and public.is_active() and public.in_class(s.class_id)
      and (m.open_at is null or m.open_at <= now())));
drop policy if exists mc_staff on public.material_contents;
create policy mc_staff on public.material_contents for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- =====================================================================
--  PHẦN 4 — KHO TỆP (Storage): bucket riêng tư 'tailieu'
--  Đường dẫn tệp đặt theo mẫu '<session_id>/<tên tệp>' và phải có dòng trong
--  material_contents trỏ tới, nếu không thì không ai đọc được.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('tailieu', 'tailieu', false)
on conflict (id) do update set public = false;

drop policy if exists st_read on storage.objects;
create policy st_read on storage.objects for select to authenticated
  using (bucket_id = 'tailieu' and (
    public.is_staff() or exists (
      select 1 from public.material_contents mc
      join public.materials m on m.id = mc.material_id
      join public.sessions  s on s.id = m.session_id
      where mc.storage_path = storage.objects.name
        and s.published and public.is_active() and public.in_class(s.class_id)
        and (m.open_at is null or m.open_at <= now()))));

drop policy if exists st_write on storage.objects;
create policy st_write on storage.objects for all to authenticated
  using (bucket_id = 'tailieu' and public.is_staff())
  with check (bucket_id = 'tailieu' and public.is_staff());

-- =====================================================================
--  PHẦN 5 — TIỆN ÍCH CHO GIÁO VIÊN
-- =====================================================================

-- Ghi danh nhanh một sinh viên vào lớp theo email (sinh viên phải có tài khoản trước)
create or replace function public.enroll_by_email(p_class uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_staff() then raise exception 'Chỉ giáo viên mới ghi danh được'; end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'Chưa có tài khoản nào dùng email %', p_email; end if;
  insert into public.enrollments (class_id, student) values (p_class, uid)
    on conflict do nothing;
end; $$;

-- Danh sách sinh viên của một lớp. CHỈ dùng trong SQL Editor (chạy bằng quyền quản trị).
-- Thu hồi quyền của tài khoản thường để sinh viên không đọc được danh sách bạn học.
create or replace view public.class_roster as
  select e.class_id, p.id as student, p.full_name, p.student_no, u.email, p.active, e.joined_at
  from public.enrollments e
  join public.profiles p on p.id = e.student
  join auth.users u on u.id = p.id;
revoke all on public.class_roster from anon, authenticated;

-- =====================================================================
--  PHẦN 6 — CHẠY MỘT LẦN SAU KHI TẠO TÀI KHOẢN CỦA MÌNH
--  Bỏ dấu -- ở hai dòng dưới, thay email và tên, rồi chạy lại file này
--  (hoặc chỉ chạy riêng hai dòng đó).
-- =====================================================================
-- update public.profiles set role = 'admin', full_name = 'Phạm Anh Ngọc'
--   where id = (select id from auth.users where email = 'email-cua-ban@gmail.com');
