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

## Những điều không được làm

- Không dán khoá `service_role` vào bất kỳ file nào đưa lên mạng.
- Không đẩy bản giáo viên hay kho câu hỏi vào cơ sở dữ liệu này. Chỉ đẩy bản học sinh đã lược đáp án.
- Không dùng chung một tài khoản cho cả lớp. Mỗi sinh viên một tài khoản thì mới lần được nguồn rò rỉ.

## Việc sẽ làm tiếp

1. Trang quản trị cho mình: tạo buổi, tải tệp, giao bài bằng giao diện thay vì gõ SQL.
2. Nút "Giao cho lớp" ngay trong Sổ Bài Tập, tự xuất bản học sinh rồi đẩy lên.
3. Sinh viên nộp bài, xem ai nộp ai chưa.
4. Chấm điểm và theo dõi tiến độ.
