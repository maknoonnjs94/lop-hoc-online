-- =====================================================================
--  v23 — MỤC HỎI ĐÁP RIÊNG  +  CÂU HỎI THƯỜNG GẶP
--
--  Tới v22, mỗi câu hỏi buộc phải gắn vào một tài liệu (material_id NOT NULL)
--  và chỉ đọc được khi mở tài liệu đó ra. Hệ quả: không có chỗ nào để hỏi
--  câu chung ("cuối kỳ thi phần nào ạ?"), và câu trả lời hay thì chìm nghỉm
--  dưới đáy một phiếu bài tập của buổi 3.
--
--  v23 mở ra ba việc:
--    1. Câu hỏi có thể KHÔNG gắn tài liệu — chỉ gắn lớp (cột class_id).
--    2. Giảng viên GHIM một câu vào mục "Câu hỏi thường gặp" của lớp; câu đã
--       ghim thì cả lớp đọc được, không phụ thuộc vào việc tài liệu gốc đã mở
--       hay chưa. Giảng viên cũng tự soạn được câu hỏi + trả lời mà không cần
--       chờ ai hỏi (hàm luu_faq).
--    3. Nhóm câu ghim theo chủ đề (cột chu_de) và tự xếp thứ tự (ghim_stt).
--
--  GIỮ NGUYÊN: tên người hỏi không bao giờ ra khỏi máy chủ cho bạn học —
--  bảng cau_hoi không cho sinh viên đọc profiles, và trang học không hỏi tên.
--  Câu chưa được trả lời vẫn chỉ chính người hỏi thấy.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Cột mới
alter table public.cau_hoi add column if not exists class_id uuid references public.classes(id) on delete cascade;
alter table public.cau_hoi add column if not exists ghim     boolean not null default false;
alter table public.cau_hoi add column if not exists ghim_stt int;
alter table public.cau_hoi add column if not exists chu_de   text;
alter table public.cau_hoi alter column material_id drop not null;

-- Điền class_id cho các câu hỏi đã có
update public.cau_hoi c
   set class_id = s.class_id
  from public.materials m
  join public.sessions s on s.id = m.session_id
 where m.id = c.material_id and c.class_id is null;

create index if not exists cau_hoi_lop_idx  on public.cau_hoi (class_id, tao_luc desc);
create index if not exists cau_hoi_ghim_idx on public.cau_hoi (class_id, ghim_stt) where ghim;

-- ------------------------------------- 2. class_id luôn suy ra từ tài liệu
--  Không tin máy khách: nếu câu hỏi có gắn tài liệu thì lớp phải là lớp của
--  tài liệu đó, dù trang web gửi lên gì đi nữa.
create or replace function public.cau_hoi_dien_lop() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.material_id is not null then
    select s.class_id into new.class_id
      from public.materials m
      join public.sessions s on s.id = m.session_id
     where m.id = new.material_id;
  end if;
  return new;
end $$;

drop trigger if exists cau_hoi_lop on public.cau_hoi;
create trigger cau_hoi_lop before insert or update of material_id on public.cau_hoi
  for each row execute function public.cau_hoi_dien_lop();

-- ---------------------------------------------------------------- 3. Luật đọc
drop policy if exists ch_doc on public.cau_hoi;
create policy ch_doc on public.cau_hoi for select to authenticated
  using (
    public.is_staff()
    or (not an and (
          -- (a) đã ghim vào "thường gặp" và đã có trả lời: cả lớp đọc được,
          --     không cần mở tài liệu gốc — đó chính là ý nghĩa của việc ghim
          (ghim and tra_loi is not null
           and public.is_active() and public.in_class(class_id))
          -- (b) câu hỏi dưới một tài liệu: phải xem được tài liệu đó
          or (material_id is not null and public.duoc_xem_tai_lieu(material_id)
              and (user_id = auth.uid() or tra_loi is not null))
          -- (c) câu hỏi chung của lớp
          or (material_id is null
              and public.is_active() and public.in_class(class_id)
              and (user_id = auth.uid() or tra_loi is not null))
        )));

drop policy if exists ch_them on public.cau_hoi;
create policy ch_them on public.cau_hoi for insert to authenticated
  with check (
    user_id = auth.uid() and not ghim and tra_loi is null
    and ((material_id is not null and public.duoc_xem_tai_lieu(material_id))
         or (material_id is null and public.is_active() and public.in_class(class_id))));

--  Sinh viên rút lại câu chưa được trả lời; câu đã ghim thì thôi.
drop policy if exists ch_xoa on public.cau_hoi;
create policy ch_xoa on public.cau_hoi for delete to authenticated
  using (public.is_staff() or (user_id = auth.uid() and tra_loi is null and not ghim));

-- ------------------------------------------------ 4. Ghim / bỏ ghim một câu
create or replace function public.ghim_cau_hoi(p_id uuid, p_ghim boolean, p_chu_de text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lop uuid; v_max int; v_bat boolean := coalesce(p_ghim, false);
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  select class_id into v_lop from public.cau_hoi where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;
  select coalesce(max(ghim_stt), 0) into v_max
    from public.cau_hoi where class_id = v_lop and ghim and id <> p_id;
  update public.cau_hoi
     set ghim     = v_bat,
         chu_de   = case when p_chu_de is null then chu_de else nullif(trim(p_chu_de), '') end,
         ghim_stt = case when v_bat then coalesce(ghim_stt, v_max + 1) else null end
   where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.ghim_cau_hoi(uuid, boolean, text) from public;
grant execute on function public.ghim_cau_hoi(uuid, boolean, text) to authenticated;

-- ------------------------- 5. Giảng viên tự soạn một câu hỏi thường gặp
--  Không cần chờ ai hỏi: viết luôn cả câu hỏi lẫn câu trả lời.
--  p_id là null thì thêm mới, khác null thì sửa.
create or replace function public.luu_faq(p_id uuid, p_class uuid, p_hoi text, p_dap text,
                                          p_chu_de text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_max int; v_id uuid := p_id; v_lop uuid := p_class;
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  if trim(coalesce(p_hoi, '')) = '' then return jsonb_build_object('ok', false, 'reason', 'thieu_cau_hoi'); end if;
  if trim(coalesce(p_dap, '')) = '' then return jsonb_build_object('ok', false, 'reason', 'thieu_tra_loi'); end if;

  if v_id is null then
    if v_lop is null then return jsonb_build_object('ok', false, 'reason', 'thieu_lop'); end if;
    select coalesce(max(ghim_stt), 0) + 1 into v_max
      from public.cau_hoi where class_id = v_lop and ghim;
    insert into public.cau_hoi (material_id, class_id, user_id, noi_dung,
                                tra_loi, tra_luc, tra_boi, ghim, ghim_stt, chu_de)
    values (null, v_lop, auth.uid(), trim(p_hoi),
            trim(p_dap), now(), auth.uid(), true, v_max, nullif(trim(coalesce(p_chu_de, '')), ''))
    returning id into v_id;
  else
    select class_id into v_lop from public.cau_hoi where id = v_id;
    if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;
    select coalesce(max(ghim_stt), 0) into v_max
      from public.cau_hoi where class_id = v_lop and ghim and id <> v_id;
    update public.cau_hoi
       set noi_dung = trim(p_hoi),
           tra_loi  = trim(p_dap),
           tra_luc  = coalesce(tra_luc, now()),
           tra_boi  = auth.uid(),
           ghim     = true,
           ghim_stt = coalesce(ghim_stt, v_max + 1),
           chu_de   = nullif(trim(coalesce(p_chu_de, '')), ''),
           an       = false
     where id = v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.luu_faq(uuid, uuid, text, text, text) from public;
grant execute on function public.luu_faq(uuid, uuid, text, text, text) to authenticated;

-- --------------------------------- 6. Đổi thứ tự một câu trong mục thường gặp
create or replace function public.xep_faq(p_id uuid, p_len boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lop uuid; v_stt int; v_kia uuid; v_kstt int;
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  select class_id, coalesce(ghim_stt, 0) into v_lop, v_stt
    from public.cau_hoi where id = p_id and ghim;
  if not found then return jsonb_build_object('ok', false, 'reason', 'khong_thay'); end if;

  if coalesce(p_len, true) then
    select id, coalesce(ghim_stt, 0) into v_kia, v_kstt from public.cau_hoi
     where class_id = v_lop and ghim and coalesce(ghim_stt, 0) < v_stt
     order by coalesce(ghim_stt, 0) desc limit 1;
  else
    select id, coalesce(ghim_stt, 0) into v_kia, v_kstt from public.cau_hoi
     where class_id = v_lop and ghim and coalesce(ghim_stt, 0) > v_stt
     order by coalesce(ghim_stt, 0) asc limit 1;
  end if;
  if v_kia is null then return jsonb_build_object('ok', true, 'reason', 'het_duong'); end if;

  update public.cau_hoi set ghim_stt = v_stt  where id = v_kia;
  update public.cau_hoi set ghim_stt = v_kstt where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.xep_faq(uuid, boolean) from public;
grant execute on function public.xep_faq(uuid, boolean) to authenticated;

-- ------------------------ 7. Bảng câu hỏi cho trang quản trị (dựng lại)
--  Thêm ghim / ghim_stt / chu_de, và tài liệu giờ có thể rỗng (câu hỏi chung).
drop function if exists public.bang_cau_hoi(uuid);
create or replace function public.bang_cau_hoi(p_class uuid)
returns table (
  id uuid, material_id uuid, tai_lieu text, buoi text, session_no int,
  ho_ten text, email text, cua_gv boolean,
  noi_dung text, tao_luc timestamptz, tra_loi text, tra_luc timestamptz, an boolean,
  ghim boolean, ghim_stt int, chu_de text
) language sql stable security definer set search_path = public as $$
  select c.id, m.id, m.title,
         case when m.id is null then null
              else coalesce(nullif(s.title, ''), 'Buổi ' || coalesce(s.no::text, '')) end,
         s.no,
         p.full_name, p.email, coalesce(p.role, 'student') <> 'student',
         c.noi_dung, c.tao_luc, c.tra_loi, c.tra_luc, c.an,
         c.ghim, c.ghim_stt, c.chu_de
  from public.cau_hoi c
  left join public.materials m on m.id = c.material_id
  left join public.sessions  s on s.id = m.session_id
  left join public.profiles  p on p.id = c.user_id
  where public.is_staff() and c.class_id = p_class
  order by c.ghim desc, coalesce(c.ghim_stt, 999999), (c.tra_loi is not null), c.tao_luc desc;
$$;
revoke all on function public.bang_cau_hoi(uuid) from public;
grant execute on function public.bang_cau_hoi(uuid) to authenticated;

-- Xem thử
select count(*) filter (where ghim)                as da_ghim,
       count(*) filter (where material_id is null) as cau_chung,
       count(*)                                    as tong
  from public.cau_hoi;
