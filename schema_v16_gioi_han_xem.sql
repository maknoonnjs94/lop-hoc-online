-- =====================================================================
--  GIỚI HẠN THỜI LƯỢNG XEM VIDEO + ĐẾM LƯỢT XEM
--
--  Ý tưởng: mỗi video giảng viên đặt một "quỹ thời gian xem" (ví dụ video 30 phút, cho quỹ 60 phút
--  = xem được khoảng 2 lượt). Máy chủ cộng dồn số giây sinh viên thực sự xem; hết quỹ thì
--  KHÔNG CẤP VÉ XEM nữa, video biến mất khỏi danh sách của riêng sinh viên đó.
--  Vì video chỉ mở được bằng vé do máy chủ ký, chặn ở đây là chặn thật, không phải ẩn trên giao diện.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- 1. Quỹ thời gian xem của từng tài liệu (0 = không giới hạn)
alter table public.materials add column if not exists gioi_han_giay int not null default 0;
comment on column public.materials.gioi_han_giay is 'Quỹ thời gian xem cho mỗi sinh viên, tính bằng giây. 0 = không giới hạn.';

-- 2. Tổng số giây đã xem, cộng dồn cho từng sinh viên × từng tài liệu
alter table public.view_events add column if not exists tong_giay int not null default 0;
comment on column public.view_events.tong_giay is 'Tổng số giây đã xem cộng dồn (chỉ tăng).';

-- 3. Chống gian lận: sinh viên không tự hạ được số giờ đã xem, cũng không nhảy cóc.
--    Mỗi lần ghi chỉ được cộng tối đa 60 giây và 1 lượt mở. Giảng viên và máy chủ (service role) miễn.
create or replace function public.ve_chan_gian_lan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;                                  -- máy chủ hoặc giảng viên: ghi sao giữ vậy
  end if;
  new.tong_giay := greatest(old.tong_giay, least(coalesce(new.tong_giay, 0), old.tong_giay + 60));
  new.opens     := greatest(old.opens,     least(coalesce(new.opens, 0),     old.opens + 1));
  return new;
end $$;

drop trigger if exists trg_ve_chan_gian_lan on public.view_events;
create trigger trg_ve_chan_gian_lan
  before update on public.view_events
  for each row execute function public.ve_chan_gian_lan();

-- 4. Trang học gọi hàm này mỗi ~20 giây khi video đang chạy, để cộng thời lượng đã xem.
--    Trả về quỹ còn lại để trang hiển thị.
create or replace function public.ghi_gio_xem(p_material uuid, p_them int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me    uuid := auth.uid();
  them  int  := greatest(0, least(coalesce(p_them, 0), 60));   -- mỗi lần tối đa 60 giây
  quy   int;
  daxem int;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;

  select coalesce(gioi_han_giay, 0) into quy from public.materials where id = p_material;
  if quy is null then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;

  update public.view_events
     set tong_giay = tong_giay + them,
         last_at   = now()
   where user_id = me and material_id = p_material
  returning tong_giay into daxem;

  if daxem is null then                           -- chưa có dòng (mở lần đầu chưa kịp ghi)
    insert into public.view_events (user_id, material_id, tong_giay, opens)
    values (me, p_material, them, 1)
    on conflict (user_id, material_id) do update set tong_giay = public.view_events.tong_giay + them
    returning tong_giay into daxem;
  end if;

  return jsonb_build_object('ok', true, 'da_xem', daxem, 'gioi_han', quy,
                            'con_lai', case when quy > 0 then greatest(0, quy - daxem) else null end);
end $$;
revoke all on function public.ghi_gio_xem(uuid, int) from public;
grant execute on function public.ghi_gio_xem(uuid, int) to authenticated;

-- Xem thử: các video đang đặt giới hạn
select s.no as buoi, m.title, m.kind, m.gioi_han_giay / 60 as quy_phut
from public.materials m join public.sessions s on s.id = m.session_id
where m.gioi_han_giay > 0
order by s.no, m.order_no;
