-- =====================================================================
--  HỒ SƠ (bổ sung): sinh viên chưa có dòng trong profiles vẫn khai được (tạo dòng khi khai).
--  + Câu kiểm tra một tài khoản cụ thể. Dán vào Supabase → SQL Editor → Run.
-- =====================================================================

-- 1. Tạo dòng hồ sơ còn thiếu cho mọi tài khoản đã có trong auth (không đụng dòng đã có)
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', ''), 'student'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 2. hoan_tat_ho_so: có dòng thì sửa, chưa có thì tạo
create or replace function public.hoan_tat_ho_so(
  p_full_name text, p_gender text, p_birth_year int, p_major text, p_student_no text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); v_email text;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;
  if coalesce(trim(p_full_name), '') = '' then return jsonb_build_object('ok', false, 'reason', 'thieu_ten'); end if;
  if p_gender not in ('nam', 'nu', 'khac') then return jsonb_build_object('ok', false, 'reason', 'sai_gioi_tinh'); end if;
  if p_birth_year is not null and (p_birth_year < 1950 or p_birth_year > extract(year from now())::int) then
    return jsonb_build_object('ok', false, 'reason', 'sai_nam_sinh');
  end if;
  select email into v_email from auth.users where id = me;
  insert into public.profiles (id, email, full_name, role, gender, birth_year, major, student_no, theme, onboarded_at)
  values (me, v_email, left(trim(p_full_name), 120), 'student', p_gender, p_birth_year, left(coalesce(trim(p_major), ''), 120),
          nullif(left(trim(p_student_no), 40), ''), case when p_gender = 'nu' then 'peach' else 'mint' end, now())
  on conflict (id) do update
     set full_name = excluded.full_name,
         gender = excluded.gender,
         birth_year = excluded.birth_year,
         major = excluded.major,
         student_no = coalesce(excluded.student_no, public.profiles.student_no),
         theme = case when public.profiles.theme = '' then excluded.theme else public.profiles.theme end,
         onboarded_at = coalesce(public.profiles.onboarded_at, now());
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hoan_tat_ho_so(text, text, int, text, text) from public;
grant execute on function public.hoan_tat_ho_so(text, text, int, text, text) to authenticated;

-- 3. Kiểm tra một tài khoản: dòng nào NULL ở cột role là chưa có hồ sơ
select u.email, u.last_sign_in_at, p.role, p.full_name, p.active, p.must_change_pw, p.onboarded_at, p.gender, p.theme,
       (select count(*) from public.device_bindings d where d.user_id = u.id) as so_may_da_gan
from auth.users u left join public.profiles p on p.id = u.id
where u.email = 'sv.thu@example.com';
