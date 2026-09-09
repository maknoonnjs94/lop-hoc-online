-- =====================================================================
--  XEM BÀI SINH VIÊN ĐÃ ĐIỀN  +  THỐNG KÊ CÂU HAY SAI
--
--  1. Máy chấm xong chỉ hiện "3/4" mà giảng viên không mở ra xem được sinh viên
--     gõ chữ gì — nhãn "cần xem lại" ở câu gần đúng vì thế thành vô dụng.
--     Hàm xem_bai_o trả về từng ô: sinh viên gõ gì, đáp án đúng là gì, máy chấm ra sao.
--     Hàm sua_o_cham cho giảng viên đổi kết luận của máy ở một ô.
--
--  2. Hàm thong_ke_o cộng lại cả lớp: câu nào bao nhiêu em đúng / gần / sai,
--     để biết buổi sau phải giảng lại chỗ nào.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- ------------------------------------------- 1. Xem chi tiết một bài đã nộp
create or replace function public.xem_bai_o(p_bai uuid)
returns table (o_id text, thu_tu int, sv_go text, dap_an text, trang_thai text)
language sql stable security definer set search_path = public as $$
  select t.o ->> 'id',
         t.ord::int,
         coalesce(b.tra_loi ->> (t.o ->> 'id'), ''),
         coalesce(d.dap_an -> (t.o ->> 'id') ->> 'dap_an', ''),
         coalesce(b.chi_tiet ->> (t.o ->> 'id'), 'chua')
  from public.bai_nop b
  join public.materials m on m.id = b.material_id
  left join public.dap_an_o d on d.material_id = m.id
  cross join lateral jsonb_array_elements(coalesce(m.o_tra_loi, '[]'::jsonb))
             with ordinality as t(o, ord)
  where public.is_staff() and b.id = p_bai
  order by t.ord;
$$;
revoke all on function public.xem_bai_o(uuid) from public;
grant execute on function public.xem_bai_o(uuid) to authenticated;

-- --------------------------- 2. Giảng viên đổi kết luận của máy ở một ô
create or replace function public.sua_o_cham(p_bai uuid, p_o text, p_trang_thai text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ct   jsonb;
  ods  jsonb;
  so_o int;
  dg   int;
  gan  int;
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  if p_trang_thai not in ('dung', 'gan', 'sai') then
    return jsonb_build_object('ok', false, 'reason', 'trang_thai_la');
  end if;

  select coalesce(b.chi_tiet, '{}'::jsonb), coalesce(m.o_tra_loi, '[]'::jsonb)
    into ct, ods
  from public.bai_nop b join public.materials m on m.id = b.material_id
  where b.id = p_bai;
  if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;

  ct   := ct || jsonb_build_object(p_o, p_trang_thai);
  so_o := jsonb_array_length(ods);

  select count(*) filter (where e.value #>> '{}' = 'dung'),
         count(*) filter (where e.value #>> '{}' = 'gan')
    into dg, gan
  from jsonb_each(ct) as e;

  update public.bai_nop
     set chi_tiet = ct,
         diem     = dg || '/' || so_o,
         can_xem  = (gan > 0),
         cham_luc = now()
   where id = p_bai;

  return jsonb_build_object('ok', true, 'so_dung', dg, 'so_gan', gan, 'so_o', so_o);
end $$;
revoke all on function public.sua_o_cham(uuid, text, text) from public;
grant execute on function public.sua_o_cham(uuid, text, text) to authenticated;

-- ------------------------------------- 3. Câu nào cả lớp sai nhiều nhất
create or replace function public.thong_ke_o(p_class uuid)
returns table (
  material_id uuid, tai_lieu text, buoi text,
  o_id text, thu_tu int, dap_an text,
  so_dung int, so_gan int, so_sai int, so_nop int
) language sql stable security definer set search_path = public as $$
  select m.id,
         m.title,
         coalesce(nullif(s.title, ''), 'Buổi ' || coalesce(s.no::text, '')),
         t.o ->> 'id',
         t.ord::int,
         coalesce(d.dap_an -> (t.o ->> 'id') ->> 'dap_an', ''),
         count(*) filter (where b.chi_tiet ->> (t.o ->> 'id') = 'dung')::int,
         count(*) filter (where b.chi_tiet ->> (t.o ->> 'id') = 'gan')::int,
         count(*) filter (where b.chi_tiet ->> (t.o ->> 'id') = 'sai')::int,
         count(b.id)::int
  from public.materials m
  join public.sessions s on s.id = m.session_id
  left join public.dap_an_o d on d.material_id = m.id
  cross join lateral jsonb_array_elements(coalesce(m.o_tra_loi, '[]'::jsonb))
             with ordinality as t(o, ord)
  left join public.bai_nop b
         on b.material_id = m.id and b.chi_tiet ? (t.o ->> 'id')
  where public.is_staff()
    and s.class_id = p_class
    and jsonb_array_length(coalesce(m.o_tra_loi, '[]'::jsonb)) > 0
  group by m.id, m.title, m.order_no, s.title, s.no, t.o, t.ord, d.dap_an
  order by s.no desc nulls last, m.order_no, t.ord;
$$;
revoke all on function public.thong_ke_o(uuid) from public;
grant execute on function public.thong_ke_o(uuid) to authenticated;

-- Xem thử (đổi <id lớp> thành lớp của m nếu muốn chạy tay)
-- select * from public.thong_ke_o('<id lớp>');
select 'v22 xong' as ket_qua;
