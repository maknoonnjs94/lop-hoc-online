-- =====================================================================
-- v28 — SAO LƯU TỰ ĐỘNG + NHẬT KÝ LỖI PHÍA SINH VIÊN (2026-09-12)
-- =====================================================================
-- A. Sao lưu tự động: Worker chạy theo lịch (3h sáng Chủ nhật, giờ VN) gom 15 bảng thành một tệp JSON
--    cất vào kho Supabase Storage riêng `sao-luu` (KHÔNG công khai; giảng viên tải về ở Quản trị → Kho tệp),
--    và đồng thời vào kho R2 nếu Worker có binding SAO_LUU. Giữ 8 bản gần nhất. Nút "Sao lưu ngay" gọi
--    cùng đường. Tệp PDF/ảnh/video không nằm trong bản sao (chỉ có đường dẫn), như bản sao lưu tay.
-- B. loi_khach: trang học / trang quản trị gặp lỗi JavaScript thì tự ghi một dòng (tối đa 5 dòng mỗi phiên,
--    không lặp cùng thông điệp). Giảng viên xem ở tab Cảnh báo → "Lỗi phía sinh viên".
-- Chạy: Supabase → SQL Editor → dán → Run. Chạy lại được.
-- Kiểm: /api/trang-thai → "v28_sao_luu_loi_khach": true

-- ---------- A. kho sao lưu ----------
insert into storage.buckets (id, name, public) values ('sao-luu', 'sao-luu', false)
on conflict (id) do nothing;

drop policy if exists sl_doc on storage.objects;
create policy sl_doc on storage.objects for select to authenticated
  using (bucket_id = 'sao-luu' and public.is_staff());
-- ghi/xoá: chỉ Worker (khoá quản trị), không mở cho ai khác

-- ---------- B. lỗi phía sinh viên ----------
create table if not exists public.loi_khach (
  id          bigserial primary key,
  user_id     uuid references auth.users on delete cascade,
  luc         timestamptz not null default now(),
  trang       text not null default '',      -- hoc | quan-tri
  thong_diep  text not null default '',
  nguon       text not null default '',      -- tệp:dòng:cột
  ua          text not null default '',
  them        jsonb not null default '{}'::jsonb
);
alter table public.loi_khach enable row level security;
drop policy if exists lk_ghi on public.loi_khach;
create policy lk_ghi on public.loi_khach for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists lk_staff on public.loi_khach;
create policy lk_staff on public.loi_khach for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
grant insert on public.loi_khach to authenticated;
grant select, delete on public.loi_khach to authenticated;
create index if not exists loi_khach_luc_idx on public.loi_khach (luc desc);

-- tự dọn: giữ 30 ngày (hàm để Worker gọi mỗi lần sao lưu)
create or replace function public.don_loi_khach()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.loi_khach where luc < now() - interval '30 days';
  get diagnostics n = row_count;
  return n;
end $$;

-- Tự kiểm
select (select count(*) from storage.buckets where id = 'sao-luu') as kho_sao_luu,
       (select count(*) from information_schema.tables where table_name = 'loi_khach') as bang_loi_khach;
