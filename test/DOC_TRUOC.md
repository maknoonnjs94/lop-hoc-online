# Bản thử trang học tại máy

Chạy trang học của sinh viên ngay trên máy m, **không cần mạng, không cần đăng nhập, không đụng vào lớp thật**.
Supabase được thay bằng một bản giả chạy trong trình duyệt, dữ liệu chỉ nằm trong bộ nhớ — tải lại trang là mọi thứ về như cũ.

## Chạy

Bấm đúp **`chay-thu.cmd`**. Nó tự dựng bản thử rồi mở trình duyệt.
Đóng cửa sổ đen là tắt.

Muốn chạy tay:

```bash
node tao-ban-thu.js
node may-chu.js
```

Cần có Node.js. Chưa có thì tải ở nodejs.org.

## Thử từng luồng

Địa chỉ gốc: `http://127.0.0.1:8765/_test_index.html`
Thêm phần sau vào đuôi địa chỉ:

| Thêm vào | Xem được gì |
|---|---|
| *(để trống)* | Sinh viên nữ đã khai hồ sơ — giao diện Peach, nhân vật nữ |
| `?g=nam` | Sinh viên nam — giao diện Mint, nhân vật nam |
| `?onb=1` | **Lần đầu đăng nhập**: đặt mật khẩu riêng → khai họ tên, giới tính, năm sinh, ngành → giao diện tự đổi theo giới tính |
| `?het=1` | Đã xem xong hết tài liệu → màn hình chúc mừng, "Bài tập cần làm" trống |
| `?trong=1` | Lớp chưa có buổi nào → màn hình trống của sinh viên mới vào lớp |
| `?quy=het` | Video đã hết quỹ thời lượng xem → video biến mất khỏi danh sách |
| `?st=1` | Tài liệu video lấy từ Cloudflare Stream (xem khung, không phát được — xem mục dưới) |
| `?nop=roi` | Đã nộp bài, đang chờ chấm → có nút **Nộp lại** và **Rút bài** |
| `?nop=cham` | Bài đã được chấm → hiện điểm và nhận xét, không sửa được nữa |
| `?han=het` | Quá hạn nộp → nút nộp đóng lại |
| `?hoi=trong` | Chưa có câu hỏi nào |
| `?han=gap` | Còn 2 giờ tới hạn → dải nhắc chuyển màu gấp |
| `?chuong=1` | Vừa được chấm bài và trả lời câu hỏi → thử chuông báo |

Ghép nhiều cái bằng `&`, ví dụ:
`http://127.0.0.1:8765/_test_index.html?g=nam&het=1`

## Trang quản trị

Địa chỉ: `http://127.0.0.1:8765/_test_quan-tri.html`

Bản này **ghi thật vào bộ nhớ**: bật "Nhận bài nộp" rồi Lưu, chấm điểm, trả lời câu hỏi — mở lại tab là thấy kết quả. Tắt trang là mất hết, không đụng gì tới lớp thật.

Có sẵn: 1 lớp, 3 sinh viên, 3 buổi (một buổi còn nháp), 5 tài liệu đủ loại, 3 bài nộp (1 đã chấm, 1 nộp muộn), 3 câu hỏi (2 chờ trả lời).

Thử được: tạo/sửa/xoá buổi và tài liệu, bật nhận bài nộp + hạn nộp, chấm điểm, trả lời và ẩn câu hỏi, nới quỹ giờ xem, bảng dung lượng và ước tính hoá đơn, danh sách sinh viên, cảnh báo chụp màn hình.

Không thử được: tạo tài khoản thật, đổi mật khẩu, tải tệp lên Cloudflare Stream (Worker được giả lập, luôn trả về thành công).

## Thử được

- Toàn bộ giao diện: 4 giao diện màu, 8 nhân vật 3D, đổi qua lại, ảnh nền theo giới tính.
- **Tải ảnh đại diện của m lên** — chọn ảnh thật trên máy, nó cắt vuông và hiện luôn.
- Luồng lần đầu đăng nhập trọn vẹn.
- Trang chủ "Hôm nay", lịch buổi học, thông báo lớp, ghim buổi, giờ bắt đầu.
- "Bài tập cần làm", tiến độ đọc dở, đã xem — tiếp tục.
- Tìm nhanh `Ctrl + K`.
- Các màn hình trống / đã xong hết.
- Video bị ẩn khi hết quỹ.
- **Nộp bài**: chọn tệp thật trên máy, gõ lời nhắn, bấm Nộp — chạy trọn luồng (tệp không đi đâu cả).
- **Hỏi bài**: gõ câu hỏi và gửi; xem câu đã được trả lời của lớp.
- **Cửa chặn app**: mở tài liệu video trong trình duyệt sẽ thấy màn hình "chỉ mở trong ứng dụng máy tính" — đúng như sinh viên dùng điện thoại sẽ thấy.

## Thử phần "thêm vào màn hình chính"

Bản chạy thử tại máy có đủ manifest và icon, nhưng **iPhone và Android chỉ cho thêm vào màn hình chính với trang chạy qua HTTPS** (hoặc `localhost` ngay trên chính máy đó). Muốn thử thật thì mở bản trên mạng bằng điện thoại.

## Không thử được ở bản này

Vì không có máy chủ thật:

- **Nội dung tài liệu thật** — mở PDF ra sẽ thấy chữ giả, không phải đề thật.
- **Phát video Cloudflare Stream** — cần vé ký thật từ Worker; `?st=1` chỉ cho xem khung và luồng, bấm phát sẽ không chạy.
- Đăng nhập / đổi mật khẩu thật, khoá một thiết bị, dấu chìm gắn tên thật.
- Chuông báo tài liệu mới theo thời gian thực.
- Đếm giờ xem cộng dồn lên máy chủ (ở đây gọi gì cũng trả về "ok").

Những thứ này phải thử trên bản thật ở `lop-hoc-online.giangduonghoahoc.workers.dev` bằng một tài khoản sinh viên.

## Sửa dữ liệu mẫu

Mở `tao-ban-thu.js`, phần `sessions` / `views` / `profile` ở đầu file — sửa tên buổi, tên tài liệu, tiến độ tuỳ ý, rồi chạy lại `chay-thu.cmd`.

Bản thử ghi ra `web/_test_index.html`. Tệp đó nằm trong `.gitignore` nên không bị đẩy lên GitHub và **không có trên trang thật** (đã kiểm: trang thật trả 404).
