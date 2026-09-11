# Gắn tên miền riêng cho trang học

Hiện trang chạy ở `https://lop-hoc-online.giangduonghoahoc.workers.dev/`. Muốn có địa chỉ ngắn,
dễ nhớ (ví dụ `https://hoc.giangduonghoahoc.vn`) thì làm theo dưới đây. **Địa chỉ cũ vẫn chạy song song**
sau khi gắn — app máy tính của sinh viên không phải cập nhật gì.

Mã đã sẵn sàng (đợt v24): Worker đọc biến `TEN_MIEN` để chấp nhận tên miền mới; không đặt thì như cũ.

---

## Bước 1 — Có một tên miền

M cần sở hữu một tên miền. Hai đường:

- **Mua ngay trên Cloudflare** (đơn giản nhất, DNS tự nối): Cloudflare → *Domain Registration* → *Register domains*.
  Đuôi `.vn` Cloudflare chưa bán; `.com`/`.net`/`.org` thì có, khoảng 10 USD/năm.
- **Mua ở nhà đăng ký Việt Nam** (Mắt Bão, PA, iNET, Tenten…) nếu muốn đuôi `.vn` / `.edu.vn`. Đuôi `.edu.vn`
  cần giấy tờ của trường. Mua xong phải **trỏ nameserver về Cloudflare** (bước 2).

Gợi ý tên: `giangduonghoahoc.vn` rồi dùng tên con `hoc.giangduonghoahoc.vn` cho trang học, để sau này còn
`quantri.…`, `tailieu.…` nếu cần.

## Bước 2 — Đưa tên miền vào Cloudflare (bỏ qua nếu mua ngay trên Cloudflare)

1. Cloudflare → *Add a domain* → gõ tên miền → chọn gói **Free**.
2. Cloudflare đưa hai nameserver kiểu `ada.ns.cloudflare.com` / `bob.ns.cloudflare.com`.
3. Vào trang quản lý ở nhà đăng ký → mục *Nameserver* / *DNS* → thay bằng hai tên đó.
4. Chờ 10 phút tới vài giờ. Cloudflare báo **Active** là xong.

## Bước 3 — Gắn tên miền vào Worker

1. Cloudflare → *Workers & Pages* → **lop-hoc-online** → *Settings* → *Domains & Routes*.
2. *Add* → **Custom domain** → gõ `hoc.giangduonghoahoc.vn` (hoặc tên m chọn) → *Add domain*.
3. Cloudflare tự tạo bản ghi DNS và chứng chỉ HTTPS. Vài phút sau mở thử địa chỉ mới — phải ra trang đăng nhập.

## Bước 4 — Báo cho Worker biết tên miền mới

Cùng chỗ *Settings* → *Variables and Secrets* → *Add* → kiểu **Text**:

- Tên: `TEN_MIEN`
- Giá trị: `giangduonghoahoc.vn` (tên miền **gốc**, không có `https://`, không có `hoc.` — Worker tự nhận mọi tên con)

*Deploy* lại (hoặc đẩy một commit bất kỳ). Kiểm:

```
curl -s https://hoc.giangduonghoahoc.vn/api/trang-thai
```

Trong kết quả phải thấy `"ten_mien_rieng":"giangduonghoahoc.vn"`.

## Bước 5 — Supabase: cho phép địa chỉ mới

Thư cấp lại mật khẩu và các luồng đăng nhập chỉ chấp nhận địa chỉ đã khai:

1. Supabase → dự án → *Authentication* → *URL Configuration*.
2. **Site URL**: đổi thành `https://hoc.giangduonghoahoc.vn`.
3. **Redirect URLs**: thêm `https://hoc.giangduonghoahoc.vn/**` — **giữ nguyên** dòng
   `https://lop-hoc-online.giangduonghoahoc.workers.dev/**` vì app máy tính vẫn dùng địa chỉ đó.

## Bước 6 — Đổi địa chỉ ở những chỗ sinh viên nhìn thấy

- Infographic PR (`pr/infographic-gioi-thieu.html`): sửa dòng địa chỉ rồi xuất lại ảnh.
- `HUONG_DAN.md`, `HUONG_DAN_VIDEO.md`: thay địa chỉ trong phần hướng dẫn sinh viên.
- Trang `tai-app.html`: giữ nguyên — app tải từ R2, không phụ thuộc tên miền.

**Không cần** phát hành app máy tính mới: app đang trỏ `workers.dev`, địa chỉ đó vẫn sống. Khi nào ra bản
app tiếp theo vì lý do khác thì đổi `SITE_URL` trong `app/main.js` sang tên miền mới luôn một thể.

---

## Nếu có gì không ổn

| Hiện tượng | Nguyên nhân thường gặp | Sửa |
| --- | --- | --- |
| Địa chỉ mới ra lỗi 522 / 1016 | DNS chưa lan xong, hoặc nameserver chưa trỏ về Cloudflare | Chờ; kiểm tra bước 2 ở nhà đăng ký |
| Trang mở được nhưng đăng nhập báo lỗi CORS | Chưa đặt `TEN_MIEN` hoặc đặt sai (có `https://`, có `hoc.`) | Bước 4, đặt đúng tên miền gốc |
| Thư cấp lại mật khẩu dẫn về địa chỉ cũ | Site URL ở Supabase chưa đổi | Bước 5 |
| `trang-thai` không có `ten_mien_rieng` | Chưa deploy lại sau khi thêm biến | *Deploy* lại Worker |
