-- =====================================================================
--  ĐẾM PHÚT PHÁT THEO THÁNG (để ước tính hoá đơn Cloudflare Stream)
--
--  Cloudflare tính tiền video theo phút: 5 USD / 1 000 phút LƯU mỗi tháng,
--  1 USD / 1 000 phút PHÁT. Khoá API hiện tại chỉ có quyền Stream:Edit nên không đọc
--  được thống kê của Cloudflare; ta tự cộng số phút sinh viên xem, gom theo từng tháng.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy một lần; chạy lại cũng không sao.
-- =====================================================================

-- 1. Mỗi tháng một dòng
create table if not exists public.dung_luong_thang (
  thang     text primary key,                     -- '2026-09' theo giờ Việt Nam
  giay_phat bigint not null default 0,            -- tổng số giây sinh viên đã xem trong tháng
  cap_nhat  timestamptz not null default now()
);
alter table public.dung_luong_thang enable row level security;

drop policy if exists dlt_gv_doc on public.dung_luong_thang;
create policy dlt_gv_doc on public.dung_luong_thang for select using (public.is_staff());
-- Không có luật ghi: chỉ hàm ghi_gio_xem (security definer) cộng vào.

-- 2. Hàm cộng giờ xem: cộng luôn vào bộ đếm tháng
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

  -- bộ đếm tháng, dùng để ước tính hoá đơn
  if them > 0 then
    insert into public.dung_luong_thang (thang, giay_phat)
    values (to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM'), them)
    on conflict (thang) do update
      set giay_phat = public.dung_luong_thang.giay_phat + excluded.giay_phat,
          cap_nhat  = now();
  end if;

  noi := coalesce(noi, 0);
  return jsonb_build_object('ok', true, 'da_xem', daxem, 'gioi_han', case when quy > 0 then quy + noi else 0 end,
                            'quy_them', noi,
                            'con_lai', case when quy > 0 then greatest(0, quy + noi - daxem) else null end);
end $$;
revoke all on function public.ghi_gio_xem(uuid, int) from public;
grant execute on function public.ghi_gio_xem(uuid, int) to authenticated;

-- 3. Gộp sẵn số phút đã xem từ trước (nếu đã có dữ liệu) vào tháng hiện tại, để bảng không trống trơn
insert into public.dung_luong_thang (thang, giay_phat)
select to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM'), coalesce(sum(v.tong_giay), 0)
from public.view_events v join public.materials m on m.id = v.material_id
where m.kind = 'video'
on conflict (thang) do nothing;

-- Xem thử
select thang, round(giay_phat / 60.0) as phut_phat, cap_nhat from public.dung_luong_thang order by thang desc;
