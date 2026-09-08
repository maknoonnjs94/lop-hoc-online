-- =====================================================================
--  NỚI QUỸ XEM CHO TỪNG SINH VIÊN
--  Video có quỹ chung (materials.gioi_han_giay). Em nào xin thêm giờ thì giảng viên nới riêng
--  cho em đó, không phải nâng quỹ của cả lớp.
--      Quỹ thực tế của một em = quỹ chung + phần nới riêng
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- 1. Phần nới riêng, tính bằng giây
alter table public.view_events add column if not exists quy_them int not null default 0;
comment on column public.view_events.quy_them is 'Giảng viên nới thêm cho riêng sinh viên này, tính bằng giây.';

-- 2. Sinh viên không được tự nới cho mình (trigger cũ nay giữ luôn cột này)
create or replace function public.ve_chan_gian_lan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;                                  -- máy chủ hoặc giảng viên: ghi sao giữ vậy
  end if;
  new.tong_giay := greatest(old.tong_giay, least(coalesce(new.tong_giay, 0), old.tong_giay + 60));
  new.opens     := greatest(old.opens,     least(coalesce(new.opens, 0),     old.opens + 1));
  new.quy_them  := old.quy_them;                 -- chỉ giảng viên nới được
  return new;
end $$;

-- 3. Giảng viên đặt phần nới cho một sinh viên ở một tài liệu (đặt số phút, 0 = bỏ nới)
create or replace function public.noi_quy_xem(p_user uuid, p_material uuid, p_phut int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  giay  int := greatest(0, least(coalesce(p_phut, 0), 6000)) * 60;   -- tối đa 100 giờ cho chắc
  v_ses uuid;
  v_lop uuid;
begin
  if not public.is_staff() then
    return jsonb_build_object('ok', false, 'reason', 'khong_co_quyen');
  end if;

  select m.session_id, s.class_id into v_ses, v_lop
  from public.materials m join public.sessions s on s.id = m.session_id
  where m.id = p_material;
  if v_ses is null then return jsonb_build_object('ok', false, 'reason', 'khong_thay_tai_lieu'); end if;

  insert into public.view_events (user_id, material_id, session_id, class_id, quy_them, opens, tong_giay)
  values (p_user, p_material, v_ses, v_lop, giay, 0, 0)
  on conflict (user_id, material_id) do update
    set quy_them = giay,
        session_id = coalesce(public.view_events.session_id, excluded.session_id),
        class_id   = coalesce(public.view_events.class_id,   excluded.class_id);

  return jsonb_build_object('ok', true, 'quy_them_giay', giay);
end $$;
revoke all on function public.noi_quy_xem(uuid, uuid, int) from public;
grant execute on function public.noi_quy_xem(uuid, uuid, int) to authenticated;

-- 4. Hàm cộng giờ xem trả về quỹ đã tính cả phần nới riêng
create or replace function public.ghi_gio_xem(p_material uuid, p_them int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me    uuid := auth.uid();
  them  int  := greatest(0, least(coalesce(p_them, 0), 60));
  quy   int;
  daxem int;
  noi   int;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;

  select coalesce(gioi_han_giay, 0) into quy from public.materials where id = p_material;
  if quy is null then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;

  update public.view_events
     set tong_giay = tong_giay + them,
         last_at   = now()
   where user_id = me and material_id = p_material
  returning tong_giay, quy_them into daxem, noi;

  if daxem is null then
    insert into public.view_events (user_id, material_id, tong_giay, opens)
    values (me, p_material, them, 1)
    on conflict (user_id, material_id) do update set tong_giay = public.view_events.tong_giay + them
    returning tong_giay, quy_them into daxem, noi;
  end if;

  noi := coalesce(noi, 0);
  return jsonb_build_object('ok', true, 'da_xem', daxem, 'gioi_han', case when quy > 0 then quy + noi else 0 end,
                            'quy_them', noi,
                            'con_lai', case when quy > 0 then greatest(0, quy + noi - daxem) else null end);
end $$;
revoke all on function public.ghi_gio_xem(uuid, int) from public;
grant execute on function public.ghi_gio_xem(uuid, int) to authenticated;

-- Xem thử: ai đang được nới thêm
select p.full_name, m.title, v.quy_them / 60 as noi_them_phut, v.tong_giay / 60 as da_xem_phut
from public.view_events v
join public.profiles p on p.id = v.user_id
join public.materials m on m.id = v.material_id
where v.quy_them > 0
order by p.full_name;
