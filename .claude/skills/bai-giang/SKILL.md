---
name: bai-giang
description: Chuyển một file HTML bài giảng riêng của giảng viên (thường tải về từ Claude, có mô hình/tương tác riêng) thành một địa chỉ web thật trên giangduonghoahoc.com, để dán vào "＋ Liên kết" trong Quản trị lớp học. Dùng khi user đưa một đường dẫn file .html trên máy (thường trong Downloads) và muốn đưa lên làm bài giảng, xin link, hay hỏi cách nhúng/gắn bài giảng HTML.
---

# Đưa bài giảng HTML lên web

Việc CHỈ có một cách chạy được (đã kiểm kỹ, xem lý do ở cuối): chép file vào
`Hoc_Online/web/bai-giang/`, đẩy lên Git, chờ Cloudflare tự phát (1–3 phút), đưa địa chỉ
`https://giangduonghoahoc.com/bai-giang/<tên file, không đuôi .html>` cho user dán vào Quản trị.

## Các bước

1. **Nhận file.** User đưa đường dẫn (thường `C:\Users\<tên>\Downloads\...`) hoặc dán thẳng nội dung.
   Nếu là đường dẫn tới file **không do Claude tạo trong phiên này**, phải đọc qua nó trước khi đưa
   lên (dù user nói "không cần xem" cũng phải đọc) — dùng Read; file rất dài (bundler Claude thường
   nén hết vào 1-2 dòng, dễ vượt giới hạn đọc) thì đọc theo đoạn nhỏ hoặc dùng Grep tìm các dòng chữ
   Việt/tiêu đề để biết nội dung thật, không cần đọc từng byte của phần mã nén.

2. **Đặt tên tệp đích.** Giữ tên gốc nếu đã sạch (chữ/số/gạch ngang/gạch dưới, không dấu, không
   khoảng trắng). Có dấu/khoảng trắng thì đổi sang không dấu, gạch ngang thay khoảng trắng, giữ đuôi
   `.html`. KHÔNG ghi đè tên file đã có trong `web/bai-giang/`: `/bai-giang/*` được cache 1 ngày (trình
   duyệt + biên Cloudflare, xem `web/_headers`) nên ghi đè cùng tên thì sinh viên còn thấy bản cũ tới
   một ngày — bản sửa thì đặt tên mới (VD thêm `-v2`) rồi đổi link trong Quản trị.

3. **Chép file.** Tạo thư mục nếu chưa có, rồi chép (đường dẫn Windows đúng, chú ý dấu tiếng Việt
   trong đường dẫn "Mini WebApp"):
   ```bash
   mkdir -p "/c/Users/Admin/OneDrive - Trường Đại học Ngoại ngữ - ĐHQGHN/Desktop/Mini WebApp/Hoc_Online/web/bai-giang"
   cp "<đường dẫn file gốc>" "/c/Users/Admin/OneDrive - Trường Đại học Ngoại ngữ - ĐHQGHN/Desktop/Mini WebApp/Hoc_Online/web/bai-giang/<tên-file>.html"
   ```

4. **Đẩy lên Git.** Trong `Hoc_Online/`:
   ```bash
   git add "web/bai-giang/<tên-file>.html"
   git status --short   # soát lại: CHỈ có đúng tệp này (và không có gì khác lẫn vào), không add pr/
   ```
   Commit ngắn gọn kiểu: `Thêm bài giảng HTML: <tên môn/bài>`, có dòng
   `Co-Authored-By:` đúng theo system-reminder attribution hiện tại của phiên. Rồi `git push`.
   Đây là đẩy tệp lên kho công khai — nếu bị hệ thống chặn lại hỏi xác nhận (nhãn kiểu
   "out-of-place publication"), DỪNG, hỏi lại user một câu ngắn rồi mới đẩy, đừng tự tìm cách lách.

5. **Chờ & kiểm tra thật, không đoán:**
   ```bash
   for i in 1 2 3 4 5 6; do
     c=$(curl -s -o /dev/null -w "%{http_code}" "https://giangduonghoahoc.com/bai-giang/<tên-file, không .html>")
     echo "poll $i: $c"; if [ "$c" = "200" ]; then break; fi; sleep 18
   done
   ```
   Nếu tiện, mở thử bằng Claude Browser pane (navigate tới đúng địa chỉ, `get_page_text` hay
   screenshot) để chắc bài hiện đúng nội dung, không chỉ dừng ở mã 200.

6. **Trả lời user** đúng 1 địa chỉ để dán vào Quản trị (không cần đuôi `.html`, tự chuyển):
   ```
   https://giangduonghoahoc.com/bai-giang/<tên-file>
   ```
   Nhắc ngắn gọn: dán vào ô "Đường dẫn" khi thêm/sửa Liên kết.
   Nhắc rõ tệp trong `/bai-giang/` là CÔNG KHAI — ai có link cũng xem được, không đăng nhập —
   đừng để đáp án riêng hay nội dung nhạy cảm vào dạng file này.

   **KHÔNG tick "Chỉ cho xem trong trang" nữa** (từ app 1.0.19, 16/9/2026) — trước đây tick để ẩn
   nút "Mở tab mới", đỡ lộ link gốc. Nhưng "tab mới" trong app này không phải tab trình duyệt thật,
   là cửa sổ Electron con do `main.js` tạo qua `setWindowOpenHandler`/`did-create-window`: không có
   ô địa chỉ, đã tắt DevTools/F12, và bị `khoaCuaSo()` khoá chống chụp/quay giống cửa sổ chính — nên
   ẩn nút đó không còn ngăn được gì thêm, chỉ làm bài giảng này xem khác các bài kia. Tick nó chỉ còn
   ý nghĩa cho tình huống hiếm cần giấu cả sự tồn tại của địa chỉ (nói rõ với user nếu họ chủ động
   muốn vậy), không phải mặc định.

## Vì sao chỉ có cách này (đừng thử lại các cách đã loại)

- **Dán link Claude Artifact (publish rồi lấy link)** — KHÔNG dùng được, đã kiểm hai lớp:
  Claude tự gửi `X-Frame-Options: SAMEORIGIN` (chặn nhúng khung từ trang khác) VÀ artifact riêng
  tư theo mặc định — người khác mở link (kể cả có tài khoản Claude riêng) chỉ thấy "Sign in to
  view this page". Không dùng cho bất cứ nội dung nào học sinh cần xem.
- **Tải lên kho Supabase Storage (bucket `tailieu`, giống PDF/ảnh)** — KHÔNG dùng được cho loại
  bài có JavaScript (mô hình 3D, slide bấm chuyển…): Supabase Storage tự gửi
  `Content-Security-Policy: default-src 'none'; sandbox` cho MỌI tệp, tắt hết JavaScript khi mở
  trực tiếp. PDF/ảnh không cần JS nên không bị ảnh hưởng — vẫn cứ dùng cách tải file bình thường
  cho loại đó, không liên quan tới skill này.
- **`web/_headers` chặn `X-Frame-Options: DENY` cho mọi trang** — vì vậy phải để riêng
  `/bai-giang/*` KHÔNG có header này (xem đầu file `web/_headers`, đoạn giải thích Cloudflare NỐI
  không đè header trùng tên giữa các luật khớp cùng lúc). Đừng thêm luật `X-Frame-Options` nào cho
  `/bai-giang/*` hay bất kỳ pattern nào khớp nó.

## Tự tay không cần Claude (chọn kể cho user nếu họ muốn tự làm)

Vào trang GitHub của kho (`github.com/maknoonnjs94/lop-hoc-online`) → mở thư mục `web/bai-giang` →
"Add file → Upload files" → kéo file .html vào → Commit. Cloudflare tự phát như khi Claude đẩy.
