-- =====================================================================
--  BỔ SUNG CHO TRANG QUẢN TRỊ (chạy SAU schema.sql)
--  Dán vào Supabase → SQL Editor → Run. Chạy lại nhiều lần được.
--
--  Vì sao cần: trang quản trị phải hiện danh sách sinh viên của lớp.
--  Bảng enrollments chỉ giữ id người dùng, còn tên và email nằm ở chỗ khác:
--   - thêm cột email vào profiles (điền sẵn khi tạo tài khoản) để khỏi phải
--     đụng vào bảng hệ thống auth.users;
--   - thêm khoá ngoại enrollments.student → profiles.id để đọc kèm một lượt.
-- =====================================================================

-- 1) Cột email trong hồ sơ
alter table public.profiles add column if not exists email text;

-- 2) Tạo hồ sơ cho những tài khoản đã có từ trước, rồi điền email
insert into public.profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and (p.email is distinct from u.email);

-- 3) Từ nay tạo tài khoản là có sẵn email trong hồ sơ
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Khoá ngoại để đọc kèm hồ sơ khi lấy danh sách lớp
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'enrollments_student_profile_fk') then
    alter table public.enrollments
      add constraint enrollments_student_profile_fk
      foreign key (student) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- 5) Giáo viên tự sửa được tên hiển thị của mình (luật cũ chỉ cho sinh viên)
drop policy if exists p_self_upd on public.profiles;
create policy p_self_upd on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- 6) Kiểm tra nhanh
select p.full_name, p.email, p.role, p.active from public.profiles p order by p.role, p.full_name;
