-- =====================================================================
--  KHOÁ MỘT THIẾT BỊ CHO MỖI TÀI KHOẢN SINH VIÊN
--
--  Dán TOÀN BỘ file này vào Supabase → SQL Editor → Run. Chạy một lần.
--  Chạy lại lần nữa cũng không sao (mọi câu đều "if not exists" / "or replace").
--
--  Sau khi chạy: mỗi sinh viên chỉ dùng được MỘT thiết bị. Máy thứ hai đăng
--  nhập sẽ bị máy chủ từ chối — không lách được bằng trình duyệt, vì phép
--  kiểm nằm ở đây chứ không nằm trong trang web.
--
--  Giáo viên (role teacher/admin) KHÔNG bị khoá, vẫn dùng nhiều máy.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Bảng ghi thiết bị. Khoá chính là user_id → mỗi người đúng một dòng.
-- ---------------------------------------------------------------------
create table if not exists public.device_bindings (
  user_id    uuid primary key references auth.users on delete cascade,
  device_id  text not null,                        -- mã ngẫu nhiên trình duyệt tự sinh
  ua         text default '',                      -- tên trình duyệt, chỉ để m nhìn cho biết
  first_seen timestamptz not null default now(),   -- lần gắn máy đầu tiên
  last_seen  timestamptz not null default now()    -- lần vào gần nhất
);

alter table public.device_bindings enable row level security;


-- ---------------------------------------------------------------------
-- 2. Luật đọc/ghi
--    - Sinh viên: chỉ ĐỌC được dòng của chính mình, không sửa, không xoá.
--    - Giáo viên: đọc hết, xoá được (để gỡ máy cho sinh viên đổi điện thoại).
--    Không ai INSERT/UPDATE thẳng được — chỉ đi qua hàm claim_device bên dưới.
-- ---------------------------------------------------------------------
drop policy if exists dev_doc         on public.device_bindings;
drop policy if exists dev_gv_doc_het  on public.device_bindings;
drop policy if exists dev_gv_xoa      on public.device_bindings;

create policy dev_doc on public.device_bindings
  for select using (user_id = auth.uid());

create policy dev_gv_doc_het on public.device_bindings
  for select using (public.is_staff());

create policy dev_gv_xoa on public.device_bindings
  for delete using (public.is_staff());


-- ---------------------------------------------------------------------
-- 3. Hàm ghi danh thiết bị — trang học gọi hàm này ngay sau khi đăng nhập.
--
--    Trả về jsonb:
--      { "ok": true }                                → cho vào
--      { "ok": true, "staff": true }                 → giáo viên, không khoá
--      { "ok": false, "reason": "other_device", ... } → máy khác, chặn
--
--    security definer: hàm chạy bằng quyền chủ bảng nên ghi được, còn người
--    gọi thì vẫn không tự sửa dòng của mình được. Đó là chỗ khiến khoá này
--    không lách được từ phía trình duyệt.
-- ---------------------------------------------------------------------
create or replace function public.claim_device(p_device text, p_ua text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  me   uuid := auth.uid();
  cur  public.device_bindings%rowtype;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap');
  end if;

  if coalesce(p_device, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'thieu_ma_thiet_bi');
  end if;

  -- Giáo viên không bị khoá máy
  if public.is_staff() then
    return jsonb_build_object('ok', true, 'staff', true);
  end if;

  -- Tài khoản đã bị tắt thì chặn luôn ở đây cho gọn
  if not public.is_active() then
    return jsonb_build_object('ok', false, 'reason', 'tai_khoan_da_tat');
  end if;

  select * into cur from public.device_bindings where user_id = me;

  if not found then
    insert into public.device_bindings (user_id, device_id, ua)
    values (me, p_device, left(coalesce(p_ua, ''), 300));
    return jsonb_build_object('ok', true, 'moi_gan', true);
  end if;

  if cur.device_id = p_device then
    update public.device_bindings
       set last_seen = now(), ua = left(coalesce(p_ua, ''), 300)
     where user_id = me;
    return jsonb_build_object('ok', true);
  end if;

  return jsonb_build_object(
    'ok', false,
    'reason', 'other_device',
    'gan_tu', cur.first_seen,
    'lan_cuoi', cur.last_seen
  );
end;
$$;

revoke all on function public.claim_device(text, text) from public;
grant execute on function public.claim_device(text, text) to authenticated;


-- ---------------------------------------------------------------------
-- 4. Hàm gỡ thiết bị — chỉ giáo viên gọi được, dùng khi sinh viên đổi máy.
-- ---------------------------------------------------------------------
create or replace function public.reset_device(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    return jsonb_build_object('ok', false, 'reason', 'khong_co_quyen');
  end if;
  delete from public.device_bindings where user_id = p_user;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.reset_device(uuid) from public;
grant execute on function public.reset_device(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Xem thử: ai đang gắn máy nào (chạy câu này bất cứ lúc nào để kiểm)
-- ---------------------------------------------------------------------
select p.full_name,
       p.student_no,
       p.email,
       d.ua        as trinh_duyet,
       d.first_seen as gan_tu,
       d.last_seen  as lan_vao_cuoi
from public.device_bindings d
join public.profiles p on p.id = d.user_id
order by d.last_seen desc;
