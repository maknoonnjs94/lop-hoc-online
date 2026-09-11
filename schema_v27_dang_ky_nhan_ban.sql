-- =====================================================================
-- v27 — ĐĂNG KÝ TỪ TRANG CÔNG KHAI + NHÂN BẢN BUỔI SANG LỚP KHÁC (2026-09-12)
-- =====================================================================
-- A. dang_ky: sinh viên điền form ở giangduonghoahoc.com → Worker ghi vào đây (khoá quản trị,
--    KHÔNG mở insert cho anon). Giảng viên duyệt ở Quản trị → tab Sinh viên: tạo tài khoản + ghi danh
--    qua /api/tao-tai-khoan, mật khẩu tạm hiện cho giảng viên gửi Zalo.
-- B. nhan_ban_buoi(): sao chép một buổi (kèm tài liệu + nội dung, dùng lại tệp trong kho) sang lớp
--    khác dưới dạng NHÁP (published = false) để giảng viên xem lại rồi mới mở.
-- C. st_read: tệp trong kho cũng theo luật học phí (v26) cho trọn bộ.
--
-- Chạy: Supabase → SQL Editor → dán cả tệp → Run. Chạy lại được.
-- Kiểm: /api/trang-thai → "v27_dang_ky": true

-- ---------- A. đăng ký ----------
create table if not exists public.dang_ky (
  id          uuid primary key default gen_random_uuid(),
  ho_ten      text not null,
  email       text not null,
  sdt         text not null default '',
  khoa        text not null default '',          -- tên khoá sinh viên chọn trên trang công khai
  ghi_chu     text not null default '',          -- ngành, năm, lời nhắn
  trang_thai  text not null default 'cho' check (trang_thai in ('cho', 'da_duyet', 'tu_choi')),
  tao_luc     timestamptz not null default now(),
  duyet_luc   timestamptz,
  user_id     uuid,                              -- tài khoản được tạo khi duyệt
  class_id    uuid,                              -- lớp được ghi danh khi duyệt
  ghi_chu_gv  text
);
alter table public.dang_ky enable row level security;
drop policy if exists dk_staff on public.dang_ky;
create policy dk_staff on public.dang_ky for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
revoke all on public.dang_ky from anon;
grant select, update, delete on public.dang_ky to authenticated;
-- một email chỉ một đơn đang chờ cho mỗi khoá (chặn bấm gửi nhiều lần)
create unique index if not exists dang_ky_cho_uq on public.dang_ky (lower(email), khoa) where trang_thai = 'cho';
create index if not exists dang_ky_tt_idx on public.dang_ky (trang_thai, tao_luc);

-- ---------- B. nhân bản buổi ----------
create or replace function public.nhan_ban_buoi(p_session uuid, p_class uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s   public.sessions%rowtype;
  sid uuid;
  m   record;
  mid uuid;
begin
  if not public.is_staff() then raise exception 'chi_giang_vien'; end if;
  select * into s from public.sessions where id = p_session and deleted_at is null;
  if s.id is null then raise exception 'khong_thay_buoi'; end if;
  if not exists (select 1 from public.classes where id = p_class and not archived) then raise exception 'khong_thay_lop'; end if;

  -- buổi mới: bản NHÁP, không ghim, bỏ ngày/giờ vì lớp khác lịch khác
  insert into public.sessions (class_id, no, title, held_on, note, published, pinned, starts_at)
  values (p_class, s.no, s.title, null, s.note, false, false, null)
  returning id into sid;

  for m in select * from public.materials where session_id = p_session and deleted_at is null order by order_no, created_at loop
    insert into public.materials (session_id, kind, title, open_at, order_no, gioi_han_giay, nhan_bai, han_nop, o_tra_loi, cho_tai)
    values (sid, m.kind, m.title, m.open_at, m.order_no, m.gioi_han_giay, m.nhan_bai, null, m.o_tra_loi, m.cho_tai)
    returning id into mid;
    -- nội dung: cùng tệp trong kho (storage_path), cùng link video, cùng thân văn bản — không tải lên lần nữa
    insert into public.material_contents (material_id, url, storage_path, body)
    select mid, url, storage_path, body from public.material_contents where material_id = m.id;
  end loop;
  return sid;
end $$;
grant execute on function public.nhan_ban_buoi(uuid, uuid) to authenticated;

-- ---------- C. tệp trong kho theo luật học phí ----------
drop policy if exists st_read on storage.objects;
create policy st_read on storage.objects for select to authenticated
  using (bucket_id = 'tailieu' and (
    public.is_staff() or exists (
      select 1 from public.material_contents mc
      join public.materials m on m.id = mc.material_id
      join public.sessions  s on s.id = m.session_id
      where mc.storage_path = storage.objects.name
        and s.published and s.deleted_at is null and m.deleted_at is null
        and public.is_active() and public.in_class(s.class_id) and public.hoc_phi_ok(s.class_id)
        and (m.open_at is null or m.open_at <= now()))));

-- Tự kiểm
select (select count(*) from information_schema.tables where table_name = 'dang_ky') as bang_dang_ky,
       (select count(*) from pg_proc where proname = 'nhan_ban_buoi') as ham_nhan_ban;
