-- =====================================================================
--  BỐN GIAO DIỆN + AVATAR: sinh viên tự chọn màu (mint / sky / peach / lavender)
--  và nhân vật (boy / girl) độc lập nhau.
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- 1. Cho phép thêm hai màu mới; 'mint' và 'peach' cũ vẫn dùng được như trước
alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles add constraint profiles_theme_check
  check (theme in ('', 'mint', 'sky', 'peach', 'lavender'));

-- 2. Nhân vật đại diện, không gắn với giới tính
alter table public.profiles add column if not exists avatar text not null default '';
alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check
  check (avatar in ('', 'boy', 'girl'));

-- 3. Sinh viên tự đổi màu + nhân vật (chỉ sửa được dòng của chính mình)
create or replace function public.doi_giao_dien(p_theme text, p_avatar text)
returns jsonb language sql security definer set search_path = public as $$
  update public.profiles
     set theme  = case when p_theme  in ('mint', 'sky', 'peach', 'lavender') then p_theme  else theme  end,
         avatar = case when p_avatar in ('boy', 'girl')                      then p_avatar else avatar end
   where id = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all on function public.doi_giao_dien(text, text) from public;
grant execute on function public.doi_giao_dien(text, text) to authenticated;

-- Bản một tham số vẫn giữ để trang cũ đang mở không lỗi
create or replace function public.doi_giao_dien(p_theme text)
returns jsonb language sql security definer set search_path = public as $$
  update public.profiles
     set theme = case when p_theme in ('mint', 'sky', 'peach', 'lavender') then p_theme else theme end
   where id = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all on function public.doi_giao_dien(text) from public;
grant execute on function public.doi_giao_dien(text) to authenticated;

-- 4. Ai chưa có nhân vật thì đặt sẵn theo giới tính đã khai (vẫn đổi lại được)
update public.profiles
   set avatar = case when gender = 'nu' then 'girl' else 'boy' end
 where avatar = '' and onboarded_at is not null;

-- Xem thử
select full_name, role, gender, theme, avatar from public.profiles order by role, full_name;
