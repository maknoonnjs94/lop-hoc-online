-- =====================================================================
--  CHO TẢI VỀ TỪNG TỆP
--
--  Mặc định mọi tài liệu đều KHÔNG cho tải: sinh viên chỉ đọc trên trang.
--  Bật cờ này cho tệp nào thì tệp đó hiện nút "Tải về" cho sinh viên —
--  dùng cho phiếu bài tập cần in ra làm tay.
--
--  Dán TOÀN BỘ vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không sao.
-- =====================================================================

alter table public.materials add column if not exists cho_tai boolean not null default false;

-- Xem thử: tài liệu nào đang mở cho tải
select s.no as buoi, m.title, m.kind, m.cho_tai
from public.materials m
join public.sessions s on s.id = m.session_id
order by m.cho_tai desc, s.no desc nulls last, m.order_no;

-- =====================================================================
--  Nói rõ giới hạn, đừng hiểu nhầm là "khoá tuyệt đối":
--
--  Để vẽ được phiếu ra màn hình, trình duyệt của sinh viên BẮT BUỘC phải tải
--  được nội dung tệp về máy — đó là cách web hoạt động, không tránh được.
--  Vì thế cờ này KHÔNG phải một hàng rào mật mã. Nó quyết định có nút Tải về
--  hay không: tắt thì muốn lấy tệp phải biết mở công cụ nhà phát triển của
--  trình duyệt; bật thì ai cũng tải được bằng một cú bấm.
--
--  Bảo vệ thật của hệ thống vẫn là ba thứ cũ: dấu chìm mang tên người xem,
--  khoá một thiết bị cho mỗi tài khoản, và ứng dụng máy tính chặn chụp/quay.
--  Tệp đã cho tải thì KHÔNG có dấu chìm — nó là bản gốc.
-- =====================================================================
