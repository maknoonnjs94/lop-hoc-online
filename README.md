# Lớp học online

Hệ thống dạy online riêng: giáo viên đẩy tài liệu, sinh viên đăng nhập và chỉ xem được phần được giao.

## Thư mục `web/` — phần đưa lên mạng
| File | Ai dùng | Việc |
|---|---|---|
| `index.html` | Sinh viên | Xem buổi học, tài liệu, video |
| `quan-tri.html` | Giáo viên | Lớp, buổi, tài liệu, sinh viên, kho tệp |
| `so-bai-tap.html` | Giáo viên | Sổ Bài Tập bản web (sinh ra từ mã nguồn, không sửa tay) |

## File ở thư mục gốc — không đưa lên mạng
- `schema.sql`, `schema_v2.sql`, `schema_v3_so.sql` — cấu trúc dữ liệu và luật truy cập trên Supabase, chạy theo thứ tự.
- `tao_du_lieu_thu.sql` — tạo lớp thử và đặt quyền quản trị.
- `kiem_tra_quyen.sql` — xem và đổi quyền tài khoản.
- `shim_supabase.js` — cầu nối để Sổ Bài Tập chạy ngoài khung Artifact.
- `HUONG_DAN.md` — hướng dẫn dựng và vận hành.
- `HUONG_DAN_VIDEO.md` — video bài giảng qua Cloudflare Stream: bật, lấy khoá, tải video, kiểm tra, xử lý lỗi.
- `NHAT_KY_WEB.md` — nhật ký làm việc từng phiên: đã làm gì, m còn phải chạy SQL nào, việc dang dở, ghi chú kỹ thuật.

## Nguyên tắc
- Quyền đọc chặn ở máy chủ bằng Row Level Security, không phải ẩn trên giao diện.
- Kho câu hỏi và bản giáo viên không nằm trong cơ sở dữ liệu của lớp học.
- Khoá `service_role` của Supabase không bao giờ nằm trong kho mã này.

## Dựng lại Sổ Bài Tập bản web sau khi cập nhật sổ
```
node So_Bai_Tap_HUS\Tools\build_web_so.js so_bai_tap.html ..\Hoc_Online
```
