# Video bài giảng qua Cloudflare Stream — hướng dẫn từng bước

Mục tiêu: video chỉ xem được **trong lớp**, không có link cố định để chia sẻ, không có nút tải, link tự hết hạn sau 4 giờ và gắn với máy đang xem. Sinh viên mở trong trang học (hoặc app) với dấu chìm tên như tài liệu khác, xem dở thì lần sau tiếp tục đúng chỗ.

Cách hoạt động, nói ngắn: video nằm trên **Cloudflare Stream** ở chế độ "chỉ mở bằng chữ ký". Mỗi lần sinh viên bấm xem, máy chủ (Worker của trang) kiểm tra đúng lớp, đúng buổi, đúng giờ mở, rồi ký một token dùng một lần trong 4 giờ. Không có token thì Cloudflare không phát.

## Chi phí

Stream tính theo phút video: **5 USD cho mỗi 1 000 phút lưu trữ / tháng** và **1 USD cho mỗi 1 000 phút phát**. Ví dụ 30 giờ bài giảng (1 800 phút) và 30 sinh viên xem hết một lần (54 000 phút phát) ≈ 9 + 54 = 63 USD cho cả khoá; tháng chỉ lưu không ai xem ≈ 9 USD. Cloudflare thu tối thiểu 5 USD/tháng khi bật Stream.

---

## Phần A — Làm một lần trên Cloudflare (khoảng 10 phút)

### A1. Bật Stream

1. Vào **dash.cloudflare.com**, đăng nhập tài khoản đang có (tài khoản có `lop-hoc-online`).
2. Cột trái, tìm mục **Stream** (nằm trong nhóm *Media* hoặc gõ "Stream" vào ô Quick search Ctrl+K).
3. Bấm **Subscribe** / **Enable Stream**. Nó hỏi thẻ thanh toán nếu tài khoản chưa có; thẻ đã dùng cho R2 thì tự lấy.
4. Xong thấy trang **Stream → Videos** (danh sách trống).

### A2. Chép Account ID

1. Vào **Workers & Pages** (cột trái).
2. Ở trang danh sách, cột bên phải có ô **Account details** → dòng **Account ID** (32 ký tự chữ + số). Bấm biểu tượng chép.
3. Dán tạm vào Notepad, gọi là **ACCOUNT_ID**.

(Nếu không thấy: mở trang của Worker `lop-hoc-online` → tab **Settings** → cuối trang mục **General** cũng có Account ID.)

### A3. Tạo API token riêng cho Stream

1. Góc trên phải bấm **ảnh đại diện → My Profile** → tab **API Tokens** (hoặc vào thẳng `dash.cloudflare.com/profile/api-tokens`).
2. Bấm **Create Token**.
3. Kéo xuống cuối, mục **Custom token** → **Get started**.
4. Điền:
   - **Token name**: `giang duong stream`
   - **Permissions**: hàng đầu chọn **Account** · **Stream** · **Edit**. Chỉ một hàng này, không thêm gì khác.
   - **Account Resources**: **Include** · **All accounts** (hoặc chọn đúng tài khoản của m).
   - Mấy mục còn lại để nguyên.
5. **Continue to summary** → **Create Token**.
6. Màn hình hiện chuỗi token **đúng một lần**. Bấm **Copy**, dán tạm vào Notepad, gọi là **STREAM_TOKEN**. Đóng trang là không xem lại được (mất thì tạo token mới, không sao).

> Token này chỉ có quyền với Stream, không đụng được Worker, R2 hay DNS. Vẫn coi như mật khẩu: không gửi t, không dán vào chat, không để trong file.

### A4. Dán hai giá trị vào Worker

Mở **PowerShell** (cửa sổ của m, không bấm Run trong chat), gõ từng dòng, Enter sau mỗi dòng:

```bash
cd "C:\Users\Admin\OneDrive - Trường Đại học Ngoại ngữ - ĐHQGHN\Desktop\Mini WebApp\Hoc_Online"
```

```bash
npx.cmd wrangler secret put CF_ACCOUNT_ID
```

Khi hiện `Enter a secret value:` → **chuột phải** để dán ACCOUNT_ID (không hiện chữ là bình thường) → Enter. Thấy `Success! Uploaded secret CF_ACCOUNT_ID`.

```bash
npx.cmd wrangler secret put CF_STREAM_TOKEN
```

Tương tự: chuột phải dán STREAM_TOKEN → Enter → `Success!`.

Xong hai lệnh thì xoá hai dòng trong Notepad đi. Nhắn t một câu, t hỏi máy chủ để xác nhận đã thấy đủ (t chỉ thấy "có/không", không thấy giá trị).

### A5. Chạy một file SQL

Supabase → **SQL Editor** → dán `schema_v14_video.sql` → **Run**. File này tạo bảng để Worker cất khoá ký video; sinh viên không đọc được bảng đó.

---

## Phần B — Đưa một video vào buổi học

Có hai cách, chọn theo dung lượng.

### B1. Tải thẳng trong trang quản trị (mọi cỡ, tới 30 GB)

1. Trang quản trị → chọn lớp → tab **Buổi học** → buổi cần thêm → **Thêm tài liệu** → **Video**.
2. Bấm **Tải video lên** → chọn tệp .mp4.
3. Tệp nhỏ (dưới ~190 MB) gửi một lần, xong hiện "Đã tải xong". Tệp lớn hiện **thanh tiến trình** kèm số MB và nút **Dừng**: nó cắt tệp thành từng khúc 50 MB, **rớt mạng thì tự thử lại**; nếu hỏng hẳn, chọn lại **đúng tệp đó** là chạy tiếp chỗ dở, không phải tải lại từ đầu.
4. Ô *Tên hiển thị* tự điền theo tên tệp, sửa tuỳ ý. Bấm **Thêm**.

Lưu ý: **đừng đóng hộp thoại** khi thanh tiến trình đang chạy — đóng là dừng tải. Cứ để đó, mở tab khác làm việc khác được.

Cloudflare cần vài phút xử lý sau khi tải xong (video 1 giờ ≈ 3–5 phút). Trong lúc đó sinh viên mở sẽ thấy "Video đang được xử lý, vài phút nữa mở lại nhé".

### B2. Cách dự phòng: tải ở Cloudflare rồi chọn

Dùng khi mạng chặn thư viện tải tệp lớn, hoặc m muốn tải sẵn nhiều video một lượt.

1. **dash.cloudflare.com → Images & Stream → Hosted videos → Upload video** → kéo tệp .mp4 vào. Đặt tên rõ ràng, ví dụ `Buoi 5 - Chuan do axit bazo`.
2. Chờ cột trạng thái thành **Ready**.
3. Trang quản trị → buổi học → **Thêm tài liệu → Video** → **Chọn video đã tải lên** → danh sách hiện ra → bấm đúng video.
4. Trang tự **khoá link** video đó (chỉ mở bằng chữ ký, chỉ nhúng được từ trang lớp học) và điền tên. Bấm **Thêm**.

Cả hai cách đều có thể đặt **Mở lúc** như tài liệu khác nếu muốn hẹn giờ.

### Muốn để link YouTube như cũ?

Vẫn được: dán vào ô *Hoặc dán link ngoài*. Nhưng YouTube "không công khai" vẫn có tiện ích tải về được; video quan trọng nên để trên Stream.

---

## Giới hạn thời lượng xem (chống chia sẻ, chống cày lại)

Khi thêm hoặc sửa một video, ô **Giới hạn thời lượng xem** cho chọn: Không giới hạn, 30, 45, 60, 90, 120, 180, 240, 300 phút.

Quỹ này tính cho **từng sinh viên**, cộng dồn số phút thực sự xem (tua qua không tính). Ví dụ video dài 30 phút:

| Đặt quỹ | Sinh viên xem được | Dùng khi |
|---|---|---|
| Không giới hạn | thoải mái | bài giảng nền tảng, muốn các em xem đi xem lại |
| 30 phút | đúng một lượt | bài chỉ cho xem một lần |
| 60 phút | khoảng hai lượt | mặc định hợp lý cho bài giảng chính |
| 90–120 phút | ba đến bốn lượt | bài khó, cần xem lại nhiều |

**Chặn ở máy chủ, không phải ẩn ngoài giao diện**: video chỉ mở được bằng vé do máy chủ ký; hết quỹ thì máy chủ từ chối cấp vé, đồng thời video rời khỏi danh sách của riêng sinh viên đó (các bạn khác vẫn thấy bình thường).

Vài điểm đã tính sẵn:
- Tua đi tua lại không bị trừ oan — chỉ cộng phần chạy tiến tới.
- Mỗi lần bấm mở video trừ sẵn 2 phút, để máy nào chặn nhật ký cũng bị trừ dần.
- Vé chỉ sống bằng đúng quỹ còn lại (thêm 10 phút dư), tối đa 4 giờ — không thể mở một vé rồi xem cả ngày.
- Sinh viên không tự hạ số phút đã xem được: máy chủ chỉ cho cộng thêm, mỗi lần tối đa 60 giây.

Muốn cho một em xem thêm: vào **Theo dõi**, hoặc đơn giản là nâng quỹ của video đó lên (sửa video, chọn số phút lớn hơn) — quỹ mới áp dụng cho tất cả.

## Xem ai đã xem bao nhiêu

Quản trị → tab **Theo dõi**: mỗi buổi liệt kê từng tài liệu kèm **Đã mở** (bao nhiêu em, tên ai), **Lượt mở** (tổng số lần bấm mở), **Giờ xem** (tổng thời lượng cả lớp, và số em đã hết lượt), **Chưa mở** (tên những em chưa đụng tới).

---

## Phần C — Kiểm tra bằng tài khoản sinh viên

1. Đăng nhập tài khoản sinh viên trong lớp đó → Bài giảng → buổi → bấm video.
2. Thấy "Đang xin phép xem video…" rồi trình phát hiện ra, có dấu chìm tên. Xem một lúc, đóng, mở lại → tiếp tục đúng chỗ.
3. Thử lấy link: chuột phải bị chặn; link trong trình phát là token hết hạn sau 4 giờ và chỉ chạy từ đúng IP đang xem — chép sang máy khác không mở được.
4. Tài khoản **không** trong lớp đó mở video → "Bạn không ở trong lớp này". Trước giờ mở → "Chưa tới giờ mở video này".

---

## Khi có trục trặc

| Thấy gì | Nghĩa là | Làm gì |
|---|---|---|
| "Máy chủ chưa nối với kho video" | Worker chưa có CF_ACCOUNT_ID / CF_STREAM_TOKEN | Làm lại A4; hỏi t kiểm |
| "Cloudflare Stream: Authentication error (mã 10000)" | Token sai quyền hoặc dán thiếu | Tạo token mới đúng **Account · Stream · Edit**, làm lại A4 |
| "Chưa lưu được cấu hình… schema_v14" | Chưa chạy SQL | Làm A5 |
| Video "đang xử lý" quá 30 phút | Tệp lỗi hoặc định dạng lạ | Vào Stream → Videos xem trạng thái; xuất lại .mp4 (H.264) rồi tải lại |
| Sinh viên đổi mạng (Wi-Fi → 4G) giữa chừng bị dừng | Token gắn IP cũ | Đóng video, mở lại là có token mới |
| Danh sách video trống dù đã tải | Token chỉ có quyền Read, hoặc tải nhầm tài khoản | Kiểm A3 bước Permissions |
| "Chưa tải được bộ tải tệp lớn" | Mạng chặn cdn.jsdelivr.net | Dùng cách B2 |
| Đang tải tệp lớn thì mất điện / đóng nhầm | Tiến trình dừng | Mở lại hộp Thêm video, chọn **đúng tệp đó**, nó chạy tiếp chỗ dở |

Muốn xem Worker đã nối chưa: mở `https://lop-hoc-online.giangduonghoahoc.workers.dev/api/trang-thai` — có `"stream": true` là đủ hai secret.

## Những gì Stream KHÔNG chặn được

Quay màn hình bằng điện thoại, hoặc quay bằng phần mềm trên máy không cài app lớp học. Với app máy tính, cửa sổ hiện đen khi quay; dấu chìm tên hiện trong mọi trường hợp để lần được nguồn rò rỉ. Không có nền tảng nào (kể cả Netflix) chặn được máy quay ngoài.
