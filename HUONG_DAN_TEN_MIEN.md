# Gắn tên miền riêng cho trang học — từng bước

Hiện trang chạy ở `https://lop-hoc-online.giangduonghoahoc.workers.dev/`. Sau khi làm xong các bước dưới,
sinh viên mở được ở địa chỉ ngắn (ví dụ `https://hoc.giangduonghoahoc.com`), **địa chỉ cũ vẫn chạy song song** —
app máy tính không phải cập nhật, không phải phát hành bản mới.

Mã đã sẵn sàng từ v24. `wrangler.jsonc` không khai `routes` nên tên miền gắn bằng tay trên Cloudflare
**không bị xoá** khi GitHub tự phát lại; `keep_vars: true` giữ biến `TEN_MIEN`.

Ví dụ xuyên suốt (đường 1A đã chọn 11/9 — `giangduonghoahoc.com` còn trống theo RDAP): tên miền gốc `giangduonghoahoc.com`, trang học đặt ở tên con `hoc.giangduonghoahoc.com`
(để dành gốc cho trang giới thiệu sau này). Đã có tên miền rồi thì bỏ Bước 1.

Tổng thời gian tay: ~20 phút, cộng thời gian chờ DNS (10 phút – vài giờ).

---

## Bước 1 — Mua tên miền (chọn MỘT trong hai đường)

### 1A. Mua ngay trên Cloudflare — đơn giản nhất, bỏ luôn Bước 2

Chỉ có `.com` `.net` `.org` `.edu`(không) …; **không có `.vn`**. Giá ≈ 10 USD/năm, không tăng năm sau.

1. Đăng nhập `dash.cloudflare.com` → menu trái **Domain Registration** → **Register Domains**.
2. Gõ `giangduonghoahoc` → chọn đuôi (`.com`) → **Purchase**.
3. Điền thông tin chủ sở hữu (tên, địa chỉ, email — Cloudflare ẩn thông tin này trên WHOIS miễn phí).
4. Thanh toán bằng thẻ trong **Billing** (thẻ Visa/Master quốc tế; thẻ nội địa thường không được).
5. Xong: tên miền nằm sẵn trong **Domains**, trạng thái **Active**. → Sang **Bước 3**.

### 1B. Mua ở nhà đăng ký Việt Nam — khi muốn `.vn` / `.edu.vn`

Mắt Bão (`matbao.net`), P.A Việt Nam (`pavietnam.vn`), iNET (`inet.vn`), Tenten (`tenten.vn`).
`.vn` cá nhân cần ảnh CCCD; giá năm đầu khoảng 600–900 nghìn, gia hạn thấp hơn. `.edu.vn` phải có
giấy của trường — không nên đợi.

1. Tìm `giangduonghoahoc.vn` → thêm vào giỏ → **không** mua kèm hosting/SSL/email (không cần).
2. Tạo tài khoản, tải CCCD, thanh toán (chuyển khoản/VNPay đều được).
3. Chờ email "tên miền đã kích hoạt" (thường trong ngày). → Sang **Bước 2**.

## Bước 2 — Đưa tên miền vào Cloudflare (chỉ khi đi đường 1B)

1. `dash.cloudflare.com` → menu trái **Domains** → nút **Onboard a domain** (có nơi ghi *Add a domain*).
2. Gõ `giangduonghoahoc.vn` (tên gốc, không có `hoc.`) → chọn **Quick scan for DNS records** → **Continue**.
3. Chọn gói **Free** → **Continue**.
4. Màn hình DNS: tên miền mới nên trống, không phải sửa gì → **Continue**.
5. Cloudflare đưa **hai nameserver** kiểu `ada.ns.cloudflare.com` và `bob.ns.cloudflare.com` — chép lại.
6. Mở trang quản lý ở nhà đăng ký → tìm mục **Quản lý tên miền** → **Nameserver** / **Đổi DNS** / **Máy chủ tên miền**
   → xoá nameserver mặc định của họ, dán đúng hai tên của Cloudflare → Lưu.
   (Mắt Bão: *Tên miền → Quản lý → DNS/Nameserver → Sử dụng NS tuỳ chỉnh*; P.A: *Quản lý tên miền → Đổi Nameserver*.)
7. Quay lại Cloudflare → **Continue** / **Check nameservers now**. Trạng thái **Pending** → chờ.
   `.vn` thường 15 phút – 2 giờ, tối đa 24 giờ. Cloudflare gửi email khi thành **Active**.

Kiểm nhanh không cần mở gì:

```
nslookup -type=NS giangduonghoahoc.vn
```

Ra hai tên `…ns.cloudflare.com` là xong bước này.

## Bước 3 — Gắn tên miền vào Worker

1. `dash.cloudflare.com` → **Workers & Pages** → **Overview** → bấm **lop-hoc-online**.
2. Tab **Settings** → mục **Domains & Routes** → nút **Add** → chọn **Custom Domain**.
3. Gõ `hoc.giangduonghoahoc.com` → **Add Custom Domain**.
4. Dòng mới hiện với trạng thái *Initializing* → vài phút thành **Active** (Cloudflare tự tạo bản ghi DNS + chứng chỉ HTTPS).
5. Mở `https://hoc.giangduonghoahoc.com` trong trình duyệt thường → phải ra **trang đăng nhập** của lớp.

Nếu báo "a DNS record already exists": vào **Domains → giangduonghoahoc.com → DNS → Records**, xoá bản ghi
tên `hoc` đang có, rồi làm lại mục 2–3.

## Bước 4 — Báo cho Worker biết tên miền

Cùng trang Worker → **Settings** → **Variables and Secrets** → **Add**:

- Type: **Text** (không phải Secret)
- Variable name: `TEN_MIEN`
- Value: `giangduonghoahoc.com` — tên miền **gốc**, không `https://`, không `hoc.` (Worker tự nhận mọi tên con)

→ **Deploy** (nút ở góc, hoặc đẩy một commit bất kỳ lên GitHub). Kiểm:

```
curl -s https://hoc.giangduonghoahoc.com/api/trang-thai
```

Phải có `"ten_mien_rieng":"giangduonghoahoc.com"`. Biến này làm hai việc: (1) cho phép trang ở địa chỉ này
gọi `/api/*` của địa chỉ kia; (2) **video tải lên từ đây trở đi được khoá cho cả hai địa chỉ** (workers.dev +
tên miền riêng), nên sau này app chuyển sang địa chỉ mới vẫn phát được. Thiếu biến thì video tải lên từ trang
quản trị ở địa chỉ mới chỉ phát được ở địa chỉ mới → app (đang ở workers.dev) không xem được.

**Cho tới khi đặt xong biến này, tải video ở trang quản trị địa chỉ cũ.**

## Bước 5 — Supabase: cho phép địa chỉ mới

Thư **cấp lại mật khẩu** của sinh viên dẫn về đúng trang họ đang mở (`redirectTo: location.href`);
Supabase chỉ chấp nhận địa chỉ đã khai, không thì ném về Site URL cũ.

1. `supabase.com/dashboard` → dự án **euyrrodppbpnkmificbs** → menu trái **Authentication** → **URL Configuration**.
2. **Site URL**: sửa thành `https://hoc.giangduonghoahoc.com` → **Save**.
3. **Redirect URLs** → **Add URL** → `https://hoc.giangduonghoahoc.com/**` → **Save**.
   **Giữ nguyên** dòng `https://lop-hoc-online.giangduonghoahoc.workers.dev/**` — app máy tính vẫn dùng.

## Bước 6 — Thử một vòng bằng tài khoản sinh viên

Trên trình duyệt thường, ở địa chỉ mới:

1. Đăng nhập → thấy Trang chủ, Bài tập, Hỏi đáp như cũ.
2. Mở một video → phải hiện "cần mở bằng app máy tính" (đúng, video vẫn chỉ xem trong app).
3. Đăng xuất → **Quên mật khẩu** → thư về có link bắt đầu bằng `https://hoc.giangduonghoahoc.com/…`.
4. Mở app máy tính → vẫn vào bình thường (app đang trỏ địa chỉ cũ, không đổi gì).
5. Ở trang quản trị **địa chỉ mới**, tải lên một video ngắn, gắn vào buổi thử → mở app → video phát được
   (chứng tỏ khoá hai địa chỉ ở Bước 4 chạy đúng).

## Bước 7 — Báo tên miền cho Claude để đổi trong mã

Gửi đúng tên miền, Claude sẽ sửa một lượt (chưa cần phát hành app):

- `worker.js` → thêm địa chỉ mới vào `ORIGINS` (không phụ thuộc biến nữa).
- `web/index.html` → `APP_URL` (link tải app) sang địa chỉ mới.
- `pr/infographic-gioi-thieu.html`, `HUONG_DAN.md`, `HUONG_DAN_VIDEO.md` → địa chỉ trong phần hướng dẫn SV.
- `app/main.js` → `SITE_URL` sang địa chỉ mới, **để dành** cho lần phát hành app tiếp theo (bản đang chạy vẫn dùng
  workers.dev, địa chỉ đó sống mãi vì `workers_dev: true`).
- Video tải lên **trước** khi đặt `TEN_MIEN` đang khoá riêng cho workers.dev. Khi nào app đổi sang địa chỉ mới,
  Claude thêm nút "Khoá lại video cho địa chỉ mới" ở Kho tệp — chưa cần làm sớm.

---

## Nếu có gì không ổn

| Hiện tượng | Nguyên nhân thường gặp | Sửa |
| --- | --- | --- |
| Địa chỉ mới ra lỗi 522 / 1016 / "không tìm thấy" | DNS chưa lan, hoặc nameserver ở nhà đăng ký chưa đổi | Chờ; `nslookup -type=NS` phải ra `…ns.cloudflare.com` |
| Cloudflare Domains vẫn **Pending** sau 24 giờ | Nameserver dán sai / thiếu một cái / còn NS cũ | Vào lại trang nhà đăng ký, chỉ để đúng 2 tên Cloudflare |
| Custom Domain báo "record already exists" | Đã có bản ghi `hoc` (A/CNAME) | Xoá bản ghi trong DNS → Records rồi thêm lại |
| Trang mở được, đăng nhập ok, nhưng quản trị tạo tài khoản báo CORS | Chưa đặt `TEN_MIEN` hoặc đặt có `https://` / `hoc.` | Bước 4, đặt tên gốc; Deploy lại |
| Thư cấp lại mật khẩu dẫn về địa chỉ cũ | Site URL / Redirect URLs chưa thêm | Bước 5 |
| `trang-thai` không có `ten_mien_rieng` | Chưa Deploy lại sau khi thêm biến | Bấm Deploy hoặc đẩy commit |
| Trình duyệt báo chứng chỉ không hợp lệ | Chứng chỉ chưa cấp xong (Initializing) | Chờ 5–15 phút, tải lại |
