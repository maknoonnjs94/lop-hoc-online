-- =====================================================================
--  KHO DỮ LIỆU CHO BẢN WEB CỦA SỔ BÀI TẬP (chạy SAU schema.sql và schema_v2.sql)
--  Dán vào Supabase → SQL Editor → New query → Run. Chạy lại nhiều lần được.
--
--  Bản Artifact của Sổ Bài Tập lưu dữ liệu theo kiểu "bộ sưu tập / tài liệu".
--  Bảng dưới đây giữ đúng hình dạng đó nên mã của app không phải sửa gì:
--     collection = 'weeks' | 'bank' | 'images' | 'trash' | 'versions' | 'ink' | 'files'
--                  | 'settings' (doc_id 'course') | 'banktree' (doc_id 'root')
--
--  Ai đọc được: CHỈ giáo viên, và chỉ dữ liệu của chính mình (owner).
--  Tài khoản sinh viên không có một đường nào chạm tới bảng này.
-- =====================================================================

create table if not exists public.notebook (
  owner      uuid not null default auth.uid() references auth.users on delete cascade,
  collection text not null,
  doc_id     text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner, collection, doc_id)
);
create index if not exists notebook_col_idx on public.notebook (owner, collection);

alter table public.notebook enable row level security;

-- Chỉ giáo viên, và chỉ đụng được dữ liệu của chính mình
drop policy if exists nb_own on public.notebook;
create policy nb_own on public.notebook for all to authenticated
  using (owner = auth.uid() and public.is_staff())
  with check (owner = auth.uid() and public.is_staff());

-- Cho phép cập nhật trực tiếp giữa hai máy (máy tính và máy bảng) nếu bật Realtime
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notebook')
  then
    alter publication supabase_realtime add table public.notebook;
  end if;
end $$;

-- Kiểm tra
select collection, count(*) as so_tai_lieu
from public.notebook where owner = auth.uid()
group by collection order by collection;
