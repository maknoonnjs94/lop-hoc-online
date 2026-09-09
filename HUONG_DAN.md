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

## Trên điện thoại: thêm vào màn hình chính

**Không có app điện thoại trên kho ứng dụng.** Nhưng trang web thêm được vào màn hình chính, sau đó nó có icon logo, có tên, mở toàn màn hình không thanh địa chỉ — nhìn và dùng y như một app.

- **Android (Chrome):** mở trang → menu ba chấm → *Thêm vào Màn hình chính*. Nhiều máy tự hiện lời mời cài.
- **iPhone (bắt buộc Safari):** mở trang → nút Chia sẻ → *Thêm vào Màn hình chính*. Chrome trên iPhone **không làm được**, phải Safari.

Sinh viên thêm trang học, m thêm trang quản trị — hai cái là hai icon riêng, tên riêng, mở thẳng vào đúng trang của mình.

Hai điều cần nói rõ với sinh viên:

- **Video bài giảng vẫn không xem được trên điện thoại.** Icon ngoài màn hình chính không phải là ứng dụng máy tính; nó vẫn là trình duyệt nên vẫn bị chặn theo `BAT_BUOC_APP`. Phiếu, đề, đáp án, nộp bài, hỏi bài thì dùng bình thường.
- **Trên điện thoại không có chống chụp màn hình.** Cửa sổ chỉ được hệ điều hành che khi chạy trong app máy tính. Dấu chìm tên thì vẫn có ở mọi nơi.

Muốn đổi icon hay tên hiển thị: sửa `web/manifest.json` (trang học) và `web/manifest-quan-tri.json` (quản trị); ảnh nằm ở `web/img/app-*.png`.

## Ai phải dùng ứng dụng máy tính

Đặt ở đầu tệp `web/index.html`, dòng `BAT_BUOC_APP`:

| Giá trị | Nghĩa là |
|---|---|
| `'khong'` | Không bắt buộc gì. Mọi thứ mở được trên trình duyệt, kể cả điện thoại. |
| `'video'` | **Đang dùng.** Chỉ video bài giảng phải mở trong app; phiếu, đề, đáp án vẫn đọc trên điện thoại. |
| `'tat_ca'` | Khoá sạch: không có app thì không vào được — **kể cả điện thoại và máy tính bảng**. |

Giảng viên và quản trị luôn được miễn.

Vì sao mặc định là `'video'`: app chỉ có bản Windows và macOS, nên `'tat_ca'` là chặn hết sinh viên học bằng điện thoại. Video bài giảng mới là thứ đáng bảo vệ, còn phiếu bài tập thì để các em ôn ở đâu cũng được.

Chặn thật nằm ở máy chủ chứ không chỉ ở giao diện: `APP_CHO_VIDEO` trong `worker.js` làm Worker **không ký vé xem** cho ai không chạy trong app, dù có gọi thẳng vào `/api/stream/token`. Đổi `BAT_BUOC_APP` thì nhớ đổi cả hai cho khớp.

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

## Hỏi bài

Dưới **mọi** tài liệu đều có ô hỏi, không phải bật gì cả.

Sinh viên thấy: câu của chính mình (kèm trạng thái *đang chờ trả lời*) và mọi câu **đã được trả lời** của cả lớp. Tên người hỏi không hiện với bạn học — chỉ mình m thấy.

M trả lời ở tab **Hỏi đáp**: câu chưa trả lời xếp lên đầu, số câu chờ hiện ngay trên tên tab. Trả lời một lần là cả lớp đọc được. Câu không phù hợp thì bấm **Ẩn** — ẩn xong chỉ mình m còn thấy.

## Mỗi tài khoản một máy

Sinh viên đăng nhập lần đầu, hệ thống ghi nhớ chiếc máy đó; máy khác đăng nhập cùng tài khoản sẽ bị chặn.

- **Trong ứng dụng máy tính** (từ bản 1.0.16): nhớ theo *mã của chính chiếc máy*. Cập nhật app, cài lại app, đổi tên miền, xoá dữ liệu duyệt web — đều **không** làm mất, sinh viên không bị chặn oan.
- **Trên trình duyệt**: nhớ theo bộ nhớ của trình duyệt. Xoá dữ liệu duyệt web hoặc dùng chế độ ẩn danh thì mất, sẽ bị chặn.
- **Đổi máy thật / cài lại Windows**: vào Quản trị → tab **Sinh viên** → dòng của người đó → **Gỡ**. Xong là họ đăng nhập được ở máy mới.
- Cột *Thiết bị* ghi rõ "đã gắn máy (app)" hay "đã gắn máy" (trình duyệt), rê chuột lên xem giờ gắn.

## Những điều không được làm

- Không dán khoá `service_role` vào bất kỳ file nào đưa lên mạng.
- Không đẩy bản giáo viên hay kho câu hỏi vào cơ sở dữ liệu này. Chỉ đẩy bản học sinh đã lược đáp án.
- Không dùng chung một tài khoản cho cả lớp. Mỗi sinh viên một tài khoản thì mới lần được nguồn rò rỉ.

## Việc sẽ làm tiếp

1. Trang quản trị cho mình: tạo buổi, tải tệp, giao bài bằng giao diện thay vì gõ SQL.
2. Nút "Giao cho lớp" ngay trong Sổ Bài Tập, tự xuất bản học sinh rồi đẩy lên.
3. Sinh viên nộp bài, xem ai nộp ai chưa.
4. Chấm điểm và theo dõi tiến độ.
