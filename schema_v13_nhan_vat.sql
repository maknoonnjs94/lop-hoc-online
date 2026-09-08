-- =====================================================================
--  NHÂN VẬT: 8 nhân vật 3D (4 nam, 4 nữ) thay cho hai lựa chọn boy/girl cũ.
--  Giá trị cũ 'boy' / 'girl' vẫn hợp lệ (trang tự hiểu là boy-00 / girl-00).
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check
  check (avatar in ('', 'boy', 'girl',
                    'boy-00', 'girl-00', 'boy-01', 'girl-01', 'boy-02', 'girl-02', 'boy-03', 'girl-03'));

create or replace function public.doi_giao_dien(p_theme text, p_avatar text)
returns jsonb language sql security definer set search_path = public as $$
  update public.profiles
     set theme  = case when p_theme in ('mint', 'sky', 'peach', 'lavender') then p_theme else theme end,
         avatar = case when p_avatar in ('boy', 'girl', 'boy-00', 'girl-00', 'boy-01', 'girl-01', 'boy-02', 'girl-02', 'boy-03', 'girl-03')
                       then p_avatar else avatar end
   where id = auth.uid();
  select jsonb_build_object('ok', true);
$$;
revoke all on function public.doi_giao_dien(text, text) from public;
grant execute on function public.doi_giao_dien(text, text) to authenticated;

-- Xem thử
select full_name, role, theme, avatar from public.profiles order by role, full_name;
