-- =====================================================================
--  NỘP BÀI  +  HỎI BÀI
--
--  1. Giảng viên bật "nhận bài nộp" cho một tài liệu (thường là phiếu bài tập),
--     đặt hạn nộp nếu muốn. Sinh viên tải ảnh bài làm hoặc PDF lên, kèm lời nhắn.
--     Giảng viên xem, cho điểm và nhận xét.
--  2. Dưới mỗi tài liệu có chỗ hỏi bài. Giảng viên trả lời một lần, cả lớp thấy.
--     Sinh viên thấy câu của chính mình + mọi câu đã được trả lời; tên bạn hỏi
--     không hiện cho bạn học khác, chỉ giảng viên thấy.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Cột mới
alter table public.materials add column if not exists nhan_bai boolean     not null default false;
alter table public.materials add column if not exists han_nop  timestamptz;

-- ------------------------------------------------- 2. Hàm phụ: được xem tài liệu?
create or replace function public.duoc_xem_tai_lieu(p_material uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.materials m
    join public.sessions s on s.id = m.session_id
    where m.id = p_material
      and s.published and public.is_active() and public.in_class(s.class_id)
      and (m.open_at is null or m.open_at <= now()));
$$;

-- ---------------------------------------------------------------- 3. Bài nộp
create table if not exists public.bai_nop (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id     uuid not null references auth.users(id)       on delete cascade,
  loi_nhan    text not null default '',
  tep         jsonb not null default '[]'::jsonb,   -- [{path, ten, co}]
  nop_luc     timestamptz not null default now(),
  cham_luc    timestamptz,
  diem        text,
  nhan_xet    text not null default '',
  cham_boi    uuid,
  unique (material_id, user_id)
);
create index if not exists bai_nop_mat_idx on public.bai_nop (material_id, nop_luc desc);
alter table public.bai_nop enable row level security;

drop policy if exists bn_doc on public.bai_nop;
create policy bn_doc on public.bai_nop for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
-- Không có luật ghi trực tiếp: mọi thay đổi đi qua hai hàm bên dưới.

-- ---------------------------------------------------------------- 4. Hỏi bài
create table if not exists public.cau_hoi (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id     uuid not null references auth.users(id)       on delete cascade,
  noi_dung    text not null,
  tao_luc     timestamptz not null default now(),
  tra_loi     text,
  tra_luc     timestamptz,
  tra_boi     uuid,
  an          boolean not null default false        -- giảng viên ẩn câu không phù hợp
);
create index if not exists cau_hoi_mat_idx on public.cau_hoi (material_id, tao_luc desc);
alter table public.cau_hoi enable row level security;

drop policy if exists ch_doc on public.cau_hoi;
create policy ch_doc on public.cau_hoi for select to authenticated
  using (
    public.is_staff()
    or (not an and public.duoc_xem_tai_lieu(material_id)
        and (user_id = auth.uid() or tra_loi is not null)));

drop policy if exists ch_them on public.cau_hoi;
create policy ch_them on public.cau_hoi for insert to authenticated
  with check (user_id = auth.uid() and public.duoc_xem_tai_lieu(material_id));

drop policy if exists ch_xoa on public.cau_hoi;
create policy ch_xoa on public.cau_hoi for delete to authenticated
  using (public.is_staff() or (user_id = auth.uid() and tra_loi is null));

-- ------------------------------------------------- 5. Kho tệp bài nộp: 'bainop'
--  Đường dẫn bắt buộc theo mẫu  <material_id>/<user_id>/<tên tệp>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bainop', 'bainop', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

drop policy if exists bn_tep_doc on storage.objects;
create policy bn_tep_doc on storage.objects for select to authenticated
  using (bucket_id = 'bainop'
         and (public.is_staff() or (storage.foldername(name))[2] = auth.uid()::text));

drop policy if exists bn_tep_them on storage.objects;
create policy bn_tep_them on storage.objects for insert to authenticated
  with check (bucket_id = 'bainop' and (storage.foldername(name))[2] = auth.uid()::text
              and public.duoc_xem_tai_lieu(((storage.foldername(name))[1])::uuid));

drop policy if exists bn_tep_xoa on storage.objects;
create policy bn_tep_xoa on storage.objects for delete to authenticated
  using (bucket_id = 'bainop'
         and (public.is_staff() or (storage.foldername(name))[2] = auth.uid()::text));

-- ---------------------------------------------------- 6. Sinh viên nộp / nộp lại
create or replace function public.nop_bai(p_material uuid, p_loi_nhan text, p_tep jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me   uuid := auth.uid();
  m    record;
  cu   record;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;
  if not public.duoc_xem_tai_lieu(p_material) then
    return jsonb_build_object('ok', false, 'reason', 'khong_co_quyen');
  end if;

  select nhan_bai, han_nop into m from public.materials where id = p_material;
  if not found or not m.nhan_bai then
    return jsonb_build_object('ok', false, 'reason', 'khong_nhan_bai');
  end if;
  if m.han_nop is not null and now() > m.han_nop then
    return jsonb_build_object('ok', false, 'reason', 'qua_han', 'han', m.han_nop);
  end if;

  select cham_luc into cu from public.bai_nop where material_id = p_material and user_id = me;
  if found and cu.cham_luc is not null then
    return jsonb_build_object('ok', false, 'reason', 'da_cham');   -- chấm rồi thì không sửa nữa
  end if;

  insert into public.bai_nop (material_id, user_id, loi_nhan, tep)
  values (p_material, me, coalesce(p_loi_nhan, ''), coalesce(p_tep, '[]'::jsonb))
  on conflict (material_id, user_id) do update
    set loi_nhan = excluded.loi_nhan, tep = excluded.tep, nop_luc = now();

  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.nop_bai(uuid, text, jsonb) from public;
grant execute on function public.nop_bai(uuid, text, jsonb) to authenticated;

-- --------------------------------------------------------- 7. Sinh viên rút bài
create or replace function public.rut_bai(p_material uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;
  delete from public.bai_nop where material_id = p_material and user_id = me and cham_luc is null;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('ok', false, 'reason', 'da_cham'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.rut_bai(uuid) from public;
grant execute on function public.rut_bai(uuid) to authenticated;

-- ------------------------------------------------------- 8. Giảng viên chấm bài
create or replace function public.cham_bai(p_id uuid, p_diem text, p_nhan_xet text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  update public.bai_nop
     set diem = nullif(trim(coalesce(p_diem, '')), ''),
         nhan_xet = coalesce(p_nhan_xet, ''),
         cham_luc = case when trim(coalesce(p_diem, '')) = '' and trim(coalesce(p_nhan_xet, '')) = ''
                         then null else now() end,
         cham_boi = auth.uid()
   where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.cham_bai(uuid, text, text) from public;
grant execute on function public.cham_bai(uuid, text, text) to authenticated;

-- --------------------------------------------------- 9. Giảng viên trả lời / ẩn
create or replace function public.tra_loi_cau_hoi(p_id uuid, p_tra_loi text, p_an boolean default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  update public.cau_hoi
     set tra_loi = nullif(trim(coalesce(p_tra_loi, '')), ''),
         tra_luc = case when trim(coalesce(p_tra_loi, '')) = '' then null else now() end,
         tra_boi = auth.uid(),
         an      = coalesce(p_an, an)
   where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.tra_loi_cau_hoi(uuid, text, boolean) from public;
grant execute on function public.tra_loi_cau_hoi(uuid, text, boolean) to authenticated;

-- ----------------------------------- 10. Bảng tổng hợp cho trang quản trị
--  Một dòng cho mỗi (tài liệu nhận bài × sinh viên trong lớp): đã nộp hay chưa, chấm chưa.
create or replace function public.bang_bai_nop(p_class uuid)
returns table (
  material_id uuid, tai_lieu text, session_no int, buoi text, han_nop timestamptz,
  user_id uuid, ho_ten text, email text,
  bai_id uuid, nop_luc timestamptz, loi_nhan text, tep jsonb,
  cham_luc timestamptz, diem text, nhan_xet text
) language sql stable security definer set search_path = public as $$
  select m.id, m.title, s.no, coalesce(nullif(s.title, ''), 'Buổi ' || coalesce(s.no::text, '')), m.han_nop,
         p.id, p.full_name, p.email,
         b.id, b.nop_luc, b.loi_nhan, b.tep, b.cham_luc, b.diem, b.nhan_xet
  from public.materials m
  join public.sessions s   on s.id = m.session_id
  join public.enrollments e on e.class_id = s.class_id
  join public.profiles p   on p.id = e.student
  left join public.bai_nop b on b.material_id = m.id and b.user_id = p.id
  where public.is_staff() and s.class_id = p_class and m.nhan_bai
  order by s.no desc nulls last, m.order_no, p.full_name;
$$;
revoke all on function public.bang_bai_nop(uuid) from public;
grant execute on function public.bang_bai_nop(uuid) to authenticated;

-- ----------------------------------- 11. Danh sách câu hỏi cho trang quản trị
create or replace function public.bang_cau_hoi(p_class uuid)
returns table (
  id uuid, material_id uuid, tai_lieu text, buoi text,
  ho_ten text, email text,
  noi_dung text, tao_luc timestamptz, tra_loi text, tra_luc timestamptz, an boolean
) language sql stable security definer set search_path = public as $$
  select c.id, m.id, m.title, coalesce(nullif(s.title, ''), 'Buổi ' || coalesce(s.no::text, '')),
         p.full_name, p.email,
         c.noi_dung, c.tao_luc, c.tra_loi, c.tra_luc, c.an
  from public.cau_hoi c
  join public.materials m on m.id = c.material_id
  join public.sessions  s on s.id = m.session_id
  left join public.profiles p on p.id = c.user_id
  where public.is_staff() and s.class_id = p_class
  order by (c.tra_loi is not null), c.tao_luc desc;
$$;
revoke all on function public.bang_cau_hoi(uuid) from public;
grant execute on function public.bang_cau_hoi(uuid) to authenticated;

-- Xem thử
select title, kind, nhan_bai, han_nop from public.materials order by created_at desc limit 10;

-- =====================================================================
--  Nếu phần 5 báo lỗi "must be owner of table objects" (một số dự án Supabase
--  khoá bảng này), làm bằng giao diện: Storage → New bucket tên "bainop",
--  KHÔNG công khai, giới hạn 10 MB → Policies → tạo ba luật đúng như trên.
--  Mọi phần khác vẫn chạy bình thường.
-- =====================================================================
