# Lớp học online — hướng dẫn dựng và vận hành

Hệ thống gồm ba phần:

| Phần | Là gì | Ai dùng |
|---|---|---|
| `schema.sql` | Cấu trúc dữ liệu + luật truy cập trên Supabase | Chạy một lần |
| `index.html` | Trang học của sinh viên | Sinh viên |
| Sổ Bài Tập | Nơi soạn phiếu bài tập, đề, bài giảng | Chỉ mình |

Nguyên tắc xuyên suốt: **quyền đọc chặn ở máy chủ**, không phải ẩn trên giao diện. Kho câu hỏi và bản giáo viên không nằm trong cơ sở dữ liệu này. Đáp án khoá theo giờ máy chủ nên sinh viên nghịch trình duyệt cũng không lấy sớm được.

---

## Bước 1. Tạo dự án Supabase

1. Vào supabase.com, đăng nhập, bấm **New project**.
2. Đặt tên (ví dụ `lop-hoc-online`), chọn vùng **Southeast Asia (Singapore)** cho gần Việt Nam.
3. Đặt mật khẩu cơ sở dữ liệu và **lưu lại chỗ nào an toàn**. Mật khẩu này không dùng hằng ngày nhưng mất thì phiền.
4. Chờ vài phút cho dự án chạy xong.

## Bước 2. Chạy cấu trúc dữ liệu

1. Trong dự án, mở **SQL Editor** ở cột trái, bấm **New query**.
2. Mở file `schema.sql`, chép **toàn bộ**, dán vào, bấm **Run**.
3. Chạy xong thấy `Success. No rows returned`. File này chạy lại nhiều lần không sao, kể cả khi lần trước chạy dở.

> Nếu báo `relation "public.enrollments" does not exist`: đó là bản `schema.sql` cũ, thứ tự bị sai. Dùng bản mới nhất trong thư mục này (bảng đặt trước, hàm đặt sau) rồi chạy lại từ đầu.
>
> Nếu báo lỗi ở phần `storage.objects` (`must be owner of table objects`): bỏ qua phần đó, vào **Storage → tailieu → Policies** tạo bằng giao diện, hoặc báo lại để lấy cách khác.

## Bước 3. Tạo tài khoản của mình và tự đặt quyền quản trị

1. Vào **Authentication → Users → Add user → Create new user**.
2. Nhập email của mình, đặt mật khẩu, bật **Auto Confirm User**.
3. Quay lại **SQL Editor**, chạy đoạn này (thay email):

```sql
update public.profiles set role = 'admin', full_name = 'Phạm Anh Ngọc'
where id = (select id from auth.users where email = 'email-cua-ban@gmail.com');
```

## Bước 4. Cắm khoá vào trang học

1. Vào **Project Settings → API**, lấy hai giá trị:
   - **Project URL**
   - **anon public** key
2. Mở `index.html`, tìm phần `CẤU HÌNH` ở đầu thẻ script, dán hai giá trị vào.

> **Cảnh báo:** trong trang API còn một khoá tên `service_role`. Khoá đó mở toàn bộ dữ liệu, bỏ qua mọi luật truy cập. Không dán vào file này, không gửi cho ai, không đưa vào chat.

## Bước 5. Đưa trang học lên mạng

Cách nhanh nhất là Cloudflare Pages:

1. Vào dash.cloudflare.com, chọn **Workers & Pages → Create → Pages → Upload assets**.
2. Kéo thả file `index.html` vào, đặt tên dự án, bấm **Deploy**.
3. Có ngay địa chỉ dạng `ten-du-an.pages.dev`, đã có HTTPS. Gửi địa chỉ này cho sinh viên.

Sửa gì trong `index.html` thì tải lên lại là xong.

---

## Vận hành hằng ngày

Giai đoạn đầu dùng thẳng **Table Editor** của Supabase. Sau này sẽ có trang quản trị riêng.

### Tạo lớp

```sql
insert into public.classes (name, subject) values ('Hóa phân tích K68 · tối 3-5', 'Hóa phân tích');
```

### Tạo tài khoản cho sinh viên

Làm ngay trên trang quản trị: chọn lớp → tab **Sinh viên** → **＋ Tạo tài khoản mới**, mỗi dòng `email, họ tên, mã SV`. Trang tạo tài khoản, ghi danh vào lớp và hiện mật khẩu tạm **một lần** (có nút chép / tải .txt). Sinh viên đăng nhập lần đầu phải tự đổi mật khẩu rồi khai hồ sơ. Sinh viên quên mật khẩu thì bấm **Cấp lại mật khẩu** ở dòng của người đó.

Việc này chạy qua một đoạn mã nhỏ trên Cloudflare (`worker.js`) và cần **khoá quản trị của Supabase**, dán **một lần**:

1. Supabase → **Project Settings → API Keys** → chép khoá **service_role** (dự án dùng kiểu khoá mới thì chép khoá `sb_secret_…`).
2. Cloudflare → **Workers & Pages → lop-hoc-online → Settings → Variables and Secrets → Add**: Type **Secret**, Variable name `SUPABASE_SERVICE_ROLE_KEY`, Value = khoá vừa chép → **Deploy**.
3. Không gửi khoá này cho ai, không dán vào file, không dán vào chat. Chưa có khoá thì trang quản trị báo "Máy chủ chưa có khoá quản trị".

Cách cũ vẫn dùng được khi cần: **Authentication → Users → Add user**, bật **Auto Confirm User**, rồi bấm **Thêm bằng email** trên trang quản trị.

### Ghi danh sinh viên vào lớp

```sql
select public.enroll_by_email(
  (select id from public.classes where name like 'Hóa phân tích K68%'),
  'sinhvien@example.com');
```

Xem danh sách lớp:

```sql
select full_name, email, joined_at from public.class_roster
where class_id = (select id from public.classes where name like 'Hóa phân tích K68%');
```

### Thêm một buổi

```sql
insert into public.sessions (class_id, no, title, held_on, note, published)
values ((select id from public.classes where name like 'Hóa phân tích K68%'),
        1, 'Nồng độ và pha dung dịch', '2026-09-10',
        'Xem video trước, làm phiếu bài tập rồi mang tới lớp.', true);
```

`published = false` là buổi nháp, sinh viên không thấy gì cả. Bật `true` khi muốn mở.

### Thêm tài liệu vào buổi

Mỗi tài liệu gồm **hai dòng**: một dòng mô tả trong `materials`, một dòng nội dung trong `material_contents`.

Video bài giảng:

```sql
with m as (
  insert into public.materials (session_id, kind, title, order_no)
  values ((select id from public.sessions where no = 1 and class_id =
           (select id from public.classes where name like 'Hóa phân tích K68%')),
          'video', 'Video buổi 1 · Nồng độ dung dịch', 1)
  returning id)
insert into public.material_contents (material_id, url)
select id, 'https://www.youtube.com/watch?v=XXXXXXXX' from m;
```

Phiếu bài tập PDF: tải tệp lên trước ở **Storage → tailieu**, đặt trong thư mục tên đúng bằng `id` của buổi, rồi:

```sql
with m as (
  insert into public.materials (session_id, kind, title, order_no)
  values ('<id-buổi>', 'pdf', 'Phiếu bài tập buổi 1', 2)
  returning id)
insert into public.material_contents (material_id, storage_path)
select id, '<id-buổi>/phieu-buoi-1.pdf' from m;
```

Đáp án mở sau, ví dụ mở lúc 20 giờ ngày 12/9:

```sql
with m as (
  insert into public.materials (session_id, kind, title, open_at, order_no)
  values ('<id-buổi>', 'answer', 'Đáp án và lời giải', '2026-09-12 20:00+07', 3)
  returning id)
insert into public.material_contents (material_id, storage_path)
select id, '<id-buổi>/dap-an-buoi-1.pdf' from m;
```

Trước giờ đó sinh viên thấy dòng "Đáp án và lời giải · Mở lúc 12/09 lúc 20:00" nhưng máy chủ từ chối trả nội dung.

---

## Hạn nộp và nhắc hạn

Đặt hạn khi bật **Nhận bài nộp** cho phiếu. Sau đó sinh viên được nhắc **tự động**:

- Bài chưa nộp mà còn hạn trong **7 ngày** thì hiện thành một dải **“Sắp tới hạn nộp”** ngay đầu trang chủ, kèm đếm ngược và nút Nộp bài.
- Còn **dưới 24 giờ** thì dải đó chuyển màu đỏ.
- Trong tab Bài tập, nhãn đổi từ “Cần nộp” thành “Nộp · còn 2 ngày”.
- Nộp xong là dải biến mất ngay.

Không đặt hạn thì không có nhắc gì cả — chỉ ghi “cần nộp bài”.

## Trên điện thoại

**Từ 11/9/2026 sinh viên không học trên điện thoại được nữa** — việc học chỉ nằm trong app Windows/macOS (xem hai mục dưới).
Điện thoại mở `giangduonghoahoc.com` thì thấy trang giới thiệu, khoá học, cách học, hỏi đáp nhanh, Zalo và nút tải app.

Trang quản trị vẫn thêm được vào màn hình chính điện thoại cho m (Android: Chrome → ba chấm → *Thêm vào Màn hình chính*;
iPhone: Safari → Chia sẻ → *Thêm vào Màn hình chính*) — icon/tên ở `web/manifest-quan-tri.json`.

## Ai phải dùng ứng dụng máy tính

Đặt ở đầu tệp `web/index.html`, dòng `BAT_BUOC_APP`:

| Giá trị | Nghĩa là |
|---|---|
| `'khong'` | Không bắt buộc gì. Mọi thứ mở được trên trình duyệt, kể cả điện thoại. |
| `'video'` | Chỉ video bài giảng phải mở trong app; phiếu, đề, đáp án vẫn đọc trên điện thoại. (Dùng tới 11/9/2026.) |
| `'tat_ca'` | **Đang dùng.** Khoá sạch: sinh viên không có app thì không vào được — kể cả điện thoại. Trình duyệt chỉ hiện màn "Lớp học mở trong ứng dụng" + nút tải. |

Giảng viên và quản trị luôn được miễn.

Vì sao đổi sang `'tat_ca'` (11/9/2026): tách hẳn **trang công khai** (`giangduonghoahoc.com/` — giới thiệu, tải app) khỏi
**chỗ học** (trong app, trang `/hoc`). Sinh viên chỉ có một đường, mọi tài liệu đều nằm sau màn đen chống chụp/quay và
khoá mã máy thật, hết cảnh đề đọc được trên web còn video thì không. Giá phải trả, đã chấp nhận: không học, không nộp bài
từ điện thoại; sinh viên chụp bài làm rồi chuyển ảnh sang máy tính để nộp.

Ba việc mã đã lo để đổi chế độ không gãy gì:
- **App bản ≤ 1.0.16** vẫn mở địa chỉ gốc `/`: Worker nhận ra app qua User-Agent `LopHocApp/…` và trả thẳng trang học, sinh viên không phải cập nhật. Bản app sau trỏ thẳng `/hoc`.
- **Quên mật khẩu**: link trong thư mở bằng trình duyệt → trang `/hoc` nhận ra `type=recovery`, chỉ hiện ô đặt mật khẩu mới, không gắn máy, không bắt app; xong thì nhắc mở app.
- **Sinh viên thử đăng nhập bằng trình duyệt** không bị gắn nhầm tài khoản vào trình duyệt: trang kiểm "đang trong app?" **trước** khi gắn máy.

Chặn thật nằm ở máy chủ chứ không chỉ ở giao diện: `APP_CHO_VIDEO` trong `worker.js` làm Worker **không ký vé xem** cho ai không chạy trong app, dù có gọi thẳng vào `/api/stream/token`. Đổi `BAT_BUOC_APP` thì nhớ đổi cả hai cho khớp.

## Web hay app: cái gì chặn được, cái gì không

Từ 11/9/2026 sinh viên **không học trên trình duyệt nữa**, nên cột "web" dưới đây chỉ còn đúng với giảng viên (được miễn)
và để hiểu vì sao phải bắt app. Bảng thật để khỏi kỳ vọng nhầm:

| Bảo vệ | Trình duyệt (web) | App tải về |
|---|---|---|
| Dấu chìm tên + email người xem đè lên PDF và video | ✅ | ✅ |
| Không tải PDF về (trừ tệp m bật *cho tải*), không in, không Ctrl+S | ✅ ghi lại + báo GV | ✅ |
| Phím **PrintScreen** | ✅ ghi, báo, xoá ảnh khỏi bộ nhớ tạm | ✅ |
| **Win+Shift+S** (Snipping Tool) | ⚠️ chỉ *đoán* qua việc mất tiêu điểm trong ~2 s — bắt được phần lớn, có thể sót hoặc nhầm | ✅ ảnh chụp ra **màn đen** |
| Quay màn hình (OBS, Game Bar, Zoom, Teams…) | ❌ trình duyệt không nhìn thấy | ✅ bản quay ra **màn đen**; app còn dò tiến trình quay và ghi cảnh báo |
| Chụp bằng điện thoại chĩa vào màn hình | ❌ | ❌ — không công nghệ nào chặn được, chỉ còn dấu chìm để truy nguồn |
| Một tài khoản = một máy | ⚠️ nhớ theo bộ nhớ trình duyệt, **riêng từng địa chỉ**; xoá dữ liệu duyệt web hay đổi địa chỉ là "máy mới" | ✅ mã của chính chiếc máy, bền qua mọi thứ |
| Toàn bộ việc học (bài giảng, tài liệu, bài tập, nộp bài, hỏi đáp) | ❌ sinh viên thấy màn "Lớp học mở trong ứng dụng" + nút tải | ✅ |
| Rời cửa sổ / bỏ đi 5 phút | ✅ che mờ, hỏi rồi đăng xuất | ✅ |
| Ba lần vi phạm chắc chắn | ✅ đóng phiên | ✅ |

Nói ngắn: **trên web, ảnh chụp và bản quay vẫn ra nội dung thật**, hệ thống chỉ ghi lại được một phần và báo cho m.
**Trong app, ảnh chụp và bản quay ra màn đen** — trình duyệt không bao giờ làm được điều này, nên toàn bộ việc học nằm trong app.
Muốn mở lại đường đọc đề trên điện thoại thì đổi `BAT_BUOC_APP` về `'video'` (và `APP_CHO_VIDEO` giữ nguyên).

Mọi vi phạm (dù bắt được ở web hay app) đều vào Quản trị → **Cảnh báo**, kèm tên, tài liệu đang mở và giờ.

**Bốn địa chỉ, nhớ cho đúng:**

| Địa chỉ | Là gì | Ai mở |
|---|---|---|
| `giangduonghoahoc.com/` | Trang công khai: giới thiệu, khoá học, cách học, hỏi đáp nhanh, Zalo, tải app | Ai cũng được, không đăng nhập |
| `giangduonghoahoc.com/hoc` | Trang học — app mở trang này | Sinh viên trong app; giảng viên mở bằng trình duyệt để xem như sinh viên (miễn khoá máy, miễn app) |
| `giangduonghoahoc.com/quan-tri` | Trang quản trị — **không có link nào dẫn tới** từ trang công khai, tự gõ địa chỉ; có `noindex` để máy tìm kiếm không lập chỉ mục | Giảng viên, trình duyệt |
| `giangduonghoahoc.com/so-bai-tap` | Bản web của Sổ Bài Tập | Giảng viên, trình duyệt |

Địa chỉ cũ `lop-hoc-online.giangduonghoahoc.workers.dev` vẫn trả y hệt bốn trang trên.

## Trang công khai — sửa nội dung ở đâu

Quản trị → tab **Trang công khai**: lời mở đầu (khẩu hiệu + đoạn giới thiệu), **khoá học** (tên, trạng thái đang mở / sắp mở / đã kết thúc,
lịch, dành cho ai, mô tả), **cách học** (các bước, tự đánh số), **hỏi đáp nhanh**, **liên hệ** (số Zalo, link zalo.me, email, Facebook).
Bấm **Lưu và đăng** là trang đổi ngay. Nút tải app, phần "học ở đây thì được gì" và nội quy ngắn là cố định trong `web/index.html`.

Cần chạy `schema_v25_trang_cong_khai.sql` một lần (bảng `trang_cong_khai`, ai cũng đọc, chỉ giảng viên sửa). Chưa chạy thì tab
nhắc đúng tên tệp, còn trang công khai vẫn hiện bản mẫu có sẵn trong mã. Đừng ghi gì riêng tư vào tab này — ai cũng đọc được.

Số Zalo đang **để trống** trong bản mẫu — m điền ở tab này, trang mới hiện nút *Nhắn Zalo* và *Đăng ký qua Zalo*.

**Chữ cố định trên trang** (tiêu đề mục, nhãn, nút, 6 thẻ "được gì", chân trang): cùng tab, khối **Chữ trên trang** (bấm để mở).
Ô trống = chữ mặc định (hiện mờ trong ô); gõ đúng một dấu `-` = bỏ trống hẳn (bỏ nội dung ghi chú cuối mục Cách học là ẩn cả ghi chú).
Muốn thêm/bớt dòng sửa được thì bảo t sửa `web/chu-cong-khai.js`.

**Link Zalo riêng từng khoá:** trong thẻ khoá học có ô *Link Zalo của khoá* (nhóm lớp) + *Chữ trên nút*. Có link thì nút chính
của thẻ dẫn vào nhóm, nút phụ "Nhắn giảng viên"; không có thì nút "Đăng ký qua Zalo" dùng số ở mục Liên hệ. Khoá đã kết thúc không có nút.

**Ảnh QR Zalo:** Zalo → *Cá nhân* → *Mã QR của tôi* → *Lưu ảnh* → ở tab này bấm **📷 Chọn ảnh** → Lưu và đăng. Ảnh tự thu nhỏ về 480 px
và nằm ngay trong bảng (không cần kho tệp), hiện cạnh số Zalo ở mục Liên hệ; điện thoại thì QR lên trước số. *Bỏ ảnh* để gỡ.

**Giọng của trang công khai và trang tải app (chốt 11/9): phô cái tốt, che rào cản.** Không nêu "một tài khoản một máy", "chưa ký số",
chống chụp/quay, dấu chìm, tự đăng xuất… ở nơi ai cũng đọc. Những điều đó sinh viên biết khi đã vào lớp (màn đăng nhập lần đầu,
lời báo khi vướng). Hướng dẫn cài chỉ nói *cách làm* ("nếu Windows hỏi xác nhận → More info → Run anyway"), không nói *lý do*.
M đã chạy v25 trước khi đổi giọng → chạy thêm `schema_v25b_giong_trang.sql` (chỉ thay hai mảnh còn chữ cũ; đã sửa tay thì không đụng).

## Video: chọn nơi đặt

> **Đã có cách chặn tải:** đưa video lên Cloudflare Stream với link ký — làm theo `HUONG_DAN_VIDEO.md` (từng bước). Bảng dưới là so sánh các lựa chọn.

Không có cách nào chặn tải tuyệt đối. Cái gì phát ra màn hình thì quay màn hình được. Ba mức thực tế:

| Cách | Chi phí | Mức chặn |
|---|---|---|
| YouTube chế độ **Không công khai**, nhúng vào trang | Miễn phí | Thấp. Link không lộ ra ngoài nhưng vẫn có tiện ích tải được |
| **Bunny Stream** hoặc **Cloudflare Stream**, bật link ký theo phiên | Rẻ, tính theo dung lượng và lượt xem | Khá. Không có link cố định để chép, link máy này không mở được ở máy khác |
| Dịch vụ có khoá bản quyền | Đắt | Cao, nhưng vẫn không chặn được quay màn hình |

Trang học đã có sẵn **dấu chìm động**: tên và email của chính người đang xem hiện đè lên video và trang PDF, tự đổi vị trí. Bản quay lén sẽ mang tên người phát tán. Đây là biện pháp răn đe mạnh hơn mọi thủ thuật kỹ thuật.

Trang cũng đã tắt chuột phải và kéo ảnh trong cửa sổ xem, và PDF được vẽ ra màn hình chứ không đưa link tải.

---

## Nộp bài

Bật cho từng phiếu: tab **Buổi học** → ✎ Sửa một *Phiếu bài tập* hoặc *Bài giảng* → tích **Nhận bài nộp**, đặt **Hạn nộp** nếu muốn.

Sinh viên mở phiếu ra là thấy ô nộp ngay bên dưới: chụp ảnh bài làm hoặc chọn PDF (nhiều tệp một lúc, mỗi tệp tối đa 10 MB), kèm lời nhắn. Nộp rồi vẫn **nộp lại** hoặc **rút bài** được — cho tới khi m chấm.

M xem và chấm ở tab **Bài nộp**: mỗi phiếu một bảng, ai nộp ai chưa, bấm tên tệp để mở bài làm, gõ điểm và nhận xét rồi **Lưu**. Chấm xong sinh viên thấy ngay dưới phiếu và không sửa bài được nữa. Muốn cho sửa lại thì xoá trắng cả ô điểm lẫn ô nhận xét rồi Lưu.

Quá hạn thì nút nộp đóng lại. Cần mở thêm cho một bạn thì sửa lại **Hạn nộp** của phiếu.

## Sao lưu dữ liệu lớp

**Tự động (v28):** máy chủ tự gom 15 bảng thành một tệp JSON lúc **3h sáng Chủ nhật** hằng tuần, cất vào kho riêng tư `sao-luu`
trong Supabase (giữ 8 bản gần nhất). Quản trị → **Kho tệp** → thẻ *Sao lưu tự động*: danh sách bản, **⤓ Tải về**, **Sao lưu ngay**.
Cần chạy `schema_v28_sao_luu_loi_khach.sql` một lần. Muốn có thêm bản ở Cloudflare R2 (ngoài Supabase, đề phòng mất cả dự án):
tạo bucket R2 riêng tư (vd `giang-duong-sao-luu`) rồi nhắn t thêm `r2_buckets` binding `SAO_LUU` vào `wrangler.jsonc` — Worker tự
ghi thêm sang đó. Tệp PDF/ảnh/video **không** nằm trong bản sao (chỉ có đường dẫn), như sao lưu tay.

**Tay:** nút *⤓ Sao lưu dữ liệu* vẫn còn — tải tệp về máy ngay lúc bấm.

## Lỗi phía sinh viên

App (trang học) và trang quản trị gặp lỗi JavaScript thì tự ghi một dòng về bảng `loi_khach` (tối đa 5 dòng/phiên, không lặp cùng
thông điệp; giữ 30 ngày, tự dọn mỗi lần sao lưu). Quản trị → **Cảnh báo** → mục *Lỗi phía sinh viên*: lúc, ai, trang, thông điệp, chỗ
(tệp:dòng:cột), rê chuột thấy trình duyệt/app. Thấy lỗi lặp ở nhiều em thì chép dòng lỗi gửi t.

### (cũ) Sao lưu tay

Quản trị → tab **Kho tệp** → nút **⤓ Sao lưu dữ liệu**. Nó gom mọi bảng về một tệp `.json` tải thẳng xuống máy, tên có sẵn ngày tháng.

Trong tệp có: lớp, buổi học, tài liệu, danh sách sinh viên và hồ sơ, lượt xem và giờ xem, **bài nộp kèm câu trả lời và điểm**, hỏi đáp, đáp án các ô, thiết bị đã gắn, cảnh báo chụp màn hình, và bộ đếm phút phát video.

**Không có trong tệp:** tệp PDF, ảnh và video. Chúng nằm ở kho Supabase và Cloudflare Stream — tệp sao lưu chỉ ghi lại đường dẫn để biết cái nào ở đâu. Muốn giữ cả tệp gốc thì tải riêng từ Supabase → Storage.

Nên làm **cuối mỗi kỳ**, hoặc trước khi m định xoá gì lớn. Cất tệp ở chỗ khác máy này — sao lưu để cùng một chỗ với bản gốc thì hỏng cả hai cùng lúc.

Chưa có nút phục hồi tự động: cần khôi phục thì đưa tệp này cho người dựng hệ thống, dữ liệu trong đó đủ để dựng lại.

## Cho sinh viên tải phiếu về để in

Cần chạy một lần `schema_v21_cho_tai.sql`.

Mặc định **mọi tài liệu đều không cho tải** — sinh viên chỉ đọc trên trang. Muốn mở cho tệp nào: tab **Buổi học** → ✎ Sửa tài liệu đó → tích **Cho tải về** → Lưu. Hàng tài liệu sẽ hiện nhãn **⤓ cho tải** để m nhìn là biết.

Sinh viên mở tài liệu ra sẽ thấy nút **Tải về để in** ở cuối trang.

**Cân nhắc trước khi bật:**

- Tệp tải về là **bản gốc: không có dấu chìm, không có bảo vệ gì**. Ra khỏi máy sinh viên là m mất quyền kiểm soát nó.
- Hợp lý cho **phiếu bài tập** cần in ra làm tay. **Đừng bật cho đề thi và đáp án.**
- Cờ này quyết định *có nút hay không*, chứ không phải hàng rào mật mã: để vẽ được phiếu ra màn hình thì trình duyệt bắt buộc phải tải nội dung về, đó là cách web hoạt động. Tắt cờ thì muốn lấy tệp phải biết mở công cụ nhà phát triển; bật thì ai cũng lấy được bằng một cú bấm.

## Cho sinh viên điền thẳng vào phiếu, máy chấm đúng/sai

Cần chạy một lần `schema_v20_o_tra_loi.sql` trong Supabase.

**M làm một lần cho mỗi phiếu:**

1. Bật **Nhận bài nộp** cho phiếu đó trước (xem mục Nộp bài).
2. Ở hàng tài liệu bấm nút **◻ Ô trả lời**.
3. Phiếu hiện ra. **Kéo chuột** khoanh vào từng chỗ trống — mỗi lần kéo tạo một ô.
4. Bên phải, gõ **đáp án đúng** cho từng ô. Bỏ trống thì máy chỉ thu bài, không chấm ô đó.
5. Bấm **Lưu ô trả lời**.

Kéo ô để dời, kéo góc dưới phải để chỉnh cỡ, bấm **Xoá ô** để bỏ.

**Cách gõ đáp án cho máy chấm đúng:**

| Muốn gì | Gõ thế nào |
|---|---|
| Nhiều cách viết đều đúng | Ngăn bằng dấu `|`: `phenolphtalein|phenolphthalein` |
| Đáp án là số, cho sai số | Gõ số vào ô **sai số**: đáp án `0,08` sai số `0,001` |
| Đáp án là công thức | Cứ gõ `H2SO4` — sinh viên gõ `H₂SO₄` vẫn được tính đúng |

Máy tự bỏ khoảng trắng, không phân biệt hoa thường, coi dấu phẩy và dấu chấm thập phân như nhau, và quy chỉ số dưới / số mũ về số thường trước khi so.

**Sinh viên thấy gì:** mở phiếu ra là có ô nhập nằm đúng chỗ trống, gõ vào rồi bấm **Nộp bài**. Máy chấm ngay và tô màu từng ô: **xanh** là đúng, **vàng** là gần đúng, **đỏ** là sai. Kết quả ghi kiểu **3/4 câu đúng**. Máy chấm rồi vẫn sửa và **nộp lại** được — chỉ khi m chấm tay thì mới khoá.

**Câu gần đúng thì máy không dám kết luận** — nó đẩy sang cho m. Trong tab Bài nộp bài đó hiện nhãn **cần xem lại**, trong bảng điểm có dấu **!** bên cạnh. Lệch dưới 2% so với đáp án số, hoặc chỉ khác dấu ngoặc / ký tự lạ, thì tính là gần đúng.

**Phân biệt điểm máy với điểm m:** ô do máy chấm ghi **nghiêng** trong bảng điểm, và cột "Nộp lúc" ghi rõ *máy chấm*. M chấm đè lên thì nó thành điểm của m.

**Chỉ dùng được với phiếu tải lên dạng tệp** (PDF hoặc ảnh). Phiếu là link ngoài hay gõ chữ thì không khoanh ô được.

## Xem sinh viên đã điền gì, và sửa kết luận của máy

Cần chạy một lần `schema_v22_xem_bai_thong_ke.sql`.

Tab **Bài nộp** → bài nào điền trên phiếu sẽ có nút **Xem bài**. Mở ra là một bảng từng câu: **sinh viên gõ gì · đáp án đúng là gì · máy chấm ra sao**. Câu máy đánh dấu *gần đúng* được tô hồng để m nhìn thấy ngay.

Mỗi dòng có sẵn nút đổi kết luận: **đúng · gần đúng · sai**. Bấm một cái là điểm tự tính lại và nhãn *cần xem lại* biến mất nếu không còn câu nào lửng lơ.

Dùng khi máy chấm quá nghiêm — ví dụ em ấy viết `2,03` mà đáp án là `2`, hoặc viết đúng ý nhưng khác chữ.

## Câu nào cả lớp sai nhiều nhất

Tab **Bài nộp** → bấm **Câu hay sai** ở thanh trên.

Mỗi phiếu một bảng: từng câu bao nhiêu em đúng / gần đúng / sai, kèm thanh màu nhìn phát biết. Tiêu đề ghi luôn **câu khó nhất**. Dòng nào quá nửa lớp chưa làm đúng thì tô hồng — đó chính là chỗ đáng giảng lại buổi sau.

## Bảng điểm cả lớp

Quản trị → tab **Bài nộp** → bấm **Bảng điểm** ở thanh trên cùng.

Một bảng **sinh viên × phiếu**: mỗi ô là điểm đã chấm, dấu **•** là đã nộp mà m chưa chấm, dấu **–** là chưa nộp. Hai cột cuối là số bài đã nộp và điểm trung bình.

Trung bình chỉ tính những ô là **số**. Ô ghi chữ (Đạt, Khá…) vẫn hiện nhưng không cộng vào trung bình — nên nếu muốn có trung bình thì cho điểm bằng số.

Nút **⤓ Xuất bảng điểm** tải về tệp `.csv`, mở được bằng Excel hoặc Google Sheets (đã gắn sẵn dấu nhận diện tiếng Việt nên không bị lỗi phông).

## Xem một sinh viên học thế nào

Quản trị → tab **Sinh viên** → **bấm vào tên** người đó.

Hiện ra một bảng gom hết: đã mở bao nhiêu tài liệu trên tổng số, bao nhiêu lượt, tổng giờ xem video, điểm trung bình; rồi danh sách bài đã nộp (kèm điểm và nhận xét), câu đã hỏi (câu nào chưa được trả lời in đậm), tài liệu mở gần đây, và cảnh báo chụp màn hình nếu có.

Dùng trước buổi phụ đạo để biết em nào đang hổng chỗ nào, khỏi phải mở bốn tab.

## Đăng ký từ trang công khai → duyệt → tài khoản

Cần chạy `schema_v27_dang_ky_nhan_ban.sql` một lần (`/api/trang-thai` → `v27_dang_ky: true`).

1. Sinh viên điền form **Đăng ký** trên `giangduonghoahoc.com` (họ tên, Zalo, email, khoá, lời nhắn). Nút *Đăng ký* trên mỗi thẻ khoá
   tự chọn sẵn khoá đó. Form gửi qua Worker (`/api/dang-ky`) — có bẫy chống máy điền, mỗi IP tối đa 5 đơn/giờ, một email một đơn chờ mỗi khoá.
2. Quản trị → tab **Sinh viên** → bảng **Đăng ký mới từ trang công khai** (nút tab có số đếm, cộng với học phí chờ duyệt).
3. Bấm **✓ Duyệt** → chọn lớp (tự gợi ý theo tên khoá), sửa tên, thêm mã SV nếu có → *Tạo tài khoản & ghi danh*: tài khoản tạo qua
   `/api/tao-tai-khoan` như tạo tay; email đã có tài khoản thì chỉ ghi danh thêm. Hộp tiếp theo có **tin nhắn soạn sẵn** (email + mật khẩu tạm
   + link tải app) với nút *Chép* và *Mở Zalo <số>* — dán vào Zalo là xong. Đồng hồ học phí (nếu lớp có thu) chạy từ hôm duyệt.
   Form đăng ký tick được **nhiều khoá**. Hộp Duyệt liệt kê **từng khoá em ấy xin** (không tick sẵn) → tick khoá muốn duyệt lần này, chọn lớp tương ứng
   (máy gợi ý lớp trùng tên). Khoá chưa tick **ở lại hàng chờ** (chip ✓ cho khoá đã duyệt), duyệt sau lúc nào cũng được — tránh một cú bấm ghi danh nhầm.
   Lớp đầu tạo tài khoản, các lớp sau ghi danh thêm vào cùng tài khoản. Cần `schema_v27d_duyet_tung_khoa.sql` để nhớ từng khoá.
   **Mật khẩu khởi tạo = mã sinh viên** em ấy khai trên form (mã dưới 6 ký tự thì máy tự sinh) — cả khi m tạo tay có điền mã SV; lần đầu vào vẫn phải đổi.
4. **Từ chối** ghi lý do, đơn không hiện nữa (vẫn còn trong bảng `dang_ky` để tra).

Chưa chạy v27 thì form trên trang công khai báo "Đăng ký trực tuyến chưa mở — nhắn Zalo", tab quản trị không hiện bảng.

## Sao chép buổi sang lớp khác

Tab Buổi học → trong một buổi bấm **⧉ Sang lớp…** → chọn lớp nhận. Bản sao mang theo mọi tài liệu (PDF, video, phiếu có ô đáp án, đáp án, link)
và **dùng lại đúng tệp trong kho** — không tải lên lần nữa. Bản sao là **nháp**, không ghim, bỏ ngày/giờ/hạn nộp để m đặt lại theo lịch lớp kia
rồi mới *Mở cho sinh viên*. Toast có nút *Mở lớp đó* để sang xem ngay.

## Học phí — chuyển khoản QR, được nợ 2 tuần, khoá theo từng khoá

Cần chạy `schema_v26_hoc_phi.sql` một lần (`/api/trang-thai` → `v26_hoc_phi: true`).

**Cài một lần:** Quản trị → tab **Sinh viên** → **💳 Nhận học phí**: chọn ngân hàng, số tài khoản, tên chủ tài khoản (không dấu).
Từ đó sinh viên thấy **mã VietQR có sẵn số tiền của khoá và nội dung chuyển** `HP <mã SV> <chữ cái đầu tên lớp>` — m chỉ đối chiếu
sao kê theo mã SV rồi bấm ✓. Không dùng VietQR thì tải ảnh QR của app ngân hàng (sinh viên tự nhập số tiền, nội dung).

**Mỗi lớp:** *Đổi tên lớp* → **Học phí (VND)** và **Được nợ (ngày)**, mặc định 14. Học phí 0 = không thu. Đổi mức thu (kể cả từ 0 lên)
thì hạn của sinh viên đã ghi danh tính **từ hôm đó**, không ai bị quá hạn ngay.

**Sinh viên thấy gì:** còn hạn → dải nhắc trên trang chủ ("còn N ngày", nút *Xem cách chuyển*) và vẫn học bình thường. Quá hạn →
**chỉ khoá đó** tạm đóng: mọi mục chỉ còn màn học phí (QR, số tiền, số TK, nội dung có nút Chép, nút **Tôi đã chuyển**, *Kiểm tra lại*,
*Nhắn Zalo giảng viên* lấy từ trang công khai). Máy chủ cũng không trả buổi/tài liệu/vé video của khoá đó. Các khoá khác của em đó
vẫn học — thẻ lớp bị khoá có 🔒. Trang tự kiểm tra mỗi phút; m xác nhận là mở lại ngay.

**Sinh viên đóng sớm:** thẻ **Học phí của bạn** ngay đầu trang chủ liệt kê mọi khoá có thu với nút *Chuyển khoản* — không phải đợi nhắc hay đợi khoá.

**Duyệt nhanh:** đầu tab Sinh viên có bảng **Chờ duyệt học phí** gom mọi lớp (ai đã bấm *Tôi đã chuyển*), nút tab có số đếm; bấm **✓ Duyệt** →
hộp xác nhận (số tiền, hình thức: QR / chuyển ngoài hệ thống / tiền mặt / khác, ghi chú). Học viên chuyển khoản ngoài hệ thống hay đưa tiền mặt
thì vào cột Học phí của em đó bấm **✓ Đã nhận** và chọn hình thức tương ứng — không bị khoá nhầm. Số tiền của lớp đặt ở nút **💰 Học phí lớp này**.

**Xác nhận:** tab Sinh viên → cột **Học phí**: `còn N ngày` / `quá hạn N ngày — đang khoá` / `đã đóng` / `miễn`, kèm nhãn **SV báo đã chuyển**
khi em đó bấm nút. Nút **✓ Đã nhận** (hỏi số tiền, mặc định = học phí lớp) · **Gia hạn** (+N ngày từ hôm nay hoặc từ hạn hiện tại) ·
**Miễn** / **Thu lại** · **Hoàn tác**. Thanh trên tab tóm tắt: `1.500.000 ₫ · 3 đã đóng · 2 còn hạn · 1 quá hạn · 1 báo đã chuyển`.

**Đối chiếu sao kê (tab Sinh viên → 📋 Đối chiếu sao kê):** mở app ngân hàng → Lịch sử giao dịch → sao chép (hoặc xuất CSV, hoặc SMS) → dán vào ô
→ *Đối chiếu*. Máy tìm trên từng dòng chữ **HP + mã sinh viên** (+ viết tắt lớp nếu em ấy học nhiều khoá) và số tiền (ưu tiên số có dấu nghìn
hoặc dấu +; bỏ số tài khoản, mã giao dịch, ngày giờ). Bảng kết quả: **Khớp** (tick sẵn) · *Lệch tiền* (duyệt được, ghi đúng số trên sao kê) ·
*Chọn lớp* (học nhiều khoá mà nội dung không có viết tắt lớp) · *Đã đóng rồi* · *Không thấy mã SV* · *Trùng dòng trên*. Bấm **Duyệt các dòng đã tick**
→ ghi `da_dong_at`, số tiền, ghi chú "Sao kê <ngày> — <dòng gốc>". Chưa bấm Duyệt thì chưa ghi gì.

**Vì sao "thông minh":** một em học 3 khoá = 3 dòng ghi danh, mỗi dòng hạn riêng, mốc đóng riêng, miễn riêng — đóng khoá nào mở khoá đó.
Hạn = ngày ghi danh (hoặc ngày bắt đầu thu, nếu muộn hơn) + số ngày; gia hạn ghi vào dòng đó. Không có "khoá cả tài khoản".

**Giới hạn nói rõ:** m vẫn phải tự đối chiếu sao kê (không có cổng thanh toán tự động — tránh phí và giấy tờ). Mã VietQR lấy từ
`img.vietqr.io` (dịch vụ miễn phí ngoài); nếu có lúc không tải được, sinh viên vẫn có đủ số TK + số tiền + nội dung để chuyển tay.
Đặt học phí mà chưa đặt ngân hàng thì sinh viên không có QR — trang quản trị nhắc ngay lúc lưu.

## Thùng rác — xoá nhầm buổi hay tài liệu thì lấy lại được

Cần chạy một lần `schema_v24_thung_rac_bo_go.sql`. Chưa chạy thì nút Xoá vẫn xoá thẳng như trước, có báo trước trong hộp thoại.

Từ v24, **Xoá buổi** / **×** ở tài liệu không xoá thẳng nữa mà đưa vào **Thùng rác**: sinh viên hết thấy ngay (chặn ở luật đọc của máy chủ, không phải chỉ giấu trên trang), còn bài nộp, câu hỏi, lượt xem kèm theo vẫn nguyên.

- Ngay sau khi xoá có nút **Hoàn tác** trên thông báo — bấm là về như cũ.
- Nút **🗑 Thùng rác** trên thanh tab *Buổi học* (chỉ hiện khi có gì trong đó) liệt kê buổi và tài liệu đã xoá, mỗi dòng có **Khôi phục** và **Xoá hẳn**.
- Quá **30 ngày** thì tự dọn thật. Muốn mất luôn ngay thì bấm *Xoá hẳn* — cái này không lấy lại được.

Tệp đã tải lên kho (Storage) không bị đụng tới trong mọi trường hợp; muốn dọn thì vào Supabase → Storage.

## Sinh viên gõ công thức vào ô đáp án

Bấm vào một ô trên phiếu là hiện **bộ gõ ký hiệu** nổi ngay trên ô: `⁻ ² ³ ⁺ ₂ ₃ ₄ × · √ → ⇌ ≈ ≤ ≥ ° Δ` và mấy cụm hay dùng (`×10`, `mol/L`, `[H⁺]`). Sau khi bấm `×10` hoặc `⁻`, **gõ chữ số là tự lên số mũ** cho tới khi gõ ký tự khác.

Máy chấm (v24) hiểu mọi kiểu viết là **cùng một số**: `1,74×10⁻⁵` = `1.74e-5` = `1,74*10^-5` = `0,0000174`. Sai lệch dưới **0,5 %** tính là đúng (làm tròn chữ số có nghĩa thứ ba), dưới 2 % là "gần" — hoặc theo sai số m đặt riêng cho ô nếu lớn hơn. Nên đáp án m ghi kiểu nào cũng được, sinh viên gõ kiểu nào cũng được.

## Tên miền riêng

**Đã gắn 11/9/2026: `https://giangduonghoahoc.com`** (mua trên Cloudflare Registrar, ≈ 10 USD/năm, tự gia hạn bằng thẻ trong Billing).
Địa chỉ `lop-hoc-online.giangduonghoahoc.workers.dev` vẫn chạy song song — app máy tính bản ≤ 1.0.16 đang dùng nó.
Cách gắn, kiểm, xử lý lỗi: `HUONG_DAN_TEN_MIEN.md`. Khi phát hành app bản mới (trỏ tên miền riêng) nhớ bấm **🔒 Khoá lại video** ở Kho tệp trước.

## Hỏi bài và mục Hỏi đáp

Cần chạy một lần `schema_v23_hoi_dap_rieng.sql` (chưa chạy thì ô hỏi dưới tài liệu vẫn chạy, chỉ thiếu mục riêng).

Sinh viên có **hai chỗ để hỏi**, và cả hai đổ về **một chỗ để đọc**:

- **Dưới mọi tài liệu** có ô hỏi — hỏi tại chỗ, lúc đang làm dở câu 3 của phiếu. Không phải bật gì cả.
- **Mục Hỏi đáp** trên thanh điều hướng (mục thứ sáu) — hỏi câu chung không gắn bài nào ("cuối kỳ thi phần nào ạ?"), và đọc lại toàn bộ. Ba ngăn:
  1. **Thường gặp** — những câu m ghim, gom theo chủ đề, bấm mở ra đọc. Sinh viên vào là thấy ngăn này trước.
  2. **Theo buổi học** — mỗi buổi một khối, trong buổi tách theo từng phiếu / video; bấm tên phiếu là mở thẳng tài liệu.
  3. **Câu hỏi của bạn** — mọi câu mình đã hỏi, kèm trạng thái *đang chờ trả lời*.

Sinh viên thấy: câu của chính mình và mọi câu **đã được trả lời** của cả lớp. **Tên người hỏi không hiện với bạn học ở bất kỳ chỗ nào** — chỉ mình m thấy. Câu chưa trả lời chỉ người hỏi thấy.

M làm việc ở tab **Hỏi đáp** của trang quản trị, có hai phần:

- **Câu hỏi thường gặp** (khối trên): **＋ Soạn một câu** để viết sẵn cả hỏi lẫn đáp mà không cần chờ ai hỏi — nên soạn vài câu *trước khi mở lớp*. Có Sửa, Bỏ ghim, ↑ ↓ xếp thứ tự, và ô chủ đề (gợi ý sẵn: Cách học · Bài tập & nộp bài · Video bài giảng · Thi cử · Tài khoản; để trống cũng được). Câu đã ghim thì cả lớp đọc được kể cả bạn chưa mở tài liệu gốc — ghim một lần, dùng cho mọi khoá sau.
- **Sinh viên hỏi bài** (khối dưới): câu chưa trả lời xếp lên đầu, số câu chờ hiện ngay trên tên tab. Trả lời một lần là cả lớp đọc được. Câu hay thì bấm **📌 Ghim vào Thường gặp**. Câu không phù hợp thì bấm **Ẩn** — ẩn xong chỉ mình m còn thấy. Câu không gắn tài liệu có nhãn *Câu hỏi chung*.

## Mỗi tài khoản một máy

Sinh viên đăng nhập lần đầu, hệ thống ghi nhớ chiếc máy đó; máy khác đăng nhập cùng tài khoản sẽ bị chặn.

- **Trong ứng dụng máy tính** (từ bản 1.0.16): nhớ theo *mã của chính chiếc máy*. Cập nhật app, cài lại app, đổi tên miền, xoá dữ liệu duyệt web — đều **không** làm mất, sinh viên không bị chặn oan.
- **Trên trình duyệt**: từ 11/9/2026 sinh viên không đăng nhập được bằng trình duyệt nữa (chỉ thấy màn "mở bằng app"), và link quên mật khẩu **không** gắn máy. Sinh viên đã lỡ gắn máy bằng trình duyệt từ trước (cột *Thiết bị* không có chữ *app*) sẽ bị chặn khi vào app lần đầu → bấm **Gỡ** cho em đó, mười giây.
- **Đổi máy thật / cài lại Windows**: vào Quản trị → tab **Sinh viên** → dòng của người đó → **Gỡ**. Xong là họ đăng nhập được ở máy mới.
- Cột *Thiết bị* ghi rõ "đã gắn máy (app)" hay "đã gắn máy" (trình duyệt), rê chuột lên xem giờ gắn.

## Những điều không được làm

- Không dán khoá `service_role` vào bất kỳ file nào đưa lên mạng.
- Không đẩy bản giáo viên hay kho câu hỏi vào cơ sở dữ liệu này. Chỉ đẩy bản học sinh đã lược đáp án.
- Không dùng chung một tài khoản cho cả lớp. Mỗi sinh viên một tài khoản thì mới lần được nguồn rò rỉ.

## Việc sẽ làm tiếp

Bốn việc cũ (trang quản trị, Giao cho lớp, nộp bài, chấm điểm) đã xong. Đang để ngỏ, chọn khi cần:

1. Nhân bản một buổi học sang lớp khác (dạy cùng phiếu cho hai lớp không phải tạo lại).
2. Điểm danh: sinh viên bấm "có mặt" trong khung giờ buổi học, giảng viên xem bảng.
3. Phát hành app bản mới trỏ thẳng `giangduonghoahoc.com` (nhớ bấm 🔒 Khoá lại video trước).
