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

Địa chỉ gốc: `http://127.0.0.1:8765/_test_hoc.html`
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
| `?hoi=chuaghim` | Có câu hỏi nhưng chưa ghim câu thường gặp nào — xem màn hình trống của mục Thường gặp |
| `?han=gap` | Còn 2 giờ tới hạn → dải nhắc chuyển màu gấp |
| `?chuong=1` | Vừa được chấm bài và trả lời câu hỏi → thử chuông báo |
| `?o=1` | Phiếu buổi 5 có 4 ô trả lời đặt sẵn → gõ thẳng vào phiếu, máy chấm đúng/sai |
| `?tai=1` | Phiếu buổi 5 được bật cho tải về → hiện nút **Tải về để in** |
| `?o=1` (đã có) | Bấm vào một ô trả lời → hiện **bộ gõ ký hiệu**; ô thứ 4 đáp án `1,74×10⁻⁵`, gõ `0,0000174` hay `1.74e-5` đều phải xanh |

Ghép nhiều cái bằng `&`, ví dụ:
`http://127.0.0.1:8765/_test_hoc.html?g=nam&het=1`

## Trang quản trị

Địa chỉ: `http://127.0.0.1:8765/_test_quan-tri.html`

| Tham số | Xem gì |
| --- | --- |
| `?rac=1` | Có sẵn 1 buổi và 1 tài liệu trong **Thùng rác** → nút 🗑 hiện trên thanh tab Buổi học; thử Khôi phục / Xoá hẳn; xoá thêm rồi bấm **Hoàn tác** trên thông báo |

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
- **Điền vào phiếu và để máy chấm** (`?o=1`): phiếu mẫu có 4 chỗ trống. Thử gõ `0,08` · `Phenolphtalein` · `H₂SO₄` · `2,03` để thấy đủ ba trạng thái đúng / gần đúng / sai.
- **Khoanh ô trả lời** ở trang quản trị: Buổi học → nút **◻ Ô trả lời** ở phiếu bài tập buổi 5.
- **Cửa chặn app**: mở tài liệu video trong trình duyệt sẽ thấy màn hình "chỉ mở trong ứng dụng máy tính" — đúng như sinh viên dùng điện thoại sẽ thấy.

## Thử phần "thêm vào màn hình chính"

Bản chạy thử tại máy có đủ manifest và icon, nhưng **iPhone và Android chỉ cho thêm vào màn hình chính với trang chạy qua HTTPS** (hoặc `localhost` ngay trên chính máy đó). Muốn thử thật thì mở bản trên mạng bằng điện thoại.

## Không thử được ở bản này

Vì không có máy chủ thật:

- **Nội dung tài liệu thật** — mở PDF ra sẽ thấy chữ giả, không phải đề thật.
- **Phát video Cloudflare Stream** — cần vé ký thật từ Worker; `?st=1` chỉ cho xem khung và luồng, bấm phát sẽ không chạy.
- Đăng nhập / đổi mật khẩu thật, khoá một thiết bị, dấu chìm gắn tên thật.
- **Phiếu PDF**: pdf.js treo ở bước vẽ hình trong bản chạy thử tại máy (đã dựng lại độc lập để xác nhận: đọc được tài liệu, `getPage` xong, nhưng `render()` không bao giờ trả về). Vì thế phiếu mẫu của bản thử để dạng **ảnh PNG**. Ô trả lời trên PDF dùng chung đúng một hàm với ảnh, nhưng phải thử trên bản thật mới chắc.
- Chuông báo tài liệu mới theo thời gian thực.
- Đếm giờ xem cộng dồn lên máy chủ (ở đây gọi gì cũng trả về "ok").

Những thứ này phải thử trên bản thật ở `lop-hoc-online.giangduonghoahoc.workers.dev` bằng một tài khoản sinh viên.

## Sửa dữ liệu mẫu

Mở `tao-ban-thu.js`, phần `sessions` / `views` / `profile` ở đầu file — sửa tên buổi, tên tài liệu, tiến độ tuỳ ý, rồi chạy lại `chay-thu.cmd`.

Bản thử ghi ra `web/_test_hoc.html` (trang học thật là `web/hoc.html`; `index.html` giờ là trang công khai). Bản thử giả lập app; thêm `?web=1` để xem màn "cần mở bằng app" như sinh viên mở bằng trình duyệt. Tệp đó nằm trong `.gitignore` nên không bị đẩy lên GitHub và **không có trên trang thật** (đã kiểm: trang thật trả 404).


## Học phí (v26)

Trang học: `?hp=chua_han` (nhắc còn 5 ngày) · `?hp=qua_han` (khoá màn học phí, QR VietQR thật) · `?hp=da_dong` · `?hp=bao` (đã báo chuyển); thêm `&lop2=1` để có lớp thứ hai không thu → thấy khoá theo từng lớp.
Quản trị: tab Sinh viên có cột Học phí (u1 quá hạn + báo chuyển, u2 đã đóng, u3 còn hạn), nút 💳 Nhận học phí; `?hp=0` giả lớp chưa có cột (chưa chạy v26), `?bank=0` giả chưa đặt ngân hàng.

## Đăng ký + nhân bản buổi (v27)

Quản trị: tab Sinh viên có bảng "Đăng ký mới từ trang công khai" (dk1 khớp lớp, dk2 "Khác / chưa rõ"); `?dk=0` giả chưa chạy v27. Tab Buổi học (lớp Hóa phân tích) có nút ⧉ Sang lớp… → sao sang Hóa hữu cơ K68 (stub có 2 lớp).
Trang công khai `index.html`: form Đăng ký kiểm tra tại chỗ; gửi thật đi tới Worker thật (từ localhost gọi giangduonghoahoc.com) — đừng gửi bừa sau khi v27 đã chạy.
