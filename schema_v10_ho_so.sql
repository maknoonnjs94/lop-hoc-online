-- =====================================================================
--  HỒ SƠ SINH VIÊN: lần đầu đăng nhập phải đổi mật khẩu + khai danh tính; giao diện theo giới tính
--  Dán TOÀN BỘ file vào Supabase → SQL Editor → Run. Chạy một lần, chạy lại cũng không sao.
-- =====================================================================

-- 1. Cột mới trong hồ sơ
alter table public.profiles add column if not exists gender         text not null default '';
alter table public.profiles add column if not exists birth_year     int;
alter table public.profiles add column if not exists major          text not null default '';
alter table public.profiles add column if not exists theme          text not null default '';     -- '' | mint | peach
alter table public.profiles add column if not exists onboarded_at   timestamptz;                  -- đã khai danh tính lúc nào
alter table public.profiles add column if not exists must_change_pw boolean not null default true; -- tài khoản mới cấp: bắt đổi mật khẩu

do $$ begin
  alter table public.profiles add constraint profiles_gender_check check (gender in ('', 'nam', 'nu', 'khac'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_theme_check check (theme in ('', 'mint', 'peach'));
exception when duplicate_object then null; end $$;

-- Giảng viên không phải đi qua bước khai danh tính / đổi mật khẩu
update public.profiles set must_change_pw = false, onboarded_at = coalesce(onboarded_at, now())
where role in ('teacher', 'admin');

-- 2. Sinh viên tự khai danh tính (chỉ ghi được đúng các cột này, không đụng role/active)
create or replace function public.hoan_tat_ho_so(
  p_full_name text, p_gender text, p_birth_year int, p_major text, p_student_no text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;
  if coalesce(trim(p_full_name), '') = '' then return jsonb_build_object('ok', false, 'reason', 'thieu_ten'); end if;
  if p_gender not in ('nam', 'nu', 'khac') then return jsonb_build_object('ok', false, 'reason', 'sai_gioi_tinh'); end if;
  if p_birth_year is not null and (p_birth_year < 1950 or p_birth_year > extract(year from now())::int) then
    return jsonb_build_object('ok', false, 'reason', 'sai_nam_sinh');
  end if;
  update public.profiles
     set full_name = left(trim(p_full_name), 120),
         gender = p_gender,
         birth_year = p_birth_year,
         major = left(coalesce(trim(p_major), ''), 120),
         student_no = coalesce(nullif(left(trim(p_student_no), 40), ''), student_no),
         theme = case when theme = '' then (case when p_gender = 'nu' then 'peach' else 'mint' end) else theme end,
         onboarded_at = coalesce(onboarded_at, now())
   where id = me;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hoan_tat_ho_so(text, text, int, text, text) from public;
grant execute on function public.hoan_tat_ho_so(text, text, int, text, text) to authenticated;

-- 3. Sau khi đổi mật khẩu xong thì tắt cờ bắt đổi
create or replace function public.da_doi_mat_khau()
returns jsonb language sql security definer set search_path = public as $$
  update public.profiles set must_change_pw = false where id = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all on function public.da_doi_mat_khau() from public;
grant execute on function public.da_doi_mat_khau() to authenticated;

-- 4. Sinh viên tự chọn giao diện (mint / peach)
create or replace function public.doi_giao_dien(p_theme text)
returns jsonb language sql security definer set search_path = public as $$
  update public.profiles set theme = case when p_theme in ('mint', 'peach') then p_theme else '' end where id = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all on function public.doi_giao_dien(text) from public;
grant execute on function public.doi_giao_dien(text) to authenticated;

-- Xem thử
select full_name, role, gender, birth_year, major, theme, must_change_pw, onboarded_at from public.profiles order by role, full_name;
