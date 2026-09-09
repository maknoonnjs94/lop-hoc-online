-- =====================================================================
--  Ô TRẢ LỜI ĐẶT TRÊN PHIẾU  —  sinh viên gõ thẳng vào chỗ trống, máy chấm đúng/sai
--
--  Giảng viên mở phiếu PDF trong trang quản trị, khoanh từng chỗ trống thành một ô,
--  gõ đáp án đúng cho ô đó. Sinh viên mở phiếu ra thấy ô nhập nằm đúng chỗ, gõ vào,
--  bấm Nộp. Máy so đáp án ngay và trả về đúng / gần đúng / sai cho từng ô.
--
--  QUAN TRỌNG: đáp án nằm ở bảng riêng "dap_an_o" mà **chỉ giảng viên đọc được**.
--  Toạ độ ô thì để trong materials (sinh viên phải đọc được để vẽ ô), nhưng KHÔNG
--  bao giờ kèm đáp án. Việc chấm chạy trong hàm trên máy chủ, đáp án không rời máy chủ.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- ------------------------------------------------ 1. Toạ độ ô (sinh viên đọc được)
--  [{ id, trang, x, y, w, h }]  — x,y,w,h tính theo PHẦN TRĂM của trang, nên phóng to
--  thu nhỏ hay xem trên điện thoại đều nằm đúng chỗ.
alter table public.materials add column if not exists o_tra_loi jsonb not null default '[]'::jsonb;

-- --------------------------------------------- 2. Đáp án (chỉ giảng viên đọc được)
--  { "<id ô>": { "dap_an": "0,1", "sai_so": 0.01 } }
--  sai_so để trống = so khớp chữ; có số = so khớp số với dung sai đó.
create table if not exists public.dap_an_o (
  material_id uuid primary key references public.materials(id) on delete cascade,
  dap_an      jsonb not null default '{}'::jsonb,
  cap_nhat    timestamptz not null default now()
);
alter table public.dap_an_o enable row level security;

drop policy if exists dao_gv on public.dap_an_o;
create policy dao_gv on public.dap_an_o for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------- 3. Bài nộp: thêm bốn cột
alter table public.bai_nop add column if not exists tra_loi  jsonb   not null default '{}'::jsonb;  -- { id ô: "sinh viên gõ gì" }
alter table public.bai_nop add column if not exists chi_tiet jsonb   not null default '{}'::jsonb;  -- { id ô: "dung" | "gan" | "sai" }
alter table public.bai_nop add column if not exists may_cham boolean not null default false;
alter table public.bai_nop add column if not exists can_xem  boolean not null default false;        -- có ô gần đúng, cần giảng viên ngó

-- ------------------------------------- 4. Chuẩn hoá trước khi so, không thì chấm oan
--  Bỏ khoảng trắng, về chữ thường, dấu phẩy thập phân → dấu chấm,
--  chỉ số dưới ₂ và số mũ ² → số thường (H₂SO₄ = H2SO4).
create or replace function public.chuan_dap(s text)
returns text language sql immutable as $$
  select lower(regexp_replace(
    translate(coalesce(s, ''),
              '₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹,',
              '01234567890123456789.'),
    '\s+', '', 'g'));
$$;

--  Chuỗi đã chuẩn có phải là một con số không
create or replace function public.la_so(s text)
returns boolean language sql immutable as $$
  select coalesce(s, '') ~ '^-?[0-9]+(\.[0-9]+)?$';
$$;

-- --------------------------------------------- 5. Chấm một ô: 'dung' | 'gan' | 'sai'
create or replace function public.cham_mot_o(p_sv text, p_dung text, p_sai_so numeric)
returns text language plpgsql immutable as $$
declare
  a text := public.chuan_dap(p_sv);
  b text := public.chuan_dap(p_dung);
  x numeric; y numeric; ss numeric;
begin
  if a = '' then return 'sai'; end if;

  -- Giảng viên ghi nhiều đáp án chấp nhận được, cách nhau bằng dấu |
  if position('|' in coalesce(p_dung, '')) > 0 then
    if a = any (select public.chuan_dap(t) from unnest(string_to_array(p_dung, '|')) as t) then
      return 'dung';
    end if;
  end if;

  if a = b then return 'dung'; end if;

  if public.la_so(a) and public.la_so(b) then
    x := a::numeric; y := b::numeric;
    ss := coalesce(p_sai_so, 0);
    if abs(x - y) <= ss then return 'dung'; end if;
    -- lệch ít thì đừng gạch vội, đẩy sang cho giảng viên xem
    if y <> 0 and abs(x - y) <= greatest(ss * 5, abs(y) * 0.02) then return 'gan'; end if;
    return 'sai';
  end if;

  -- Chữ: bỏ nốt mọi ký tự không phải chữ/số rồi so lại — sai mỗi dấu ngoặc thì cho là gần
  if regexp_replace(a, '[^a-z0-9]', '', 'g') = regexp_replace(b, '[^a-z0-9]', '', 'g') then
    return 'gan';
  end if;
  return 'sai';
end $$;

-- --------------------------------------------------- 6. Sinh viên nộp bài dạng ô
create or replace function public.nop_bai_o(p_material uuid, p_tra_loi jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  m      record;
  cu     record;
  da     jsonb;
  o      jsonb;
  oid    text;
  kq     jsonb := '{}'::jsonb;
  tt     text;
  so_o   int := 0;
  so_dg  int := 0;
  so_gan int := 0;
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;
  if not public.duoc_xem_tai_lieu(p_material) then
    return jsonb_build_object('ok', false, 'reason', 'khong_co_quyen');
  end if;

  select nhan_bai, han_nop, o_tra_loi into m from public.materials where id = p_material;
  if not found or not m.nhan_bai then return jsonb_build_object('ok', false, 'reason', 'khong_nhan_bai'); end if;
  if m.han_nop is not null and now() > m.han_nop then
    return jsonb_build_object('ok', false, 'reason', 'qua_han', 'han', m.han_nop);
  end if;
  if jsonb_array_length(coalesce(m.o_tra_loi, '[]'::jsonb)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'chua_dat_o');
  end if;

  -- Bài đã được người chấm thì không cho nộp đè; máy chấm thì làm lại được.
  select cham_luc, may_cham into cu from public.bai_nop where material_id = p_material and user_id = me;
  if found and cu.cham_luc is not null and not coalesce(cu.may_cham, false) then
    return jsonb_build_object('ok', false, 'reason', 'da_cham');
  end if;

  select coalesce(dap_an, '{}'::jsonb) into da from public.dap_an_o where material_id = p_material;
  da := coalesce(da, '{}'::jsonb);

  for o in select * from jsonb_array_elements(m.o_tra_loi) loop
    oid := o ->> 'id';
    so_o := so_o + 1;
    if da ? oid and coalesce(da -> oid ->> 'dap_an', '') <> '' then
      tt := public.cham_mot_o(
              coalesce(p_tra_loi ->> oid, ''),
              da -> oid ->> 'dap_an',
              nullif(da -> oid ->> 'sai_so', '')::numeric);
    else
      tt := 'chua';                      -- ô này giảng viên không đặt đáp án, chỉ thu bài
    end if;
    if tt = 'dung' then so_dg := so_dg + 1; end if;
    if tt = 'gan'  then so_gan := so_gan + 1; end if;
    kq := kq || jsonb_build_object(oid, tt);
  end loop;

  insert into public.bai_nop (material_id, user_id, tra_loi, chi_tiet, may_cham, can_xem,
                              diem, cham_luc, loi_nhan, tep)
  values (p_material, me, coalesce(p_tra_loi, '{}'::jsonb), kq, true, so_gan > 0,
          so_dg || '/' || so_o, now(), '', '[]'::jsonb)
  on conflict (material_id, user_id) do update
    set tra_loi = excluded.tra_loi, chi_tiet = excluded.chi_tiet, may_cham = true,
        can_xem = excluded.can_xem, diem = excluded.diem, cham_luc = now(), nop_luc = now();

  return jsonb_build_object('ok', true, 'so_o', so_o, 'so_dung', so_dg, 'so_gan', so_gan, 'chi_tiet', kq);
end $$;
revoke all on function public.nop_bai_o(uuid, jsonb) from public;
grant execute on function public.nop_bai_o(uuid, jsonb) to authenticated;

-- ---------------------------------- 7. Giảng viên lưu ô + đáp án cho một tài liệu
create or replace function public.dat_o_tra_loi(p_material uuid, p_o jsonb, p_dap_an jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  update public.materials set o_tra_loi = coalesce(p_o, '[]'::jsonb) where id = p_material;
  if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;
  insert into public.dap_an_o (material_id, dap_an, cap_nhat)
  values (p_material, coalesce(p_dap_an, '{}'::jsonb), now())
  on conflict (material_id) do update set dap_an = excluded.dap_an, cap_nhat = now();
  return jsonb_build_object('ok', true, 'so_o', jsonb_array_length(coalesce(p_o, '[]'::jsonb)));
end $$;
revoke all on function public.dat_o_tra_loi(uuid, jsonb, jsonb) from public;
grant execute on function public.dat_o_tra_loi(uuid, jsonb, jsonb) to authenticated;

-- ------------------------------- 8. Giảng viên đọc lại đáp án đã đặt (để sửa)
create or replace function public.lay_dap_an_o(p_material uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d jsonb;
begin
  if not public.is_staff() then return '{}'::jsonb; end if;
  select coalesce(dap_an, '{}'::jsonb) into d from public.dap_an_o where material_id = p_material;
  return coalesce(d, '{}'::jsonb);
end $$;
revoke all on function public.lay_dap_an_o(uuid) from public;
grant execute on function public.lay_dap_an_o(uuid) to authenticated;

-- Xem thử
select title, kind, nhan_bai, jsonb_array_length(o_tra_loi) as so_o
from public.materials where jsonb_array_length(o_tra_loi) > 0;

-- ------------------------- 9. Bảng bài nộp cho quản trị: thêm cờ máy chấm / cần xem
--  Phải xoá rồi tạo lại vì đổi danh sách cột trả về.
drop function if exists public.bang_bai_nop(uuid);
create or replace function public.bang_bai_nop(p_class uuid)
returns table (
  material_id uuid, tai_lieu text, session_no int, buoi text, han_nop timestamptz,
  user_id uuid, ho_ten text, email text,
  bai_id uuid, nop_luc timestamptz, loi_nhan text, tep jsonb,
  cham_luc timestamptz, diem text, nhan_xet text,
  may_cham boolean, can_xem boolean, so_o int
) language sql stable security definer set search_path = public as $$
  select m.id, m.title, s.no, coalesce(nullif(s.title, ''), 'Buổi ' || coalesce(s.no::text, '')), m.han_nop,
         p.id, p.full_name, p.email,
         b.id, b.nop_luc, b.loi_nhan, b.tep, b.cham_luc, b.diem, b.nhan_xet,
         coalesce(b.may_cham, false), coalesce(b.can_xem, false),
         jsonb_array_length(coalesce(m.o_tra_loi, '[]'::jsonb))
  from public.materials m
  join public.sessions s    on s.id = m.session_id
  join public.enrollments e on e.class_id = s.class_id
  join public.profiles p    on p.id = e.student
  left join public.bai_nop b on b.material_id = m.id and b.user_id = p.id
  where public.is_staff() and s.class_id = p_class and m.nhan_bai
  order by s.no desc nulls last, m.order_no, p.full_name;
$$;
revoke all on function public.bang_bai_nop(uuid) from public;
grant execute on function public.bang_bai_nop(uuid) to authenticated;
