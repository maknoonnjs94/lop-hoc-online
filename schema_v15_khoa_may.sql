-- =====================================================================
--  KHOÁ MỘT TÀI KHOẢN MỘT MÁY — chuyển sang mã máy thật (app 1.0.16 trở lên)
--
--  Trước đây mã thiết bị do trình duyệt tự sinh và cất trong bộ nhớ của trình duyệt, nên
--  cập nhật app / cài lại app / đổi tên miền / xoá dữ liệu duyệt web là mất mã → sinh viên
--  bị chặn oan, phải nhờ giảng viên gỡ.
--
--  Từ app 1.0.16, app gửi mã của CHÍNH CHIẾC MÁY (Windows: MachineGuid; macOS: UUID phần cứng),
--  đã băm SHA-256 nên máy chủ không giữ mã gốc. Mã này bền qua mọi lần cập nhật app.
--
--  Câu lệnh dưới xoá sạch ràng buộc kiểu cũ MỘT LẦN, để lần đăng nhập tới mỗi người gắn lại
--  bằng mã mới. Chạy sau khi app 1.0.16 đã phát.
--  Dán vào Supabase → SQL Editor → Run.
-- =====================================================================

delete from public.device_bindings;

-- Xem lại: bảng phải rỗng; sau khi sinh viên đăng nhập bằng app, device_id sẽ bắt đầu bằng "app:"
select user_id, left(device_id, 12) as ma_dau, first_seen, last_seen from public.device_bindings;
