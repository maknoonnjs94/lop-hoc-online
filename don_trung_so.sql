-- =====================================================================
--  DỌN DỮ LIỆU SỔ BỊ TRÙNG DƯỚI HAI TÀI KHOẢN
--
--  Chạy TỪNG CÂU MỘT. Supabase chỉ hiện kết quả của câu cuối, nên bôi đen
--  đúng câu muốn chạy rồi bấm Run (hoặc xoá các câu khác đi).
--
--  LÀM THEO ĐÚNG THỨ TỰ. Câu 3 xoá dữ liệu, không lấy lại được.
-- =====================================================================

-- ---------------------------------------------------------------------
-- CÂU 1 — Xem tài khoản nào đang giữ gì
-- ---------------------------------------------------------------------
select coalesce(p.email, '(không rõ)') as tai_khoan,
       n.collection as loai,
       count(*) as so_luong
from public.notebook n
left join public.profiles p on p.id = n.owner
group by p.email, n.collection
order by tai_khoan, so_luong desc;


-- ---------------------------------------------------------------------
-- CÂU 2 — Trước khi xoá: đếm riêng tài khoản SẼ GIỮ
--   Thay email bên dưới bằng tài khoản mình dùng hằng ngày.
--   Chỉ chạy câu 3 khi câu này cho bank = 148.
-- ---------------------------------------------------------------------
select n.collection as loai, count(*) as so_luong
from public.notebook n
join public.profiles p on p.id = n.owner
where p.email = 'THAY-EMAIL-GIU-LAI@gmail.com'
group by n.collection
order by so_luong desc;


-- ---------------------------------------------------------------------
-- CÂU 3 — Xoá bộ dữ liệu của tài khoản KHÔNG dùng
--   Thay email bên dưới bằng tài khoản muốn BỎ.
--   Đọc kỹ: câu này xoá thật, không hoàn tác được.
--   Bỏ hai dấu -- ở đầu dòng rồi mới chạy được.
-- ---------------------------------------------------------------------
-- delete from public.notebook
-- where owner = (select id from public.profiles where email = 'THAY-EMAIL-MUON-BO@gmail.com');


-- ---------------------------------------------------------------------
-- CÂU 4 — Kiểm lại sau khi xoá. Mỗi loại chỉ còn một bộ:
--   bank 148 · weeks 4 hoặc 6 · images 3 · settings 1 · banktree 1
-- ---------------------------------------------------------------------
select n.collection as loai, count(*) as so_luong,
       count(distinct n.owner) as so_tai_khoan
from public.notebook n
group by n.collection
order by so_luong desc;
