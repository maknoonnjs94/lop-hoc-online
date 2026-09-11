-- =====================================================================
-- v26 — HỌC PHÍ: chuyển khoản theo QR, hạn 2 tuần, khoá theo TỪNG KHOÁ (2026-09-11)
-- =====================================================================
-- Ý tưởng:
--   • Mỗi LỚP (classes) đặt học phí (VND) và số ngày được nợ (mặc định 14). Học phí 0 = không thu.
--   • Mỗi GHI DANH (enrollments = 1 sinh viên × 1 lớp) có hạn riêng, mốc đóng, miễn, "SV báo đã chuyển".
--     Sinh viên học 2–3 khoá thì mỗi khoá tính riêng: đóng khoá nào mở khoá đó, khoá nào quá hạn thì
--     chỉ khoá ấy tạm đóng — các khoá khác vẫn học bình thường.
--   • Hạn = ngày ghi danh (hoặc ngày giảng viên bắt đầu thu, nếu muộn hơn) + số ngày; giảng viên gia hạn
--     bằng cách đặt han_dong riêng.
--   • Chặn thật ở máy chủ: quá hạn chưa đóng thì RLS không trả buổi học / tài liệu / nội dung của lớp đó,
--     Worker không ký vé video. Giao diện chỉ hiện màn học phí (QR có sẵn số tiền + nội dung chuyển).
--   • Thông tin ngân hàng nhận tiền cất ở cau_hinh_he_thong (khoá 'ngan_hang'), chỉ đọc qua hàm.
--
-- Chạy: Supabase → SQL Editor → dán cả tệp → Run. Chạy lại được.
-- Kiểm: /api/trang-thai → "v26_hoc_phi": true

-- ---------- cột ----------
alter table public.classes add column if not exists hoc_phi    numeric not null default 0;   -- VND; 0 = không thu
alter table public.classes add column if not exists han_ngay   integer not null default 14;  -- số ngày được nợ kể từ mốc
alter table public.classes add column if not exists hoc_phi_tu timestamptz;                  -- lúc bắt đầu thu (đặt khi đổi học phí)

alter table public.enrollments add column if not exists han_dong      date;          -- hạn riêng (gia hạn); null = tự tính
alter table public.enrollments add column if not exists da_dong_at    timestamptz;   -- giảng viên xác nhận đã nhận
alter table public.enrollments add column if not exists so_tien       numeric;       -- số đã nhận
alter table public.enrollments add column if not exists mien          boolean not null default false;
alter table public.enrollments add column if not exists bao_chuyen_at timestamptz;   -- sinh viên bấm "tôi đã chuyển"
alter table public.enrollments add column if not exists ghi_chu_hp    text;

-- ---------- hạn thực tế của một ghi danh ----------
create or replace function public.han_hoc_phi(p_class uuid, p_student uuid)
returns date language sql stable security definer set search_path = public as $$
  select coalesce(e.han_dong,
                  (greatest(e.joined_at, coalesce(c.hoc_phi_tu, e.joined_at)) + make_interval(days => c.han_ngay))::date)
  from public.enrollments e join public.classes c on c.id = e.class_id
  where e.class_id = p_class and e.student = p_student;
$$;

-- ---------- trạng thái: mien | da_dong | chua_han | qua_han ----------
create or replace function public.trang_thai_hoc_phi(p_class uuid, p_student uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when c.hoc_phi <= 0 or e.mien then 'mien'
    when e.da_dong_at is not null then 'da_dong'
    when public.han_hoc_phi(p_class, p_student) >= current_date then 'chua_han'
    else 'qua_han' end
  from public.enrollments e join public.classes c on c.id = e.class_id
  where e.class_id = p_class and e.student = p_student;
$$;

-- người đang gọi có được học lớp này không (giảng viên luôn được)
create or replace function public.hoc_phi_ok(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff() or coalesce(public.trang_thai_hoc_phi(p_class, auth.uid()), 'mien') <> 'qua_han';
$$;

-- ---------- chặn ở máy chủ: buổi / tài liệu / nội dung ----------
drop policy if exists s_read on public.sessions;
create policy s_read on public.sessions for select to authenticated
  using (public.is_staff()
         or (published and deleted_at is null and public.is_active() and public.in_class(class_id)
             and public.hoc_phi_ok(class_id)));

drop policy if exists m_read on public.materials;
create policy m_read on public.materials for select to authenticated
  using (public.is_staff()
         or (deleted_at is null and exists (
               select 1 from public.sessions s
               where s.id = session_id and s.published and s.deleted_at is null
                 and public.is_active() and public.in_class(s.class_id) and public.hoc_phi_ok(s.class_id))));

drop policy if exists mc_read on public.material_contents;
create policy mc_read on public.material_contents for select to authenticated
  using (public.is_staff() or exists (
    select 1 from public.materials m
    join public.sessions s on s.id = m.session_id
    where m.id = material_id and s.published and s.deleted_at is null and m.deleted_at is null
      and public.is_active() and public.in_class(s.class_id) and public.hoc_phi_ok(s.class_id)
      and (m.open_at is null or m.open_at <= now())));

create or replace function public.duoc_xem_tai_lieu(p_material uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.materials m
    join public.sessions s on s.id = m.session_id
    where m.id = p_material
      and s.published and s.deleted_at is null and m.deleted_at is null
      and public.is_active() and public.in_class(s.class_id) and public.hoc_phi_ok(s.class_id)
      and (m.open_at is null or m.open_at <= now())
  ) or public.is_staff();
$$;

-- ---------- ngân hàng nhận tiền (giảng viên đặt một lần) ----------
-- gia_tri: { "bin": "970422", "ma": "MB", "ten_nh": "MB Bank", "stk": "0123456789", "ten_tk": "PHAM ANH NGOC", "qr_anh": "data:image/..." }
create or replace function public.luu_ngan_hang(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'chi_giang_vien'; end if;
  insert into public.cau_hinh_he_thong (khoa, gia_tri, updated_at) values ('ngan_hang', coalesce(p, '{}'::jsonb), now())
  on conflict (khoa) do update set gia_tri = excluded.gia_tri, updated_at = now();
end $$;

create or replace function public.doc_ngan_hang()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then coalesce((select gia_tri from public.cau_hinh_he_thong where khoa = 'ngan_hang'), '{}'::jsonb) else null end;
$$;

-- ---------- sinh viên: học phí của tôi (mọi lớp đang ghi danh) ----------
create or replace function public.hoc_phi_cua_toi()
returns table (class_id uuid, ten text, hoc_phi numeric, han date, da_dong_at timestamptz, so_tien numeric,
               mien boolean, bao_chuyen_at timestamptz, trang_thai text, mssv text, ngan_hang jsonb)
language sql stable security definer set search_path = public as $$
  select e.class_id, c.name, c.hoc_phi,
         public.han_hoc_phi(e.class_id, e.student),
         e.da_dong_at, e.so_tien, e.mien, e.bao_chuyen_at,
         public.trang_thai_hoc_phi(e.class_id, e.student),
         coalesce(nullif((select p.student_no from public.profiles p where p.id = auth.uid()), ''),
                  upper(right(replace(auth.uid()::text, '-', ''), 6))),
         (select gia_tri - 'qr_anh' || jsonb_build_object('co_qr_anh', (gia_tri ? 'qr_anh'))
            from public.cau_hinh_he_thong where khoa = 'ngan_hang')
  from public.enrollments e join public.classes c on c.id = e.class_id
  where e.student = auth.uid() and not c.archived;
$$;

-- ảnh QR tự tải (nếu giảng viên không dùng VietQR): trả riêng cho gọn, chỉ cho sinh viên đang ghi danh
create or replace function public.anh_qr_hoc_phi()
returns text language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from public.enrollments where student = auth.uid()) or public.is_staff()
              then (select gia_tri ->> 'qr_anh' from public.cau_hinh_he_thong where khoa = 'ngan_hang') end;
$$;

-- sinh viên bấm "tôi đã chuyển" — chỉ ghi mốc, giảng viên vẫn phải xác nhận
create or replace function public.bao_da_chuyen(p_class uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.enrollments set bao_chuyen_at = now()
  where class_id = p_class and student = auth.uid() and da_dong_at is null;
end $$;

grant execute on function public.han_hoc_phi(uuid, uuid), public.trang_thai_hoc_phi(uuid, uuid), public.hoc_phi_ok(uuid),
  public.luu_ngan_hang(jsonb), public.doc_ngan_hang(), public.hoc_phi_cua_toi(), public.anh_qr_hoc_phi(), public.bao_da_chuyen(uuid)
  to authenticated;

-- Tự kiểm: cột đã có, hàm gọi được
select (select count(*) from information_schema.columns where table_name = 'enrollments' and column_name in ('han_dong','da_dong_at','so_tien','mien','bao_chuyen_at')) as cot_enrollments,
       (select count(*) from information_schema.columns where table_name = 'classes' and column_name in ('hoc_phi','han_ngay','hoc_phi_tu')) as cot_classes,
       (select count(*) from public.hoc_phi_cua_toi()) as dong_cua_toi;
