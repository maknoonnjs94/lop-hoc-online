-- =====================================================================
--  BƯỚC 1 — Hai tài khoản đang giữ những gì, và 12 câu thiếu nằm ở đâu
--
--  File này CHỈ CÓ MỘT CÂU LỆNH. Xoá sạch ô SQL Editor, dán cả file này
--  vào, bấm Run. Câu này KHÔNG XOÁ GÌ, chỉ đếm.
--
--  Đọc kết quả:
--   - kho_bai            : số câu trong kho của riêng tài khoản đó
--   - cau_chi_ben_nay_co : số câu CHỈ tài khoản này có, bên kia không có
--                          → nếu một bên có 12 thì 12 câu thiếu vẫn còn,
--                            chỉ là đang nằm nhầm tài khoản.
--
--  Gửi lại ảnh kết quả rồi mới sang bước 2.
-- =====================================================================

with kho as (
  select owner, doc_id from public.notebook where collection = 'bank'
),
rieng as (
  select k.owner, count(*) as chi_minh_co
  from kho k
  where not exists (
    select 1 from kho x where x.doc_id = k.doc_id and x.owner <> k.owner
  )
  group by k.owner
)
select coalesce(p.email, 'ẩn danh · ' || left(n.owner::text, 8)) as tai_khoan,
       count(*) filter (where n.collection = 'bank')     as kho_bai,
       coalesce(max(r.chi_minh_co), 0)                   as cau_chi_ben_nay_co,
       count(*) filter (where n.collection = 'trash')    as thung_rac,
       count(*) filter (where n.collection = 'weeks')    as tuan,
       count(*) filter (where n.collection = 'images')   as anh,
       count(*) filter (where n.collection = 'versions') as ban_luu,
       count(*)                                          as tong,
       max(n.owner::text)                                as ma_tai_khoan
from public.notebook n
left join public.profiles p on p.id = n.owner
left join rieng r on r.owner = n.owner
group by 1
order by kho_bai desc;
