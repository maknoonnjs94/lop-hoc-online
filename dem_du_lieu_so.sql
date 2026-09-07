-- =====================================================================
--  ĐẾM DỮ LIỆU SỔ BÀI TẬP TRÊN BẢN WEB
--  Dán vào Supabase → SQL Editor → New query → Run.
--  Dùng để đối chiếu với bản artifact xem khôi phục đã đủ chưa.
--
--  Số đúng phải bằng bản sao lưu ngày 2026-09-07:
--     bank 148  ·  weeks 4  ·  images 3  ·  trash 12  ·  settings 1  ·  banktree 1
-- =====================================================================

select collection as loai,
       count(*)   as so_luong,
       case collection
         when 'bank'     then 'Câu trong kho bài tập'
         when 'weeks'    then 'Tài liệu / đề'
         when 'images'   then 'Ảnh'
         when 'trash'    then 'Thùng rác'
         when 'settings' then 'Cài đặt đầu trang'
         when 'banktree' then 'Bản đồ kiến thức'
         when 'ink'      then 'Nét viết bảng giảng'
         when 'files'    then 'Tệp đính kèm'
         when 'versions' then 'Lịch sử phiên bản'
         else collection
       end as giai_thich
from public.notebook
group by collection
order by so_luong desc;

-- Tổng dung lượng đang dùng
select pg_size_pretty(pg_total_relation_size('public.notebook')) as dung_luong_so;
