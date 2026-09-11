-- =====================================================================
--  v24 — THÙNG RÁC cho buổi & tài liệu  +  BỘ CHẤM hiểu ký hiệu khoa học
--
--  A. Thùng rác. Tới v23 "Xoá buổi" là xoá THẲNG, cascade: mất luôn tài liệu, bài nộp,
--     câu hỏi, lượt xem kèm theo — một cú bấm nhầm là không lấy lại được. Giờ xoá là
--     đánh dấu deleted_at (xoá mềm): sinh viên không thấy nữa, giảng viên khôi phục
--     được từ Thùng rác, 30 ngày sau mới dọn thật.
--
--  B. Bộ chấm. Sinh viên gõ bằng bộ gõ ký hiệu trên ô đáp án: 1,74×10⁻⁵, 10^-5, 1.74e-5…
--     chuan_dap() trước chỉ hiểu chỉ số/số mũ Unicode của CHỮ SỐ, không hiểu ⁻ ⁺ × và
--     dạng a×10^b. Giờ so_khoa_hoc() quy mọi kiểu viết về một con số rồi mới so.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- ======================================================= A. THÙNG RÁC
alter table public.sessions  add column if not exists deleted_at timestamptz;
alter table public.materials add column if not exists deleted_at timestamptz;
create index if not exists sessions_thung_rac_idx  on public.sessions  (class_id)   where deleted_at is not null;
create index if not exists materials_thung_rac_idx on public.materials (session_id) where deleted_at is not null;

-- Sinh viên không bao giờ thấy thứ đã vào thùng rác: chặn ở luật đọc, không tin trang web.
drop policy if exists s_read on public.sessions;
create policy s_read on public.sessions for select to authenticated
  using (public.is_staff()
         or (published and deleted_at is null and public.is_active() and public.in_class(class_id)));

drop policy if exists m_read on public.materials;
create policy m_read on public.materials for select to authenticated
  using (public.is_staff()
         or (deleted_at is null and exists (
               select 1 from public.sessions s
               where s.id = session_id and s.published and s.deleted_at is null
                 and public.is_active() and public.in_class(s.class_id))));

drop policy if exists mc_read on public.material_contents;
create policy mc_read on public.material_contents for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.materials m
    join public.sessions s on s.id = m.session_id
    where m.id = material_id and s.published and s.deleted_at is null and m.deleted_at is null
      and public.is_active() and public.in_class(s.class_id)
      and (m.open_at is null or m.open_at <= now())));

-- Cổng của nộp bài / hỏi bài / ô đáp án cũng phải đóng với thứ đã vào thùng rác
create or replace function public.duoc_xem_tai_lieu(p_material uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.materials m
    join public.sessions s on s.id = m.session_id
    where m.id = p_material
      and s.published and s.deleted_at is null and m.deleted_at is null
      and public.is_active() and public.in_class(s.class_id)
      and (m.open_at is null or m.open_at <= now()));
$$;

-- Dọn thật những gì đã nằm trong thùng rác quá 30 ngày (trang quản trị gọi mỗi lần mở)
create or replace function public.don_thung_rac()
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_s int; n_m int;
begin
  if not public.is_staff() then return jsonb_build_object('ok', false, 'reason', 'khong_phai_gv'); end if;
  delete from public.materials where deleted_at is not null and deleted_at < now() - interval '30 days';
  get diagnostics n_m = row_count;
  delete from public.sessions  where deleted_at is not null and deleted_at < now() - interval '30 days';
  get diagnostics n_s = row_count;
  return jsonb_build_object('ok', true, 'buoi', n_s, 'tai_lieu', n_m);
end $$;
revoke all on function public.don_thung_rac() from public;
grant execute on function public.don_thung_rac() to authenticated;

-- Ba bảng tổng hợp của trang quản trị: bỏ qua thứ đã vào thùng rác (khôi phục là hiện lại)
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
    and s.deleted_at is null and m.deleted_at is null
  order by s.no desc nulls last, m.order_no, p.full_name;
$$;
revoke all on function public.bang_bai_nop(uuid) from public;
grant execute on function public.bang_bai_nop(uuid) to authenticated;

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
    and m.deleted_at is null and s.deleted_at is null      -- null khi câu hỏi chung: vẫn đúng
  order by c.ghim desc, coalesce(c.ghim_stt, 999999), (c.tra_loi is not null), c.tao_luc desc;
$$;
revoke all on function public.bang_cau_hoi(uuid) from public;
grant execute on function public.bang_cau_hoi(uuid) to authenticated;

drop function if exists public.thong_ke_o(uuid);
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
    and s.deleted_at is null and m.deleted_at is null
    and jsonb_array_length(coalesce(m.o_tra_loi, '[]'::jsonb)) > 0
  group by m.id, m.title, m.order_no, s.title, s.no, t.o, t.ord, d.dap_an
  order by s.no desc nulls last, m.order_no, t.ord;
$$;
revoke all on function public.thong_ke_o(uuid) from public;
grant execute on function public.thong_ke_o(uuid) to authenticated;

-- ============================================ B. BỘ CHẤM hiểu ký hiệu khoa học
--  Chuẩn hoá: bỏ khoảng trắng, hạ chữ thường, chỉ số/số mũ Unicode → chữ số,
--  phẩy → chấm, ⁻ ⁺ − → - + -, các dấu nhân × · ⋅ → *
create or replace function public.chuan_dap(s text)
returns text language sql immutable as $$
  select lower(regexp_replace(
    translate(coalesce(s, ''),
              '₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹,⁻⁺−×·⋅',
              '01234567890123456789.-+-***'),
    '\s+', '', 'g'));
$$;

--  Đọc một chuỗi ĐÃ chuẩn hoá thành số, chấp nhận mọi cách viết hay gặp:
--    0.0000174 · 1.74*10^-5 · 1.74*10^(-5) · 1.74e-5 · 10^-5 · 1.74*10-5 (dấu mũ rơi khi bóc)
--  Không đọc được thì trả null (là chữ, so kiểu chữ).
create or replace function public.so_khoa_hoc(s text)
returns numeric language plpgsql immutable as $$
declare m text[];
begin
  if s is null or s = '' then return null; end if;
  if s ~ '^-?[0-9]+(\.[0-9]+)?$' then return s::numeric; end if;
  m := regexp_match(s, '^(-?[0-9]+(?:\.[0-9]+)?)?\*?(?:10\^?\(?(-?[0-9]+)\)?|e(-?[0-9]+))$');
  if m is null then return null; end if;
  return coalesce(nullif(m[1], '')::numeric, 1) * power(10::numeric, coalesce(m[2], m[3])::numeric);
exception when others then
  return null;
end $$;

--  Chấm một ô: 'dung' | 'gan' | 'sai'
--  Số: đúng khi lệch không quá sai số giảng viên đặt, HOẶC không quá 0,5% (làm tròn chữ số
--  có nghĩa thứ ba — 1,74×10⁻⁵ và 1,7×10⁻⁵ thì "gần", 1,74 và 1,745 thì "đúng").
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

  x := public.so_khoa_hoc(a); y := public.so_khoa_hoc(b);
  if x is not null and y is not null then
    ss := greatest(coalesce(p_sai_so, 0), abs(y) * 0.005);
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

-- Xem thử bộ chấm
select public.cham_mot_o('1,74×10⁻⁵', '0,0000174', null)  as a_dung,
       public.cham_mot_o('1.74e-5',   '1,74*10^-5', null)  as b_dung,
       public.cham_mot_o('1,7×10⁻⁵',  '1,74×10⁻⁵',  null)  as c_gan,
       public.cham_mot_o('2×10⁻⁵',    '1,74×10⁻⁵',  null)  as d_sai,
       public.cham_mot_o('H₂SO₄',     'H2SO4',      null)  as e_dung,
       (select count(*) from public.sessions where deleted_at is not null) as buoi_trong_thung_rac;
