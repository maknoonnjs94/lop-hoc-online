# Nhật ký làm việc — Lớp học online (web + app máy tính)

**Trang học:** https://lop-hoc-online.giangduonghoahoc.workers.dev/ (đổi từ …maknoonnjs94… ngày 09/9 khi đổi tên nhánh Cloudflare; tên cũ đã chết) (Cloudflare Workers, phát tự động sau mỗi lần đẩy lên GitHub, trễ 1–3 phút)
**Kho mã:** https://github.com/maknoonnjs94/lop-hoc-online (thư mục này, `git log` là lịch sử đầy đủ từng lần sửa)
**Máy chủ dữ liệu:** Supabase, dự án `euyrrodppbpnkmificbs` — khoá `service_role` không bao giờ nằm trong kho mã hay trong nhật ký này
**App máy tính:** tải tại `/tai-app` → Windows `LopHoc-win.exe`, macOS `LopHoc-mac.dmg` (kho Cloudflare R2 `giang-duong-hoa-hoc-app`)
**Nhật ký của Sổ Bài Tập (artifact):** `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` — file này chỉ ghi phần web + app.

Cách đọc: mục mới nhất ở trên. Mỗi mục: làm gì, m đã phải làm gì bên ngoài (SQL, khoá), đã test gì, còn gì.

---

## Trạng thái hiện tại (2026-09-11)

Đang chạy trên web:
- **Trang công khai** `web/index.html` (`/`) — giới thiệu, khoá học, cách học, hỏi đáp nhanh, Zalo, tải app; nội dung sửa ở Quản trị → Trang công khai (v25).
- **Trang học sinh viên** `web/hoc.html` (`/hoc`, **chỉ trong app** — `BAT_BUOC_APP = 'tat_ca'`) — 6 mục: Trang chủ · Bài giảng · Bài tập · Lịch học · Tiến độ · **Hỏi đáp** (Câu hỏi thường gặp do giảng viên ghim, theo buổi học, câu của bạn; ẩn danh). Nộp bài (ảnh/PDF), **ô điền đáp án trên PDF** có bộ gõ công thức (₂ ⁻ × → …), máy chấm hiểu mọi cách viết số khoa học, bảng điểm, nhắc hạn nộp, quyền tải về từng tệp (đáp án không bao giờ cho tải), 4 giao diện × 8 nhân vật, video Cloudflare Stream có quỹ giờ xem, app máy tính bắt buộc cho video.
- **Trang quản trị** — Buổi học (xoá mềm, Hoàn tác, 🗑 Thùng rác giữ 30 ngày) / Sinh viên / Kho tệp (giờ xem + ước tính hoá đơn) / Theo dõi / Bài nộp (chấm, xem bài đã điền, sửa kết luận máy, thống kê) / Hỏi đáp (ghim FAQ, soạn sẵn, xếp thứ tự) / Cảnh báo. Sao lưu 13 bảng.
- **Bản web của Sổ Bài Tập** `web/so-bai-tap.html` (+ 4 bản môn) — đang ở **đợt 100**. Nút *Giao cho lớp* xuất PDF qua html2canvas, giờ chụp theo từng lô nên không còn giới hạn độ dài tài liệu (xem `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` mục đợt 97). Công thức: Equation của Word → LaTeX → dựng thật; `Tools/thu_cong_thuc.js` là bộ thử 65 phép cho cả đường bóc. **Nhắc:** bản web KHÔNG tự lên theo Artifact — sau mỗi lần publish Artifact phải chạy thêm `Tools/build_web_so.js` từng sổ rồi `git push` mới lên đúng bản (đã quên mất 3 lần liền ở đợt 91-93, xem mục 2026-09-17 bên dưới).
- **Worker** `worker.js`: `/api/tao-tai-khoan`, `/api/cap-lai-mat-khau`, `/api/stream/*`, `/api/trang-thai`. Ba secret đủ, Stream trả 200.
- **App máy tính 1.0.20** (tag 16/9: hiện % tải bản mới, log cap-nhat.log; 1.0.19 khoá chụp cửa sổ con; 1.0.17 tag 12/9, trỏ giangduonghoahoc.com/hoc; 1.0.16 vẫn chạy qua workers.dev) — vỏ Electron, chống chụp/quay, khoá theo mã máy, tự cập nhật qua R2.

**SQL:** v9 → **v28** đều `true` trên `/api/trang-thai` (kiểm 12/9). **v30, v32** vừa thêm (15/9) — t cần chạy SQL rồi mới thấy `true`; **v31 không cần chạy nữa** (đổi thiết kế trước khi t kịp chạy — xem mục 15/9 ở dưới).
**Tên miền riêng:** `https://giangduonghoahoc.com` chạy từ 11/9 (Cloudflare Registrar, Custom Domain tên gốc); workers.dev song song, app 1.0.16 vẫn trỏ workers.dev, `SITE_URL` trong mã đã đổi cho bản sau.

Tự kiểm sau này, khỏi mở Supabase:

```
curl -s https://lop-hoc-online.giangduonghoahoc.workers.dev/api/trang-thai
```

**Việc còn treo phía m (không phải mã):**
1. **Publish lại** bản gốc Hóa phân tích + sổ Hóa hữu cơ ở đợt 85 (bản web đã tự lên, artifact thì phải publish tay).
2. **Giao cho lớp lại** phiếu pH — bản sinh viên đang thấy là PDF cũ từ trước khi sửa công thức.
3. Chạy đủ luồng bằng app Windows thật + một tài khoản sinh viên thật.

**Giới hạn đã biết, nói rõ:**
- Phân số bóc từ **PDF** có thể đảo thứ tự (tử/mẫu bị đọc theo dòng ngang) — mất dữ kiện từ đầu vào, không dựng lại được. Nạp bằng **.docx** thì đúng.
- `Ca` chỉ được đổi thành `C_a` ở ngữ cảnh chắc chắn (sau dấu nhân, bài có K_a); còn lại giữ nguyên vì Ca là canxi.

**Bẫy khi ghi nhật ký (đã dính 11/9):** `String.replace(moc, chuoi)` hiểu `$`+backtick và `$'` trong chuỗi thay thế là mẫu đặc biệt → chèn cả đầu tệp vào giữa mục. Từ nay dùng `replace(moc, function () { return chuoi; })` hoặc ghép chuỗi tay.
---

## 2026-09-24 — Sổ Bài Tập đợt 100: ngắt trang giữa hai dòng kẻ

Đề còn vừa trang trước thì ở lại, dòng kẻ chia sang cả hai trang — hết khoảng trống vô nghĩa cuối trang
(chi tiết ở `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` mục đợt 100). Dựng lại cả 5 `web/so-bai-tap*.html`.

---

## 2026-09-24 — Sổ Bài Tập đợt 99: câu dài sang trang giữa hai ý nhỏ

Đợt 98 cho ý nhỏ tới 20 dòng làm lộ lỗi cũ: câu dài hơn một trang mất vạch trang trên màn hình và bị
PDF cắt cụt phần tràn. Giờ câu quá dài được ngắt giữa hai ý nhỏ (chi tiết ở
`..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` mục đợt 99). Dựng lại cả 5 `web/so-bai-tap*.html`.

---

## 2026-09-24 — Trang học: tự đăng xuất 5 → 15 phút · Sổ Bài Tập đợt 98

**Trang học (`web/hoc.html`):** T báo SV xem video hay bị văng vì 5 phút không thao tác. Nâng
`IDLE_MS` lên 15 phút; khung cảnh báo "Tôi vẫn đang học" đếm ngược 30 giây trước khi đăng xuất vẫn
giữ nguyên (đã có từ trước — bấm hoặc rê chuột/cuộn/gõ phím là tính lại từ đầu). Sửa luôn 4 chỗ chữ
ghi "5 phút" (dòng dưới form đăng nhập, mục trợ giúp, khung cảnh báo, câu báo sau khi bị đăng xuất).

**Sổ Bài Tập đợt 98:** ý nhỏ đổi nút −/+ số dòng thành ô gõ số, tối đa 20 dòng (chi tiết ở
`..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` mục đợt 98). Dựng lại cả 5 `web/so-bai-tap*.html`.

---

## 2026-09-17 — Dựng lại bản web theo đợt 97 (chia lô chụp PDF, hết giới hạn độ dài)

Sổ gốc + 4 sổ dẫn xuất publish xong đợt 97 (chi tiết ở `So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` mục
đợt 97). Đã chạy `Tools/build_web_so.js` cho cả 5 sổ (`web/so-bai-tap*.html`, 1623 KB mỗi file) và
`git push` (commit `504d881`) — đúng quy trình bắt buộc rút ra từ vụ đợt 91-93 dưới đây, không quên
bước nào.

---

## 2026-09-17 — Bản web Sổ Bài Tập đứng yên đợt 90 suốt 3 lần vá PDF (91→93) — quên dựng lại + đẩy

**T thấy gì:** báo lỗi PDF cắt ngang công thức phân số (xem `So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md`
mục đợt 91-93), bấm Ctrl+F5 rồi xuất lại vẫn thấy y hệt lỗi cũ. Hỏi lại thì menu Công cụ ghi "đợt 90 ·
bản web" — tức m đang mở **bản web** (`giangduonghoahoc.com`), không phải bản Artifact t vẫn publish.

**Vì sao:** bản web là 1 bản mirror tĩnh riêng (`web/so-bai-tap*.html`, dựng bởi `build_web_so.js` từ
đúng file Artifact, chèn thêm cầu nối Supabase), KHÔNG tự cập nhật theo Artifact — phải tự tay dựng lại
+ `git push` (Cloudflare tự triển khai sau khi đẩy lên GitHub, trễ 1-3 phút). Suốt 3 đợt vá PDF gần đây
t chỉ nhớ publish Artifact, quên hẳn bước này — Ctrl+F5 của m hoàn toàn đúng, chỉ là tải lại đúng bản
đang đứng yên ở đợt 90.

**Đã sửa:** `build_web_so.js` lại cả 5 sổ (gốc + 4 môn) từ đúng bản Artifact đợt 93, `git push` lên
`main` — Cloudflare tự lên bản mới sau 1-3 phút.

**Bài học ghi vào việc cần làm mỗi lần publish Sổ Bài Tập:** publish Artifact **xong phải luôn luôn**
chạy `build_web_so.js` (đủ 5 sổ) + `git push` trong `Hoc_Online` ngay sau đó — 2 bước không tách rời
nhau nữa, đừng để lặp lại lỗi này.

---

## 2026-09-16 — Dấu chìm tên+email trên bài tập PDF trông như vết bẩn — sửa màu cho nền trắng

**T thấy gì:** mở bài tập (PDF) giao cho lớp, dòng tên + email của sinh viên phủ lên trang, "trông ghê quá".

**Đó là gì:** dấu chìm chống lộ đề — mọi trang xem trong app (video, bài giảng viết tay, ghi chú, ảnh, PDF) đều in mờ tên + email + giờ phút của người đang xem, lặp khắp trang (hàm `watermark()` trong `hoc.html`). Mục đích: ai chụp màn hình hay quay lại rồi phát tán ra ngoài thì vẫn lộ đúng ai đã xem, giảng viên biết để xử lý.

**Vì sao trông xấu:** kiểu chữ (trắng mờ + viền tối) vốn làm cho nền video/ảnh tối — đặt lên nền TRẮNG của trang PDF/giấy thì phần chữ trắng gần như vô hình, chỉ còn viền tối loang ra thành từng vết mờ, giống vết bẩn. Ngoài ra khung PDF (`renderPdf`) từ trước thiếu class `vpaper` mà các loại nội dung giấy khác (bài giảng viết tay, ghi chú, ảnh) đã có, nên không được hưởng bất cứ style dành riêng cho nền trắng nào.

**Đã sửa:** gắn thêm class `vpaper` cho khung xem PDF (đúng như các loại nội dung nền trắng khác), rồi thêm luật CSS riêng `.vpaper .wmgrid span` — đổi qua chữ xám nhạt + viền sáng, giống dấu chìm in trên giấy thật. Khung video/bài giảng có khung nền tối vẫn giữ đúng kiểu chữ trắng cũ, không đổi.

**Đã kiểm:** dựng trang thử độc lập so 2 kiểu cạnh nhau trên nền trắng — bản cũ đúng là mờ nhoè như vết bẩn, bản mới đọc được rõ, sạch hơn hẳn; khung video giữ nguyên không ảnh hưởng.

**Không fix (giữ nguyên vì đây là mục đích chính):** dấu chìm KHÔNG bỏ được — đây là biện pháp truy được người làm lộ đề, không phải lỗi.

---

## 2026-09-16 — Câu hỏi Hóa phân tích không chỉ hiện sai, đã bị ĐẨY THẬT vào kho các môn khác — thêm nút dọn

**T thấy gì (tiếp mục localStorage phía trên):** sau khi vá localStorage, mục "Tất cả câu hỏi" của sổ môn khác (đọc từ kho trên Supabase, không phải localStorage) vẫn còn câu của Hóa phân tích.

**Vì sao vá localStorage chưa đủ:** app có sẵn cơ chế "câu chỉ có trên máy thì đẩy lên kho chung ngay" (đợt 63, tránh mất câu khi mạng chập chờn — xem `pushUpDocs`/`rescueLocalOnly` trong `so_bai_tap.html`). Trước khi vá localStorage, mở sổ môn khác đã đọc trúng kho câu CHUNG của trình duyệt (kho của Hóa phân tích) — cơ chế trên tưởng đó là câu riêng mới có trên máy của môn này, nên **đẩy thật** những câu đó lên đúng kho Supabase của môn đó (`<mã môn>:bank`). Không phải hiện sai màn hình — dữ liệu thật đã bị chép nhầm.

**Đã thêm:** nút **🧹 Dọn câu dính từ Hóa phân tích** trong menu tài khoản (`shim_supabase.js`, chỉ hiện ở bản môn khác, không hiện ở bản gốc). Bấm vào: so mã câu (`doc_id`) giữa kho gốc `bank`/`trash` (không tiền tố) và kho môn này (`<mã môn>:bank`/`trash`) — mã trùng gần như chắc chắn là câu bị đẩy nhầm (mã tự sinh theo giờ + số ngẫu nhiên, không trùng tự nhiên). Hiện số lượng + vài câu ví dụ, hỏi xác nhận, chỉ xoá ở kho MÔN NÀY sau khi giáo viên đồng ý — không đụng tới kho Hóa phân tích.

**Đã kiểm:** viết lại đúng logic so/xoá bằng `sb` giả trong Node — kho giả có 2 câu dính + 1 câu thật của Hữu cơ, chạy xong chỉ xoá đúng 2 câu dính (và 1 mục thùng rác dính), câu thật của Hữu cơ và cả kho gốc còn nguyên. Build lại 5 bản web, soát cú pháp `new Function()` không lỗi.

**T cần làm:** mở từng sổ môn khác (Hữu cơ, Hóa lý, Vô cơ, Kĩ thuật — KHÔNG có ở sổ gốc), bấm avatar ☁ → 🧹 Dọn câu dính từ Hóa phân tích, đọc kỹ danh sách ví dụ trước khi bấm OK. Nếu chắc chắn không câu nào trong đó là m tự soạn riêng thì xác nhận xoá.

---

## 2026-09-16 — Sửa lỗi lớn: các sổ web dùng lẫn kho câu hỏi của nhau

**T thấy gì:** mở sổ Hóa hữu cơ (bản web) lại thấy bài tập của Hóa phân tích trong Kho bài tập.

**Nguyên nhân:** dữ liệu trên Supabase đã tách đúng theo môn từ trước (bảng `notebook`, tiền tố `huu-co:` …). Nhưng sổ còn giữ vài thứ ngay trong máy bằng `localStorage` khoá cố định — `sbt-bank-v1` (kho câu), `sbt-weeks-v1`, `sbt-settings-v1`, `sbt-banktree-v1`, `sbt-images-v1`, `sbt-trash-v1` — viết thẳng trong mã sổ gốc, không đi qua tiền tố môn. Bản Claude Artifact mỗi cái chạy ở một địa chỉ web riêng nên không sao, nhưng **mọi bản web đều chạy chung một tên miền** `giangduonghoahoc.com` → trình duyệt coi đó là MỘT localStorage duy nhất cho tất cả các sổ. Mở sổ nào sau cùng thì đọc trúng khoá của sổ mở trước.

**Sửa:** `shim_supabase.js` (cầu nối riêng cho bản web) chặn `localStorage.getItem/setItem/removeItem`, tự gắn tiền tố môn (`NS`, giống tiền tố đã dùng cho bảng `notebook`) vào MỌI khoá bắt đầu bằng `sbt-`. Khoá đăng nhập `sb-...-auth-token` do supabase-js tự quản KHÔNG bị đổi — đăng nhập một lần vẫn dùng chung được cho mọi sổ. IndexedDB `keyval-store` (kho tệp ngôn ngữ OCR của Tesseract.js) CỐ Ý để chung — chỉ là mô hình OCR dùng lại được, không phải nội dung bài tập.

**Đã kiểm:** viết lại đúng đoạn vá trong Node (giả lập localStorage), xác nhận: sổ Hữu cơ không đọc được khoá của sổ gốc; ghi vào sổ Hữu cơ tạo khoá thật riêng `huu-co:sbt-bank-v1`; khoá auth của supabase không bị đổi tên. Rồi build lại đủ 5 bản web (`Tools/build_web_so.js`) và soát `new Function()` từng bản, không lỗi cú pháp.

**T cần làm:** sau khi Cloudflare phát xong, mở LẠI từng sổ web một lần (gốc, Hữu cơ, Hóa lý, Vô cơ, Kĩ thuật) để chắc kho câu đúng của từng môn. Dữ liệu m thấy "lẫn" trước đây vẫn còn nguyên dưới khoá cũ không tiền tố (khoá của sổ gốc) — không mất, chỉ là từ giờ sổ khác không đọc trúng nữa nữa.

---

## 2026-09-16 — "Sơ lược nhóm chức" không có nút "Mở tab mới": do skill /bai-giang tự tick, giờ bỏ mặc định

**T thấy gì:** "Liên kết & lai hóa" mở tab mới được, "Sơ lược nhóm chức" thì không — hỏi sao không đồng bộ.

**Nguyên nhân:** không phải lỗi mã — mỗi Liên kết có riêng ô tick "Chỉ cho xem trong trang" trong Quản trị, tick thì ẩn nút "Mở tab mới". Skill `/bai-giang` (m viết) trước đây LUÔN nhắc tick ô này để đỡ lộ link gốc — "Sơ lược nhóm chức" đưa lên theo đúng hướng dẫn đó nên bị tick, còn "Liên kết & lai hóa" t tự thêm sau không tick.

**Vì sao bỏ mặc định:** từ app 1.0.19, "Mở tab mới" không phải tab trình duyệt thật — là cửa sổ Electron con do `main.js` tạo, không có ô địa chỉ, đã tắt F12, và bị khoá chống chụp/quay giống cửa sổ chính. Ẩn nút đó không còn ngăn được gì thêm, chỉ gây khác biệt khó hiểu giữa các bài giảng.

**Đã sửa:** `.claude/skills/bai-giang/SKILL.md` không còn nhắc tick ô này; chữ giải thích ô tick trong `quan-tri.html` cập nhật theo đúng lý do trên (không cần tick nữa, chỉ để dành khi m chủ động muốn giấu hẳn địa chỉ).

**T cần tự làm (m không đụng được, phải m đăng nhập của t):** vào Quản trị → buổi có "Sơ lược nhóm chức" → Sửa tài liệu → bỏ tick "Chỉ cho xem trong trang" → Lưu. Các bài giảng thêm sau này qua skill sẽ không bị tick nữa, khỏi phải sửa tay từng cái.

---

## 2026-09-16 — Dải nhắc "app bản cũ" ngay trên trang, không cần app tự cập nhật mới thấy

**Vì sao thêm:** cơ chế tự cập nhật của app (mục 1.0.20 trên) chỉ chạy đúng khi bản đó ĐANG cài rồi — máy nào còn kẹt ở bản trước, không có cách nào tự vá từ xa qua app. Nhưng `hoc.html` tải lại từ máy chủ mỗi lần mở (không cache), nên sửa được ngay cả khi app đã cài rất cũ.

**Làm gì:** thêm hằng `BAN_MOI_NHAT` trong `hoc.html` (đang là `1.0.20`) và hàm so số hiệu phiên bản. Sau khi lấy được số phiên bản app qua `getVersion()`, nếu cũ hơn `BAN_MOI_NHAT` thì hiện dải màu cam đầu trang chính (không tự biến mất, chỉ đóng khi bấm ✕, nhớ theo `sessionStorage` tới khi có bản mới hơn) — chỉ đường tải tay tại `/tai-app`.

**Sau mỗi lần ra tag app mới:** phải sửa `BAN_MOI_NHAT` trong `hoc.html` theo số tag đó rồi đẩy lên — không tự động theo tag, quên sửa thì dải nhắc sai số hoặc không hiện.

**Đã kiểm:** hàm so version qua 6 trường hợp (kể cả `1.0.2` so `1.0.20` — dễ sai nếu so chuỗi thường); giao diện dải nhắc render đúng ở khổ hẹp 420px qua trang thử độc lập (không log vào tài khoản thật, vì `window.lopHocApp` chỉ có trong app Electron thật).

---

## 2026-09-16 — App 1.0.20: "đang tải ngầm" mà không thấy gì → hiện % tải, báo lỗi rõ, ghi log

**T thấy gì:** bấm *Kiểm tra cập nhật* báo "Có bản 1.0.19 — đang tải ngầm" rồi im bặt, không bao giờ hỏi khởi động lại.

**Nguyên nhân tìm được:** không phải kho hỏng — R2 có đủ `latest.yml` (1.0.19), `LopHoc-win.exe` (85 MB) và `.blockmap`. Vấn đề là **mù tịt**: bản 1.0.19 trở về trước nuốt mọi lỗi cập nhật (`autoUpdater.on('error', () => {})`) và không báo tiến trình. 85 MB qua mạng ~270 KB/s là 5–10 phút; đóng app giữa chừng là tải lại từ đầu, nên "chờ 1 phút rồi tắt" thì không bao giờ xong.

**Sửa (app 1.0.20):**
- `main.js` `batTuCapNhat`: bắt đủ sự kiện `checking / available / not-available / download-progress / downloaded / error`; gửi cho trang qua kênh `lophoc:update`; ghi `%APPDATA%\lop-hoc\cap-nhat.log` (mỗi 10 % một dòng, lỗi ghi nguyên văn) — lần sau kêu "không cập nhật" thì mở file này là biết.
- `preload.js`: thêm `lopHocApp.onUpdate(cb)`.
- `hoc.html`: thông báo "Đang tải bản mới · 40% (34/85 MB) — cứ để app mở", mục menu đổi thành "Đang tải bản mới · 40%", tải xong báo "Khởi động lại app", lỗi thì hiện nguyên văn + đường tải tay `/tai-app`.
- Dò phần mềm quay giãn từ 4 s → 10 s (`tasklist` chạy dày làm giật khi xem bài giảng HTML; mất thêm 6 s mới phát hiện OBS, chấp nhận được).

**Cách lên 1.0.20 cho máy đang kẹt:** tải tay `LopHoc-win.exe` ở `/tai-app`, chạy đè lên bản đang cài (không cần gỡ), mở app → menu tài khoản phải ghi *Kiểm tra cập nhật · bản 1.0.20*. Từ bản này trở đi tự cập nhật sẽ nhìn thấy được.

**Chưa test được:** chỉ `node --check`; luồng tải thật phải chờ GitHub build xong (tag `v1.0.20`) rồi thử trên máy Windows thật.

---

## 2026-09-16 — Bài giảng HTML mở chậm + giật: /bai-giang bị "no-cache" tải lại cả gói mỗi lần, dấu chìm mix-blend-mode nặng GPU

**T:** *"giật lag + delay khi mở bài giảng html… phần sơ lược nhóm chức thì không cho mở trong tab mới, phần
liên kết lai hóa thì mở được nhưng vẫn chụp màn hình được. Update bản v19 thì không được."*

**Kiểm trước khi đoán:** R2 `latest.yml` = 1.0.19, file 85 MB có, Actions "completed successfully" → bản 1.0.19
ĐÃ phát hành; "update không được" nằm ở khâu app tải/cài trên máy t (hỏi lại thông báo; đường tay: /tai-app
tải LopHoc-win.exe chạy đè). "Sơ lược nhóm chức không mở tab mới" = link đó tick "Chỉ cho xem trong trang"
(cố ý ẩn nút Mở ở tab mới) — không phải lỗi; "Liên kết lai hóa" không tick → mở cửa sổ con → app 1.0.18 chưa
khoá cửa sổ con nên chụp được (1.0.19 sửa).

**Hai thủ phạm lag (sửa ở web, F5 là ăn):**
1. `/bai-giang/<tên>` rơi vào luật `/*.html`… không, địa chỉ gọn không khớp `/*.html` nên KHÔNG có Cache-Control
   nào → Cloudflare trả `public, max-age=0, must-revalidate`, không ETag → mỗi lần mở bài là tải lại nguyên gói
   ~900 KB rồi bung. Thêm khối `/bai-giang/*` → `Cache-Control: public, max-age=86400` (trình duyệt + biên CDN
   giữ 1 ngày; skill `bai-giang` ghi rõ: sửa bài thì đặt tên file mới, đừng ghi đè).
2. Dấu chìm `.wmgrid span{ mix-blend-mode:difference }` phủ lên iframe có mô hình 3D/video đang vẽ liên tục →
   compositor phải trộn màu từng khung hình → giật. Đổi sang chữ trắng mờ 40 % + `text-shadow` viền tối, không
   blend; thử trên tài liệu nền sáng: 24 dấu vẫn đọc rõ.

**Còn nghi (chưa đụng, chờ t xác nhận sau khi F5 + lên 1.0.19):** app dò phần mềm quay bằng `tasklist` mỗi 4 s —
máy yếu có thể khựng nhẹ theo nhịp; nếu vẫn giật đều đặn thì giãn 10 s ở bản 1.0.20.

---

## 2026-09-16 — Thẻ "Bài mới" trang chủ: chữ tràn lên mặt nhân vật; app 1.0.19 khoá chống chụp cả cửa sổ con

**T (ảnh thẻ "BÀI MỚI · Liên kết - Lai hóa trong Hóa hữu cơ", chữ đè ngang mặt bạn nữ):** *"chữ vẫn đè lên
ảnh linh vật, t muốn chữ xuất hiện ở chỗ khác, m không fix à"* + *"Khi mở bài giảng ở tab mới, vẫn có thể
dùng snipping tool để chụp màn hình được"*. (Lượt trước t sửa linh vật CỘT TRÁI — đúng nhưng chưa đủ; cái
"nhân vật" trong ảnh này là minh hoạ thẻ hero trang chủ.)

**Thẻ hero:** `.hero .copy` 48% + `.hero .art` 60% = chồng 8%, mép ảnh tan tới 42% — tên bài ngắn thì đẹp
(bản chốt 9/9 "tan + lật"), tên dài xuống 2 dòng là chữ đi thẳng vào mặt nhân vật. Sửa: copy 52% / art 48%
(không chồng), `overflow-wrap:anywhere`, mép tan ngắn lại (0→22%) vì không còn phần chồng phải che. Đo ở
1366×800 với đúng tên bài của t: `copy.right − art.left = 0 px`, tiêu đề 2 dòng nằm gọn cột chữ. Nhân vật
vẫn bleed sát mép phải + tan vào nền — không phải hai ô rời như bản t từng chê.

**App 1.0.19 (lỗi thật):** chỉ cửa sổ chính gọi `setContentProtection(true)`; Liên kết không tick "chỉ xem"
có nút "Mở ở tab mới" → `setWindowOpenHandler` cho phép cùng tên miền → Electron mở CỬA SỔ MỚI không hề
được khoá → Snipping Tool chụp được bài giảng. Sửa: gom cả bộ khoá (content protection, ẩn menu, UA, chỉ
đi trong tên miền, chặn Ctrl+P/S/U, F12, DevTools) vào `khoaCuaSo(win)`, gọi cho cửa sổ chính và đệ quy
cho mọi cửa sổ con qua `did-create-window` (+ `overrideBrowserWindowOptions` sandbox/preload/devTools:false).
Link ngoài tên miền (YouTube, Drive) vẫn mở bằng trình duyệt thường → không khoá được, chấp nhận; bài giảng
riêng nên để trong `/bai-giang` (cùng tên miền) hoặc tick "Chỉ cho xem trong trang" (mở ngay trong cửa sổ
chính, không cần cửa sổ con). Tag `v1.0.19`, Windows tự cập nhật qua R2.

**Sửa lại lần 2 (t chê "fix tệ"):** *"chữ t muốn hiển thị ở mục phía trên, để nguyên vẹn ảnh cho t"* — không
phải chia cột hẹp/rộng gì cả. `.hero` thành cột dọc: khối chữ (nhãn, tiêu đề, dòng phụ, nút, câu nhắc)
rộng hết thẻ ở TRÊN; `.art` ở DƯỚI, ảnh `width:100%; height:auto`, bỏ mask/absolute/cover — ảnh nguyên tỉ
lệ gốc, không cắt, không chữ nào chạm. Bỏ luôn nhánh lật `.hero.trai` (không còn cần) và rule mobile riêng.
Đo ở 1000 px: ảnh nằm trọn dưới khối chữ, 458×276 đúng tỉ lệ 460×277. Bài học: hai lần "chữ đè ảnh" t đều
tự nghĩ ra cách "đỡ chồng" thay vì làm đúng câu t nói — hỏi lại một câu "chữ trên, ảnh dưới đúng không?"
đã xong từ đầu.

**Việc t cần làm:** F5 thấy thẻ hero mới ngay; app chờ tự cập nhật 1.0.19 (hoặc tải lại từ /tai-app) rồi
thử lại Snipping Tool trên bài giảng mở tab mới — phải ra đen.

---

## 2026-09-16 — "Vẫn không đổi gì": cột trái không cuộn nên nút Trợ giúp rơi khỏi màn hình; bỏ bong bóng linh vật; no-store + app 1.0.18 tự xoá cache

**T (ảnh chụp + 4 lần báo):** *"giao diện nhân vật hoạt hình cứ hiện thông báo chữ… che đi trong rất xấu"*,
*"phần hướng dẫn sử dụng không tìm thấy"*, rồi *"tắt app vào lại rồi"*, *"update bản v18 rồi… vẫn không có
phần hướng dẫn và chữ vẫn đè lên nhân vật ở đầu"*.

**Đi vòng (ghi lại để lần sau đừng lặp):** t đoán cache — đúng là có chuyện cache (Cloudflare `CF-Cache-Status:
HIT` dù origin "no-cache"; Chromium trong app giữ bản cũ) nên đã sửa thật: `_headers` 9 trang app sang
`Cache-Control: no-store`, app 1.0.18 gọi `session.defaultSession.clearCache()` mỗi lần mở (tag v1.0.18, R2
`latest.yml` đã 1.0.18). Nhưng đó KHÔNG phải lý do m "không thấy gì đổi". Bảo m xoá thư mục cache tay còn
đoán sai tên (`LopHoc` — Electron dùng `name` = `lop-hoc`), m xoá nhầm rộng hơn → app trắng một lúc; cài
lại là hết. Bài học: khi user gửi ảnh nói "chữ đè lên nhân vật", nhìn kỹ ẢNH trước khi đổ cho cache.

**Nguyên nhân thật (đọc CSS):** `.side{ position:sticky; height:calc(100vh - 40px); display:flex;
flex-direction:column }` — cao cố định, KHÔNG `overflow`. Máy màn hình thấp (laptop 768/800px) thì tổng
brand + 7 nút nav + khối linh vật (bong bóng + ảnh 128px + nút Trợ giúp) ≈ 810px > cột → flex ép các khối
co lại: bong bóng đè lên đầu nhân vật ("chữ đè lên nhân vật ở đầu"), nút **Trợ giúp** rơi ra ngoài đáy
màn hình → m không bao giờ thấy nút, nên mục hướng dẫn "không tìm thấy" và mọi bản mới đều "y chang".
Ở bố cục hẹp (< 1200px) `.mascot{display:none}` — nút Trợ giúp không tồn tại luôn.

**Sửa:** (1) bỏ hẳn `<div class="bub" id="mascotSay">` + CSS `.bub`, `MASCOT[]`/2 timer — linh vật chỉ là
ảnh; `noiMascot(t)` giờ = `baoChup(t,'','ok')` (4 câu chúc "Nộp bài xong rồi đó!"… lên banner đầu trang
6 s, đúng ý "thông báo đẩy lên trên"). (2) `.side` thêm `overflow-y:auto; overflow-x:hidden`, `.side > *{flex:none}`
(không cho ép), ảnh linh vật 96px khi cao < 860px, ẩn khi < 720px. (3) menu tài khoản (avatar góc phải)
thêm **Hướng dẫn sử dụng** (`#hdBtn` → `toggleMenu(false)` + mở `#helpBox`) — tới được ở mọi bố cục.

**Thử:** `_test_hoc.html?g=nu` ở 1366×700: không bong bóng, ảnh linh vật ẩn, nút Trợ giúp nằm trong cột
(đáy 657/660), cột không phải cuộn; 1366×800: ảnh 96px, nút trong cột; menu avatar → Hướng dẫn sử dụng mở
đúng hộp, menu tự đóng; không lỗi console; `ra-soat.js` sạch, không còn tham chiếu `mascotSay`.

**Việc t cần làm:** F5 (hay mở lại app) — bản này là web, không cần cập nhật app. Muốn xem hướng dẫn: nút
**Trợ giúp** dưới linh vật, hoặc bấm ảnh đại diện góc trên phải → **Hướng dẫn sử dụng**.

---

## 2026-09-15 (khuya) — Mục Trợ giúp trong app học thêm bản đồ 7 mục + sơ đồ Module 4 bước

**T:** t đưa ra một "Bản Đồ Lớp Học" (infographic Claude) hướng dẫn dùng giao diện học sinh, rồi hỏi lại:
*"thế cái bản đồ lớp học nó xuất hiện ở đâu, t nghĩ nên là mục hướng dẫn ở trong app chứ? để cho người
mới hiểu"* — đúng, artifact Claude riêng tư/không nhúng được (đã kiểm ở mục trước), học sinh không xem
được; phải đưa nội dung THẲNG vào app.

**Làm:** không tạo mục mới — đưa nội dung vào đúng hộp `#helpBox` đã có sẵn (bấm nhân vật góc dưới trái
→ nút Trợ giúp). Hộp cũ chỉ có 6 dòng gạch đầu; thêm hai khối mới ở đầu, dùng nguyên bộ icon `I{}` và
biến màu `--primary/--accent/--ok/--primary-deep` sẵn có của app (tự đổi đúng theo 4 giao diện Mint/Sky/
Peach/Lavender, không hard-code màu):
- **Bảy mục ở cột trái** — 7 dòng gọn (icon + tên + 1 câu) cho Trang chủ/Khoá học/Bài giảng/Bài tập/Lịch
  học/Tiến độ/Hỏi đáp.
- **Sơ đồ Module 4 bước** (`.hb-pipe`) — Xem video → Đọc bài giảng HTML → Làm bài tập → Đối chiếu đáp án,
  mỗi bước một icon + màu riêng theo token, nối bằng mũi tên; > 480px xếp ngang, ≤ 480px xếp dọc (mũi
  tên tự xoay 90°).
`.helpbox .card` thêm `max-height:88vh; overflow:auto` (nội dung dài hơn trước nhiều) — cẩn thận: đổi
`width:min(560px,100%)` sang `width:min(560px,calc(100vw - 32px))` để tránh phần trăm bên trong grid
item `place-items:center` không có track xác định.

**Bẫy khi thử:** đo `.helpbox .card` bằng `document.querySelector` ra 0×0, tưởng CSS hỏng — hộp "Đổi mật
khẩu" cũng dùng chung class `.helpbox`, `querySelector` (không phải `querySelectorAll`) chỉ lấy phần tử
ĐẦU TIÊN khớp trong DOM, vớ đúng hộp kia (đang ẩn) chứ không phải `#helpBox`. Đổi sang `#helpBox .card`
(id, không mơ hồ) mới đo đúng: 382 px trên khung 414 px (= calc(100vw-32px) khớp chính xác), cuộn được.
Bài học: nhiều hộp thoại dùng chung class chỉ để định vị overlay — luôn đo bằng `#id` khi trang có nhiều
hộp cùng lúc.

**Thử:** `_test_hoc.html?g=nu` (giao diện Peach) — bấm Trợ giúp, cuộn hết hộp, 7 icon mục + 4 icon bước
đều tô đúng, không lỗi console; ở 414 px bốn bước xếp dọc mũi tên quay đúng chiều; `ra-soat.js` sạch.

**Việc t cần làm:** không — đã đẩy lên, học sinh mở app bấm Trợ giúp là thấy ngay.

---

## 2026-09-15 (tối) — Sổ từng môn thành BẢN WEB trên giangduonghoahoc.com (kho riêng từng môn trong bảng `notebook`), menu Quản trị trỏ sang bản web

**T:** *"các sổ bài tập làm thành link web cho t, chừa lại cái hóa phân tích thì để lại thôi, các sổ mới để
link web gắn với trang quản trị hết"* — sổ Claude bất tiện (cần đăng nhập claude.ai, app desktop của t không
tải/AI được, không "Giao cho lớp" được); bản web dùng chung phiên giáo viên, giao thẳng lên lớp.

**Làm:** `shim_supabase.js` thêm tiền tố kho theo môn — bản theo môn đặt `window.SBT_MON = {key,name,upper}`
(chèn bởi `build_web_so.js` khi truyền mã môn), mọi `collection` được gắn `key + ':'` (`hoa-ly:weeks`,
`hoa-ly:settings`…) trong cùng bảng `notebook` (PK owner+collection+doc_id, không đổi schema); bản Hóa phân
tích không tiền tố → dữ liệu cũ y nguyên. `seedMon()` sau đăng nhập: kho môn chưa có `settings/course` thì
chép từ kho gốc (GV, email, logo, hồ sơ, khổ giấy — đổi "HÓA PHÂN TÍCH" → tên môn, như `seed_mon.js`),
theme chỉ mang chữ chìm/logo mờ + `preset` của môn (KHÔNG chép màu — chép cả màu thì sổ mới mang màu Hóa
phân tích; `THEME_PRESETS` nằm trong IIFE của app nên shim không với tới, phải để `themeDefaults()` của bản
theo môn lo). `Tools/build_web_so.js` nhận tham số 3 `<mã môn>`: đọc file `Mon/…`, chèn `SBT_MON`, tiêu đề
"· bản web", ra `web/so-bai-tap-<mã>.html`. Dựng 4 bản: huu-co, hoa-ly, vo-co, ky-thuat (1609 KB mỗi file,
đợt 90) + gốc. `web/_headers` thêm 4 khối (no-cache, noindex, DENY). Menu **Sổ Bài Tập ▾** ở Quản trị: Hóa
phân tích giữ 2 dòng (bản web · sổ Claude), 4 môn kia trỏ `so-bai-tap-<mã>.html` cùng tab, cuối là 📚 Kệ
Sổ (bản Claude). Sổ Claude của 4 môn vẫn còn, không xoá.

**Thử:** mở `/so-bai-tap-ky-thuat.html` tại máy: tiêu đề "Sổ Bài Tập Hóa Kĩ Thuật · bản web", `SBT_MON`
đúng, chữ đầu app "Hóa kĩ thuật · HUS/VNU", dấu bản "đợt 90 · bản Hóa kĩ thuật · bản web", màn đăng nhập
hiện, không lỗi console. Chưa thử được bước sau đăng nhập (t không có mật khẩu) — `seedMon` đọc bằng mắt,
lần đầu t mở sổ môn mới mà thấy thiếu logo/tên GV thì báo.

**Việc t cần làm:** đăng nhập một lần ở mỗi sổ môn để kho tự chép cài đặt; muốn mang câu hỏi từ sổ Claude
sang bản web thì Sao lưu toàn bộ (sổ Claude) → Khôi phục từ file (bản web).

---

## 2026-09-15 — Thư mục /bai-giang cho HTML bài giảng riêng (nhúng "chỉ cho xem"), X-Frame-Options tách theo trang; menu Sổ Bài Tập từng môn ở Quản trị

**T:** *"link html mở bằng chrome thì nhúng vào mục quản trị kiểu gì để chỉ xem mà không tải được nhỉ, t chưa
rõ"* — hỏi lại: file `.html` nằm trên máy (bấm đúp mở), chưa có địa chỉ web. Ô "Đường dẫn" của Liên kết chỉ
nhận địa chỉ http(s); `file:///C:/…` chỉ có trên máy t, sinh viên không mở được.

**Đã thử & loại:** (1) publish thành Claude Artifact rồi dán link — thử thật: trang Claude trả
`X-Frame-Options: SAMEORIGIN` nên khung xem ở giangduonghoahoc.com bị trình duyệt từ chối hiển thị (và CSP
của artifact cũng không cho artifact nhúng trang khác). (2) kho `tailieu` Supabase là bucket kín (RLS, cần
phiên đăng nhập) — `<iframe src>` trần không mang phiên, không dùng được.

**Làm:** thư mục `web/bai-giang/` — file đặt vào đó lên cùng tên miền:
`https://giangduonghoahoc.com/bai-giang/<tên>` (Cloudflare tự bỏ `.html`; gõ `.html` thì 307 sang địa chỉ
gọn). Dán vào `＋ Liên kết`, tick "Chỉ cho xem trong trang". **Bẫy:** `web/_headers` đặt
`X-Frame-Options: DENY` ở `/*` từ 12/9, và Cloudflare NỐI (không ghi đè) header trùng tên giữa các luật cùng
khớp (kiểm tài liệu Cloudflare Pages `_headers`) → không thể "nới riêng" `/bai-giang/*` bằng một luật thêm
(sẽ thành `DENY, SAMEORIGIN`). Dời DENY khỏi `/*`, đặt riêng ở `/`, `/hoc`, `/quan-tri`, `/so-bai-tap`,
`/tai-app` (5 trang thật, `/quan-tri.html` v.v. đều 307 về đường gọn nên không hở); `/bai-giang/*` không có
header này. Kiểm live sau deploy: `/hoc` `/quan-tri` vẫn DENY, `/bai-giang/Module1-HoaHuuCo-NhapMon` 200 và
không có X-Frame-Options. File thử của t: `Module1-HoaHuuCo-NhapMon.html` (bản Claude "Bundled Page" tải
về, 885 KB) → https://giangduonghoahoc.com/bai-giang/Module1-HoaHuuCo-NhapMon . Nói rõ với t: file trong
`/bai-giang/` công khai, ai có link cũng xem được, không cần đăng nhập — đừng để đáp án riêng vào đó.

**Bị chặn một nhịp:** hệ thống chặn lệnh `git commit && git push` với nhãn "out-of-place publication"
(đẩy tệp gói lớn lên kho công khai + web công khai) — dừng, hỏi lại t, t gõ "đẩy đi" mới đẩy (`f7523d0`).

**Menu Sổ Bài Tập (quan-tri.html):** *"cho t các sổ bài tập của từng môn ở trang quản trị"* — chip "Sổ Bài
Tập" thành `<details class="chipmenu">` bung: Hóa phân tích (bản web `so-bai-tap.html` · sổ Claude), Hữu cơ,
Lý, Vô cơ, Kĩ thuật, 📚 Kệ Sổ; sổ trên Claude mở tab mới; bấm ra ngoài là đóng (handler cạnh `$`). Ba sổ
Lý / Vô cơ / Kĩ thuật tạo mới cùng phiên — xem `So_Bai_Tap_HUS/NHAT_KY_PHIEN_LAM_VIEC.md` đợt 90.
`web/so-bai-tap.html` dựng lại theo gốc đợt 90 (`build_web_so.js`).

**Thử:** `_test_quan-tri.html`: 7 link đúng địa chỉ + `target=_blank`, mở/đóng đúng, không lỗi console;
`ra-soat.js` sạch.

**Việc t cần làm:** không.

---

## 2026-09-15 — Đổi lại: Module NẰM TRONG buổi (video → HTML → bài tập → đáp án, mở theo ngày riêng từng bước) — thay thế mục "Video bài giảng" (v31) vừa làm ở trên (schema_v32)

**T:** *"t nghĩ lại rồi, nếu video ở 1 mục khác, thì khó theo dõi quá nhỉ, có cách nào thiết kế thông
minh hơn được không, là video chắc phải ở trong từng buổi, nhưng t nghĩ nó vẫn phải chia thành các
module kèm chỗ gắn html như cũ, và bài tập sẽ ở giao diện trong buổi để HS biết logic là: xem video
xong - dùng html để hiểu - và làm bt vận dụng cái thử mình xem được - sau đó hiện đáp án - cho t set
ngày với tất cả các tính năng trên (chọn ngày để video, html hay bài tập nó xuất hiện ấy"*. Ngay sau
khi vừa làm xong mục "🎬 Video bài giảng" tách riêng (v31, mục nhật ký ngay dưới) — đổi ý trong vòng
một buổi làm việc, chưa kịp báo t chạy SQL v31 nên không mất gì thật.

**Gỡ v31:** bỏ sạch tab/nav/section/CSS/hàm riêng cho "Video bài giảng" ở cả hai trang, đưa
`matById`/`saveMaterial`/`delMaterial`/`moveMaterial` về lại dạng chỉ tìm trong `sessions` (bỏ
`modules`/`lecModules`/`refreshBuoiHoacModule`) — **giữ nguyên** `materials.xem_khong_tai` và
`oXemKhongTai()` (ô "Chỉ cho xem trong trang" của Liên kết) vì tính năng đó vẫn cần cho thiết kế mới.
`lecture_topics`/`sessions.la_bai_giang`/`topic_id` (bảng/cột của v31) để nguyên trong CSDL, không
dùng nữa — không xoá, phòng khi t đã trót tạo dữ liệu thật ở đó.

**Kỹ thuật v32:** bảng mới `session_modules` (session_id, title, order_no) + `materials.module_id`
(nullable, trỏ vào đó). Module KHÔNG ép cứng 4 loại ở CSDL — Quản trị chỉ GỢI Ý đúng 4 nút (Video/
Liên kết/Tệp PDF/Đáp án) theo mạch video→HTML→bài tập→đáp án cho quen mắt, còn thêm loại gì cũng được.
`open_at` ("Mở lúc") vốn đã có sẵn ở `materials` từ trước — chỉ mở rộng ô nhập ngày trong hộp "Thêm
tài liệu" ra MỌI loại (trước đây chỉ answer/pdf/lecture mới có), để video/link cũng đặt được ngày mở.

`web/quan-tri.html`: mỗi buổi (khung `<details class="ses">` sẵn có, không đổi gì) có thêm nút **📦
Module mới**; module hiện thành khung `.modbox` con bên trong buổi, có hàng nút ＋ riêng (gắn
`data-mod` để `saveMaterial` biết gắn `module_id`). Tách `matRowHtml()`/`addRowHtml()` ra khỏi
`loadSessions()` để dùng chung cho tài liệu rời lẫn tài liệu trong module, đỡ chép hai lần. `↑ ↓` của
một tài liệu chỉ đổi chỗ trong CÙNG cụm (module đó, hay nhóm tài liệu rời) — không nhảy lẫn module
khác. **Xoá module** chỉ xoá cái khung (`session_modules` có `on delete set null` cho `module_id`) —
tài liệu bên trong không mất, tự tách thành tài liệu rời; phòng khi bản thử (không có FK thật) không
tự làm vậy, `loadSessions()` còn tự coi tài liệu trỏ vào module-đã-mất là tài liệu rời (không cho biến
mất khỏi danh sách).

`web/hoc.html`: `renderMain()` tách module thành khung `.modblock` riêng ngay trong buổi, đúng thứ tự,
tài liệu chưa tới giờ mở vẫn hiện kèm ổ khoá + giờ mở y hệt tài liệu rời (dùng lại nguyên `row()`); tài
liệu không thuộc module nào (buổi cũ) vẫn hiện y như trước trong mục "Tài liệu khác". `matList` (mảng
cho nút ◀ ▶ trong khung xem) dồn theo đúng thứ tự hiện trên trang — module trước, tài liệu rời sau —
nên lướt đúng mạch video→html→bt→đáp án.

**Bẫy khi vá:** dùng hàm `khoang(a, b, moi)` (thay từ mốc a tới mốc b bằng `moi`) mà lỡ truyền `moi`
TRÙNG với chính mốc `b` — kết quả bị TRÙNG LẶP dòng đó hai lần (`<div id="paneWeb" hidden>` in hai
lần liền, comment `/* kho tệp */` in hai lần) vì hàm giữ nguyên đoạn từ b trở đi rồi còn nối thêm
`moi` phía trước. `node --check` không bắt được (comment/HTML trùng vẫn hợp lệ cú pháp) — chỉ lộ ra
khi đọc `git diff`. Từ nay `khoang(a, b, moi)` mà muốn XOÁ hẳn đoạn ở giữa thì `moi` phải là `''`
(rỗng), không phải chép lại `b`.

**Thử:** `_test_quan-tri.html` — buổi "Cân bằng tạo phức" có sẵn 1 module đủ 4 bước (video mở ngay,
HTML "chỉ xem trong trang" mở ngay, bài tập mở ngay, đáp án khoá "Mở sau") + 1 tài liệu rời, xem đúng
cả hai kiểu cùng lúc; thêm tài liệu vào module qua nút riêng lưu đúng `module_id`; xoá module xong 4
tài liệu tách ra thành tài liệu rời, không mất cái nào; "Mở lúc" hiện cho cả Video/Liên kết (trước
đây không có). `_test_hoc.html` — buổi 4 hiện khung module đúng mạch, mục Đáp án khoá nằm dưới "MỞ
SAU" NGAY TRONG module (không văng ra ngoài); bấm link HTML trong module vẫn đúng `sandbox`, không có
nút Mở tab mới; buổi 5 (không dùng module) hiện y hệt trước khi sửa — không hỏng gì. `ra-soat.js`
sạch cả hai trang.

**Việc t cần làm:** chạy `schema_v32_module_trong_buoi.sql`, publish lại web. `schema_v31...sql` không
cần chạy nữa (đã đổi thiết kế trước khi t kịp chạy).

---

## 2026-09-15 — Video bài giảng: Chủ đề → Module, tách khỏi Buổi học; link HTML "chỉ cho xem" (schema_v31)

**T:** *"t muốn m điều chỉnh giao diện tạo video bài giảng, t sẽ thêm video bài giảng dưới dạng chủ đề
1 2 3, trong chủ đề sẽ có các module nhỏ hơn, để SV theo dõi, và chỗ để thêm đường link html bài giảng
(nhớ chỉ cho quyền xem, chặn tải html)"*. Hỏi lại 1 câu trước khi làm: mục mới tách hẳn khỏi Buổi học,
t chọn "mục mới tách biệt" (không gộp vào Buổi).

**Kỹ thuật:** không dựng bảng "module" riêng — Module CHÍNH LÀ một dòng `sessions` có sẵn, đánh dấu
`la_bai_giang=true` + gắn `topic_id` (bảng mới `lecture_topics`). Nhờ vậy Module dùng lại NGUYÊN VẸN
toàn bộ hạ tầng materials/video Cloudflare Stream/quỹ giờ xem/RLS đã chạy tốt — không xây lại từ đầu,
không đụng gì tới Buổi học đang chạy thật.

`schema_v31_video_bai_giang.sql`: bảng `lecture_topics` (class_id, name, order_no) + RLS; `sessions`
thêm `la_bai_giang`, `topic_id`; `materials` thêm `xem_khong_tai` (cho kind='link').

`web/quan-tri.html`: tab mới **🎬 Video bài giảng** — cột trái Chủ đề (`.citem`/`.clist` dùng lại từ
sidebar lớp), cột phải Module (`.card.ses`/`.mats`/`.mat` dùng lại từ khung buổi, cho quen mắt). Tổng
quát hoá 5 chỗ trong `matById`/`saveMaterial`/`delMaterial`/`moveMaterial` từ "chỉ tìm/tải trong
`sessions`" thành "tìm/tải đúng `sessions` HOẶC `modules`" (`refreshBuoiHoacModule`) — nhờ vậy nút
"＋ Video" trong module gọi thẳng `addMaterial()` sẵn có (khung chọn/tải video Stream, quỹ giờ xem)
không phải viết lại. Thêm `oXemKhongTai()` — ô tick "Chỉ cho xem trong trang" khi thêm/sửa Liên kết.

`web/hoc.html`: nav mới "🎬 Video bài giảng"; `loadSessions()` tách `la_bai_giang=true` ra `lecModules`
(mảng `sessions` cho Buổi học không đổi gì) + nạp thêm `lecture_topics`; `renderLec()` xếp module theo
chủ đề thành lưới thẻ; bấm thẻ là `matList` = tài liệu của module đó rồi `openMaterial()` — dùng lại
khung xem toàn màn hình có sẵn (◀ ▶, dấu chìm, quỹ giờ…). Nhánh "link ngoài" trong `moNoiDung` tra
`matById(id).xem_khong_tai` → nhúng `<iframe sandbox="allow-scripts allow-same-origin">`, bỏ nút "Mở
tab mới".

**Bẫy khi viết:** dòng ghi chú trong `oXemKhongTai()` gõ nhầm dấu phẩy `,` thay vì `+` giữa hai chuỗi
nối nhau — cú pháp vẫn hợp lệ (thành toán tử phẩy) nên `node --check` không bắt được, chỉ lộ ra lúc bấm
thử: hộp thoại thêm Liên kết mất trắng ô tick, hiện chữ "NaN" (dòng sau bắt đầu bằng `+` bị hiểu thành
dấu cộng một ngôi, ép chuỗi thành số). Nhắc: bẫy `$` trong replace đã có trong sổ tay, giờ thêm bẫy
`,` thay `+` khi nối chuỗi nhiều dòng — phải BẤM THỬ THẬT trên trình duyệt, không chỉ tin `node --check`.

**Thử:** `_test_hoc.html` — mục Video bài giảng hiện đúng Chủ đề 1 với 2 module; module có link
`xem_khong_tai` mở đúng `sandbox="allow-scripts allow-same-origin"`, không có nút Mở tab mới; module chỉ
video mở thẳng, không qua bước chọn. `_test_quan-tri.html` — tạo chủ đề, tạo module, thêm Liên kết tick
"Chỉ cho xem" → material hiện "· chỉ xem trong trang" đúng; publish/nháp module đổi qua lại đúng; Buổi
học (tab cũ) không đổi gì, vẫn 3 buổi + tài liệu như trước.

**Việc t cần làm:** chạy `schema_v31_video_bai_giang.sql`, publish lại web.

---

## 2026-09-15 — Canh gác chụp/quay màn hình leo thang: 3 ngày → 30 ngày → vĩnh viễn (schema_v30)

**T:** *"vẫn còn chức năng cảnh báo khi SV thật sự bấm nút chụp màn hình đấy hay quay màn hình đấy chứ,
nhớ là chỉ khi bấm thôi đấy nhé, và kèm dòng thông báo nếu 3 lần liên tiếp sẽ bị khóa tài khoản 3 ngày,
sau khi mở tái phạm sẽ bị khóa tiếp 30 ngày, lần 3 là ban vĩnh viễn luôn (…dọa khóa 3 ngày trước, các lần
sau sẽ dọa với khung 30 và vĩnh viễn), làm thử t xem"*.

**Rà lại bộ canh gác có sẵn (đợt 11/9):** đúng như t nhớ — `viPhamChac()` chỉ đếm khi THẬT SỰ bấm
(PrintScreen, Win+Shift+S dò qua mất tiêu điểm đúng nhịp phím, phần mềm quay đang chạy, Ctrl+P/S); mất
tiêu điểm không rõ lý do hay mở Snipping Tool/Game Bar chỉ ghi `nghi_chup`, không tính. Không đổi gì ở
chỗ này — chỉ thêm hình phạt sau khi đủ 3 lần.

`schema_v30_canh_gac_leo_thang.sql`:
- `profiles` thêm `cg_muc` (0..3), `cg_khoa_den` (khoá tạm tới lúc này), `cg_cam` (cấm hẳn).
- Sửa lại `screenshot_events` cho phép ghi `quay`/`win_snip`/`nghi_chup` (schema_v6 trước đây chỉ cho
  `printscreen/in/luu` — 3 loại kia âm thầm bị chặn ghi từ lâu, không ai biết).
- `is_active()` sửa lại (không thêm hàm mới) để cũng trả `false` khi đang khoá/đã cấm — RLS của
  sessions/materials/material_contents đều gọi hàm này sẵn nên khoá xong tự chặn hết, không cần vá
  từng policy.
- Trigger `chan_tu_sua_cg`: chặn sinh viên tự sửa 3 cột `cg_*` qua update() thẳng (RLS tự-sửa-hồ-sơ
  không giới hạn theo cột) — chỉ 2 hàm `canh_gac_leo_thang()`/`gv_mo_khoa_cg()` bật cờ
  `app.cg_trusted` mới sửa được.
- `canh_gac_leo_thang()`: sinh viên tự gọi cho chính mình khi đủ 3 lần; bỏ qua nếu không phải role
  student (phòng giảng viên tự thử trang bị dính).
- `gv_mo_khoa_cg(uuid)`: giảng viên mở khoá tay.

`web/hoc.html`: `viPhamChac()` gọi RPC khi đủ 3 lần, dựng câu báo chính xác mức vừa dính rồi mới đăng
xuất (không phải đăng xuất trước); dòng 1/3, 2/3 đổi theo `tenMucKeTiep(profile.cg_muc)`. `enter()` kiểm
`lyDoKhoaCanhGac(profile)` ngay sau khi đọc hồ sơ — đăng nhập lại lúc còn hạn khoá vẫn bị chặn kèm đúng
giờ hết hạn. Chặn lúc đăng nhập ban đầu định dùng `alert()` theo kiểu dòng `profile.active===false` sẵn
có — thử mới thấy `alert()` xong rồi tải lại trang thì mất trắng câu báo, không đọng lại gì trên màn
đăng nhập; đổi sang cùng kiểu `sessionStorage` + dòng báo màu đỏ như `idle`/`chup` đã dùng.

`web/quan-tri.html`: roster thêm 3 cột khoá vào select hồ sơ; `oHoSo()` hiện pill 🔒 *đang khoá*/*cấm
vĩnh viễn*; hộp Hồ sơ SV (`moHoSoSV`) thêm mục *Canh gác chụp / quay màn hình* + nút *Mở khoá ngay* (hỏi
lại trước khi làm, theo lệ `hỏi trước khi xoá`).

**Bẫy khi thử:** vá mock `canh_gac_leo_thang` vào `test/tao-ban-thu.js` làm mất một dấu `}` đóng nhánh
`nop_bai_o` trước đó → cả trang thử vỡ (SyntaxError, `window.supabase` không hiện) — không phải lỗi ở
`web/hoc.html` thật. Nhớ: mỗi lần vá bằng chuỗi khớp-thay, kiểm `node --check` cả file gốc VÀ file thử
sau khi build, không chỉ file gốc.

**Thử:** `_test_hoc.html?cgmuc=0|1|2` (đã dính mấy lần — câu doạ 1/3, 2/3 đúng mức 3 ngày/30 ngày/vĩnh
viễn), `?cgkhoa=1` (đang khoá tạm — chặn ngay lúc vào, đúng giờ hết hạn), `?cgcam=1` (đã cấm). Dính đủ 3
lần ở `cgmuc=1` ra đúng "khoá tới …" (30 ngày sau); ở `cgmuc=2` ra đúng "CẤM VĨNH VIỄN". `_test_quan-
tri.html`: u2 (Trần Quốc Bảo) đang khoá tạm, u3 (Lê Thu Hà) đã cấm — pill hiện đúng trong danh sách lớp
và trong hộp Hồ sơ; bấm Mở khoá ngay cho u2 → pill biến mất, danh sách tự tải lại.

**Việc t cần làm:** chạy `schema_v30_canh_gac_leo_thang.sql`, publish lại web + Worker.

---

## 2026-09-12 — Infographic số 3: Đăng ký tài khoản (một tài khoản học mọi khoá, mật khẩu = mã SV)

M hỏi đã có ảnh hướng dẫn đăng ký chưa — chưa. `pr/infographic-dang-ky.html` → `.png` 2160×2700 (cùng công thức Chrome headless),
`web/img/huong-dan-dang-ky.jpg` 1620×2025 (~470 KB). 4 bước: 1 form mô phỏng (vòng cam ở ô Mã sinh viên và ô tick nhiều khoá) + 4
lưu ý (email = tên đăng nhập, mã SV = mật khẩu lần đầu + mã đối chiếu học phí, học 2–3 môn tick hết một lần, số Zalo) · 2 bốn thẻ
"Học nhiều khoá: một tài khoản là đủ" (Đúng/Đừng/học thêm khoá sau = đăng ký lại đúng email cũ, mật khẩu giữ nguyên/duyệt từng khoá)
· 3 chờ duyệt + tin Zalo mô phỏng · 4 đăng nhập lần đầu + luật mật khẩu mới + quên thì nhắn Zalo · dải học phí QR / Đóng gộp.
Không nói khoá máy, dấu chìm, hạn nợ. Lần chụp đầu dải chân bị cắt → bớt gap/padding.
- Trang công khai: nút **Cách đăng ký từng bước** (`#hdMoDk`, chữ `dk_hd` sửa được ở Quản trị) ở đầu mục Đăng ký; hộp `#hdBox` dùng
  chung: `hdMo(kieu)` đổi ảnh/tiêu đề/nút (`data-hd`: app → 2 nút tải, dk → *Tới form đăng ký*); hash `#huong-dan-dang-ky`.

---

## 2026-09-12 — Hộp kết quả duyệt / cấp mật khẩu tắt sau vài trăm ms (m không đọc kịp)

Nguyên nhân: `dlgOk` gọi `await dlgOnOk()` rồi `closeDlg()`; onOk của hộp Duyệt mở hộp kết quả bằng `setTimeout(…, 50)` rồi còn
`await loadRoster()` → khi xong, `closeDlg()` đóng luôn **hộp kết quả** vừa mở. Hộp Cấp lại mật khẩu (viết sáng nay) cùng lỗi.
- `dialog()` có `dlgGen` (thế hệ) — `dlgOk` chỉ đóng nếu `gen` chưa đổi; tham số `opts.giu` = hộp kết quả: không đóng khi bấm nền / Esc,
  ẩn nút Huỷ, chỉ đóng bằng *Đóng*.
- Duyệt: mảng `kq[]` ✓/✗ từng bước (tài khoản mới/có sẵn, ghi danh từng lớp, ghi đơn `dang_ky`, tải lại bảng); tải lại bảng **trước**,
  mở hộp kết quả sau, `return false`. Tiêu đề đổi "Duyệt xong nhưng có chỗ lỗi" khi có ✗. Nút 🔑 báo trong `dlgMsg` thay vì toast.
- Cấp lại mật khẩu: hộp kết quả giữ, thêm dòng ✓ máy chủ đã đổi + nút *Chép tin nhắn*. Tạo hàng loạt: hộp kết quả cũng `giu`.
- Toast 3,2 s → 4,5 s. Stub QT: thử duyệt → hộp còn sau 2,5 s; bấm nền/Esc không đóng; Đóng mới tắt.

---

## 2026-09-12 — Trang chủ 7 khoá vỡ khung ảnh → thẻ Tổng quan + lưới chip; học phí dời xuống mục Khoá học

M chụp máy thật: học 7 khoá, cột phải "Bạn đang học 7 khoá" liệt kê 7 dòng → grid kéo hero cao 733 px, ảnh nhân vật crop nát.
- `tongQuanHtml(kieu)`: thẻ Tổng quan cao gần cố định (3 ô số gộp, thanh %, dòng tạm đóng, dòng học phí gộp/đơn/đủ với nút
  Đóng gộp · Chuyển khoản · Xem lại); một khoá thì kèm chip khoá đó. `khChipHtml` chip một dòng; nhiều khoá → thẻ `.khchips`
  full-width lưới `auto-fill minmax(250px)`. Bỏ `.khoatom`; bỏ `hpThe()` ở đầu trang chủ.
- Mục Khoá học: `#khoaTong` = Tổng quan `.ngang` + `hpThe()` trên lưới thẻ khoá. `.home` cột phải min 310 px, `.more` nowrap.
- Stub: `?nlop=7` sinh 7 khoá tên dài + học phí đủ kiểu (chua_han/qua_han/da_dong/mien/bao). Thử 1366 px: hero 383 px (1 khoá),
  ~330 px (7 khoá); mục Khoá học hàng học phí không gãy dòng.

---

## 2026-09-12 — Rà trình quản lý mật khẩu; email đã có tài khoản thì mật khẩu không = mã SV

M báo mật khẩu khởi tạo của maknoonnjs@gmail.com không trùng mã SV. Nguyên nhân trong mã: `taoTaiKhoan` gặp email **đã có tài khoản**
(422 already registered) → chỉ `enroll_by_email`, **không đụng mật khẩu** — tài khoản này được tạo ở lần duyệt đầu (lúc còn trigger một khoá:
tạo tài khoản được, ghi danh hỏng), lần duyệt lại sau v29 đi vào nhánh "đã có". Hộp Đã duyệt trước đây chỉ nói "đăng nhập như cũ".
- Worker: nhánh đã-có trả `user_id`, `chua_vao` (chưa onboard), điền `student_no` nếu hồ sơ trống; `capLaiMatKhau` nhận `dung_mssv`
  → mật khẩu = `profiles.student_no` (≥ 6), trả `la_mssv`.
- QT: hộp Đã duyệt giải thích + nút **🔑 Đặt lại mật khẩu = mã SV** (confirm → API → viết lại tin Zalo); nút *Cấp lại mật khẩu* ở roster
  thành hộp chọn *Bằng mã sinh viên* / *Sinh ngẫu nhiên*.
- SV: *Đổi mật khẩu* từ `prompt()` thành hộp `#pwBox` (2 ô, hiện mật khẩu); `loiMatKhau()` dùng chung cho lần đầu/khôi phục/đổi:
  ≥ 8, có chữ và số, ≠ mã SV, ≠ phần trước @ email.
- Stub QT: `?daco=1` giả email đã có; mock cap-lai trả theo `dung_mssv`. Sổ tay thêm mục "Mật khẩu — ai đặt, ai đổi, quên thì sao".

---

## 2026-09-12 — Đóng học phí GỘP nhiều khoá + hồ sơ liệt kê lớp

- SV: `hpChuaDong()/hpTongChuaDong()`, cờ `hpGop`; thẻ Học phí có dòng tổng + nút Đóng gộp (`data-gop`); màn học phí có thanh
  `.che` riêng/gộp; `veHocPhiGop()` QR tổng, nội dung `HP <mã SV> GOP`, bảng khoá, *Tôi đã chuyển cả N khoá* = rpc bao_da_chuyen từng lớp.
- QT: `xacNhanHocPhi` tải các ghi danh khác chưa đóng của em → tick ghi nhận cùng lần (ô tiền tự cộng; khoá chính nhận phần còn lại,
  khoá gộp ghi đúng học phí, ghi chú "gộp N khoá, tổng"); sao kê: `GOP` sau mã SV → `k.gop`, ứng viên = mọi khoá chưa đóng, khớp khi
  tiền = tổng, duyệt ghi từng khoá; hộp Hồ sơ SV thêm mục *Đang học N lớp* (trạng thái học phí mỗi lớp).
- Stub: `?hp2=1` cho c2 có học phí; QT u1 học thêm c2. Thử: gộp 2.700.000 ₫, báo chuyển, sao kê GOP khớp/lệch, ghi nhận 2 khoá.

---

## 2026-09-12 — Duyệt đăng ký không ghi danh được: vướng trigger "một tài khoản một khoá" (v29)

M thử duyệt một tài khoản test → không thấy ghi danh. Nguyên nhân: `trg_one_class` từ `schema_v4_mot_khoa.sql` (8/9) chặn insert
enrollments thứ hai của một sinh viên → `taoTaiKhoan`/`enroll_by_email` ném lỗi → hộp Duyệt báo `da_co_tai_khoan — Tài khoản này đang
học khóa …` (hoặc cảnh báo "chưa ghi danh vào lớp"). Luật này mâu thuẫn thiết kế mới (một tài khoản nhiều khoá, học phí từng khoá).
Sửa: `schema_v29_nhieu_khoa.sql` drop trigger + hàm `nhieu_khoa_ok()`; Worker cờ `v29_nhieu_khoa` qua `goiRpcTrue`; quản trị dịch
lỗi thành lời chỉ đúng tệp SQL; `LOI_API.da_co_tai_khoan`. Trang công khai nới 1320px/chữ to; Bỏ khỏi lớp + Hạ về SV hỏi trước (memory
`hoi-truoc-khi-xoa`).

---

## 2026-09-12 — Rà bảo mật cơ bản

M sợ "bị đánh sập tên miền và app". Kiểm từ ngoài: 16 bảng đọc bằng khoá anon → 14 rỗng, 2 bị từ chối (`cau_hinh_he_thong`, `dang_ky`);
insert anon bị RLS chặn; kho GitHub **đang public**; **signup đang mở** (`/auth/v1/signup` tạo được user thật → m phải tắt + xoá user thử);
DNSSEC chưa bật; trang chưa có security headers. Đã sửa trong mã: `_headers` thêm HSTS 1 năm, X-Frame-Options DENY, nosniff,
Referrer-Policy, Permissions-Policy (kiểm live đủ 5); `run_worker_first` đổi từ `true` sang mảng `["/", "/index.html", "/api/*"]` để tệp
tĩnh không ăn hạn mức Worker (đã kiểm: UA app mở `/` vẫn ra trang học, landing, /hoc, /api, img đều 200). Việc phải bật tay ở dashboard
ghi thành bảng 7 dòng trong sổ tay mục *Bảo mật cơ bản*. Không có gì cần SQL.

---

## 2026-09-12 — Sao lưu tự động (C8) + nhật ký lỗi phía SV (C9) — v28; duyệt từng khoá (v27d)

- **SQL v28** `schema_v28_sao_luu_loi_khach.sql`: bucket Storage `sao-luu` (riêng tư, policy `sl_doc` staff select; ghi bằng khoá
  quản trị), bảng `loi_khach` (insert own, staff all), `don_loi_khach()` 30 ngày.
- **Worker**: `scheduled()` + `wrangler.jsonc triggers.crons ["0 20 * * 6"]` (3h CN giờ VN) → `saoLuuNgay(env)`: `layHetBang` phân
  trang 1000 (không order — mỗi bảng khoá khác nhau), 15 bảng (thêm trang_cong_khai, dang_ky), upload `/storage/v1/object/sao-luu/<tên>`,
  `donKhoSaoLuu` giữ 8; R2 tuỳ chọn khi có binding `env.SAO_LUU` (chưa khai — khai mà bucket chưa có là deploy hỏng). Đường
  `/api/sao-luu` (giảng viên) + `/api/sao-luu/danh-sach`. Trạng thái `v28_sao_luu_loi_khach` = coKho(sao-luu) && coCot(loi_khach).
- **Quản trị**: Kho tệp → thẻ *Sao lưu tự động* (danh sách, Tải về qua signed URL 300 s, Sao lưu ngay, nhắc chạy SQL khi
  `chua_co_kho`); Cảnh báo → mục *Lỗi phía sinh viên* (`loadLoi`, join profiles, Xoá tất cả).
- **Ghi lỗi** ở cả hoc.html và quan-tri.html: `ghiLoiKhach` bắt `error` + `unhandledrejection`, tối đa 5/phiên, không lặp, im lặng
  khi chưa có bảng hay chưa đăng nhập.
- **v27d**: hộp Duyệt liệt kê từng khoá xin, không tick sẵn, chọn lớp từng dòng; `khoa_da_duyet` ghi khoá đã xong, chưa đủ thì đơn
  ở lại hàng chờ (chip ✓). Trạng thái tách `v27b_mssv / v27c_khoa_ds / v27d_duyet_tung_khoa` — m đã chạy b, c; d chưa.
- Thử stub: Sao lưu ngay → thêm bản; Cảnh báo có 2 lỗi giả + 1 lỗi bắn thật từ trang quản trị (ErrorEvent) → 3; `?sl=0&lk=0` ra lời nhắc SQL.
- **Bẫy lặp lại 2 lần trong ngày:** `node -e "…"` trong Bash nuốt backtick → nhật ký/sổ tay thủng chữ. Từ giờ mọi đoạn có backtick
  đi qua Write + `node file`.

**M phải làm:** chạy `schema_v27d_duyet_tung_khoa.sql` và `schema_v28_sao_luu_loi_khach.sql`; vào Kho tệp bấm *Sao lưu ngay* một lần để có bản đầu.

---

## 2026-09-12 — Đối chiếu sao kê, đăng ký nhiều khoá, mã SV, hộp hướng dẫn cài

- **📋 Đối chiếu sao kê** (Sinh viên): `skDoc()` mỗi dòng bắt `HP <mã SV> [viết tắt lớp]` + `skTien()` (bỏ đoạn HP…, ngày, giờ; ưu tiên số có
  dấu nghìn hoặc +/-; số trần 5–8 chữ số là dự phòng; ≥ 9 chữ số bỏ — bẫy lần 1: mã SV 8 số bị nhận nhầm là tiền). Khớp với mọi ghi danh
  chưa đóng (lớp có thu); viết tắt lớp chỉ nhận khi trùng `skVietTat` của lớp thật (bẫy lần 2: tên người sau mã SV bị coi là viết tắt).
  Trạng thái khop/lech/khong_tien/nhieu_lop(select)/da_dong/khong_thay/trung; Duyệt = update enrollments hàng loạt, ghi chú "Sao kê …".
- **Đăng ký nhiều khoá**: form tick nhiều; worker nhận mảng, `khoa` = "A · B", `khoa_ds` jsonb (v27c); duyệt tick nhiều lớp → gọi
  `/api/tao-tai-khoan` lần lượt (lớp sau: email đã có → chỉ ghi danh). **Mã SV** trên form (v27b, bắt buộc) → điền sẵn khi duyệt →
  **mật khẩu khởi tạo = mã SV** (≥ 6 ký tự; worker `la_mssv`). Worker thử 3 dạng payload để chạy được dù chưa chạy v27b/v27c.
- Bẫy hàng chờ: `loadRoster` dừng sớm khi lớp đang chọn không có SV → hàng chờ không nạp; đã đưa `loadChoDangKy(); loadChoDuyet();` lên đầu.
- Trang công khai: *Cách cài từng bước* mở hộp `#hdBox` với `img/huong-dan-app.jpg` (infographic 1.5×, JPEG 450 KB, tải lười), nút tải
  Win/Mac trên thanh, Esc/backdrop đóng, `#huong-dan` mở sẵn. Trang chủ SV: tổng quan cả tài khoản (mục riêng bên dưới).

---

## 2026-09-12 — Trang chủ = tổng quan cả tài khoản (m sửa lại thứ tự)

M: "Trang chủ ở đầu, khoá học thứ 2… trang chủ báo số khoá đăng ký, xem video ở khoá nào, bài khoá nào vừa đăng". Đảo thanh trái
(Trang chủ → Khoá học → …), bỏ ép mở mục Khoá học khi vào app. `renderHome` viết lại thành tổng quan MỌI khoá: lời chào "Bạn đang học
N khoá · X bài mới · Y phiếu chưa xong"; thông báo từng lớp (ghi tên lớp); thẻ học phí; hạn nộp mọi khoá; hero *Tiếp tục học* = bài đang dở
gần nhất ở bất kỳ khoá nào (ghi tên khoá); thẻ *Bạn đang học N khoá* (dòng mỗi khoá: buổi · tài liệu · % · nhãn mới/học phí/tạm đóng,
bấm là vào khoá); 3 ô nhanh (Bài tập / Bài giảng / Khoá học); **Vừa đăng** 5 bài mới nhất mọi khoá ("1 giờ trước"); *Lịch sắp tới* mọi khoá;
*Bài tập cần làm* mọi khoá; *Mục tiêu tuần* mọi khoá. Dữ liệu: `tatCaBuoi` (sessions + materials mọi lớp, từ `taiTomTatKhoa`) + `views`
giờ nạp cho mọi lớp (bỏ lọc class_id). Bấm bài ở khoá khác: `nutMo` gắn `data-lop` → `moTrongKhoa()` chuyển khoá, `moSau` mở sau khi
`loadSessions` xong (đã thử: từ Hữu cơ bấm Tiếp tục học → sang Phân tích, viewer mở đúng video). `capNhatTenLop` không đè lời chào
khi đang ở trang chủ.

**Bẫy (lại):** viết nhật ký bằng `node -e "…"` trong Bash → backtick trong chuỗi bị bash coi là lệnh → mục bị khoét rỗng; phải sửa lại
bằng script ghi qua Write. Đúng quy tắc cũ: nội dung có backtick/`$` → Write file rồi `node file`.

---

## 2026-09-12 — Mục "Khoá học": mọi khoá của một tài khoản ở một chỗ

M: "một tài khoản nhiều khoá học được đó, giao diện sau khi vào app có thể hiện nhiều khoá cùng 1 chỗ". Trang học thêm mục **Khoá học**
(đầu thanh trái, huy hiệu = số khoá) — `#viewKhoa`, thẻ mỗi lớp: tên/môn, pill (học phí còn N ngày / đã đóng / tạm đóng / N mới / đang chọn),
số buổi · tài liệu · đã xong + thanh %, buổi sắp tới (starts_at gần nhất) hoặc buổi đang ghim, thông báo lớp, nút *Vào lớp* (khoá bị
khoá học phí → nút *Đóng học phí* mở thẳng màn học phí lớp đó). `taiTomTatKhoa()` lấy sessions+materials+view_events của MỌI lớp một lượt
(RLS lọc) rồi gom theo class_id. Vào app có ≥ 2 khoá và chưa chọn lớp trong phiên (`sessionStorage hoc-lop-chon`) → mở mục này trước;
1 khoá → vào thẳng như cũ. Thanh chọn lớp ẩn khi ở mục Khoá học. Bẫy: đổi `view` bằng gán biến không bật section → tách `hienSection(v)`
gọi ở cả goView lẫn renderView. Thử `?lop2=1&hp=…`: mở đúng mục, Vào lớp c2, quay lại, thẻ khoá bị khoá → màn học phí.

---

## 2026-09-12 — Luồng vận hành (v27): đăng ký từ trang công khai, sao chép buổi, app 1.0.17

M chọn: duyệt tay từng người; mật khẩu tạm hiện cho m gửi Zalo (không email — gói free giới hạn thư); phát hành app 1.0.17 luôn.

- **SQL v27** `schema_v27_dang_ky_nhan_ban.sql`: bảng `dang_ky` (RLS chỉ staff, anon KHÔNG insert — đi qua Worker), unique index
  (email, khoa) khi `cho`; `nhan_ban_buoi(p_session, p_class)` security definer: sessions nháp (published=false, bỏ held_on/starts_at/pinned),
  materials (bỏ han_nop), material_contents copy nguyên (cùng storage_path — st_read khớp theo path nên tệp dùng chung được);
  `st_read` thêm deleted_at + `hoc_phi_ok` cho trọn v26.
- **Worker** `/api/dang-ky` công khai (trước `nguoiGoi`): bẫy ô `web`, 5 đơn/IP/giờ (Map trong isolate), kiểm tên/email/SĐT/khoá, insert
  bằng khoá quản trị, 409 → `da_gui`, bảng vắng → `chua_mo_dang_ky`. Trạng thái `v27_dang_ky`.
- **Trang công khai**: mục `#dang-ky` (form 2 cột + 3 bước), menu thêm Đăng ký, select khoá lấy từ `khoa_hoc` (bỏ đã kết thúc) +
  "Khác / chưa rõ"; nút *Đăng ký* trên thẻ khoá chọn sẵn khoá; `API_BASE` cho localhost trỏ giangduonghoahoc.com. Chữ mới trong
  `chu-cong-khai.js` nhóm "Mục Đăng ký"; bỏ khoá `nut_dangky_zalo`.
- **Quản trị**: bảng *Đăng ký mới từ trang công khai* (`loadChoDangKy`, gọi cùng `loadRoster`), huy hiệu tab = học phí chờ + đăng ký chờ
  (`capNhatDuyetN`); *Duyệt* → hộp chọn lớp (`lopKhop` theo tên khoá) + tên + mã SV → `/api/tao-tai-khoan` → cập nhật `dang_ky` → hộp
  tin nhắn soạn sẵn + *Chép* + *Mở Zalo*; *Từ chối* có ghi chú. Nút **⧉ Sang lớp…** ở mỗi buổi → `cloneSession` → rpc → toast *Mở lớp đó*.
- **Stub**: `dang_ky` 2 đơn (`?dk=0` vắng bảng), lớp c2, `nhan_ban_buoi` giả, `/api/tao-tai-khoan` trả đúng dạng `ket_qua`.
  Thử: duyệt dk1 → hộp Zalo có tin + link zalo.me; từ chối dk2; sao chép buổi 5 sang c2 → 1 buổi nháp 4 tài liệu; form công khai
  kiểm lỗi tại chỗ (gửi thật đụng Worker chưa deploy → `chua_dang_nhap`, đúng như dự đoán).
- **App 1.0.17**: bump version, tag `v1.0.17` → CI dựng, đưa lên R2; app trỏ `giangduonghoahoc.com/hoc`.

**M phải làm:** chạy `schema_v27_dang_ky_nhan_ban.sql`; khi CI xong kiểm `latest.yml` trên R2 = 1.0.17.

---

## 2026-09-12 — Infographic số 2: Tải & dùng app

M tạm gác chứng chỉ ký số, cần ảnh hướng dẫn tải + dùng app, **không nói bảo mật**, có cách bấm qua hộp Windows/macOS.
`pr/infographic-huong-dan-app.html` → `.png` 2160×2700 (cùng công thức Chrome headless như infographic 1). Bố cục 4 bước: 1 địa chỉ
+ 2 nút tải · 2 cài — hai cột Windows/macOS, mỗi cột 3 bước + **hộp thoại mô phỏng** (SmartScreen với More info / Run anyway,
menu chuột phải Mac với Open) tô vòng cam `.nhan-o` ngay trên phần tử (đặt vòng tròn tuyệt đối thì lệch — bẫy lần 1) ·
3 đăng nhập lần đầu (+ quên mật khẩu) · 4 sáu thẻ việc học · dải Zalo. Chỉ nói cách bấm, không nói lý do; không có khoá máy,
dấu chìm, chống chụp. Ô Zalo ghi "số Zalo ở trang giangduonghoahoc.com" — m đưa số là t in thẳng.

---

## 2026-09-12 — Học phí: QR chuyển khoản, nợ 2 tuần, khoá theo từng khoá (v26)

M yêu cầu: đặt học phí VND + QR nhận tiền ở quản trị; tài khoản cấp xong có 2 tuần để chuyển; quá hạn thì giao diện học tạm khoá,
chỉ hiện QR; đóng xong dùng lại; một SV có thể học 2–3 khoá → "thiết kế cho thông minh".

**Thiết kế:** học phí theo LỚP (`classes.hoc_phi`, `han_ngay`, `hoc_phi_tu`), trạng thái theo GHI DANH (`enrollments.han_dong, da_dong_at,
so_tien, mien, bao_chuyen_at`). Hàm `han_hoc_phi` = coalesce(han_dong, greatest(joined_at, hoc_phi_tu) + han_ngay); `trang_thai_hoc_phi` →
mien | da_dong | chua_han | qua_han; `hoc_phi_ok(class)` gắn vào s_read / m_read / mc_read / duoc_xem_tai_lieu → quá hạn là máy chủ
không trả buổi/tài liệu/nội dung của KHOÁ ĐÓ (khoá khác không ảnh hưởng, GV miễn). Worker: `streamToken` gọi `trang_thai_hoc_phi`
bằng khoá quản trị → `hoc_phi` 403. Ngân hàng ở `cau_hinh_he_thong.ngan_hang` (chỉ qua `luu_ngan_hang`/`doc_ngan_hang` staff;
`hoc_phi_cua_toi()` trả cho SV bản không có ảnh, `anh_qr_hoc_phi()` trả ảnh riêng). `bao_da_chuyen(p_class)` cho SV.

**QR:** VietQR `https://img.vietqr.io/image/<BIN>-<STK>-compact2.png?amount=&addInfo=&accountName=` — số tiền + nội dung
`HP <mã SV> <chữ cái đầu tên lớp>` (≤ 25 ký tự, không dấu, tính ở client cả hai trang) có sẵn trong mã; thử trong pane thấy ảnh
thật hiện đúng. Dự phòng: ảnh QR tự tải (data URL ≤ 480 px) khi không dùng VietQR. 27 ngân hàng với BIN Napas trong `NGAN_HANG`.

**Trang học:** `taiHocPhi()` trước `loadClasses()`; view mới `hocphi` (`#viewHocPhi`), `renderView` gác: `bKhoaHP(curClass)` →
ép về hocphi; thẻ lớp bị khoá thêm class `khoa` (🔒); `hpNhac()` dải nhắc trên trang chủ khi còn hạn; màn học phí: QR, số tiền, dl,
nút Chép, Tôi đã chuyển (rpc), Kiểm tra lại, Nhắn Zalo (đọc `trang_cong_khai.lien_he`), Về trang chủ (khi chỉ xem); khoá thì poll
60 s, mở lại → toast + về trang chủ. Đổi sang lớp không khoá khi đang ở màn học phí → về home (bẫy gặp khi thử).

**Quản trị:** hộp thoại lớp thêm Học phí + Được nợ (đổi mức → `hoc_phi_tu = now()`; lưu xong chưa có ngân hàng → toast có nút
💳 Đặt ngay); nút **💳 Nhận học phí** (select 27 NH, STK, tên không dấu tự hoa, mẫu VietQR đổi theo khi gõ, ảnh QR tự tải);
roster thêm cột Học phí (`oHocPhi`): pill trạng thái + nhãn "SV báo đã chuyển" + ✓ Đã nhận (prompt số tiền) / Gia hạn (prompt ngày) /
Miễn / Thu lại / Hoàn tác — cập nhật thẳng `enrollments` (policy e_staff); `hpTomTat` trên thanh. Cột thiếu (chưa v26) → tự lùi.

**Thử (stub):** SV `?hp=chua_han|qua_han|da_dong|bao` + `&lop2=1`; QT: u1 quá hạn + báo, u2 đã đóng, u3 còn hạn; ✓ Đã nhận / Gia hạn
/ hộp ngân hàng / hộp lớp đều chạy. ra-soat 0 lỗi.

**Đợt 2 (theo m — "giao diện nhỏ để ai ck trước cũng được", "duyệt", "cho t thêm số tiền"):**
- SV: thẻ **Học phí của bạn** ngay đầu trang chủ (dưới thông báo GV), một dòng mỗi khoá có thu: tên · số tiền · trạng thái (hạn/còn N ngày · đã báo chuyển · quá hạn · đã đóng) · nút **Chuyển khoản** — bấm cho khoá khác thì tự chuyển lớp rồi mở màn học phí (bẫy: đổi `view` mà không `goView` → section không hiện; sửa `loadSessions().then(goView)`). Bỏ dải nhắc cũ vì trùng.
- QT: nút **💰 Học phí lớp này** (số tiền + ngày nợ, cùng luật `hoc_phi_tu`); hộp **xác nhận đã nhận** thay prompt: số tiền (mặc định = học phí lớp), hình thức (QR / chuyển ngoài hệ thống / tiền mặt / khác), ghi chú → `ghi_chu_hp`, hiện dưới pill; bảng **Chờ duyệt** đầu tab Sinh viên gom MỌI lớp (`bao_chuyen_at not null, da_dong_at null`) với ✓ Duyệt / Chưa thấy, huy hiệu số trên nút tab.
- Stub QT: enrollments join thêm `classes`.

**M phải làm:** chạy `schema_v26_hoc_phi.sql`; 💳 đặt ngân hàng; 💰 đặt học phí cho lớp thật; thử bằng tài khoản SV trong app.

---

## 2026-09-11 (khuya) — Tách trang công khai / học chỉ trong app (v25)

M chốt kiến trúc mới: `giangduonghoahoc.com/` là **trang công khai** (giới thiệu khoá học, cách học, hỏi đáp nhanh, Zalo,
tải app); **toàn bộ việc học chỉ trong app**. Hỏi 3 câu, m chọn: chấp nhận mất đường học bằng điện thoại; t soạn nháp nội
dung; nội dung sửa được trong Quản trị.

Làm:
- `web/index.html` (trang học) → `git mv` thành **`web/hoc.html`**; `BAT_BUOC_APP = 'tat_ca'`. Thêm màn `#appOnly` ("Lớp học
  mở trong ứng dụng" + 2 nút tải) thay cho alert; kiểm "trong app?" **trước** `xinThietBi()` để SV thử trình duyệt không bị
  gắn nhầm máy vào trình duyệt. Link khôi phục mật khẩu (`type=recovery` trong hash) → `hienKhoiPhuc()`: chỉ ô đặt mật khẩu
  mới, không `enter()`, không gắn máy, xong `khoiPhucXong()` đăng xuất lặng (`khongReload`). Sửa luôn lỗi cũ: link quên mật
  khẩu của SV đã gắn app trước đây vấp `other_device` ngay khi mở bằng trình duyệt.
- `web/index.html` **mới** = trang công khai: palette logo (ink/sea/flask), Be Vietnam Pro + Lora nghiêng cho khẩu hiệu, hero
  2 cột + 2 nút tải R2 + link tai-app, 6 thẻ "được gì", khoá học / cách học / hỏi đáp / liên hệ nạp từ bảng
  `trang_cong_khai` qua REST anon (fetch, không cần SDK); có bản mẫu `MAU` trong mã nên chưa chạy SQL hay mất mạng vẫn đủ trang.
- `schema_v25_trang_cong_khai.sql`: bảng `trang_cong_khai(khoa pk, noi_dung jsonb, updated_at)`, RLS đọc `true`, sửa `is_staff()`,
  grant anon select; seed 5 khoá (gioi_thieu, khoa_hoc, cach_dung, hoi_dap, lien_he) `on conflict do nothing`. Zalo để trống.
- `web/quan-tri.html`: tab **Trang công khai** (`paneWeb`): `veTck/docTck/loadWeb/luuWeb`, dòng thêm/xoá, upsert theo `khoa`,
  toast "Đã đăng" có nút Mở trang; chưa có bảng → nhắc đúng tên tệp SQL.
- `worker.js`: `/` hoặc `/index.html` với UA `LopHocApp/` → trả `/hoc` (app ≤ 1.0.16 không phải cập nhật); `v25_trang_cong_khai`.
- `app/main.js`: `SITE_URL` → `/hoc` (bản sau). Link "Trang học" ở quản trị / shim sổ / so-bai-tap / tai-app → `hoc.html`.
  `manifest.json` start_url `./hoc`; `_headers` no-cache `/hoc`. PR infographic bỏ câu "mở bằng trình duyệt".
- Test: `tao-ban-thu.js` đọc `hoc.html`, ghi `_test_hoc.html`, tự giả lập app (`window.lopHocApp.getMachineId`), `?web=1` xem
  màn cần app; `#access_token=x&type=recovery` xem luồng khôi phục. Stub quản trị: bảng `trang_cong_khai` + `?tck=0` giả vắng
  bảng. `ra-soat.js` kiểm cả `hoc.html`. `may-chu.js` mở `_test_hoc.html`.
- Đã chạy thử 3 luồng trong pane (đo DOM): màn cần app, vào lớp trong "app", khôi phục mật khẩu; tab quản trị thêm/xoá/lưu/tải lại.
- Sổ tay `HUONG_DAN.md`: mục Trên điện thoại viết lại, bảng BAT_BUOC_APP (đang `tat_ca` + vì sao + 3 việc mã đã lo), bảng
  web/app, **bảng 4 địa chỉ**, mục mới "Trang công khai — sửa nội dung ở đâu".

**Bẫy lớn:** deploy xong, `/` với UA `LopHocApp/` vẫn ra trang công khai — vì Cloudflare trả **tệp tĩnh trước khi chạy Worker** (mặc định `run_worker_first: false`): yêu cầu khớp tệp trong `web/` không bao giờ tới `worker.js`, chỉ `/api/*` mới tới. Sửa: `wrangler.jsonc` → `assets.run_worker_first: true` (`4ab96a0`); Worker vẫn gọi `env.ASSETS.fetch` nên `_headers` và chuyển hướng `.html → sạch` giữ nguyên (đã kiểm: `/hoc` no-cache, `/hoc.html` 307). Kiểm từ ngoài sau đó: `/` UA app → trang học (cả workers.dev), UA thường → trang công khai, `/quan-tri` có tab, `/so-bai-tap` 200.

**Bẫy gặp:** heredoc Bash nuốt `\\n` thành `\n` trong script vá → anchor có `\n\n` literal không khớp; chuyển sang Write.
Screenshot pane ẩn hay timeout/zoom lạ → đo DOM bằng javascript_tool (grid columns, chiều cao thẻ, scrollWidth).

**Đổi giọng (cùng tối, theo m):** "tốt thì phô ra, rào cản che lại" — bỏ khỏi trang công khai / trang tải / màn cần app / dòng chữ nhỏ màn đăng nhập / infographic mọi câu về 1 tài khoản 1 máy, chưa ký số, chống chụp/quay, dấu chìm; SmartScreen chỉ nói cách bấm. Hỏi đáp nhanh thay bằng 4 câu tích cực (học trên máy nào, xem lại được không, hỏi ở đâu, quên mật khẩu). M đã chạy v25 với seed cũ → thêm `schema_v25b_giong_trang.sql` thay 2 mảnh cach_dung/hoi_dap khi còn chữ cũ. Quy tắc ghi vào sổ tay + memory `giong-trang-cong-khai`.

**QR Zalo (theo m):** tab Trang công khai có ô *Ảnh QR Zalo* — chọn tệp → canvas thu về ≤ 480 px → PNG (quá 150 KB thì JPEG) → data URL cất trong `lien_he.qr_anh` (không cần bucket, không cần SQL). Trang công khai chỉ nhận data URL ảnh (regex), hiện 168 px cạnh số Zalo (`.card.zalo.coqr` 2 cột; ≤ 520 px QR lên trước). Đã thử trong pane: 900 px → 480 px / 8 KB, giữ qua lưu + tải lại, Bỏ ảnh; bản thử landing 1280 và 400 px không tràn. v25b m đã chạy (máy chủ hết chữ cũ).

**Zalo từng khoá + giấu trang quản trị (theo m):** thẻ khoá học có `zalo` (link nhóm lớp, chỉ nhận http(s)) + `zalo_nhan`; `nutKhoa()`: có link → nút chính vào nhóm + nút phụ Nhắn giảng viên; không → Đăng ký qua Zalo (số ở Liên hệ); kết thúc → không nút. Bỏ link "Giảng viên" ở chân trang công khai ("trang quản trị phải tuyệt mật, không được lộ link"); `quan-tri.html` thêm meta robots noindex, `_headers` thêm `X-Robots-Tag: noindex` cho /quan-tri và /so-bai-tap; `robots.txt` chỉ Allow / (không liệt kê đường quản trị vì liệt kê = lộ). Thử 4 trường hợp thẻ + tab quản trị lưu/tải lại.

**Chữ cố định sửa được (theo m: "1 số chữ hơi thô"):** danh mục 46 chuỗi ở `web/chu-cong-khai.js` ([khoá, nhãn, mặc định], dùng chung cho cả trang công khai lẫn quản trị); trang công khai gắn `data-chu` lên phần tử tĩnh + `T(k)` trong các hàm vẽ, `apChu()` áp trước khi vẽ; menu dùng chung chữ với nhãn mục. Quản trị: khối `<details>` "Chữ trên trang" gập sẵn, placeholder = mặc định, ô trống = mặc định, "-" = bỏ trống (bỏ nội dung ghi chú là ẩn cả ghi chú); khi lưu chỉ giữ ô có chữ → `chu`. Tiện tay đổi vài mặc định: "Học ở đây, bạn có gì", "Bốn bước để bắt đầu", "Hỏi bài, có lời giải đáp". Thử: ghi đè menu/nhãn/thẻ/pill, ẩn ghi chú, lưu + tải lại ở quản trị.

**M phải làm:** vào Quản trị → Trang công khai điền số Zalo + chọn ảnh QR (+ sửa khoá học cho đúng);
thử `/hoc` bằng trình duyệt với tài khoản SV → phải thấy màn "mở trong ứng dụng"; mở app 1.0.16 → vẫn vào lớp như cũ.

---

## 2026-09-11 (tối) — Tên miền giangduonghoahoc.com đã gắn

M mua `giangduonghoahoc.com` trên Cloudflare Registrar (đường 1A), gắn Custom Domain **tên gốc** (không `hoc.`)
vào Worker. `https://giangduonghoahoc.com/` ra trang đăng nhập, `/api/trang-thai` ok. workers.dev vẫn chạy song song.

**Nhầm chỗ khi đặt biến:** m thêm `TEN_MIEN` vào mục *Build → Variables and secrets* (chỉ có nút Save, không có
Deploy) — đó là biến lúc build, Worker chạy thật không thấy. Chỗ đúng là *Settings → Variables and Secrets* ở
phần trên (cạnh Bindings). Để khỏi mò menu, đưa luôn vào `wrangler.jsonc` → `"vars": { "TEN_MIEN": "giangduonghoahoc.com" }`;
`keep_vars: true` vẫn giữ các secret đặt tay.

Đổi mã một lượt:
- `worker.js`: `ORIGINS` thêm `https://giangduonghoahoc.com` + `www.`; `nguonStream()` lấy host của mọi ORIGINS https
  + `TEN_MIEN`; endpoint mới `POST /api/stream/khoa-lai` — khoá lại MỌI video (per_page=200) cho đủ địa chỉ.
- `web/quan-tri.html`: nút **🔒 Khoá lại video** ở thanh Kho tệp (cạnh Sao lưu) gọi endpoint trên, toast kết quả.
- `web/index.html`: `APP_URL` → `https://giangduonghoahoc.com/tai-app` (URL sạch, khỏi 307).
- `app/main.js`: `SITE_URL` → tên miền riêng, **cho bản app sau**; ghi rõ phải bấm 🔒 Khoá lại video trước khi phát hành.
- `HUONG_DAN.md`, `HUONG_DAN_VIDEO.md`, `pr/infographic-gioi-thieu.html` (pr/ vẫn chưa commit): địa chỉ mới.

M đã làm xong: Supabase Site URL `https://giangduonghoahoc.com` + Redirect URLs 2 dòng (`/**` cho cả hai địa chỉ —
lần đầu m dán nhầm `/**` vào ô Site URL, lần hai gõ nhầm thành `giangduonghoahoc.com/workers.dev/`, đã sửa);
bấm 🔒 Khoá lại video → "1 video cho: giangduonghoahoc.com, workers.dev, www., *.". Kiểm CORS từ ngoài: 3 origin
hợp lệ được echo, origin lạ rơi về workers.dev. `www.` chưa gắn Custom Domain (000) — tuỳ chọn.

**Bẫy còn lại (ghi ở Bước 6b hướng dẫn):** mã máy trên trình duyệt là localStorage theo origin → SV gắn máy bằng
trình duyệt ở workers.dev mở địa chỉ mới bị "gắn với máy khác"; app không sao. GV bấm Gỡ ở tab Sinh viên.

---
## 2026-09-11 (chiều) — Hướng dẫn tên miền từng bước + khoá video cho cả hai địa chỉ

`HUONG_DAN_TEN_MIEN.md` viết lại thành 7 bước bấm-từng-nút (mua ở Cloudflare hay nhà đăng ký VN, đưa vào
Cloudflare, Custom Domain cho Worker, biến `TEN_MIEN`, Supabase URL Configuration, vòng thử bằng tài khoản SV,
danh sách chỗ trong mã Claude sẽ đổi khi có tên). Đã tra tài liệu Cloudflare: `wrangler.jsonc` không khai
`routes` nên tên miền gắn tay **không bị xoá** khi GitHub phát lại; `keep_vars: true` giữ biến.

**Bẫy tìm ra khi rà:** ba chỗ khoá video Stream (`streamChon`, `streamTaiLen`, `streamTaiLenLon`) đặt
`allowedOrigins: [host của request]`. Nếu tải video ở trang quản trị **địa chỉ mới**, video chỉ phát được ở
địa chỉ mới → app (đang trỏ workers.dev) không xem được. Sửa: `nguonStream(request)` trả host đang gọi +
workers.dev + `TEN_MIEN` + `*.TEN_MIEN`; chưa đặt biến thì danh sách y hệt cũ (một host) nên không đổi gì
hành vi hiện tại. Video tải lên trước khi có biến vẫn khoá riêng workers.dev — khi nào app đổi địa chỉ mới
cần nút khoá lại hàng loạt (ghi ở Bước 7 của hướng dẫn).

---
## 2026-09-11 — Thùng rác, bộ gõ công thức cho sinh viên, chuẩn bị tên miền riêng (v24)

**M chọn ba việc:** 1 (hoàn tác khi lỡ xoá) · 4 (bộ gõ công thức) · 5 (tên miền riêng).

### Trước đó: dọn hai nhật ký bị chèn rác

Cách ghi nhật ký `h.replace(moc, moi)` dính bẫy: chuỗi thay thế có `$`+backtick (mấy mục nói về "dấu $")
bị JS hiểu là mẫu "phần trước chỗ khớp" → chèn cả đầu tệp vào giữa câu. Nhật ký web có khối trạng thái
nhân bản **8 lần** (1374 → 1173 dòng), nhật ký Sổ có **25 chỗ** chèn (2952 → 2752). Đã dựng lại sạch,
viết khối "Trạng thái hiện tại" mới đúng ngày. Từ nay ghép chuỗi tay hoặc `replace(moc, function(){…})`.

### 1. Thùng rác — `schema_v24_thung_rac_bo_go.sql` (phần A)

Trước v24 *Xoá buổi* là `delete` thẳng, cascade: mất luôn tài liệu, bài nộp, câu hỏi, lượt xem. Giờ:

- Cột `deleted_at` trên `sessions` và `materials`. Xoá = `update deleted_at = now()`.
- **Luật đọc** `s_read` / `m_read` / `mc_read` và `duoc_xem_tai_lieu()` thêm `deleted_at is null` — sinh viên hết thấy ở tầng máy chủ, và cũng không nộp bài / hỏi bài vào thứ đã xoá được.
- Ba bảng tổng hợp `bang_bai_nop` / `bang_cau_hoi` / `thong_ke_o` dựng lại, bỏ qua thứ trong thùng rác (khôi phục là hiện lại).
- `don_thung_rac()` dọn thật những gì quá 30 ngày; trang quản trị gọi nền mỗi lần tải lớp.

Trang quản trị: `toast(t, nhãn, hàm)` có nút **Hoàn tác**; `delSession` / `delMaterial` xoá mềm; nút **🗑 Thùng rác (N)**
trên thanh *Buổi học* mở hộp liệt kê + Khôi phục / Xoá hẳn. Máy chủ chưa chạy v24 thì tự rơi về xoá thẳng, có báo trong hộp thoại.
Các tab Theo dõi / Hồ sơ lọc thứ đã xoá qua `boThungRac()`.

### 4. Bộ gõ công thức + máy chấm hiểu ký hiệu khoa học (phần B của v24)

- Trang học: bấm vào ô `.otl` → thanh `.bogo` nổi trên ô với 17 ký hiệu + 4 cụm; `mousedown` chặn mặc định nên ô không mất tiêu điểm.
  **Chế độ số mũ**: sau `×10` / `⁻` / `⁺` / `xⁿ`, chữ số gõ tiếp thành `⁰…⁹` cho tới khi gõ ký tự khác.
- Máy chủ: `chuan_dap()` dịch thêm `⁻ ⁺ − × · ⋅`; `so_khoa_hoc()` đọc `a×10^b`, `a×10^(b)`, `ae-b`, `10^-b`, cả `a×10-b` (dấu mũ rơi);
  `cham_mot_o()` so bằng số với dung sai **0,5 % tương đối** (hoặc sai số giảng viên đặt, lấy cái lớn hơn), 2 % là "gần".
- Bản giả trong `test/tao-ban-thu.js` theo đúng luật; chạy trong Node 10/10 ca: 7 kiểu viết của `1,74×10⁻⁵` đều **đúng**, `1,7×10⁻⁵` **gần**, `2×10⁻⁵` **sai**.
  Cuối file SQL có `select` tự kiểm — m chạy SQL xong nhìn năm cột `a_dung … e_dung` là biết máy chủ chấm đúng.

### 5. Tên miền riêng — phần mã xong, phần còn lại của m

- `worker.js`: biến `TEN_MIEN` (đặt trên Cloudflare) → chấp nhận tên miền đó và mọi tên con; `/api/trang-thai` báo `ten_mien_rieng`.
- `HUONG_DAN_TEN_MIEN.md`: sáu bước — mua tên miền, trỏ nameserver, gắn vào Worker, đặt biến, khai với Supabase, đổi chỗ sinh viên nhìn thấy.
- **Không cần phát hành app mới**: `workers.dev` vẫn chạy song song.

### Bẫy khi test

- Pane trình duyệt ở nền → `document.hasFocus()` = false → `el.focus()` **không bắn** `focusin`; phải `dispatchEvent(new FocusEvent('focusin'))` để thử đường xử lý. Tab nền còn bóp `setTimeout` — vòng lặp 7 lần × 0,9 s treo quá 45 s. Chuyển sang chạy bộ chấm giả trong Node.
- `confirm()` trong pane ẩn trả về false → nộp bài bị chặn khi còn ô trống; phải điền đủ.
- Stub trong `tao-ban-thu.js` nằm trong template literal → regex phải viết `\\` (đã dính lần nữa).

**Đã chạy** `schema_v24_thung_rac_bo_go.sql` (11/9): `/api/trang-thai` báo `v24_thung_rac_bo_go: true`; gọi thẳng `rpc/cham_mot_o` bằng khoá publishable đủ 10/10 phép (dung/gan/sai đúng như bộ thử Node).
Tên miền thì theo `HUONG_DAN_TEN_MIEN.md` khi nào m có tên miền.

---

## 2026-09-19 — Tên dạng bài có ngay lúc mở sổ; PDF không còn rơi xuống hộp thoại in (đợt 84–85)

M: *"vẫn không hiện tên dạng bài… giãn dòng để bé thôi, hoặc cho t tự chỉnh"*. Dựng lại đúng cảnh trên bản web:

1. **Cây kho không được nạp lúc mở sổ** (chỉ nạp khi mở Kho) → mở sổ in thẳng là không có tiêu đề dạng.
   Giờ `loadTree()` ngay lúc khởi động, cây về thì dựng lại phiếu nếu đang thiếu tiêu đề.
2. **html2canvas 1.4.1 không đọc được `color()`** mà Chrome sinh ra từ `color-mix()` trong CSS tiêu đề dạng /
   "Phần N" → từ đợt 65, phiếu có tiêu đề dạng là **dựng PDF thất bại**, app lùi về hộp thoại in của trình duyệt
   (đó là nguồn của header/footer đợt 82 và dòng kẻ "sai" đợt 83). Thay bằng `rgba(var(--primary-rgb), a)`.
3. Bỏ hẳn nới khoảng cách để lấp trang; ô *Dòng kẻ làm bài (mm)* mặc định 8,5, chỉnh 5–25.

Đợt 84 (cùng lần đẩy): đọc `word/numbering.xml` khi nhập .docx → danh sách a. b. c. / i. ii. / (1) ra đúng nhãn,
không còn "1. a.".

Đo trên localhost (bản web, không mở Kho): 2 tiêu đề dạng có ngay, dòng kẻ 8,50 mm, html2canvas chạy 4 lượt không
lỗi, *Đã tải file PDF về máy*. `thu_cong_thuc` 77/77.

- `web/so-bai-tap.html` dựng lại ở **đợt 85**.

---

---

## 2026-09-18 (khuya) — Tiêu đề dạng bài không rơi khi sang trang; dòng kẻ 1,5 cm (đợt 83)

M báo bản in mất dạng bài và dòng kẻ quá cao. Dạng bài không bị xoá — PDF cắt trang **từ mép trên
của câu đầu trang**, nên tiêu đề dạng đứng ngay trước câu đó rơi ra ngoài lát cắt (trang 1 không sao).
Sửa `measureProblems()` để tiêu đề đi cùng câu.

Dòng kẻ: app tự kéo giãn tới 1,75 cm để lấp trang. Giờ là ô **"Dòng kẻ làm bài (mm)"** trong
*Khổ giấy / lề / cỡ chữ*, mặc định 15, **cố định** — không giãn nữa.

- `web/so-bai-tap.html` dựng lại ở **đợt 83**.

---

---

## 2026-09-18 (tối) — In ra không còn header/footer của trình duyệt (đợt 82)

M báo PDF xuất ra có ngày giờ / tên trang / URL / số trang ở mép giấy. Đó là **hàng chữ trình duyệt
tự chèn khi in**, xuất hiện khi đi qua hộp thoại in (`printFallback` hoặc Ctrl+P).

Sửa: `@page { margin: 0 }` (Chrome/Edge bỏ hàng chữ đó khi lề = 0), lề thật do `.sheet` lo bằng
`padding: var(--paper-margin)`; và lưu file thất bại thì **mở PDF đã dựng ở tab mới** thay vì quay về
hộp thoại in.

Kiểm trên bản web thật: quyền `downloads` có, jsPDF + html2canvas tải được từ cdnjs.

- `web/so-bai-tap.html` dựng lại ở **đợt 82**.

---

---

## 2026-09-18 (chiều) — Ô Sửa hiện mã công thức (đợt 81)

M báo *"sửa thủ công … nhưng k save được"*. Dựng lại lỗi thì thấy nút Lưu **có** chạy —
lỗi là **thiết kế của t từ đợt 70**: mã LaTeX là bản gốc, nhưng ô Sửa nạp **cấu trúc đã dựng**
(có cả ký tự ẩn trong `.can-kh`). Gõ vào giữa đó là chỉnh phần hiển thị, còn `data-tex` vẫn nguyên,
nên lưu xong nó dựng lại y như cũ — nhìn đúng như không lưu được.

Đã sửa: `texGoBoc()` gỡ về mã `$…$` khi mở ô Sửa; lúc lưu có dấu đô-la là luôn dựng lại
(kể cả khi tắt "tự hoá công thức"). Lời nhắc trong ô nói rõ điều này.

- `web/so-bai-tap.html` dựng lại ở **đợt 81**. Bộ thử **65/65 đạt** (thêm nhóm S: dựng rồi gỡ về mã).

---

## 2026-09-18 — Hết lòi dấu $ ra phiếu (đợt 80)

Lỗi t gây ra ở đợt 79: thêm `'pK'` vào bộ từ ngắt bước, mà `pK` đứng giữa công thức suốt ngày
(`pK_a = −log K_a`) → `autoBreakSteps` chèn `<br>` giữa cụm `$…$` → cắt đôi mã LaTeX →
hai dấu đô-la hiện nguyên trên phiếu.

Đã sửa: `autoBreakSteps` chừa nguyên phần trong `$…$` (cả luật từ mở đầu bước lẫn luật dấu hai chấm);
bỏ `'pK'` khỏi bộ từ, thay bằng luật hẹp "chỉ ngắt trước pK khi có chữ *của* theo sau".

**Đúng bẫy đã gặp ở đợt 74** — lần đó vá `donSoMu` mà quên `autoBreakSteps`.

- `web/so-bai-tap.html` dựng lại ở **đợt 80**. Bộ thử **62/62 đạt** (thêm nhóm R: không được lòi dấu đô-la).

---

## 2026-09-17 (khuya) — Equation của Word dịch thẳng sang LaTeX (đợt 79)

M chuyển sang nạp bằng `.docx` — thứ tự phân số đã đúng, nhưng bộ đọc OMML trả về **chữ phẳng**
(`([H+]^2)/Ca`) mà không ai dựng lại, nên phiếu vẫn hiện dấu mũ trần và không có phân số.

Giờ bộ đọc trả về **LaTeX** (`\frac{}{}`, `{e}^{}`, `{e}_{}`, `\sqrt{}`) và bọc cả cụm trong `$…$`,
để bộ dựng LaTeX (đợt 70) vẽ ra phân số / căn thức / số mũ thật. Cấu trúc nằm sẵn trong file Word
nên không phải đoán gì.

**Chốt với m: cứ dùng Equation của Word như đang làm, đừng gõ LaTeX tay.**

- `web/so-bai-tap.html` dựng lại ở **đợt 79**. Bộ thử **59/59 đạt** (thêm nhóm Q: cả đường từ OMML).

---

## 2026-09-17 (tối) — Chỉ số C_base/C_acid + xuống dòng sau dấu chấm dính liền (đợt 78)

Sửa được: `Cbase`/`Cacid` về `C_base`/`C_acid` (thêm base·acid·axit·bazo·dd·0 vào bộ tự hoá
công thức, vẫn chừa `Ca` là canxi), và ngắt dòng sau dấu chấm **dính liền** (`tốt.pH`) — vẫn chừa `v.v.`.

**Chưa sửa được:** phân số từ PDF vẫn đảo thứ tự khi **không có ngoặc** — `ngoacLech()` không bắt được ca này.
Đường chắc chắn đúng vẫn là **nạp bằng .docx** (bộ đọc OMML giữ nguyên cấu trúc, đã có phép thử).

- `web/so-bai-tap.html` dựng lại ở **đợt 78**. Bộ thử **56/56 đạt**.

---

---

## 2026-09-17 (chiều) — Bắt công thức bị đảo thứ tự khi bóc PDF (đợt 77)

M gửi ảnh: `K_a = [H⁺]²/C_a` bóc ra thành `]^2 K_a = [H+ Ca`. Phân số xếp tầng trong PDF
nằm ở ba tầng toạ độ; bộ đọc chữ xếp theo dòng ngang nên tử/mẫu bị cắt rời và ghép xen kẽ.
**Thứ tự mất từ đầu vào — không hàm nào dựng lại được.**

Đã làm: `ngoacLech()` bắt dấu đóng đứng trước dấu mở (chứng cứ chắc chắn của chữ đảo) và hiện
**⚠ công thức đảo thứ tự** trên thẻ trong bảng soát, để m sửa tay trước khi câu vào kho.

Và kiểm chứng được: bộ đọc **OMML của Word** (`ommlToText`) đọc `<m:f>` thành `(tử)/(mẫu)` theo
đúng cấu trúc → **nạp bằng .docx thì công thức không bao giờ bị đảo**. Có phép thử riêng cho việc này.

- `web/so-bai-tap.html` dựng lại ở **đợt 77**.
- Bộ thử lên **51 phép, 51/51 đạt**.

---

---

## 2026-09-17 — Dấu căn kéo theo số đo thật của phông (đợt 76)

M báo PDF bản GV căn vẫn hơi xấu. Đúng: `scaleY` 1,45 / 2,75 là con số chỉnh bằng mắt trên
**phông sans-serif** của thẻ trong kho, mà phiếu dùng **Times New Roman** — chữ `√` hai phông cao
thấp khác nhau nên nét không chạm gạch phủ.

Giờ `canDoChu()` đo nét mực chữ `√` bằng `canvas measureText` trong đúng phông + cỡ chữ, rồi
`canChinhCao()` tính hai biến CSS `--can-s` / `--can-ty` cho từng dấu căn. Đo lại ngay trước khi
chụp PDF. Kết quả trên phiếu thật: đỉnh nét ↔ gạch phủ lệch **0,00 px** ở cả ba cỡ căn (kể cả căn ôm phân số).

- `web/so-bai-tap.html` dựng lại ở **đợt 76** → nút *Giao cho lớp* xuất PDF có căn khít.
- `web/sheet.css` đổi khối `.can::before` theo cùng cách (bản web của phiếu không chạy JS đo,
  nên dùng giá trị mặc định — vẫn đúng dáng, chỉ không khít tuyệt đối).

---

---

## 2026-09-16 (khuya) — Chuẩn hoá cả loạt + ngắt dòng lời giải (đợt 75)

Hai việc m nêu: nút chuẩn hoá cho **cả loạt** (vốn đã có từ đợt 70 nhưng t nhét lẫn vào hàng chip
lọc nên không ai thấy — giờ tách thành hàng nút riêng, ghi rõ *N câu*), và **ngắt dòng lời giải**.

Về ngắt dòng: trước đây chỉ ngắt sau dấu **. ! ?** và trước một danh sách từ cố định; dấu hai chấm
chỉ tính khi bản gốc đã có xuống dòng — mà chữ bóc từ PDF dính liền một mạch. Giờ ngắt sau dấu ":"
(chừa `1:2`, `10:30`, `http://`) và thêm các từ mở đầu bước của Hoá phân tích.

Bộ thử `So_Bai_Tap_HUS/Tools/thu_cong_thuc.js` lên **46 phép, 46/46 đạt** — thêm nhóm ngắt dòng,
số mũ dương rời (`× 10 5`), và ca `donSoMu` không được thò tay vào trong `$…$`.

- `web/so-bai-tap.html` dựng lại ở **đợt 75**.

---

## 2026-09-16 (tối) — Rà lại toàn bộ đường bóc công thức (đợt 73)

M yêu cầu rà cả quy trình thay vì vá từng chỗ. Đã dựng bộ thử riêng
`So_Bai_Tap_HUS/Tools/thu_cong_thuc.js` — **38 phép thử**, rút mã thẳng từ `so_bai_tap.html`
rồi chạy trong trình duyệt. Nó tìm ra 4 lỗi thật, nặng nhất là **thứ tự sai**: dựng căn trước
rồi mới vá số mũ, nên `√3,89 ×10- 4 × 0,250` ra `√(3,89 × 10)- 4 × 0,250` — số mũ nằm
ngoài dấu căn, **sai hẳn về Toán**. Chi tiết ở `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md`.

- `web/so-bai-tap.html` dựng lại ở **đợt 73** → nút *Giao cho lớp* xuất PDF có công thức đúng.
- `web/sheet.css` không đổi.
- `web/_test_congthuc.html` là trang thử tại máy, đã nằm trong `.gitignore` (`web/_test_*`).

---

---

## 2026-09-16 (chiều) — Vá số mũ vỡ khi bóc PDF (đợt 71)

M báo chữ bóc bằng AI ra sai công thức: `K_a=10- 4,76`, `10⁻³,75`, `pH=- log [H⁺ ]`.
Đây là **chữ đã vỡ từ đầu vào**, không phải lỗi vẽ. Đợt 71 vá ở ba tầng: bộ dịch LaTeX lấy trọn
cụm sau `^`/`_` (trước chỉ lấy một ký tự), hàm `donSoMu()` vá chữ đã vỡ, và lời nhắc AI bắt số mũ
nằm trọn trong ngoặc nhọn. Nút ở kho đổi thành **∑ Chuẩn hoá** vì giờ vá số mũ trước rồi mới chốt LaTeX.

Dấu căn bỏ cách vẽ bằng gradient, dùng **chính ký tự √ của phông** kéo cao bằng `scaleY` — ở cỡ chữ
nhỏ nét gradient chỉ còn vài điểm ảnh nên trông như vết bẩn.

- `web/so-bai-tap.html` dựng lại ở **đợt 71**.
- `web/sheet.css` đổi khối `.can` theo cùng cách vẽ.

Chi tiết ở `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` (đợt 71).

---

---

## 2026-09-16 — Chốt công thức thành LaTeX ở kho bài (đợt 70)

**Đã chốt hướng đi:** **PDF vẫn là định dạng cho sinh viên** — không đổi sang Word, nên chuỗi bảo vệ
(trình xem, dấu chìm, quyền `cho_tai`, ô điền đáp án, máy chấm) giữ nguyên không đụng gì.

Thay vào đó, công thức được chốt thành **mã LaTeX ngay trong Kho bài tập** của Sổ: nạp PDF như cũ →
bấm *∑ Công thức → LaTeX* → soát bằng *⟨⟩ Xem mã* → pick bài ra phiếu thì PDF vẽ đúng cấu trúc,
vì đã biết chắc cái gì nằm dưới căn chứ không đoán từ chữ nữa. Chi tiết ở
`..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` (đợt 70).

- `web/so-bai-tap.html` dựng lại ở **đợt 70** → nút *Giao cho lớp* xuất PDF có công thức đúng.
- `web/sheet.css` không đổi.

---

---

## 2026-09-15 (khuya) — Sửa dáng căn thức (đợt 69)

M báo *"trông tởm quá"*: gạch phủ bị đẩy vọt lên chồng vào dòng trên, ở chỗ biểu thức có `10⁻⁵`.
Hai lỗi CSS: `<sup>/<sub>` làm phồng hộp dòng (thiếu `line-height: 0`), và `.can-duoi` để
`align-self: baseline` nên nét căn hở khỏi gạch phủ (phải là `stretch`).

- `web/so-bai-tap.html` dựng lại ở **đợt 69**.
- `web/sheet.css` sửa cùng hai chỗ đó.

Đang treo quyết định của m: có chuyển định dạng SV nhận từ **PDF sang Word** không.
Word vẽ công thức đẹp hơn hẳn, nhưng .docx **phá chuỗi bảo vệ** (sửa được, chép được, không dấu chìm,
không qua trình xem) — trái với yêu cầu "bảo lưu quy trình bảo mật" m đã chốt trước đó.

---

---

## 2026-09-15 (tối) — Căn thức: vá nốt phần không ngoặc, và dựng ở mọi màn hình

Đợt 67 mới lo được `√(…)` có ngoặc và chỉ dựng ở phiếu. M báo vẫn lỗi:
bài thật viết `√Kₐ × Ca` (không ngoặc), và màn hình m đang xem là **bảng soát khi nạp đề**, chưa được vá.

Đợt 68 (chi tiết ở `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md`): căn không ngoặc kéo hết **chuỗi nhân**
(dừng ở `=`, `+`, `−`…), và một **MutationObserver** dựng lại bất cứ khung nào vừa nhận chữ có `√` hay `)/(`.

- `web/so-bai-tap.html` dựng lại ở **đợt 68** → nút *Giao cho lớp* xuất PDF có căn đúng.
- `web/sheet.css` không đổi (CSS `.can/.ps` đã đủ từ đợt 67).

**Bẫy:** `requestAnimationFrame` không chạy khi tab ẩn (đúng bẫy pdf.js cũ) → dùng `setTimeout`,
không thì xuất PDF từ tab nền ra bản thiếu căn.

**M còn phải làm:** phiếu pH đã đẩy lên lớp là PDF cũ — mở Sổ và **Giao cho lớp** lại phiếu đó.

---

---

## 2026-09-15 (chiều) — Căn thức và phân số hiển thị chuẩn trong phiếu đẩy lên lớp

**M báo:** bài tính pH có căn bậc hai, đẩy lên lớp thì *"không hiển thị toàn bộ căn"* — chỉ có dấu √, không có gạch phủ.

Gốc rễ nằm ở Sổ Bài Tập (đợt 67, xem `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md`): Sổ dịch `\sqrt{x}` thành chữ `√(x)`,
"Giao cho lớp" xuất PDF bằng html2canvas chụp đúng phiếu đang hiện, nên PDF cũng chỉ có ký hiệu √.
Giờ Sổ bọc `√(…)` và `(a)/(b)` bằng thẻ để CSS vẽ căn thức thật (gạch phủ hết biểu thức, dấu căn cao bằng biểu thức)
và phân số hai tầng — vẫn là chữ, copy/tìm/Word không đổi.

Bên web:
- `web/so-bai-tap.html` dựng lại ở đợt 67 → nút **Giao cho lớp** từ nay xuất PDF có căn đúng.
- `web/sheet.css` mang cùng CSS `.can / .ps`, để phiếu HTML (đường `<!--sbt-sheet-->`) đọc trên trang học cũng giống hệt.

Đã kiểm bằng html2canvas ngay trong trang: dấu căn, gạch phủ, gạch phân số đều có trong ảnh chụp.
**Lưu ý:** SVG nền và `calc()` trong gradient thì html2canvas KHÔNG vẽ (căn biến mất / thành khối đen) — phải dùng gradient mốc phần trăm.

**M còn phải làm:** phiếu pH đã đẩy lên trước đó là PDF cũ — mở Sổ (bản web hoặc artifact đã publish lại) và **Giao cho lớp** lại phiếu đó.

---

---

## 2026-09-15 — Mục HỎI ĐÁP riêng, mở đầu bằng Câu hỏi thường gặp

**M chốt:** *"trước mắt sẽ là mục C (câu hỏi thường gặp, m thiết kế cái đó trước), sau đó là câu hỏi gom
theo buổi học, theo từng phiếu bài tập, không hiện tên người hỏi (ẩn danh), và mọi người sẽ thấy câu trả lời."*

### Vì sao m không thấy phần hỏi đáp cũ

Nó có, và đã lên bản chính — nhưng **bị chôn**: khung hỏi bài chỉ hiện *bên trong trình xem tài liệu*,
sau khi mở một tài liệu rồi cuộn xuống tận đáy. Không có mục trong thanh điều hướng, trang chủ không nhắc.
Muốn hỏi thì phải đoán được rằng cuộn xuống đáy phiếu bài tập sẽ có chỗ hỏi.

### Chốt về thiết kế

Mục riêng **không thay** ô hỏi dưới từng bài — hai thứ làm hai việc khác nhau:
lúc bí là lúc đang đọc câu 3 của phiếu buổi 5, nên **hỏi thì phải hỏi tại chỗ**;
còn **đọc thì phải đọc một chỗ**, không ai mở lại 12 tài liệu để tìm xem cô đã trả lời gì.
Ô hỏi tại chỗ là *cửa vào*, mục riêng là *nơi ở* của toàn bộ cuộc trò chuyện.

### `schema_v23_hoi_dap_rieng.sql` — m phải chạy một lần trên Supabase

Tới v22, `cau_hoi.material_id` là **NOT NULL** và luật đọc dựa trên "có xem được tài liệu này không".
Nghĩa là **không thể có câu hỏi chung**, và câu trả lời hay thì chìm nghỉm dưới đáy một phiếu buổi 3. v23 mở ra:

- `material_id` được phép rỗng; thêm `class_id` (điền sẵn cho mọi câu hỏi cũ) → **câu hỏi chung của lớp**.
- `ghim` / `ghim_stt` / `chu_de` → mục **Câu hỏi thường gặp**, xếp tay, gom theo chủ đề.
- Luật đọc mới: câu **đã ghim và đã có trả lời** thì cả lớp đọc được, **không cần mở tài liệu gốc** — đó chính là ý nghĩa của việc ghim. Câu chưa trả lời vẫn chỉ người hỏi thấy.
- Trigger `cau_hoi_lop`: nếu câu hỏi có gắn tài liệu thì `class_id` **luôn suy ra từ tài liệu**, trang web gửi lên gì cũng không đổi được.
- Sinh viên **không tự ghim được**: luật ghi chặn `ghim = true` và chặn tự điền sẵn câu trả lời.
- Ba hàm mới `ghim_cau_hoi` · `luu_faq` · `xep_faq`, đều chặn ở `is_staff()`. `bang_cau_hoi` dựng lại (thêm ghim/chủ đề, tài liệu có thể rỗng).

**Ẩn danh giữ nguyên và mạnh hơn trước:** bảng `cau_hoi` không cho sinh viên đọc `profiles`,
trang học không hỏi tên, và mục mới cũng không hiện tên ở bất kỳ chỗ nào — chỉ "Bạn" hoặc "Một bạn trong lớp".

### Trang học: mục thứ sáu trên thanh điều hướng

Ba ngăn, mở sẵn ở ngăn đầu:

1. **Thường gặp** — làm kỹ nhất, đúng thứ tự m dặn. Mỗi câu là một khối bấm mở ra đọc; gom theo chủ đề, đánh số liên tục; trả lời mang logo Giảng đường. Đây là thứ **lãi dần theo năm**: cùng một câu sẽ lặp lại ở mọi khoá, ghim một lần dùng mãi.
2. **Theo buổi học** — mỗi buổi một khối gập, trong buổi lại tách theo **từng phiếu / video**, kèm đếm "1 chờ / 4". Buổi mới nhất mở sẵn. Bấm tên phiếu là mở thẳng tài liệu đó. Câu hỏi chung của lớp nằm ở khối đầu.
3. **Câu hỏi của bạn** — mọi câu mình đã hỏi, ghi rõ hỏi ở buổi nào / phiếu nào.

Thêm: ô soạn **câu hỏi chung** ngay đầu trang (mang mặt nhân vật của chính em ấy), ô tìm **bỏ dấu**
(gõ "nop bai muon" ra "Nộp bài muộn…"), chuông nhỏ cạnh nút Hỏi đáp khi câu của mình vừa được trả lời,
và nút *Xem tất cả hỏi đáp của lớp* ở đáy khung hỏi bài dưới mỗi tài liệu.

Thanh điều hướng trên điện thoại đổi từ 5 cột sang **3 cột × 2 hàng** vì giờ có sáu mục.

### Trang quản trị: khối Câu hỏi thường gặp

Tab **Hỏi đáp** giờ có hai phần. Trên là khối gập *Câu hỏi thường gặp*: **＋ Soạn một câu**
(viết luôn cả hỏi lẫn đáp, không cần chờ ai hỏi), Sửa, Bỏ ghim, ↑ ↓ xếp thứ tự, nhãn chủ đề
(có gợi ý sẵn: Cách học · Bài tập & nộp bài · Video bài giảng · Thi cử · Tài khoản).
Dưới là danh sách sinh viên hỏi như cũ, mỗi câu **đã trả lời** thêm nút **📌 Ghim vào Thường gặp**.
Câu không gắn tài liệu hiện nhãn **Câu hỏi chung**.

Chưa chạy v23 thì cả hai trang **không vỡ**: quản trị hiện lời nhắc chạy SQL và vẫn trả lời được như cũ;
trang học hiện lời nhắc trong mục Hỏi đáp.

### Đã test

- `test/ra-soat.js` — sạch cả hai trang (0 lỗi).
- Cú pháp **từng khối script** của bốn tệp (bản thật + bản thử) đều dựng được bằng `vm.Script`; số ký tự khớp nhau, không có khối nào bị cắt cụt.
- Chạy thật trong trình duyệt trên bản thử: gửi câu hỏi chung → thấy nó xuất hiện, ngăn tự nhảy sang *Câu hỏi của bạn*; gom nhóm ra đúng buổi 5 (phiếu 3 câu + video 1 câu) và buổi 4; tìm bỏ dấu chạy; ô trống ra đúng lời nhắn.
- Bản quản trị: xếp ↑↓ đổi đúng thứ tự, ghim một câu sinh viên hỏi (có chọn chủ đề) lên đúng cuối danh sách, soạn câu mới, **chặn khi thiếu câu trả lời**, bấm Sửa nạp lại đúng nội dung và chủ đề.
- Điện thoại 375 px: không tràn ngang (375/375), thanh điều hướng 3 cột.

### M còn phải làm

1. Chạy `schema_v23_hoi_dap_rieng.sql` trong Supabase → SQL Editor.
2. Kiểm bằng `curl -s https://lop-hoc-online.giangduonghoahoc.workers.dev/api/trang-thai` → phải thấy `"v23_hoi_dap_rieng":true`.
3. Vào Quản trị → Hỏi đáp → soạn sẵn vài câu thường gặp trước khi mở lớp; sinh viên vào là thấy ngay.

---

---

## 2026-09-14 (tối) — Thiết kế lại khung Hỏi bài của sinh viên

**M hỏi:** đã code giao diện hỏi đáp bên sinh viên chưa, làm cho thông minh, và **chèn logo cùng bộ tranh trong folder** vào.

**Trả lời thẳng:** đã code từ hôm làm nộp bài, nhưng **rất thô** — một tiêu đề, một ô nhập, một danh sách chữ. Chưa đụng tí nào tới bộ tranh 4 giao diện đã có sẵn.

### Đã dựng lại thành một mạch trò chuyện

- **Đầu khung:** tranh `ask-teacher.svg` lấy qua `licSrc()` nên **tự đổi theo giao diện sinh viên đang chọn** (Mint / Sky / Peach / Lavender). Kèm huy hiệu đếm *3 câu · 2 đã trả lời*.
- **Ô soạn:** mang **mặt nhân vật 3D của chính em ấy** (`anhMat(avatarNay)`), nhìn ra dáng đang nhắn tin chứ không phải điền biểu mẫu.
- **Câu hỏi:** bong bóng bo góc lệch, mặt nhân vật bên trái; câu của mình tô đậm hơn câu của bạn khác.
- **Câu trả lời:** thụt vào, bong bóng xanh lá có vạch bên trái, và **mang LOGO Giảng đường** làm ảnh đại diện — nhìn phát biết là giảng viên nói. Đây là chỗ m bảo chèn logo.
- **Đang chờ:** viên thuốc vàng có chấm nhấp nháy, chỉ hiện với câu của chính mình.
- **Chưa ai hỏi:** tranh `discussion.svg` cỡ lớn + lời mời hỏi câu đầu tiên, thay cho dòng chữ xám cụt lủn.

### Đã test

Trong bản chạy thử: tranh ra đúng `img/themes/peach/ask-teacher.svg` (đúng giao diện đang chọn), đếm đúng *3 câu · 2 đã trả lời*, ô soạn mang `mat-girl-00.jpg`, hai câu trả lời đều dùng `img/logo.png`, một chấm chờ. Khổ 375px: **không phần tử nào tràn**, trang không tràn ngang.

---

---

## 2026-09-14 (chiều) — Soát lại chuỗi bảo vệ theo đúng yêu cầu của m

**M yêu cầu:** app Windows/macOS giữ nguyên bảo vệ video và chống chụp/quay; chỉ **phiếu bài tập** mới được quản trị cân nhắc cho in; **đáp án chắc chắn không**.

**Soát bằng mã — bốn phần bảo vệ còn nguyên:**

- Video: `BAT_BUOC_APP = 'video'` ở trang học, `APP_CHO_VIDEO = true` ở Worker; không có app thì `/api/stream/token` trả `can_app` 403.
- App: `win.setContentProtection(true)`, dò phần mềm quay mỗi 4 giây.
- Trang web: PrintScreen, dấu chìm, che mờ khi rời cửa sổ, ghi vi phạm — đếm được 17 chỗ, còn đủ.
- In từ trang: khối `@media print` vẫn chặn sạch, chỉ hiện dòng báo không được phép in.

**Nhưng sai một chỗ, đã sửa:** ô *Cho tải về* hôm qua t mở cho cả loại `answer` — trái hẳn ý m. Sửa hai lớp:

1. Quản trị: bỏ hẳn lựa chọn ở tài liệu loại **đáp án**, và không hiện nhãn ⤓ cho tải cho loại đó.
2. Trang học: `veNutTai` từ chối thẳng khi loại là `answer` — **kể cả khi cờ đã lỡ bật trong dữ liệu**.

Lớp thứ hai mới là lớp quan trọng: nếu m đã trót bật cờ cho một đáp án trước bản này thì nút vẫn không hiện.

**Đã test:** dựng dữ liệu thử với đáp án **cố ý bật** `cho_tai:true` → phiếu bài tập có nút Tải về, đáp án **không có nút**.

**Còn để ngỏ, chờ m quyết:** loại **Bài giảng** (`lecture`) hiện vẫn bật cho tải được. M chỉ nói tới phiếu bài tập nên t giữ nguyên; mặc định vẫn tắt.

---

---

## 2026-09-14 — Sao lưu dữ liệu, và sửa nút Tải về cho chạy được trong app Windows

**M dặn:** làm sao lưu; và **tập trung app PC Windows**, sinh viên chủ yếu dùng máy Windows, phần điện thoại không cần quá kỹ.

### Lỗi bắt được nhờ câu dặn đó

Nút **Tải về để in** làm hôm qua trỏ thẳng `<a download>` sang địa chỉ Supabase. Hai chuyện cùng hỏng:

1. Thuộc tính `download` **bị trình duyệt bỏ qua** khi địa chỉ khác tên miền → mất tên tệp, và có thể mở ra thay vì tải về.
2. Trong **ứng dụng máy tính**, bộ lọc `win.webContents.on('will-navigate')` trong `app/main.js` thấy địa chỉ không bắt đầu bằng tên miền lớp là **chặn rồi ném hẳn sang trình duyệt ngoài**.

Tức là tính năng này gần như chắc chắn hỏng đúng ở chỗ đông người dùng nhất. Sửa: **tải nội dung về thành blob trước**, rồi mới cho bấm một `<a download>` trỏ vào `blob:` cùng nguồn — chạy được ở cả trình duyệt lẫn app, không cần dựng lại app.

Bài học: mỗi khi thêm thứ gì đụng tới tệp hoặc điều hướng, phải soi lại `app/main.js` — vỏ Electron có bộ lọc riêng mà trình duyệt không có.

### Sao lưu dữ liệu lớp

Tab **Kho tệp** → nút **⤓ Sao lưu dữ liệu**. Gom 13 bảng (`classes, sessions, materials, material_contents, enrollments, profiles, view_events, bai_nop, cau_hoi, dap_an_o, device_bindings, screenshot_events, dung_luong_thang`) về một tệp JSON đặt tên theo ngày.

- Lấy **từng khúc 1000 dòng** bằng `.range()` — Supabase chặn ở 1000, không phân trang là mất dữ liệu mà không báo gì.
- Bảng nào đọc lỗi thì ghi vào `_meta.bang_khong_doc_duoc` chứ không làm hỏng cả bản sao.
- `_meta` ghi giờ sao lưu, nguồn, và số dòng từng bảng để mở ra là kiểm được ngay.
- **Không gồm** tệp PDF/ảnh/video — chỉ có đường dẫn. Đã nói rõ trong tệp lẫn trên màn hình.

Không cần SQL mới: luật RLS sẵn có đã cho giảng viên đọc hết các bảng này.

**Đã test** trong bản chạy thử: chặn lại cú bấm tải rồi đọc thẳng nội dung tệp — đủ 13 bảng, số dòng khớp (1 lớp, 3 buổi, 5 tài liệu, 3 ghi danh, 4 bài nộp, 3 câu hỏi), tên tệp `sao-luu-giang-duong-2026-09-09.json`. Nút Tải về: địa chỉ là `blob:`, tên `phieu5.pdf`, kiểu `application/pdf`, 58 943 byte — khớp tệp gốc.

---

---

## 2026-09-13 (chiều) — Xem bài đã điền, sửa kết luận của máy, thống kê câu hay sai

**Vá lỗ hổng t để lại:** máy chấm xong chỉ hiện "3/4", giảng viên **không mở ra xem được sinh viên gõ chữ gì** — nên cái nhãn *cần xem lại* ở câu gần đúng hoàn toàn vô dụng. Nêu hai lượt trước, giờ mới làm.

**`schema_v22_xem_bai_thong_ke.sql`** — ba hàm:

- `xem_bai_o(bai)` — từng ô: sinh viên gõ gì, đáp án đúng, máy kết luận gì. Dùng `jsonb_array_elements … with ordinality` để giữ đúng thứ tự câu.
- `sua_o_cham(bai, o, trạng thái)` — giảng viên đổi kết luận một ô; tự tính lại `diem` và tắt `can_xem` khi hết câu lửng lơ.
- `thong_ke_o(lớp)` — cộng cả lớp theo từng ô: bao nhiêu đúng / gần / sai.

**Quản trị:** nút **Xem bài** ở hàng bài điền trên phiếu → bảng chi tiết, câu gần đúng tô hồng, mỗi dòng có ba nút đổi kết luận. Thanh chuyển của tab Bài nộp thêm mục thứ ba **Câu hay sai**: mỗi phiếu một bảng kèm thanh màu, tiêu đề ghi câu khó nhất, dòng quá nửa lớp sai thì tô hồng.

Sửa luôn chữ nghĩa: bài điền trên phiếu trước ghi "không có tệp", giờ ghi **"điền trên phiếu"**.

`/api/trang-thai` thêm `v22_xem_bai`. Lần này kiểm bằng **hàm** chứ không phải cột, nên viết thêm `coHam()` — gọi RPC với thân rỗng, chỉ cần không trả 404 là hàm đã tồn tại.

**Đã test** trong bản chạy thử quản trị: mở bài của Nguyễn Minh Anh ra đúng "2/4 câu đúng · 1 câu gần đúng", bảng liệt kê đủ bốn câu kèm đáp án; bấm đổi câu 4 từ *gần đúng* sang *đúng* → thành **3/4**, hàng tô hồng biến mất, bảng chấm ngoài cập nhật theo. Tab Câu hay sai ra "khó nhất: câu 2", câu 2 có 0 đúng / 2 sai và bị tô hồng.

**M phải làm:** chạy `schema_v22_xem_bai_thong_ke.sql` trong Supabase.

---

---

## 2026-09-13 — Quyền tải về từng tệp

**M chọn:** làm quyền tải trước, để tuần này còn in phiếu phát cho sinh viên; chuyện phiếu web gõ trực tiếp tính sau.

**Đã làm:** `schema_v21_cho_tai.sql` thêm một cột `materials.cho_tai` (mặc định `false`).

- Quản trị: ô **Cho tải về** trong hộp thêm/sửa tài liệu (pdf · bài giảng · đáp án), hàng tài liệu hiện nhãn **⤓ cho tải**.
- Sinh viên: nút **Tải về để in** ở cuối tài liệu, chỉ hiện khi cờ bật. Lấy link ký 5 phút kèm `{ download: tên }` để trình duyệt tải xuống thay vì mở tab.
- `/api/trang-thai` kiểm thêm `v21_cho_tai`.

**Nói thẳng giới hạn** (đã ghi vào cả tệp SQL lẫn hướng dẫn): cờ này **không phải hàng rào mật mã**. Trình duyệt bắt buộc phải tải được nội dung về mới vẽ được phiếu — không tránh được. Cờ chỉ quyết định có nút Tải về hay không. Bảo vệ thật vẫn là dấu chìm, khoá một thiết bị, và app chặn chụp/quay. **Tệp đã cho tải thì không có dấu chìm.**

**Đã test** trong hai bản chạy thử: bật ô rồi Lưu → mở lại vẫn nhớ → hàng hiện nhãn ⤓ cho tải; phía sinh viên tài liệu bật cờ có nút Tải về, tài liệu không bật thì **không** có nút.

### Đã tư vấn cho m về hướng "phiếu soạn ở Sổ, sinh viên gõ thẳng"

Đọc mã cả hai bên rồi kết luận: **làm được, mà còn dễ hơn khoanh ô trên PDF.** Phiếu ở Sổ vốn đã là HTML; `doSend` hiện đi vòng — bấm nút in của sổ, bắt lấy PDF, tải lên kho. Gửi thẳng HTML thì chỗ trống thành ô nhập thật, không cần toạ độ, không cần pdf.js, tự co giãn trên điện thoại, và **tái dùng được gần hết máy chấm đã xây** (chỉ đổi khoá từ id ô sang id câu).

Ba mảnh: (1) `doSend` gửi HTML + viết `web/sheet.css` (đang thiếu, trang thật trả 404); (2) ô trả lời mỗi câu; (3) bộ gõ công thức ra Unicode thuần.

Chỗ chưa chắc: phiếu **dựng bằng JS lúc chạy** nên nhìn mã tĩnh không biết mỗi câu được đánh dấu bằng thẻ gì — phải mở sổ soi DOM thật rồi mới dám hứa mảnh 2. Mảnh 1 thì chắc chắn làm được.

Đề xuất chia ba bước, bước nào cũng dùng được ngay, để không phải đánh cược cả cục.

---

---

## 2026-09-12 (tối) — PDF treo khi ẩn tab: LỖI THẬT của bản chính, đã sửa

**M báo:** phiếu PDF trong bản thử nhìn xấu, muốn dùng giao diện PDF như Sổ Bài Tập, và mở bài lên trễ.

### Sửa lại chẩn đoán hôm qua

Hôm qua t ghi "pdf.js treo ở `render()` — chuyện của môi trường chạy thử". **Sai.** Đó là **lỗi thật của bản chính**: sinh viên mở phiếu rồi chuyển sang tab khác là trang treo vĩnh viễn, không bao giờ vẽ xong.

Nguyên nhân và lời giải đều nằm sẵn trong Sổ Bài Tập, ghi rõ trong chính mã của nó:

```
/* intent print: không dùng requestAnimationFrame nên vẫn chạy khi tab bị ẩn */
page.render({ canvasContext: ctx, viewport: vp, intent: 'print' }).promise
```

Kiểu vẽ mặc định của pdf.js bám `requestAnimationFrame`, mà trình duyệt bóp cái đó khi thẻ bị ẩn → lời hứa không bao giờ hoàn thành. Sổ Bài Tập còn bọc thêm `Promise.race` hết giờ 20 giây để hỏng thì báo chứ đừng treo. **Mượn cả hai.**

Bài học: gặp chuyện lạ thì tìm trong dự án anh em trước khi kết luận là lỗi môi trường — Sổ Bài Tập đã đụng và đã giải từ đợt 42.

### Mở bài nhanh hơn

Trước: vẽ **tuần tự hết mọi trang** ở tỉ lệ tới 2,6× rồi mới hiện gì cả. Phiếu 10 trang là ngồi nhìn màn hình trống rất lâu.

Giờ:

1. Dựng ngay **khung đúng tỉ lệ cho mọi trang** (và đặt luôn ô trả lời lên) — thấy được, cuộn được liền, có vệt sáng chạy báo đang vẽ.
2. Vẽ **trang 1 trước**, hiện ngay.
3. Các trang sau **cuộn tới đâu vẽ tới đó** bằng `IntersectionObserver` (đệm trước 900px). Không có API đó thì lùi về vẽ tuần tự.
4. Hạ trần tỉ lệ **2,6 → 2,0**: vẫn nét trên màn hình 2×, mà bớt khoảng 40% số điểm ảnh phải vẽ.

### Nhìn cho tử tế

Mỗi trang thành một thẻ giấy trắng bo góc có bóng đổ, cách nhau 16px — thay vì mấy tấm canvas trần dính nhau.

### Mẹo đo toạ độ ô

Toạ độ ô trong bản thử đang tính theo ảnh PNG nên lệch khi đổi sang PDF (lề in khác). Thay vì đoán: **quét điểm ảnh của trang đã vẽ, tìm những hàng có vệt đen dài** — chính là nét gạch chân chỗ trống — rồi quy ra phần trăm. Ra đúng bốn nét, đặt ô lên là khớp ngay.

### Đã test

Bản thử quay lại dùng **phiếu PDF thật**: 1 trang vẽ xong, không còn `cho` hay `loi` treo lại, 4 ô trả lời nằm đúng trên bốn nét gạch (chụp màn hình xác nhận).

---

---

## 2026-09-12 (chiều) — Sinh viên điền thẳng vào phiếu, máy chấm đúng/sai

**M chọn:** khoanh ô trên PDF (không phải làm lại phiếu dạng web); điểm vào thẳng bảng điểm, ghi rõ máy chấm; câu gần đúng đẩy sang hàng chờ. Giữa chừng m chốt thêm: **chỉ cần đúng/sai, chưa cần điểm cụ thể**.

### Chỗ quan trọng nhất: đáp án không bao giờ rời máy chủ

Trang sinh viên đọc `materials` bằng `select('*, materials(*)')` — nên **không được** để đáp án trong cột của `materials`. Tách làm hai:

- `materials.o_tra_loi` — chỉ **toạ độ** ô (theo phần trăm trang), sinh viên đọc được để vẽ ô.
- Bảng riêng `dap_an_o` — đáp án, RLS chỉ `is_staff()`. Chấm chạy trong `nop_bai_o()` (security definer) trên máy chủ.

### Chuẩn hoá trước khi so, không thì chấm oan

`chuan_dap()`: bỏ khoảng trắng, về chữ thường, dấu phẩy → dấu chấm, chỉ số dưới ₀₋₉ và số mũ ⁰₋⁹ → số thường. Nhờ vậy `H₂SO₄` khớp `H2SO4`, `0,08` khớp `0.08`. Giảng viên ghi nhiều đáp án chấp nhận được thì ngăn bằng `|`.

Ba mức: **đúng** (khớp, hoặc số nằm trong sai số), **gần** (số lệch dưới 2% hoặc chỉ khác ký tự không phải chữ/số) → đẩy sang `can_xem` cho giảng viên, **sai**.

### Đã làm

- `schema_v20_o_tra_loi.sql`: hai bảng/cột trên, `nop_bai_o`, `dat_o_tra_loi`, `lay_dap_an_o`, và dựng lại `bang_bai_nop` để trả thêm `may_cham` / `can_xem` (đổi cột trả về nên phải `drop function` trước).
- Quản trị: nút **◻ Ô trả lời**, trình khoanh ô toàn màn hình (pdf.js nạp thêm vào trang này), kéo tạo / kéo dời / kéo góc chỉnh cỡ / xoá, cột phải gõ đáp án và sai số.
- Sinh viên: ô nhập chồng lên phiếu, nộp → máy chấm → tô xanh/vàng/đỏ kèm dấu ✓ ~ ✗, kết quả "3/4 câu đúng". Máy chấm rồi **vẫn sửa và nộp lại được**; chỉ giảng viên chấm tay mới khoá.
- Bổ sung luôn: đặt ô trên **phiếu dạng ảnh**, không chỉ PDF.

### Bẫy đã sập, ghi lại cho lần sau

1. **Khai báo sau chỗ dùng.** Khối `?o=1` trong bộ chạy thử đặt *sau* đoạn dựng `sessions`, mà `sessions` lại đọc biến đó → `var` được kéo lên nhưng giá trị vẫn `undefined`, ô không bao giờ hiện. Mất khá lâu mới thấy.
2. **pdf.js treo ở `render()`** trong bản chạy thử tại máy. Đã dựng lại độc lập ngoài mã của mình để loại trừ: worker tải được (200, 1 MB), `getDocument` ra 1 trang, `getPage` xong, nhưng `render().promise` không trả về trong 3 giây. Không phải lỗi do sửa đổi lần này. Đổi phiếu mẫu sang ảnh PNG để còn thử được luồng; **PDF phải kiểm trên bản thật**.
3. Script vá chỉ ghi tệp ở dòng cuối, nên khi nó ném lỗi giữa chừng thì tệp thật **chưa bị đụng** — đừng hoảng đi kiểm trạng thái nửa vời.

### Đã test

Trọn vòng trong bản chạy thử: khoanh một ô bằng chuột → gõ đáp án + sai số → Lưu → nút hàng tài liệu đổi thành "◻ Ô trả lời · 1" → mở lại vẫn nhớ đáp án. Phía sinh viên: 4 ô hiện đúng chỗ trống, gõ `0,08` / `Phenolphtalein` / `H₂SO₄` / `2,03` → **3/4 đúng, 1 gần đúng**, đủ bốn kiểu chuẩn hoá; nộp lại sau khi sửa → **4/4**.

### M phải làm

Supabase → SQL Editor → dán cả `schema_v20_o_tra_loi.sql` → Run. Chưa chạy thì nút ◻ Ô trả lời vẫn hiện nhưng lưu sẽ báo lỗi, còn trang sinh viên tự ẩn phần này.

---

---

## 2026-09-12 — Bảng điểm cả lớp, nhắc hạn nộp, hồ sơ từng sinh viên

**M nói:** sợ không có thời gian chấm, nhưng cứ xây 1-2-3; và gợi ý hướng **cho sinh viên tự chấm theo đáp án**.

### 1. Bảng điểm cả lớp

Tab **Bài nộp** giờ có hai cách nhìn cùng một mớ dữ liệu, chuyển bằng thanh **Chấm bài / Bảng điểm** — không thêm tab thứ tám.

- Bảng **sinh viên × phiếu**: ô là điểm đã chấm, `•` là đã nộp chưa chấm, `–` là chưa nộp; hai cột cuối là số bài đã nộp và trung bình.
- `soDiem()` nhận cả "8,5" (dấu phẩy thập phân kiểu Việt) và bỏ qua ô ghi chữ như "Đạt" — chữ vẫn hiện nhưng không cộng vào trung bình.
- Nút xuất `.csv` có **BOM UTF-8** để Excel không vỡ phông tiếng Việt; tên tệp gắn tên lớp và ngày.
- **Không cần tệp SQL mới** — xoay bảng ngay trên máy khách từ chính `bang_bai_nop()` đã có.

### 2. Nhắc hạn nộp

Trước đó đặt hạn được nhưng chẳng có gì nhắc. Giờ:

- `conHan(m)` trả về số mili giây còn lại; `null` nếu không có hạn **hoặc đã nộp rồi** — nộp xong là dải nhắc biến mất.
- Dải **“Sắp tới hạn nộp”** lên đầu trang chủ khi còn ≤ 7 ngày, đổi sang màu đỏ khi còn ≤ 24 giờ, hiện tối đa 3 bài rồi ghi "và N bài nữa".
- Nhãn trong tab Bài tập đổi thành "Nộp · còn 2 ngày".

### 3. Hồ sơ từng sinh viên

Tab **Sinh viên** → bấm vào tên → hộp gom hết: số tài liệu đã mở / tổng, lượt mở, giờ xem, điểm trung bình; bài đã nộp kèm điểm và nhận xét; câu đã hỏi (chưa trả lời in đậm); tài liệu mở gần đây; cảnh báo chụp màn hình. Năm truy vấn chạy song song bằng `Promise.all`, **không cần SQL mới**.

### Đã test

Bằng hai bộ chạy thử, dò thẳng DOM. Bảng điểm ra đúng ba trường hợp: Lê Thu Hà `– – 0/2 –`, Nguyễn Minh Anh `• – 1/2 –`, Trần Quốc Bảo `9 • 2/2 9`. Xuất CSV chạy, toast báo xong. Hồ sơ Minh Anh ra "2/5 tài liệu · 3 lượt · 35 p · bài chờ chấm · 1 câu chưa trả lời". Nhắc hạn: còn 2 ngày → cam; `?han=gap` còn 1 giờ → đỏ, `hanpill gap`; `?nop=roi` → dải biến mất.

**Bẫy đã gặp lại:** viết script vá mà để một chuỗi JS tràn sang phần tử mảng kế tiếp → `node --check` của chính script vá báo lỗi trước khi nó kịp phá tệp thật. Luôn `node --check` script vá trước khi chạy.

**Cũng lưu ý:** thông báo lỗi trong bộ đệm console của pane trình duyệt **không tự xoá khi tải lại trang** — hai lỗi `ngayGio is not defined` còn hiện là rác từ lần dựng trước, đã đối chiếu số dòng để xác nhận. Đừng vội tin console cũ.

---

---

## 2026-09-11 (tối) — Thêm được vào màn hình chính điện thoại

**M hỏi:** "app trên điện thoại à, có logo này nọ không?"

**Trả lời thẳng:** không có app điện thoại; app Electron chỉ có Windows/macOS. Cái sửa hôm nay là trang web mở bằng trình duyệt điện thoại. **Nhưng** kiểm ra thì cả hai trang đều thiếu sạch manifest, apple-touch-icon và theme-color — thêm vào màn hình chính sẽ ra một ô trắng không tên. Đã vá.

**Đã làm:**

- Dựng bộ icon từ `logo.png` (400×400) bằng System.Drawing trong PowerShell: `app-192`, `app-512`, `app-180` (apple-touch, nền trắng vì iOS không ưa nền trong suốt), và `app-mask-512` — bản *maskable*, logo thu còn **74%** đặt giữa nền `#eef6fd` để Android cắt tròn hay bo góc đều không phạm vào chữ.
- `web/manifest.json` (trang học, `start_url ./`, tên ngắn "Giảng đường") và `web/manifest-quan-tri.json` (`start_url quan-tri`, tên ngắn "Quản trị"). Hai tệp riêng vì một manifest chỉ có một `start_url` — dùng chung thì icon quản trị sẽ mở nhầm sang trang sinh viên.
- Đặt đuôi `.json` chứ không `.webmanifest`, cho chắc chuyện kiểu MIME ở cả Worker lẫn máy chủ thử tại máy.
- Thẻ `<head>` hai trang: manifest, apple-touch-icon, theme-color, `apple-mobile-web-app-*`.
- `mauThanhTrangThai(skin)` trong `apSkin`: đổi giao diện thì thẻ `theme-color` đổi theo màu `THEMES[skin].b`, không thì viền trên của điện thoại lệch tông với trang.

**Đã test** (khổ 375px trong pane trình duyệt): manifest trả 200, cả bốn icon 200 kèm `image/png`; trang học đọc đúng tên "Giảng đường Hóa học" / "Giảng đường" / `standalone`; thẻ theme-color đang là `#f7d9c8` (Peach) chứ không phải giá trị mint tĩnh trong HTML → xác nhận phần đổi màu động chạy. Trang quản trị đọc đúng manifest riêng, `start_url quan-tri`.

**Giới hạn phải nói với sinh viên:** icon ngoài màn hình chính **không phải** ứng dụng máy tính — video bài giảng vẫn bị chặn, và trên điện thoại không có chống chụp màn hình (chỉ app Electron mới có).

---

---

## 2026-09-11 (chiều) — Bộ chạy thử quản trị, chuông rộng hơn, quản trị dùng được trên điện thoại

**M nói:** chưa có thời gian ngồi test, bảo t làm trước những việc không cần m.

### Bộ chạy thử cho trang quản trị

`test/tao-ban-thu-qt.js` → `web/_test_quan-tri.html`. Khác bản của sinh viên ở chỗ **ghi thật vào bộ nhớ**: một máy truy vấn giả có lọc `.eq()`, biết insert/update/delete, nên bấm Lưu là dữ liệu đổi và mở lại tab thấy kết quả. Có sẵn 1 lớp, 3 sinh viên, 3 buổi, 5 tài liệu, 3 bài nộp, 3 câu hỏi; Worker cũng được giả lập bằng cách bọc `window.fetch`.

**Trả công ngay lập tức — bắt được một lỗi chết người:** hai tab Bài nộp và Hỏi đáp gọi `ngayGio()`, hàm đó **chỉ có ở trang sinh viên**, trang quản trị không có. Cả hai tab đứng im ở "Đang tải…" trên bản thật. Đổi 3 chỗ sang `fmtWhen()`. Bài học: đừng bê tên hàm từ tệp này sang tệp kia, hai trang không dùng chung mã.

Cũng xác nhận được lỗi quỹ xem đã sửa hôm qua: mở ✎ Sửa video giờ hiện đúng **60 phút** thay vì "Không giới hạn".

### Bài tập cần làm gom cả tài liệu nhận bài nộp

Trước chỉ lọc `kind 'pdf'|'answer'` — bật nhận bài nộp cho một Bài giảng thì nó không hiện ở tab Bài tập. Thêm `nhanBai(m)` vào cả bộ lọc lẫn phép đếm "còn lại".

### Chuông báo gom ba loại tin

Trước chỉ đếm *tài liệu mới*. Giờ `tinMoi()` gộp: tài liệu mới, **bài của mình vừa được chấm**, **câu hỏi của mình vừa được trả lời**. Nạp thêm `taiHoiDaTra()`. Mốc so sánh vẫn là `lanTruoc`.

### Trang quản trị trên điện thoại

Đo ở khổ 375px: trang tràn ngang **712px**, mọi tab đều hỏng. Ba nguyên nhân, sửa cả ba:

1. **Thủ phạm chính:** `.cols{ grid-template-columns:1fr }` trong media 900px. `1fr` là `minmax(auto,1fr)` — **không co xuống dưới bề rộng tối thiểu của nội dung**, nên một cái bảng rộng kéo giãn cả trang. Đổi thành `minmax(0,1fr)` + `.cols > *{ min-width:0 }`. Nhớ mẹo này, nó là bẫy kinh điển của CSS Grid.
2. Ba bảng `.roster` nằm thẳng trong `.card` (Kho tệp, Cảnh báo, Sinh viên) chưa có khung cuộn → bọc vào `.mats`, và `.mats{ overflow-x:auto }`.
3. Thanh trên cùng bốn thứ đè nhau → cho xuống dòng ở ≤640px.

Thêm khối `@media (max-width:640px)`: tab cuộn ngang, thanh công cụ xuống dòng, và **bảng Bài nộp xếp thành thẻ dọc** (`table.nop` + `data-l` làm nhãn qua `::before`) để còn gõ được điểm và nhận xét bằng ngón tay.

**Kết quả đo lại:** cả 7 tab đều `scrollWidth === 375`, không tab nào tràn.

### Đã test

Dò DOM trong pane trình duyệt: hai tab mới hiện đúng bảng và thẻ; **chấm điểm thật** (gõ 7,5 + nhận xét → Lưu → dòng đổi sang "đã chấm"); **trả lời thật** (gửi trả lời → nhãn tab tụt từ 2 xuống 1, câu đã trả lời xuống cuối); bật/tắt "Nhận bài nộp" rồi mở lại hộp thoại thấy nhớ đúng; chuông báo hiện "Bài của bạn đã được chấm · 8,5" và "Giảng viên đã trả lời câu hỏi của bạn" (tham số `?chuong=1`).

---

---

## 2026-09-11 — Nộp bài, hỏi bài, và app chỉ bắt buộc cho video

**M chọn:** làm việc 1, 3, 4 trong danh sách đề xuất.

### 1. Bắt buộc app theo loại tài liệu (bỏ ý định bật REQUIRE_APP cứng)

Cũ: `REQUIRE_APP = true` là đăng xuất mọi người không dùng app → khoá sạch điện thoại, mà app chỉ có Windows/macOS.

Mới: `BAT_BUOC_APP` ở đầu `web/index.html` nhận `'khong'` / `'video'` / `'tat_ca'`, đang đặt `'video'`. Chỉ `kind === 'video'` bị chặn; sinh viên thấy một màn hình mời tải app (dùng tranh `download.svg` theo đúng giao diện đang chọn) và **vẫn hỏi bài được** ngay dưới đó.

Chặn thật ở máy chủ: `APP_CHO_VIDEO` trong `worker.js` — không có `LopHocApp/` trong user-agent thì `/api/stream/token` trả `can_app` 403, không ký vé. Giảng viên miễn.

### 2. Nộp bài

- `schema_v19_nop_bai_hoi_dap.sql`: cột `materials.nhan_bai` + `han_nop`; bảng `bai_nop` (một dòng mỗi tài liệu × sinh viên); kho tệp riêng `bainop` đường dẫn `<material_id>/<user_id>/<tệp>`, tối đa 10 MB, chỉ nhận ảnh và PDF.
- RLS: bảng `bai_nop` **không có luật ghi** — mọi thay đổi qua ba hàm `security definer`: `nop_bai` (kiểm hạn nộp + đã chấm thì chặn), `rut_bai`, `cham_bai` (chỉ `is_staff()`).
- Sinh viên: khung nộp nằm dưới nội dung tài liệu; nộp lại / rút bài được cho tới khi bị chấm; chấm rồi thì hiện điểm + nhận xét. Danh sách tài liệu và tab Bài tập hiện nhãn *cần nộp / đã nộp / đã chấm 8,5*.
- Quản trị: tab **Bài nộp**, gom theo tài liệu, mỗi bảng có ai nộp ai chưa, mở tệp bằng link ký 10 phút, ô điểm + ô nhận xét + nút Lưu.

### 3. Hỏi bài

- Bảng `cau_hoi`. Sinh viên đọc được: câu của mình + mọi câu **đã trả lời** (luật RLS `ch_doc`), không bao giờ thấy tên bạn học. Trả lời/ẩn qua `tra_loi_cau_hoi` (chỉ giảng viên).
- Quản trị: tab **Hỏi đáp**, câu chưa trả lời lên đầu, số câu chờ hiện trên tên tab.
- Hai hàm gom dữ liệu cho quản trị: `bang_bai_nop(class)` và `bang_cau_hoi(class)`.

### Lỗi cũ sửa luôn

Trang quản trị nạp buổi học **không** lấy cột `gioi_han_giay`, nên hộp ✎ Sửa một video luôn hiện "Không giới hạn" và bấm Lưu là **xoá mất quỹ thời lượng xem** đã đặt. Đã thêm cột vào câu truy vấn, kèm đường lui nếu chưa chạy v16/v19.

### M phải làm

Supabase → SQL Editor → dán cả `schema_v19_nop_bai_hoi_dap.sql` → Run. Chưa chạy thì hai tính năng tự ẩn, phần còn lại vẫn chạy bình thường (tab Bài nộp / Hỏi đáp sẽ nhắc đúng tên tệp cần chạy).

### Đã test

Bằng bộ chạy thử tại máy, dò thẳng DOM: khung nộp bài + hỏi bài hiện đúng dưới phiếu bài tập (3 câu hỏi, câu đã trả lời hiện lời giảng viên, câu của mình hiện "đang chờ"); `?nop=cham` hiện điểm 8,5 + nhận xét + tệp đã nộp và nhãn "đã chấm · 8,5" ngoài danh sách; mở tài liệu video trong trình duyệt ra đúng cửa chặn app. Kiểm cú pháp: `node --check worker.js`, khối script của hai trang HTML, và thử riêng logic user-agent (app qua, trình duyệt bị chặn).

---

---

## 2026-09-10 (khuya) — Bộ chạy thử trang học ngay tại máy

**M cần:** một bản trang học của sinh viên chạy tại máy để tự thử vài luồng.

**Đã làm:** thư mục `test/`:
- `chay-thu.cmd` — bấm đúp là dựng bản thử, bật máy chủ 127.0.0.1:8765 và tự mở trình duyệt. Có kiểm Node.js trước, thiếu thì báo chỗ tải.
- `tao-ban-thu.js` — chép `web/index.html` rồi thay thẻ script Supabase bằng một Supabase giả chạy trong trình duyệt (hồ sơ, lớp, buổi học, tài liệu, view_events, rpc, storage). Kèm dải nhắc "BẢN THỬ TẠI MÁY" ở góc phải.
- `may-chu.js` — máy chủ tĩnh, in sẵn danh sách tham số ra màn hình, tự mở trình duyệt (cờ `--khong-mo` để không mở, dùng khi test tự động).
- `DOC_TRUOC.md` — bảng tham số và ranh giới thử được / không thử được.

**Tham số:** `?onb=1` (lần đầu đăng nhập), `?g=nam`, `?het=1` (xong hết), `?trong=1` (lớp trống), `?quy=het` (video hết quỹ), `?st=1` (video Cloudflare Stream). Ghép bằng `&`.

**Bẫy đã sập:** bản dựng chèn dải nhắc bằng `h.replace('</body>', …)` — trúng nhầm chuỗi `</body>` nằm **bên trong mã JS** của trang (chỗ dựng tài liệu bản đọc), làm hỏng nguyên khối script 88 nghìn ký tự. Sửa: chèn dải nhắc bằng JS trong stub, không đụng vào HTML. Từ nay dựng xong phải so số ký tự khối script của bản thử với bản thật — bằng nhau mới đúng.

**Đã test:** ba luồng chụp màn hình thật trong pane trình duyệt — mặc định (nữ, Peach, nhân vật nữ), `?onb=1` (màn "Đặt mật khẩu của riêng bạn"), `?g=nam&het=1` (nam, Mint, nhân vật nam). Kiểm cú pháp: khối script chính của bản thử dài đúng 88 485 ký tự, y hệt `web/index.html`.

**Lưu ý:** `web/_test_*.html` đã nằm trong `.gitignore` và trang thật trả 404 cho nó — bản thử không lộ ra ngoài.

---

---

## 2026-09-10 (tối) — Infographic PR gửi sinh viên

**M cần:** một ảnh đăng group Facebook để giới thiệu lớp học online, khoe điểm mạnh — và **tuyệt đối không nhắc** khoá thiết bị, giới hạn thời lượng xem, dấu chìm, chống chụp màn hình. Những thứ đó để dành cho infographic số 2, phát sau khi sinh viên đã đóng tiền ("nếu lộ ra cái đó SV nó sẽ sợ và không dám đăng kí").

**Đã làm:** `pr/infographic-gioi-thieu.png` — 2160×2700 (1080×1350 @2x, tỉ lệ 4:5, khổ Facebook hiển thị to nhất trên điện thoại). Dựng bằng HTML rồi chụp bằng Chrome headless:

```
chrome.exe --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --virtual-time-budget=12000 --window-size=1080,1350 \
  --user-data-dir="<thư mục>\cdp" --screenshot="<thư mục>\anh.png" "file:///<thư mục>/infographic-gioi-thieu.html"
```

Ba cái bẫy đã gặp: (1) `--screenshot` và `--user-data-dir` phải là **đường dẫn Windows tuyệt đối**, dùng đường dẫn tương đối thì Chrome báo *Access is denied*; (2) phải có `--virtual-time-budget` thì phông Google Fonts mới kịp tải; (3) viết lệnh node nhiều dòng trong bash thì backtick bị nuốt — cứ ghi script ra tệp rồi chạy.

**Nội dung đưa vào:** logo + khẩu hiệu "Hóa học khó, có Phạm Ngọc lo"; câu chốt "Không phải một nhóm chat… là giảng đường riêng của lớp mình"; 6 thẻ (bài giảng video xem tiếp đúng chỗ dở · trang Hôm nay · tài liệu mở là đọc · chuông báo bài mới · Ctrl+K · web & app Windows/macOS); dải 4 giao diện + 8 nhân vật 3D kèm 2 ảnh nhân vật thật của app; 3 huy hiệu (máy chủ riêng · không quảng cáo · tài khoản riêng); dải kêu gọi đăng ký.

**Cố ý không có:** khoá một thiết bị, quỹ thời lượng xem, video tự ẩn, dấu chìm tên, chặn chụp/quay, tự đăng xuất sau 5 phút, bắt buộc dùng app. Toàn bộ phần đó dành cho **infographic số 2 — hướng dẫn sử dụng, phát sau khi thu học phí**, chưa làm.

**Sửa lại thế nào:** mở `pr/infographic-gioi-thieu.html` (logo.png, boy.jpg, girl.jpg nằm cùng thư mục), sửa chữ rồi chụp lại bằng lệnh trên. Thư mục `pr/` nằm ngoài `web/` nên không bị đẩy lên trang.

---

---

## 2026-09-10 (chiều) — Giờ xem và ước tính hoá đơn ngay trong Kho tệp

**M hỏi:** "còn thông số giờ xem và ước tính con số phải trả luôn trong kho tệp quản trị đi, t cần biết t đang phải trả bao nhiêu".

**Vướng:** khoá API hiện tại chỉ có quyền Stream · Edit nên Worker không đọc được thống kê phút phát của Cloudflare (muốn đọc phải thêm quyền Analytics và đổi token). Nên đếm bằng nhật ký của chính hệ thống — số giây sinh viên xem vốn đã báo về máy chủ mỗi 20 giây để trừ quỹ xem.

**Đã làm:**
- `schema_v18_dung_luong_thang.sql` — bảng `dung_luong_thang(thang, giay_phat, cap_nhat)`, mỗi tháng một dòng theo giờ Việt Nam; RLS chỉ giảng viên đọc, không ai ghi trực tiếp. Hàm `ghi_gio_xem` viết lại: ngoài việc cộng vào `view_events` như cũ, cộng luôn số giây vào dòng tháng hiện tại. File cũng gộp sẵn số phút đã xem từ trước vào tháng này để bảng không trống.
- Tab **Kho tệp** giờ có 5 ô: *Video đang lưu* (số video · phút lưu · dung lượng), **Sinh viên đã xem** (phút phát tháng này + tổng số giờ từ trước tới nay), **Ước tính phải trả tháng này** (tiền lưu + tiền phát, quy ra tiền Việt theo tỉ giá 26 000, nói rõ khi chưa tới mức tối thiểu 5 USD, liệt kê phút phát 3 tháng trước), rồi hai ô kho Supabase như cũ.
- Phần hoá đơn nằm ngoài `try` của Stream: Stream có lỗi thì vẫn thấy giờ xem. Chưa chạy v18 thì ô ghi "Chưa bật bộ đếm — chạy schema_v18_dung_luong_thang.sql" chứ không hiện lỗi SQL.
- `/api/trang-thai` kiểm thêm `v18_hoa_don`, để biết đã chạy file chưa mà không phải mở Supabase.
- `HUONG_DAN_VIDEO.md`: mục dung lượng viết lại thành "Xem đang dùng hết bao nhiêu, đang phải trả bao nhiêu", ghi rõ công thức và rằng đây là ước tính, hoá đơn thật ở Images & Stream → Plans.

**M phải làm:** Supabase → SQL Editor → dán cả file `schema_v18_dung_luong_thang.sql` → Run (một lần).

**Đã test:** `node --check` worker, kiểm cú pháp khối script của quan-tri.html, chạy thử số học ngoài trình duyệt (20 video × 60 phút + 30 SV xem một lượt → 6 USD lưu + 36 USD phát = 42 USD ≈ 1,09 triệu; kho trống → 5 USD ≈ 130k vì mức tối thiểu).

---

---

## 2026-09-10 — Bảng dung lượng trong tab Kho tệp

**M hỏi:** video up lên lưu trên cloud đúng không, xem dung lượng ở đâu?

**Đã làm:** tab **Kho tệp** thêm ba ô số liệu, đo trực tiếp mỗi lần mở tab:
- Video · Cloudflare Stream: gọi `/api/stream/danh-sach`, cộng `giay` và `kich_thuoc` → số video, tổng phút lưu, dung lượng, ước tính USD/tháng (5 USD / 1 000 phút lưu).
- Tệp tài liệu · Supabase: đệ quy `storage.from("tailieu").list()` (thư mục con theo id buổi), cộng `metadata.size`.
- Ảnh đại diện · Supabase + ô tổng có thanh phần trăm so với 1 GB gói miễn phí.

**Trạng thái SQL:** `/api/trang-thai` báo v9, v10, v11, v12, v14, v16, v17 đều đã chạy — không còn file nào chờ.

---

---

## 2026-09-09 (rạng sáng 10/9) — Quỹ thời lượng xem video + đếm lượt xem

**M muốn:** đặt quỹ thời gian xem cho từng video (30/60/90/120 phút), hết quỹ thì video ẩn khỏi giao diện sinh viên; và có bộ đếm lượt xem để thống kê.

**Đã làm**
- `schema_v16_gioi_han_xem.sql`: `materials.gioi_han_giay` (0 = không giới hạn), `view_events.tong_giay` (cộng dồn), trigger `ve_chan_gian_lan` (sinh viên chỉ được cộng, mỗi lần tối đa +60 giây và +1 lượt; máy chủ/giảng viên miễn), RPC `ghi_gio_xem(p_material, p_them)` trả về quỹ còn lại.
- `worker.js` trong `streamToken`: đọc `gioi_han_giay` + `tong_giay`; hết quỹ → `het_luot` (403), còn quỹ → trừ trước **120 giây phí mở** rồi ký vé sống đúng `con_lai + 10 phút` (tối đa 4 giờ). Giảng viên không bị trừ.
- `web/index.html`: đếm thời lượng **thực sự xem** (chỉ cộng phần chạy tiến tới, delta ≤ 15 giây; tua không tính), gửi `ghi_gio_xem` mỗi 20 giây và khi đóng cửa sổ xem; hàng tài liệu hiện "còn N phút xem"; hết quỹ thì video rời danh sách, gom vào mục "Đã dùng hết lượt xem" có giải thích.
- `web/quan-tri.html`: ô **Giới hạn thời lượng xem** khi thêm/sửa video (0/30/45/60/90/120/180/240/300 phút); tab Theo dõi thêm cột **Lượt mở** và **Giờ xem** (kèm số em đã hết lượt), nhãn "quỹ N phút" cạnh tên video.

**Đã test** (trang thử): còn quỹ → hàng video hiện "còn 45 phút xem"; hết quỹ → video biến khỏi danh sách, hiện mục "Đã dùng hết lượt xem". Cú pháp worker + hai trang OK.

**Nới quỹ riêng cho từng sinh viên** (m yêu cầu thêm ngay sau đó): `schema_v17_noi_quy_rieng.sql` — cột `view_events.quy_them` (giây), trigger giữ luôn cột này (sinh viên không tự nới), RPC `noi_quy_xem(p_user, p_material, p_phut)` chỉ giảng viên gọi được, có upsert kèm session_id/class_id để dòng mới vẫn hiện trong Theo dõi; `ghi_gio_xem` trả quỹ đã cộng phần nới. Worker tính `quyTong = gioi_han_giay + quy_them`. Quản trị: trong Theo dõi, mỗi sinh viên ở video có quỹ thành một nút `Tên 58/60 p` (viền đỏ khi hết, ⊕ khi đang được nới) → bấm mở hộp nhập số phút nới.

**Cần m chạy:** một file duy nhất `schema_v16_v17_gop.sql` (gộp v16 + v17).

**Sửa thêm sau khi m báo lỗi ở tab Theo dõi:** thiếu cột mới thì tab **không vỡ nữa** — tự lùi về bộ cột cũ, tạm ẩn phần giờ xem/nới quỹ và hiện một dòng nhắc đúng tên file cần chạy (trước đây báo nhầm `schema_v9_hom_nay.sql`). `/api/trang-thai` cũng kiểm luôn v16/v17 nên t hỏi máy chủ là biết còn thiếu gì, khỏi đoán.

---

---

## 2026-09-09 (khuya, sau) — Khoá máy theo mã máy thật (app 1.0.16)

**M hỏi:** cài bản app mới xong tài khoản SV bị đòi gỡ thiết bị, phiền; có phải gắn theo IP không?

**Trả lời:** không dính IP (IP chỉ dùng cho vé xem video 4 giờ). Mã thiết bị là UUID ngẫu nhiên cất trong `localStorage`, mà `localStorage` gắn theo **tên miền** → lần đổi miền sang giangduonghoahoc đã làm mọi ràng buộc cũ thành "máy lạ". Cài lại app / xoá dữ liệu duyệt web cũng mất y hệt.

**Đã làm (m chọn phương án mã máy thật)**
- `app/main.js`: đọc mã máy — Windows `reg query HKLMSOFTWAREMicrosoftCryptography /v MachineGuid`, macOS `ioreg -rd1 -c IOPlatformExpertDevice` → `IOPlatformUUID`; không đọc được thì UUID cất ở `userData/may.txt`. Băm `sha256('giang-duong-hoa-hoc:' + goc)` lấy 32 ký tự → máy chủ không bao giờ giữ mã gốc. Kênh `lophoc:ma-may`.
- `app/preload.js`: thêm `getMachineId()`.
- `web/index.html`: `maThietBi()` thành async — trong app trả `app:<băm>`, trình duyệt vẫn dùng localStorage như cũ. Lời chặn nói rõ "cập nhật app hay cài lại app KHÔNG bị chặn".
- `web/quan-tri.html`: cột Thiết bị phân biệt "đã gắn máy (app)" và bản trình duyệt, chú thích khi rê chuột.
- `schema_v15_khoa_may.sql`: xoá sạch ràng buộc kiểu cũ **một lần** sau khi app 1.0.16 phát.
- App lên **1.0.16**.

**Đã test:** chạy đúng lệnh đọc MachineGuid trên máy m — ra 36 ký tự, băm còn 32, lặp lại y hệt. Cú pháp main.js/preload.js/hai trang đều OK.

---

---

## 2026-09-09 (khuya) — Nối xong Cloudflare Stream: bẫy Ctrl+V trong ô nhập khoá

**Triệu chứng:** thêm video báo `khong_xin_duoc_cho`; dò ra `/api/trang-thai` cho thấy ngay cả lệnh CHỈ ĐỌC `GET /stream?per_page=1` cũng trả **HTTP 400** → lỗi không ở phần tus mà ở khoá.

**Nguyên nhân:** cả `CF_ACCOUNT_ID` lẫn `CF_STREAM_TOKEN` chỉ dài **1 ký tự, mã 0x16** — đúng ký tự mà **Ctrl+V** chèn vào ô ẩn của `wrangler secret put` (cửa sổ đó không dán bằng phím tắt được, phải chuột phải). Bài học: đừng bao giờ dùng `secret put` tương tác nữa.

**Cách làm chuẩn từ nay:** tạo tệp `khoa.txt` (JSON `{"TEN_KHOA": "giá trị"}`, đã cho vào .gitignore) đặt sẵn trong `Hoc_Online`, mở bằng Notepad để dán, rồi `npx.cmd wrangler secret bulk khoa.txt` — không hỏi gì, không có ô ẩn. Xong xoá tệp.

**Công cụ dò còn lại:** `/api/trang-thai` báo `stream` (đủ hai secret chưa), `thu_stream` (Cloudflare trả mã gì cho lệnh chỉ đọc) và `sql` (đã chạy schema_v9/10/11/12/14 chưa). Phần in hình dạng khoá đã gỡ sau khi sửa xong.

**Trạng thái:** Stream đã trả 200, `schema_v14_video.sql` đã chạy. Chờ m thử tải video thật.

---

---

## 2026-09-09 (đêm) — Tải video lớn tới 30 GB ngay trong trang quản trị

**M hỏi:** video trên 200 MB thì sao (bài giảng cả buổi thường 0,5–2 GB).

**Đã làm**
- `worker.js`: `POST /api/stream/tai-len-lon` { name, size } → gọi Cloudflare `POST /stream?direct_user=true` kèm `Tus-Resumable`, `Upload-Length`, `Upload-Metadata` (name, requiresignedurls, allowedorigins = host trang, maxdurationseconds) → trả `endpoint` (địa chỉ tus dùng một lần) + `uid`. Khoá tài khoản không rời Worker.
- `quan-tri.html`: nạp `tus-js-client@4.3.1` từ jsDelivr (cdnjs không có gói này). Tệp ≤ 190 MB vẫn gửi một lần; lớn hơn thì cắt khúc 50 MB, có thanh tiến trình + nút Dừng, `retryDelays` tự thử lại, chọn lại đúng tệp là nối tiếp chỗ dở. Đóng hộp thoại thì `closeDlg` huỷ tải.
- `HUONG_DAN_VIDEO.md`: viết lại mục B (B1 tải thẳng mọi cỡ, B2 dự phòng qua Hosted videos), thêm hai dòng xử lý lỗi.

**Chưa test với tệp thật** — cần m thử một video lớn rồi báo lại.

---

---

## 2026-09-09 (tối muộn) — Đổi tên nhánh Cloudflare: địa chỉ trang thành giangduonghoahoc

**Chuyện gì:** m thử đổi Subdomain của tài khoản Cloudflare thành `giangduonghoahoc`. Đổi tên nhánh là **dời toàn bộ Worker** sang tên mới và **thu hồi tên cũ ngay** → `lop-hoc-online.maknoonnjs94.workers.dev` chết (DNS báo không tồn tại ở mọi máy chủ phân giải), trong khi ô *Account details* vẫn hiện tên cũ do trang chưa làm mới. T đoán nhầm là "đường workers.dev bị tắt" — thực ra toggle vẫn bật.

**Cách nhận ra:** `nslookup` một tên bịa cùng nhánh (`zzz-khong-co.maknoonnjs94…`) cũng NXDOMAIN → hỏng cả nhánh chứ không riêng Worker; một workers.dev khác vẫn phân giải; R2 vẫn 200 → không phải lỗi mạng. Thử `lop-hoc-online.giangduonghoahoc.workers.dev` → 200.

**Đã làm:** m chọn giữ tên mới (hợp với thương hiệu). Thay địa chỉ ở 7 chỗ: `app/main.js` (SITE_URL), `worker.js` (ORIGINS/CORS), `web/index.html` (APP_URL + API_BASE), `web/quan-tri.html` (API_BASE), `wrangler.jsonc`, `HUONG_DAN_VIDEO.md`, nhật ký. App lên **1.0.15**.

**Lưu ý cho sau này:** app đang cài trên máy sinh viên trỏ địa chỉ cũ → mở lên báo không kết nối được, nhưng bộ tự cập nhật lấy bản mới từ **R2** (domain riêng, không đổi) nên sau một lần mở–đóng là tự lên 1.0.15 và vào được. Đừng đổi Subdomain nữa trừ khi chấp nhận phát app mới.

**Nhân tiện:** hai khoá Stream m dán đã vào đủ — `/api/trang-thai` báo `stream: true` với `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.

---

---

## 2026-09-09 (tối) — Video bài giảng qua Cloudflare Stream (link ký, không tải được)

**M yêu cầu:** ưu tiên video; hướng dẫn thật kỹ vì chưa làm bao giờ.

**Đã làm**
- `worker.js`: mô-đun Stream. `POST /api/stream/token` (mọi tài khoản active): kiểm tài liệu → buổi đã mở, tới giờ, sinh viên có trong lớp (giảng viên bỏ qua) → lấy chi tiết video (phải `readyToStream`) → ký JWT RS256 bằng khoá ký của Stream, sống 4 giờ, `accessRules` gắn IP (v4 /32, v6 /64) → trả `embed` = `https://customer-….cloudflarestream.com/<token>/iframe`. Khoá ký tạo **một lần** qua `POST /stream/keys` rồi cất vào bảng `cau_hinh_he_thong` của Supabase (không luật RLS → chỉ service role đọc), nhớ thêm trong bộ nhớ Worker. Giảng viên: `/api/stream/danh-sach`, `/api/stream/chon` (bật `requireSignedURLs` + `allowedOrigins` = host trang), `/api/stream/tai-len` (direct upload ≤ 200 MB). Cần hai secret mới **CF_ACCOUNT_ID**, **CF_STREAM_TOKEN** (API token quyền Account · Stream · Edit); `/api/trang-thai` báo `stream: true/false`.
- `quan-tri.html`: hộp Thêm → Video có "Chọn video đã tải lên" (danh sách từ Stream, thumbnail, thời lượng, đang xử lý %, đã/chưa khoá link) và "Tải video lên (≤ 200 MB)" gửi tệp thẳng lên Cloudflare; chọn xong ô link thành `stream:<uid>`; vẫn dán được link YouTube.
- `index.html`: `material_contents.url` bắt đầu `stream:` → `moStream()` xin token qua `goiApi`, nhúng iframe, dấu chìm, nhớ chỗ xem bằng Stream SDK (`embed.cloudflarestream.com/embed/sdk.latest.js`); thông báo tiếng Việt cho từng lý do (chưa nối kho, đang xử lý %, chưa tới giờ, không trong lớp…).
- `schema_v14_video.sql`: bảng `cau_hinh_he_thong` (RLS bật, không luật). `HUONG_DAN_VIDEO.md`: từng bước bật Stream, lấy Account ID, tạo token, `wrangler secret put`, tải video hai cách, kiểm tra, bảng xử lý lỗi, chi phí.

**Đã test:** ký/xác minh token trong Node bằng WebCrypto (header/payload/kid/exp đúng, luatIp v4/v6 đúng); `wrangler deploy --dry-run` bundle 18 KiB; trang thử `?st=1` mở đúng nhánh Stream và hiện lỗi thân thiện. **Chưa** test với Stream thật — chờ m bật Stream và dán 2 secret.

---

---

## 2026-09-09 (chiều muộn) — Hero tan vào thẻ trở lại, lật bố cục theo nhân vật

**M yêu cầu:** khung khoảnh khắc ở dưới đẹp, nhưng hero hai cột nhìn "như hai mảnh rời rạc" — giữ kiểu ảnh tan vào thẻ của bản trước, hoặc làm mượt hơn.

**Đã làm**
- Quay lại kiểu ảnh phủ tuyệt đối 60 % thẻ, mép trong tan dài (mask 0 → 42 %) vào nền nên ảnh và chữ là một khối. Cột chữ 48 %, chỉ chớm 8 % thẻ vào vùng đã mờ.
- Lỗi che mặt trước đây sửa bằng **bố cục lật theo nhân vật**: bạn nữ đứng bên phải khung ảnh → ảnh phải, chữ trái; bạn nam đứng bên trái khung → lớp `.trai`: ảnh trái, chữ phải (`object-position` và hướng mask đảo theo). Nhân vật luôn ở phía xa chữ.
- Màn hình hẹp: cả hai kiểu đều xếp dọc, ảnh 215 px dưới chữ, tan từ trên.

**Đã test** (trang thử 768 px, nữ-00 và nam-02): nhân vật trọn vẹn, chữ chồng đúng 50 px vào vùng mờ, đổi nhân vật trong "Góc của bạn" là bố cục lật ngay.

---

---

## 2026-09-09 (chiều) — Khung "khoảnh khắc" cho chỗ trống và lúc hoàn thành

**M yêu cầu:** ảnh ở "Bài tập cần làm" lọt thỏm bé tí, không cân — thiết kế lại chỗ đó cho ổn, không chỉ vá một chỗ.

**Đã làm**
- Một khung chung `khoanhKhac(cảnh, tiêu đề, lời, nút)`: lưới hai cột — ảnh phủ trọn cột trái (cao hết khung, bo góc), tiêu đề + lời + nút cột phải. Khung tự đo bề rộng của chính nó (container query): hẹp dưới 480 px thì xếp dọc, ảnh 180 px trên, chữ giữa. Ảnh nhỏ 260 px thả giữa thẻ đã bỏ.
- Áp cho cả bốn chỗ: trang chủ "Bài tập cần làm" trống (*Thảnh thơi rồi!* + nút Xem bài giảng); trang Bài tập trống (*Chưa có bài tập nào*); trang Bài tập khi xong hết bài đang mở (*Xong hết rồi!* — cảnh nộp bài thành công); trang Tiến độ 100 % (*Mở hết tài liệu rồi!* — cảnh hoàn thành mục tiêu). Mục tiêu tuần 100 % thì ảnh trải hết bề rộng thẻ.
- Trang thử có thêm `?het=1` (mọi tài liệu đã xem xong) để xem các trạng thái này.

**Đã test** (trang thử `?g=nam&het=1`, 768 px): thẻ Bài tập cần làm rộng 621 px, ảnh chiếm 272 px; trang Bài tập và Tiến độ ảnh chiếm đúng nửa thẻ, chữ cân bên cạnh; nút "Xem bài giảng" chuyển trang.

---

---

## 2026-09-09 (trưa) — 8 nhân vật 3D, hero hai cột, icon app = logo (1.0.14)

**M yêu cầu:** chữ đang che mất nhân vật trong thẻ "Tiếp tục học" → thiết kế lại theo bộ `design-reference/Cute_3D_6_Models` (3 bảng, 6 nhân vật mới, mỗi bạn 4 cảnh); dùng đủ 4 cảnh trong giao diện; nhân vật đa dạng; đổi icon app sang logo.

**Đã làm**
- Cắt 8 nhân vật × 4 cảnh + 8 khuôn mặt (40 JPEG, ~1,4 MB, mỗi người chỉ tải 5 tệp) → `web/img/scenes/<hoc|xong|trong|nop|mat>-<boy|girl>-<00..03>.jpg`. Toạ độ cắt lấy từ `character_manifest.json`; cặp 00 là cặp gốc trong `03-Minh-hoa-hoc-tap.png`. Mặt các bạn nữ mới phải dời khung sang phải 70 px so với bạn nam (đứng lệch trong cảnh).
- Hero: **hai cột grid** — chữ trái (1fr), ảnh phải (1,1fr) phủ trọn cột, cao 300 px, chỉ tan mép trái 16 % để liền khối; **không còn chữ nào đè lên nhân vật**. Màn hình hẹp: ảnh 215 px nằm dưới chữ.
- Hộp "Góc của bạn": mục Nhân vật thành lưới 4×2 (8 bạn, tên + trang phục); chọn là hero + ảnh tròn đổi ngay. Giá trị cũ `boy`/`girl` tự hiểu thành cặp 00.
- Bốn cảnh dùng ở: *đang học* → hero; *chưa có bài tập* → Bài tập trống (trang chủ + trang Bài tập); *hoàn thành mục tiêu* → Mục tiêu tuần 100 % và Tiến độ 100 %; *nộp bài thành công* → đầu trang Bài tập khi đã xong hết bài đang mở.
- `schema_v13_nhan_vat.sql`: nới ràng buộc `avatar` cho 8 id (giữ boy/girl cũ), cập nhật `doi_giao_dien` hai tham số.
- App **1.0.14**: `app/build/icon.png` = logo tròn trong suốt 512 px; tag `v1.0.14` → GitHub Actions dựng, chép lên R2; Windows tự cập nhật, Mac tải lại.

**Đã test** (trang thử): đo `copy.right − art.left = 0`; đổi sang girl-02 → hero `hoc-girl-02.jpg`, ảnh tròn `mat-girl-02.jpg`; 40 tệp trả 200; không ảnh hỏng.

---

---

## 2026-09-09 (sáng) — Đổi tên "Giảng đường Hóa học", logo, nhân vật chìm vào thẻ

**M yêu cầu:** nhân vật phải là ảnh chìm, lớn hơn, liền khối với giao diện (không khung); đổi tên "Góc học tập" → **Giảng đường Hóa học**; gắn logo (ảnh tròn màu nước: bình tam giác, lá, phân tử, sách, câu "Hóa học khó, có Phạm Ngọc lo"), để to cho dễ xem.

**Đã làm**
- Tranh lớn: cắt lại cảnh học từ `04-Mau-giao-dien-Mint-Peach.png` (bạn nam mint, bạn nữ peach, có giấy nhớ, đèn bàn, chồng sách) → `web/img/scenes/hoc-*.jpg`. Ảnh phủ trọn 62 % cạnh phải thẻ, cao hết thẻ (thẻ nâng lên 300 px), mép trái tan dần bằng mask nên không còn khung; màn hình hẹp thì ảnh nằm dưới chữ, tan dần từ trên xuống.
- Tên: `<title>`, cột trái (hai dòng "Giảng đường / Hóa học"), trang đăng nhập (logo 168 px ở giữa), nút "Vào giảng đường", trợ giúp, thông báo máy, cảnh báo bắt buộc app, trang tải app — không còn chữ "Góc học tập" (nút "Góc của bạn" giữ vì là tên tính năng).
- Logo: m chép `design-reference/logo-giang-duong.png.png` (1254×1254, nền trắng, 1,7 MB). T cắt ô vuông 1130 px ở giữa, vẽ qua mặt nạ tròn → PNG nền ngoài vòng trong suốt: `web/img/logo.png` 400 px (295 KB) dùng ở cột trái (64 px, rail 52 px, điện thoại 46 px), trang đăng nhập (168 px), trang tải app (140 px); `web/img/favicon.png` 128 px thay favicon ô vuông xanh cũ. Thiếu tệp thì trang vẫn tự lùi về icon lá / hình lớp học. Bản 512 px làm icon app đã dựng sẵn ở thư mục tạm, **chưa** đưa vào app (đổi icon app cần phát bản 1.0.14, chờ m gật).

**Đã test** (trang thử): hero nam/nữ đổi theo nhân vật, tan mép đúng; tiêu đề trang, cột trái, trang đăng nhập hiện tên mới; fallback khi thiếu logo chạy đúng.

---

---

## 2026-09-09 (rạng sáng) — Nhân vật trong tranh lớn; sinh viên tự tải ảnh đại diện

**M yêu cầu:** (1) tranh lớn phải có nhân vật nam/nữ như bản cũ nhưng ăn theo 4 giao diện mới; (2) vòng tròn nhỏ cho sinh viên tự tải ảnh của họ lên.

**Đã làm**
- Minh hoạ nhân vật: cắt từ `design-reference/03-Minh-hoa-hoc-tap.png` (bộ 3D ChatGPT dựng, 8 cảnh × 2 nhân vật) ra `web/img/scenes/`: `hoc-*` (đang học bài → tranh lớn thẻ "Tiếp tục học"), `xong-*` (hoàn thành mục tiêu → thẻ Mục tiêu tuần khi đạt 100%), `trong-*` (chưa có bài tập mới → chỗ trống của Bài tập cần làm), `nop-*` (nộp bài thành công, để dành), `mat-*` (khuôn mặt → ảnh đại diện tròn mặc định). Tổng ~300 KB JPEG.
- Lần đầu t vẽ tay bằng SVG vì tưởng chỉ có bộ vector; m nhắc thì thay bằng đúng bộ 3D này, hàm `tranhNhanVat` đã bỏ.
- **Giới hạn của bộ tranh:** chỉ có 2 bảng màu — bạn nam áo xanh mint, bạn nữ áo hồng đào. Nên chọn giao diện Sky hay Lavender thì khung ảnh vẫn giữ màu gốc của nhân vật. Muốn khớp hẳn thì cần ChatGPT dựng thêm 2 bảng màu nữa, đặt tên `hoc-<mẫu>-<boy|girl>.jpg` là t nối vào được.
- Ảnh đại diện thật: mục mới trong hộp "Góc của bạn" — nút **Tải ảnh của bạn** và **Bỏ ảnh, dùng nhân vật vẽ**. Ảnh được vẽ lại vào khung vuông 256×256 bằng canvas **ngay trên máy sinh viên** (bỏ dữ liệu ẩn trong tệp gốc, giảm dung lượng) rồi mới gửi lên kho riêng `avatars` với tên đúng bằng id người dùng. Hiện ảnh qua link ký hạn 1 giờ; chưa có ảnh thì quay về hình nhân vật vẽ, không có thì về chữ tắt tên.
- `schema_v12_anh_dai_dien.sql`: cột `avatar_path`, kho `avatars` riêng (không công khai, tối đa 512 KB, chỉ nhận ảnh), bốn luật truy cập (mỗi người chỉ đọc/ghi ảnh của mình, giảng viên đọc được cả lớp), hàm `dat_anh_dai_dien(p_path)` kiểm đúng tên tệp mới ghi.

**Đã test** (trang thử, Supabase giả): tạo ảnh giả rồi thả vào ô chọn tệp → thu nhỏ, tải lên, hiện ở vòng tròn nhỏ và ô xem trước, nút "Bỏ ảnh" hiện ra; bấm bỏ → quay lại `avatar-girl.svg` đúng giao diện. Đổi nhân vật trong hộp "Góc của bạn" → tranh lớn và ảnh tròn đổi ngay sang bản kia, mọi tệp trả 200, không ảnh hỏng.

**Chưa nối:** trang quản trị chưa hiện ảnh sinh viên trong danh sách lớp (luật đã cho phép giảng viên đọc, chỉ cần thêm phần hiển thị nếu m muốn).

---

---

## 2026-09-08 (khuya) — Bốn giao diện cho sinh viên tự chọn

**M yêu cầu:** đưa bộ `design-reference/StudentHome_4_Themes` (ChatGPT dựng) vào, "cho sv tha hồ chọn".

**Đã làm**
- Chép tài nguyên 4 mẫu vào `web/img/themes/<mint|sky|peach|lavender>/` — mỗi mẫu 40 SVG (tranh nền, hero, avatar nam/nữ, 28 icon minh hoạ, 12 glyph nhỏ), tổng ~540 KB. Bỏ hẳn bộ `img/icons/` và hai ảnh `hero-*.png` cũ.
- `web/index.html`: bốn bảng màu `html[data-skin=...]` lấy đúng token của bộ (Mint #30766b, Sky #386a8c, Peach #965647, Lavender #6c5c94); màu loại tài liệu (`--k-*`) nay suy ra từ token nên tự đổi theo mẫu.
- Nút **Góc của bạn** trên thanh trên cùng (thay hai chấm màu) mở hộp chọn: 4 thẻ màu + 2 nhân vật (bạn nam / bạn nữ), **độc lập nhau**. Chọn xong đổi ngay: tranh nền, hero, icon, avatar ở thanh trên, mascot cột trái.
- Bước khai hồ sơ lần đầu có thêm hàng 4 ô màu; giới tính chỉ còn quyết định **nhân vật mặc định**, không khoá màu.
- Lưu vào hồ sơ qua `rpc('doi_giao_dien', {p_theme, p_avatar})`; máy chủ chưa chạy schema_v11 thì tự lùi về bản một tham số, không lỗi.
- `schema_v11_giao_dien.sql`: nới ràng buộc `theme` thành mint/sky/peach/lavender, thêm cột `avatar` (boy/girl), hàm hai tham số, đặt sẵn nhân vật theo giới tính cho người đã khai.

**Đã test** (trang thử `_test_index.html`, máy chủ nội bộ): đổi lần lượt 4 mẫu — màu chính, tranh nền, hero, icon, avatar đều đổi đúng đường dẫn; 4 mẫu × các tệp chính trả 200; không ảnh nào hỏng; hộp chọn và hàng màu ở bước khai hồ sơ hiện đúng.

---

---

## 2026-09-08 (đêm) — Tạo tài khoản ngay trên trang quản trị; logo app mới

**M yêu cầu:** (1) vào web quản trị tạo và cấp tài khoản trực tiếp cho từng khoá học, tạo xong thấy ngay trong danh sách lớp; (2) icon app xấu, đổi logo.

**Đã làm**
- `worker.js` + `wrangler.jsonc` (`main`, `assets.binding`): một Worker nhỏ chạy cạnh file tĩnh, hai đường `POST /api/tao-tai-khoan` và `POST /api/cap-lai-mat-khau`. Người gọi gửi access token Supabase; Worker hỏi Supabase token là ai, hồ sơ phải là teacher/admin còn active. Tạo tài khoản bằng Admin API (`email_confirm: true`), mật khẩu tạm 10 ký tự dễ đọc có gạch giữa, upsert hồ sơ (tên, mã SV, `must_change_pw = true`), ghi danh vào lớp (trigger "một tài khoản một khoá" vẫn chạy); email đã có tài khoản thì chỉ ghi danh qua `enroll_by_email` bằng quyền của chính giảng viên. Khoá `SUPABASE_SERVICE_ROLE_KEY` là **secret của Worker** — m dán một lần trong Cloudflare (HUONG_DAN.md, mục "Tạo tài khoản cho sinh viên"); không nằm trong mã, kho, hay trình duyệt.
- Quản trị → tab Sinh viên: nút **＋ Tạo tài khoản mới** (dán nhiều dòng `email, họ tên, mã SV`, tối đa 60 người), bảng kết quả hiện mật khẩu tạm **một lần** + Sao chép / Tải .txt, dòng lỗi nói rõ vì sao; mỗi sinh viên có nút **Cấp lại mật khẩu** (thay nút "Bắt đổi mật khẩu" cũ chỉ bật cờ). Chạy trên localhost thì trang gọi thẳng Worker thật (CORS mở cho localhost:8765).
- Logo app: ô vuông bo góc xanh ngọc đậm (`#1d9aa4 → #0a5058`, ánh sáng nhẹ góc trên) + minh hoạ "lớp học" (sách + mũ tốt nghiệp) của bộ icon, dựng bằng GDI+ từ PNG 512 của gói → `app/build/icon.png` (512 px, electron-builder tự sinh .ico/.icns); `web/img/favicon.png` 256 px gắn vào cả ba trang. App lên **1.0.13** (tag `v1.0.13`) để máy Windows đang cài 1.0.12 tự cập nhật; Mac tải lại từ `/tai-app`. Icon trên thanh tác vụ Windows có thể còn hiện hình cũ tới khi Windows làm mới bộ đệm icon (đăng xuất/vào lại).

**Đã test:** `npx wrangler deploy --dry-run` dựng bundle OK (Worker 8,5 KiB + 63 file tĩnh, binding ASSETS); cú pháp quan-tri.html và worker.js OK. **Chưa** test tạo tài khoản thật vì máy chủ chưa có khoá — m dán khoá xong thử với một email trước.

---

---

## 2026-09-08 (tối) — Mint / Peach, khai hồ sơ lần đầu, bộ icon minh hoạ

**M yêu cầu:** đưa bản thiết kế ChatGPT vẽ (thư mục `design-reference/`) vào trang học; sinh viên đăng nhập lần đầu phải đổi mật khẩu rồi khai họ tên, ngành, giới tính, năm sinh; giao diện chọn theo giới tính. Sau đó m thêm `design-reference/LearningIcons_48` và bảo dùng cho đẹp hơn.

**Đã làm**
- `web/index.html` viết lại toàn bộ phần giao diện, **giữ nguyên** toàn bộ logic cũ (đăng nhập, khoá thiết bị, canh gác, Hôm nay, xem tài liệu, realtime, Ctrl+K):
  - Skin đặt ở `<html data-skin="mint|peach">`, mọi màu đi qua token CSS nên đổi skin là cả trang đổi. Màu lấy đúng `design_tokens.json` (Mint `#137c85` / Peach `#7650af`).
  - Bố cục theo `layout.json`: cột trái 224 px (Trang chủ / Bài giảng / Bài tập / Lịch học / Tiến độ + robot nhắc nhở), thanh trên (tìm → Ctrl+K, chuông, hai chấm đổi skin, avatar), trang chủ = Tiếp tục học (ảnh nhân vật) · Lịch hôm nay · 3 ô nhanh · Bài tập cần làm · Mục tiêu tuần. Thu gọn ở 1199 / 899 / 639 px.
  - Luồng lần đầu (chỉ sinh viên): `must_change_pw` → form mật khẩu mới (`auth.updateUser` rồi `rpc('da_doi_mat_khau')`); `onboarded_at` trống → form họ tên / giới tính (chọn tới đâu đổi màu xem trước) / năm sinh / mã SV / ngành (`rpc('hoan_tat_ho_so')`). Nam → Mint, nữ → Peach, "khác" → Mint và tự đổi; nút đổi skin lưu bằng `rpc('doi_giao_dien')`.
  - Ảnh: cắt từ `04-Mau-giao-dien-Mint-Peach.png` và `StudentHome.png` thành `web/img/hero-mint.png` (cậu bé bên laptop), `hero-peach.png` (cô gái áo hồng); nền `backdrop-*.svg` chép nguyên.
- `web/quan-tri.html`: cột **Hồ sơ** (giới tính · ngành · năm sinh · MSSV, nhãn *chưa khai hồ sơ* / *chưa đổi mật khẩu*), nút **Bắt đổi mật khẩu**; nếu máy chủ chưa chạy v10 thì tự lùi về bộ cột cũ.
- `schema_v10_ho_so.sql`: cột `gender, birth_year, major, theme, onboarded_at, must_change_pw` + 3 hàm `hoan_tat_ho_so`, `da_doi_mat_khau`, `doi_giao_dien` (security definer, chỉ sửa dòng của chính mình). Giảng viên/admin được đặt sẵn đã xong.
- `schema_v10b_ho_so_thieu_dong.sql`: tài khoản chưa có dòng `profiles` vẫn khai được (hàm chuyển sang insert … on conflict), tạo dòng thiếu cho mọi tài khoản đang có, câu kiểm tra một email. Trang cũng sửa: không có dòng hồ sơ → coi như sinh viên mới.
- Bộ icon `LearningIcons_48`: chép 48 SVG (200 KB, bỏ 3,6 MB PNG) vào `web/img/icons/<skin>/<tên>.svg`. Trong trang dùng `lic(name, size)` tạo `<img class="lic">`, `capNhatLic(skin)` đổi tệp khi đổi skin. Đặt ở: 3 ô nhanh (homework / video-lesson / documents), Lịch hôm nay (calendar, có buổi → live-class), Mục tiêu tuần (progress, đủ 100 % → achievement), thống kê Tiến độ, mọi trạng thái trống, mascot cột trái (`help.svg` thay ảnh cắt `bot-*.png`, đã xoá), đăng nhập (classroom), khai hồ sơ (settings / profile), trợ giúp (help), trang tải app (download). Thanh điều hướng và hàng tài liệu vẫn dùng bộ nét mảnh vì bộ minh hoạ chỉ đẹp từ 48 px (theo `CLAUDE_ASSET_GUIDE.md`).

**Đã test:** trang thử `web/_test_index.html` (Supabase giả, sinh bằng script trong scratchpad, đã gitignore) ở 1440 / 1000 px, ba cảnh: nữ (Peach), nam (Mint), lần đầu (`?onb=1`); kiểm cú pháp JS bằng node; kiểm trang thật sau khi phát: có mã khai hồ sơ, tệp icon trả 200.

**Chưa nối / chưa biết:** m báo `sv.thu@example.com` chưa thấy luồng mới — xem mục Trạng thái.

---

---

## 2026-09-08 (chiều) — Trang chủ "Hôm nay", chuông, Ctrl+K, làm lại quản trị

**M chọn** làm cả 4 đề xuất (1 2 3 4) với điều kiện: giờ giấc phải sửa dễ, không cứng nhắc vì bài giảng đẩy lên không theo lịch cố định.

**Đã làm**
- Buổi học có thêm `pinned` (Ghim = "đang học", luôn lên đầu), `starts_at` (giờ bắt đầu, **tuỳ chọn**), lớp có `notice` (thông báo tự do). Không có giờ thì xếp theo lúc đẩy bài mới nhất. → `schema_v9_hom_nay.sql`, cùng bảng `view_events` (đã xem / tiến độ đọc trang, giây video) và bật realtime cho `materials`, `sessions`, `classes`.
- Trang học: "Hôm nay" (buổi ghim + thông báo + bài mới), nhãn **MỚI** theo mốc lần vào trước, "Tiếp tục" đúng trang PDF / giây video (YouTube IFrame API), chuông 🔔 liệt kê bài mới, thông báo tức thì khi giảng viên vừa giao (realtime + Notification máy), nhắc 30 phút trước giờ học, **Ctrl+K** tìm buổi / tài liệu gõ không dấu.
- Quản trị: nút Ghim, ô giờ bắt đầu, hộp "✎ Lớp & thông báo", tab **Theo dõi** (ai xem gì lúc nào), làm lại toàn bộ giao diện theo hệ thiết kế của trang học (Be Vietnam Pro, icon một nét), chip thanh đầu không xuống dòng.
- `web/_headers`: HTML `no-cache, must-revalidate` — sửa xong mở lại là thấy, không cần Ctrl+F5.
- Snipping Tool / Game Bar / QuickTime **chỉ mở** thì nhắc nhẹ, không tính vi phạm (m lo sinh viên khiếu nại); phần mềm quay thật sự (OBS, Bandicam…) mới tính.

---

---

## 2026-09-08 — App máy tính (Electron) và phát hành qua Cloudflare R2, bản 1.0.1 → 1.0.12

**Lý do:** trình duyệt không chặn được quay màn hình; m muốn chặn triệt để trên Windows lẫn macOS.

**Đã làm** (`app/`)
- `main.js`: `setContentProtection(true)` → cửa sổ **hiện đen** trong mọi ảnh chụp / bản quay (Windows `WDA_EXCLUDEFROMCAPTURE`, macOS `NSWindowSharingNone`); chỉ một cửa sổ; ẩn menu; chặn Ctrl+P/S/U, F12, DevTools; user agent gắn `LopHocApp/<bản>` để trang biết đang ở trong app; dò tiến trình quay (`tasklist` / `ps`) mỗi vài giây và báo cho trang qua `preload.js` (`window.lopHocApp`).
- Tự cập nhật bằng `electron-updater` (chỉ Windows; Mac chưa ký nên tải tay), kho `latest.yml` + `.exe` trên R2. Menu tài khoản có "Kiểm tra cập nhật · bản x.y.z".
- Dựng bằng GitHub Actions (`.github/workflows/build-app.yml`): matrix Windows + macOS, `--publish never`, đưa lên Releases bằng bước riêng, **chép lên R2** bằng aws cli (mạng Việt Nam vào GitHub chập chờn nên sinh viên tải từ R2).
- Trang `/tai-app` với link cố định `…r2.dev/LopHoc-win.exe`, `…/LopHoc-mac.dmg`.

**M đã làm bên ngoài:** bật R2, tạo bucket (đổi tên thành `giang-duong-hoa-hoc-app`), bật Public URL, tạo API token, dán vào GitHub Secrets. Khoá chỉ m thấy — t không nhận, không chụp.

**Lỗi đã gặp và sửa (mỗi lần một bản 1.0.x):** hai job cùng tạo Release (đua) → `--publish never`; ký tự CR lọt vào YAML từ script vá viết bằng heredoc → workflow chạy mà không có job, sửa bằng `lf()`; `${#VAR}` trong template literal; bucket sai tên; Access Key ID dán kèm Enter ("Invalid header value"); hai khoá dán tráo chỗ (64/32) → workflow tự cắt khoảng trắng, tự đảo, báo rõ độ dài; GitHub API bị giới hạn 60 lần/giờ → đọc trạng thái run bằng cách cào trang HTML. Bản **1.0.12** lên R2 thành công.

**Giới hạn nói rõ với m:** trình duyệt không thấy được Win+Shift+S / chụp bằng điện thoại; chỉ app mới làm cửa sổ đen; quay bằng điện thoại thì chịu, còn dấu chìm tên.

---

---

## 2026-09-08 — Bảo mật cho sinh viên: khoá thiết bị, canh gác chụp, tự đăng xuất, giao diện laptop

**M yêu cầu:** tài liệu / PDF chặn tải, video chỉ xem, **mỗi tài khoản một thiết bị**, cảnh báo khi bấm Print Screen và "phải doạ nó mới sợ", 5 phút không thao tác thì đăng xuất, giao diện đẹp hơn cho laptop.

**Đã làm**
- `schema_v5_khoa_thiet_bi.sql`: bảng `device_bindings`, hàm `claim_device` (máy đầu tiên được gắn, máy khác bị từ chối ở **máy chủ**), `reset_device` cho giảng viên; quản trị có cột Thiết bị + nút Gỡ. Giảng viên miễn.
- `schema_v6/v7/v8`: bảng `screenshot_events` + tab **Cảnh báo** ở quản trị (realtime), các kiểu: printscreen, win_snip, quay, nghi_chup, in, luu.
- Trang học: PrintScreen (keyup) → xoá clipboard + cảnh báo đỏ + ghi sự kiện; Win+Shift+S và mất tiêu điểm khi đang mở tài liệu → che mờ + cảnh báo; Ctrl+P / Ctrl+S chặn; **3 lần** thì đóng phiên, đăng nhập lại thấy lý do; dấu chìm tên + email + giờ phủ khắp tài liệu; chuột phải / kéo thả tắt; PDF vẽ bằng pdf.js lên canvas (không có link tải); video nhúng YouTube / Drive / Vimeo.
- Idle 5 phút: hộp đếm ngược 30 giây, hết thì đăng xuất.
- Giao diện hai cột cho laptop (buổi bên trái, tài liệu bên phải), icon SVG một nét, Be Vietnam Pro.

**Lỗi đã gặp:** m thử PrtSc lần 1 trượt lần 2 được và không thấy cảnh báo → cảnh báo bị `display` của class đè lên `hidden` → thêm `[hidden]{display:none!important}` và làm cảnh báo nổi to; Snipping Tool mở đã bị tính vi phạm → tách hai mức (xem mục chiều).

---

---

## 2026-09-08 (sáng) — "Giao cho lớp", đợt 62–63 của Sổ, vụ mất 12 câu

- Sổ Bài Tập bản web có nút **📤 Giao cho lớp** ở cột trái (nhóm Xuất): đẩy phiếu / đáp án lên buổi học không qua tải file. M chọn "**Chỉ bản đọc trên web, bỏ PDF**" cho bước tiếp (chưa làm: cần `web/sheet.css` + đổi `doSend` trong `shim_supabase.js` lưu HTML `#sheet` vào `material_contents.body`).
- Luật mỗi tài khoản một khoá học (`schema_v4_mot_khoa.sql`), báo rõ khi thêm sinh viên trùng khoá.
- Ghi lên kho theo hàng đợi 4 lệnh, tự thử lại, báo khi ghi hỏng.
- Vụ web thiếu 12 câu (13/50, 15/50) trong khi artifact có 160: t đã cãi sai hai lần vì ba "nguồn" đều là `read_db`. Nguyên nhân: sổ trộn `localStorage` vào bản máy chủ nên màn hình đủ mà máy chủ thiếu. Sửa ở đợt 63 (đẩy câu chỉ nằm trên máy lên máy chủ, nút ⇪), gửi m bản sao lưu 160 câu để nạp vào web. Chi tiết ở nhật ký của Sổ.

---

---

## 2026-09-07 — Dựng hệ thống lớp học online

- Supabase: `schema.sql` (profiles, classes, enrollments, sessions, materials, material_contents, kho tệp `tailieu`), `schema_v2.sql`, `schema_v3_so.sql` (kho của Sổ trên Supabase); RLS chặn ở máy chủ; `tao_du_lieu_thu.sql`, `kiem_tra_quyen.sql`.
- `web/index.html` (sinh viên), `web/quan-tri.html` (giảng viên), `web/so-bai-tap.html` (Sổ Bài Tập bản web, sinh từ mã nguồn bằng `build_web_so.js` + `shim_supabase.js` giả `window.claude`).
- Đưa lên Cloudflare Workers, chỉ đăng thư mục `web/`.
- `HUONG_DAN.md`: dựng từ đầu và vận hành hằng ngày.

---

---

## Việc còn dang dở / đề xuất (chưa làm)

- Bản đọc trên web thay PDF khi "Giao cho lớp" (m đã chọn) — `web/sheet.css` + `doSend`.
- Kiểm tra lại thiết bị định kỳ 2 phút một lần trong lúc học (hiện chỉ kiểm khi đăng nhập).
- Nút sao lưu toàn bộ dữ liệu lớp ở quản trị.
- Video: Cloudflare Stream với link ký (cần m bật Stream, đưa `STREAM_KEY_ID` / `STREAM_JWK` vào Worker secrets).
- Tạo tài khoản sinh viên hàng loạt từ quản trị (Edge Function).
- Ký số app (Windows / Mac) để Mac cũng tự cập nhật; tên miền riêng.
- Sau khi test xong: `REQUIRE_APP = true`.

## Ghi chú kỹ thuật (để làm tiếp cho nhanh)

- Vá file lớn bằng script node có `once(find, replace)`; **luôn** `lf()` cả find lẫn replace (script viết qua heredoc trên Windows mang CRLF, CR lọt vào YAML là workflow chết lặng); không dùng `${` trong template literal của script vá.
- Kiểm YAML workflow bằng js-yaml trước khi đẩy; đếm CR bằng node, `grep -c '\r'` trong Git Bash này không tin được.
- Xem thử trang không cần đăng nhập: `web/_test_index.html` (Supabase giả). Máy chủ tĩnh cho pane trình duyệt: `.claude/launch.json` cấu hình "web" chạy `.claude/serve_web.js` cổng 8765; mở `file://` kèm `?query` làm tab pane tự đóng, zoom trong pane hay lỗi → dùng `resize_window` 1440×900 rồi chụp.
- `read_db` của artifact chỉ thấy phần trên máy chủ; sổ trộn `localStorage` nên màn hình có thể đủ mà máy chủ thiếu — đừng lấy `read_db` làm bằng chứng cãi m.
- Chỉ khoá `sb_publishable_…` được nằm trong mã. Khoá R2, `service_role`: m tự dán, t không nhận.
- App: `SITE_URL` trong `app/main.js`; đổi phần vỏ mới cần tăng `version` trong `app/package.json`, gắn tag `v1.0.x` và đẩy → workflow dựng + chép lên R2; đổi trang web thì không cần bản app mới.
- Bảng SQL đã chạy theo thứ tự: schema → v2 → v3_so → v4_mot_khoa → v5_khoa_thiet_bi → v6 → v7 → (v8, v9 chưa xác nhận) → v10 ✔ → v10b (mới gửi).
