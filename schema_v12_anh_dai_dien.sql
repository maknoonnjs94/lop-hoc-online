-- =====================================================================
--  ẢNH ĐẠI DIỆN: sinh viên tự tải ảnh của mình lên thay hình nhân vật vẽ.
--  Ảnh nằm trong kho riêng "avatars", KHÔNG công khai: mỗi người chỉ đọc được ảnh
--  của chính mình, giảng viên đọc được của cả lớp. Ảnh đã được thu nhỏ 256×256
--  ngay trên máy sinh viên trước khi gửi lên.
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

-- 1. Đường dẫn ảnh trong hồ sơ (rỗng = dùng nhân vật vẽ sẵn)
alter table public.profiles add column if not exists avatar_path text not null default '';

-- 2. Kho ảnh riêng, tối đa 512 KB mỗi tệp, chỉ nhận ảnh
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 524288, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 524288,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 3. Luật truy cập: tên tệp bắt buộc là "<id người dùng>.jpg"
drop policy if exists av_read on storage.objects;
create policy av_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (name = auth.uid()::text || '.jpg' or public.is_staff()));

drop policy if exists av_them on storage.objects;
create policy av_them on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

drop policy if exists av_sua on storage.objects;
create policy av_sua on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg')
  with check (bucket_id = 'avatars' and name = auth.uid()::text || '.jpg');

drop policy if exists av_xoa on storage.objects;
create policy av_xoa on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (name = auth.uid()::text || '.jpg' or public.is_staff()));

-- 4. Ghi đường dẫn vào hồ sơ (chỉ ghi được dòng của chính mình, chỉ nhận đúng tên tệp)
create or replace function public.dat_anh_dai_dien(p_path text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return jsonb_build_object('ok', false, 'reason', 'chua_dang_nhap'); end if;
  if coalesce(p_path, '') <> '' and p_path <> me::text || '.jpg' then
    return jsonb_build_object('ok', false, 'reason', 'sai_duong_dan');
  end if;
  update public.profiles set avatar_path = coalesce(p_path, '') where id = me;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.dat_anh_dai_dien(text) from public;
grant execute on function public.dat_anh_dai_dien(text) to authenticated;

-- Xem thử
select full_name, role, theme, avatar, avatar_path from public.profiles order by role, full_name;

-- =====================================================================
-- Nếu phần 3 báo lỗi "must be owner of table objects" (một số dự án Supabase khóa
-- bảng này), làm bằng giao diện: Storage → avatars → Policies → New policy,
-- rồi tạo bốn luật đúng như trên. Phần 1, 2, 4 vẫn chạy được bình thường.
-- =====================================================================
