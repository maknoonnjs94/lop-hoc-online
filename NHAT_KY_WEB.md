# Nhật ký làm việc — Lớp học online (web + app máy tính)

**Trang học:** https://lop-hoc-online.giangduonghoahoc.workers.dev/ (đổi từ …maknoonnjs94… ngày 09/9 khi đổi tên nhánh Cloudflare; tên cũ đã chết) (Cloudflare Workers, phát tự động sau mỗi lần đẩy lên GitHub, trễ 1–3 phút)
**Kho mã:** https://github.com/maknoonnjs94/lop-hoc-online (thư mục này, `git log` là lịch sử đầy đủ từng lần sửa)
**Máy chủ dữ liệu:** Supabase, dự án `euyrrodppbpnkmificbs` — khoá `service_role` không bao giờ nằm trong kho mã hay trong nhật ký này
**App máy tính:** tải tại `/tai-app` → Windows `LopHoc-win.exe`, macOS `LopHoc-mac.dmg` (kho Cloudflare R2 `giang-duong-hoa-hoc-app`)
**Nhật ký của Sổ Bài Tập (artifact):** `..\So_Bai_Tap_HUS\NHAT_KY_PHIEN_LAM_VIEC.md` — file này chỉ ghi phần web + app.

Cách đọc: mục mới nhất ở trên. Mỗi mục: làm gì, m đã phải làm gì bên ngoài (SQL, khoá), đã test gì, còn gì.

---

## Trạng thái hiện tại (2026-09-08, tối)

Đang chạy trên web:
- Tên hệ thống: **Giảng đường Hóa học**, logo tròn màu nước ở cột trái / đăng nhập / favicon. Trang học sinh viên: **4 giao diện tự chọn** (Mint Explorer / Sky Captain / Peach Garden / Lavender Dream) × 8 nhân vật 3D, lần đầu đăng nhập **đổi mật khẩu → khai hồ sơ**, trang chủ "Hôm nay", chuông tài liệu mới, Ctrl+K, xem PDF/video/bản đọc, dấu chìm tên, canh gác chụp / quay / in, khoá một thiết bị, tự đăng xuất sau 5 phút, bộ icon minh hoạ màu.
- Trang quản trị: Buổi học / Sinh viên (**Tạo tài khoản mới**, Thêm bằng email, cột Hồ sơ, Cấp lại mật khẩu, gỡ thiết bị) / Kho tệp / Theo dõi / Cảnh báo.
- Worker `worker.js` cạnh file tĩnh: `/api/tao-tai-khoan`, `/api/cap-lai-mat-khau` (secret `SUPABASE_SERVICE_ROLE_KEY`, đã có) và `/api/stream/*` cho video (cần thêm `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN` — chưa có).
- App máy tính bản **1.0.15** (địa chỉ trang mới giangduonghoahoc; icon logo Giảng đường; lên R2 lúc 23:46 ngày 08/9): vỏ Electron tải thẳng trang web, cửa sổ được hệ điều hành chống chụp/quay, dò phần mềm quay, tự cập nhật (Windows) qua R2.

M còn phải làm:
1. **Cloudflare → Workers & Pages → lop-hoc-online → Settings → Variables and Secrets → Add**: Type Secret, tên `SUPABASE_SERVICE_ROLE_KEY`, giá trị = khoá service_role (Supabase → Project Settings → API Keys) → Deploy. Không có nó thì nút "Tạo tài khoản mới" báo "Máy chủ chưa có khoá quản trị".
2. Bên Supabase → SQL Editor (nếu chưa chạy): `schema_v8_kieu_quay.sql`, `schema_v9_hom_nay.sql` — t chưa thấy m xác nhận. Thiếu v9 thì Ghim / giờ bắt đầu / thông báo lớp / đã xem-tiếp tục không lưu được.
3. `schema_v10_ho_so.sql` — **đã chạy**; `schema_v10b_ho_so_thieu_dong.sql` — **đã chạy**.
4. `schema_v11_giao_dien.sql` (4 màu + nhân vật), `schema_v12_anh_dai_dien.sql` (kho ảnh đại diện), `schema_v13_nhan_vat.sql` (8 nhân vật) — chưa chạy thì trang vẫn dùng được, chỉ là lựa chọn không lưu lên máy chủ và chưa tải ảnh lên được.
5. `don_trung_so.sql` câu 3 — xoá tài khoản admin "Phạm Anh Ngọc" bị trùng (vẫn còn 2 dòng).
6. **Video**: làm theo `HUONG_DAN_VIDEO.md` phần A (bật Stream, Account ID, API token, 2 lệnh `wrangler secret put`, chạy `schema_v14_video.sql`).
7. Khi đã chạy đủ 7 luồng test bằng app thật: đổi `REQUIRE_APP = false` → `true` trong `web/index.html` để sinh viên bắt buộc dùng app.

Đã xong: m chạy v10b, câu kiểm tra cho thấy `sv.thu@example.com` đã đi trọn luồng lúc 17:39 (08/9): `must_change_pw = false`, `onboarded_at` có giờ, tên "Bành Thị Lệ Xuân", giới tính nữ → giao diện Peach. Lần "chưa thấy" trước đó là app/trình duyệt còn giữ trang cũ. Muốn xem lại luồng lần đầu thì đặt lại bằng `update public.profiles set must_change_pw = true, onboarded_at = null where email = 'sv.thu@example.com';`.

---

## 2026-09-09 (khuya) — Nối xong Cloudflare Stream: bẫy Ctrl+V trong ô nhập khoá

**Triệu chứng:** thêm video báo `khong_xin_duoc_cho`; dò ra `/api/trang-thai` cho thấy ngay cả lệnh CHỈ ĐỌC `GET /stream?per_page=1` cũng trả **HTTP 400** → lỗi không ở phần tus mà ở khoá.

**Nguyên nhân:** cả `CF_ACCOUNT_ID` lẫn `CF_STREAM_TOKEN` chỉ dài **1 ký tự, mã 0x16** — đúng ký tự mà **Ctrl+V** chèn vào ô ẩn của `wrangler secret put` (cửa sổ đó không dán bằng phím tắt được, phải chuột phải). Bài học: đừng bao giờ dùng `secret put` tương tác nữa.

**Cách làm chuẩn từ nay:** tạo tệp `khoa.txt` (JSON `{"TEN_KHOA": "giá trị"}`, đã cho vào .gitignore) đặt sẵn trong `Hoc_Online`, mở bằng Notepad để dán, rồi `npx.cmd wrangler secret bulk khoa.txt` — không hỏi gì, không có ô ẩn. Xong xoá tệp.

**Công cụ dò còn lại:** `/api/trang-thai` báo `stream` (đủ hai secret chưa), `thu_stream` (Cloudflare trả mã gì cho lệnh chỉ đọc) và `sql` (đã chạy schema_v9/10/11/12/14 chưa). Phần in hình dạng khoá đã gỡ sau khi sửa xong.

**Trạng thái:** Stream đã trả 200, `schema_v14_video.sql` đã chạy. Chờ m thử tải video thật.

---

## 2026-09-09 (đêm) — Tải video lớn tới 30 GB ngay trong trang quản trị

**M hỏi:** video trên 200 MB thì sao (bài giảng cả buổi thường 0,5–2 GB).

**Đã làm**
- `worker.js`: `POST /api/stream/tai-len-lon` { name, size } → gọi Cloudflare `POST /stream?direct_user=true` kèm `Tus-Resumable`, `Upload-Length`, `Upload-Metadata` (name, requiresignedurls, allowedorigins = host trang, maxdurationseconds) → trả `endpoint` (địa chỉ tus dùng một lần) + `uid`. Khoá tài khoản không rời Worker.
- `quan-tri.html`: nạp `tus-js-client@4.3.1` từ jsDelivr (cdnjs không có gói này). Tệp ≤ 190 MB vẫn gửi một lần; lớn hơn thì cắt khúc 50 MB, có thanh tiến trình + nút Dừng, `retryDelays` tự thử lại, chọn lại đúng tệp là nối tiếp chỗ dở. Đóng hộp thoại thì `closeDlg` huỷ tải.
- `HUONG_DAN_VIDEO.md`: viết lại mục B (B1 tải thẳng mọi cỡ, B2 dự phòng qua Hosted videos), thêm hai dòng xử lý lỗi.

**Chưa test với tệp thật** — cần m thử một video lớn rồi báo lại.

---

## 2026-09-09 (tối muộn) — Đổi tên nhánh Cloudflare: địa chỉ trang thành giangduonghoahoc

**Chuyện gì:** m thử đổi Subdomain của tài khoản Cloudflare thành `giangduonghoahoc`. Đổi tên nhánh là **dời toàn bộ Worker** sang tên mới và **thu hồi tên cũ ngay** → `lop-hoc-online.maknoonnjs94.workers.dev` chết (DNS báo không tồn tại ở mọi máy chủ phân giải), trong khi ô *Account details* vẫn hiện tên cũ do trang chưa làm mới. T đoán nhầm là "đường workers.dev bị tắt" — thực ra toggle vẫn bật.

**Cách nhận ra:** `nslookup` một tên bịa cùng nhánh (`zzz-khong-co.maknoonnjs94…`) cũng NXDOMAIN → hỏng cả nhánh chứ không riêng Worker; một workers.dev khác vẫn phân giải; R2 vẫn 200 → không phải lỗi mạng. Thử `lop-hoc-online.giangduonghoahoc.workers.dev` → 200.

**Đã làm:** m chọn giữ tên mới (hợp với thương hiệu). Thay địa chỉ ở 7 chỗ: `app/main.js` (SITE_URL), `worker.js` (ORIGINS/CORS), `web/index.html` (APP_URL + API_BASE), `web/quan-tri.html` (API_BASE), `wrangler.jsonc`, `HUONG_DAN_VIDEO.md`, nhật ký. App lên **1.0.15**.

**Lưu ý cho sau này:** app đang cài trên máy sinh viên trỏ địa chỉ cũ → mở lên báo không kết nối được, nhưng bộ tự cập nhật lấy bản mới từ **R2** (domain riêng, không đổi) nên sau một lần mở–đóng là tự lên 1.0.15 và vào được. Đừng đổi Subdomain nữa trừ khi chấp nhận phát app mới.

**Nhân tiện:** hai khoá Stream m dán đã vào đủ — `/api/trang-thai` báo `stream: true` với `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.

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

## 2026-09-09 (chiều muộn) — Hero tan vào thẻ trở lại, lật bố cục theo nhân vật

**M yêu cầu:** khung khoảnh khắc ở dưới đẹp, nhưng hero hai cột nhìn "như hai mảnh rời rạc" — giữ kiểu ảnh tan vào thẻ của bản trước, hoặc làm mượt hơn.

**Đã làm**
- Quay lại kiểu ảnh phủ tuyệt đối 60 % thẻ, mép trong tan dài (mask 0 → 42 %) vào nền nên ảnh và chữ là một khối. Cột chữ 48 %, chỉ chớm 8 % thẻ vào vùng đã mờ.
- Lỗi che mặt trước đây sửa bằng **bố cục lật theo nhân vật**: bạn nữ đứng bên phải khung ảnh → ảnh phải, chữ trái; bạn nam đứng bên trái khung → lớp `.trai`: ảnh trái, chữ phải (`object-position` và hướng mask đảo theo). Nhân vật luôn ở phía xa chữ.
- Màn hình hẹp: cả hai kiểu đều xếp dọc, ảnh 215 px dưới chữ, tan từ trên.

**Đã test** (trang thử 768 px, nữ-00 và nam-02): nhân vật trọn vẹn, chữ chồng đúng 50 px vào vùng mờ, đổi nhân vật trong "Góc của bạn" là bố cục lật ngay.

---

## 2026-09-09 (chiều) — Khung "khoảnh khắc" cho chỗ trống và lúc hoàn thành

**M yêu cầu:** ảnh ở "Bài tập cần làm" lọt thỏm bé tí, không cân — thiết kế lại chỗ đó cho ổn, không chỉ vá một chỗ.

**Đã làm**
- Một khung chung `khoanhKhac(cảnh, tiêu đề, lời, nút)`: lưới hai cột — ảnh phủ trọn cột trái (cao hết khung, bo góc), tiêu đề + lời + nút cột phải. Khung tự đo bề rộng của chính nó (container query): hẹp dưới 480 px thì xếp dọc, ảnh 180 px trên, chữ giữa. Ảnh nhỏ 260 px thả giữa thẻ đã bỏ.
- Áp cho cả bốn chỗ: trang chủ "Bài tập cần làm" trống (*Thảnh thơi rồi!* + nút Xem bài giảng); trang Bài tập trống (*Chưa có bài tập nào*); trang Bài tập khi xong hết bài đang mở (*Xong hết rồi!* — cảnh nộp bài thành công); trang Tiến độ 100 % (*Mở hết tài liệu rồi!* — cảnh hoàn thành mục tiêu). Mục tiêu tuần 100 % thì ảnh trải hết bề rộng thẻ.
- Trang thử có thêm `?het=1` (mọi tài liệu đã xem xong) để xem các trạng thái này.

**Đã test** (trang thử `?g=nam&het=1`, 768 px): thẻ Bài tập cần làm rộng 621 px, ảnh chiếm 272 px; trang Bài tập và Tiến độ ảnh chiếm đúng nửa thẻ, chữ cân bên cạnh; nút "Xem bài giảng" chuyển trang.

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

## 2026-09-09 (sáng) — Đổi tên "Giảng đường Hóa học", logo, nhân vật chìm vào thẻ

**M yêu cầu:** nhân vật phải là ảnh chìm, lớn hơn, liền khối với giao diện (không khung); đổi tên "Góc học tập" → **Giảng đường Hóa học**; gắn logo (ảnh tròn màu nước: bình tam giác, lá, phân tử, sách, câu "Hóa học khó, có Phạm Ngọc lo"), để to cho dễ xem.

**Đã làm**
- Tranh lớn: cắt lại cảnh học từ `04-Mau-giao-dien-Mint-Peach.png` (bạn nam mint, bạn nữ peach, có giấy nhớ, đèn bàn, chồng sách) → `web/img/scenes/hoc-*.jpg`. Ảnh phủ trọn 62 % cạnh phải thẻ, cao hết thẻ (thẻ nâng lên 300 px), mép trái tan dần bằng mask nên không còn khung; màn hình hẹp thì ảnh nằm dưới chữ, tan dần từ trên xuống.
- Tên: `<title>`, cột trái (hai dòng "Giảng đường / Hóa học"), trang đăng nhập (logo 168 px ở giữa), nút "Vào giảng đường", trợ giúp, thông báo máy, cảnh báo bắt buộc app, trang tải app — không còn chữ "Góc học tập" (nút "Góc của bạn" giữ vì là tên tính năng).
- Logo: m chép `design-reference/logo-giang-duong.png.png` (1254×1254, nền trắng, 1,7 MB). T cắt ô vuông 1130 px ở giữa, vẽ qua mặt nạ tròn → PNG nền ngoài vòng trong suốt: `web/img/logo.png` 400 px (295 KB) dùng ở cột trái (64 px, rail 52 px, điện thoại 46 px), trang đăng nhập (168 px), trang tải app (140 px); `web/img/favicon.png` 128 px thay favicon ô vuông xanh cũ. Thiếu tệp thì trang vẫn tự lùi về icon lá / hình lớp học. Bản 512 px làm icon app đã dựng sẵn ở thư mục tạm, **chưa** đưa vào app (đổi icon app cần phát bản 1.0.14, chờ m gật).

**Đã test** (trang thử): hero nam/nữ đổi theo nhân vật, tan mép đúng; tiêu đề trang, cột trái, trang đăng nhập hiện tên mới; fallback khi thiếu logo chạy đúng.

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

## 2026-09-08 (đêm) — Tạo tài khoản ngay trên trang quản trị; logo app mới

**M yêu cầu:** (1) vào web quản trị tạo và cấp tài khoản trực tiếp cho từng khoá học, tạo xong thấy ngay trong danh sách lớp; (2) icon app xấu, đổi logo.

**Đã làm**
- `worker.js` + `wrangler.jsonc` (`main`, `assets.binding`): một Worker nhỏ chạy cạnh file tĩnh, hai đường `POST /api/tao-tai-khoan` và `POST /api/cap-lai-mat-khau`. Người gọi gửi access token Supabase; Worker hỏi Supabase token là ai, hồ sơ phải là teacher/admin còn active. Tạo tài khoản bằng Admin API (`email_confirm: true`), mật khẩu tạm 10 ký tự dễ đọc có gạch giữa, upsert hồ sơ (tên, mã SV, `must_change_pw = true`), ghi danh vào lớp (trigger "một tài khoản một khoá" vẫn chạy); email đã có tài khoản thì chỉ ghi danh qua `enroll_by_email` bằng quyền của chính giảng viên. Khoá `SUPABASE_SERVICE_ROLE_KEY` là **secret của Worker** — m dán một lần trong Cloudflare (HUONG_DAN.md, mục "Tạo tài khoản cho sinh viên"); không nằm trong mã, kho, hay trình duyệt.
- Quản trị → tab Sinh viên: nút **＋ Tạo tài khoản mới** (dán nhiều dòng `email, họ tên, mã SV`, tối đa 60 người), bảng kết quả hiện mật khẩu tạm **một lần** + Sao chép / Tải .txt, dòng lỗi nói rõ vì sao; mỗi sinh viên có nút **Cấp lại mật khẩu** (thay nút "Bắt đổi mật khẩu" cũ chỉ bật cờ). Chạy trên localhost thì trang gọi thẳng Worker thật (CORS mở cho localhost:8765).
- Logo app: ô vuông bo góc xanh ngọc đậm (`#1d9aa4 → #0a5058`, ánh sáng nhẹ góc trên) + minh hoạ "lớp học" (sách + mũ tốt nghiệp) của bộ icon, dựng bằng GDI+ từ PNG 512 của gói → `app/build/icon.png` (512 px, electron-builder tự sinh .ico/.icns); `web/img/favicon.png` 256 px gắn vào cả ba trang. App lên **1.0.13** (tag `v1.0.13`) để máy Windows đang cài 1.0.12 tự cập nhật; Mac tải lại từ `/tai-app`. Icon trên thanh tác vụ Windows có thể còn hiện hình cũ tới khi Windows làm mới bộ đệm icon (đăng xuất/vào lại).

**Đã test:** `npx wrangler deploy --dry-run` dựng bundle OK (Worker 8,5 KiB + 63 file tĩnh, binding ASSETS); cú pháp quan-tri.html và worker.js OK. **Chưa** test tạo tài khoản thật vì máy chủ chưa có khoá — m dán khoá xong thử với một email trước.

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

## 2026-09-08 (chiều) — Trang chủ "Hôm nay", chuông, Ctrl+K, làm lại quản trị

**M chọn** làm cả 4 đề xuất (1 2 3 4) với điều kiện: giờ giấc phải sửa dễ, không cứng nhắc vì bài giảng đẩy lên không theo lịch cố định.

**Đã làm**
- Buổi học có thêm `pinned` (Ghim = "đang học", luôn lên đầu), `starts_at` (giờ bắt đầu, **tuỳ chọn**), lớp có `notice` (thông báo tự do). Không có giờ thì xếp theo lúc đẩy bài mới nhất. → `schema_v9_hom_nay.sql`, cùng bảng `view_events` (đã xem / tiến độ đọc trang, giây video) và bật realtime cho `materials`, `sessions`, `classes`.
- Trang học: "Hôm nay" (buổi ghim + thông báo + bài mới), nhãn **MỚI** theo mốc lần vào trước, "Tiếp tục" đúng trang PDF / giây video (YouTube IFrame API), chuông 🔔 liệt kê bài mới, thông báo tức thì khi giảng viên vừa giao (realtime + Notification máy), nhắc 30 phút trước giờ học, **Ctrl+K** tìm buổi / tài liệu gõ không dấu.
- Quản trị: nút Ghim, ô giờ bắt đầu, hộp "✎ Lớp & thông báo", tab **Theo dõi** (ai xem gì lúc nào), làm lại toàn bộ giao diện theo hệ thiết kế của trang học (Be Vietnam Pro, icon một nét), chip thanh đầu không xuống dòng.
- `web/_headers`: HTML `no-cache, must-revalidate` — sửa xong mở lại là thấy, không cần Ctrl+F5.
- Snipping Tool / Game Bar / QuickTime **chỉ mở** thì nhắc nhẹ, không tính vi phạm (m lo sinh viên khiếu nại); phần mềm quay thật sự (OBS, Bandicam…) mới tính.

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

## 2026-09-08 (sáng) — "Giao cho lớp", đợt 62–63 của Sổ, vụ mất 12 câu

- Sổ Bài Tập bản web có nút **📤 Giao cho lớp** ở cột trái (nhóm Xuất): đẩy phiếu / đáp án lên buổi học không qua tải file. M chọn "**Chỉ bản đọc trên web, bỏ PDF**" cho bước tiếp (chưa làm: cần `web/sheet.css` + đổi `doSend` trong `shim_supabase.js` lưu HTML `#sheet` vào `material_contents.body`).
- Luật mỗi tài khoản một khoá học (`schema_v4_mot_khoa.sql`), báo rõ khi thêm sinh viên trùng khoá.
- Ghi lên kho theo hàng đợi 4 lệnh, tự thử lại, báo khi ghi hỏng.
- Vụ web thiếu 12 câu (13/50, 15/50) trong khi artifact có 160: t đã cãi sai hai lần vì ba "nguồn" đều là `read_db`. Nguyên nhân: sổ trộn `localStorage` vào bản máy chủ nên màn hình đủ mà máy chủ thiếu. Sửa ở đợt 63 (đẩy câu chỉ nằm trên máy lên máy chủ, nút ⇪), gửi m bản sao lưu 160 câu để nạp vào web. Chi tiết ở nhật ký của Sổ.

---

## 2026-09-07 — Dựng hệ thống lớp học online

- Supabase: `schema.sql` (profiles, classes, enrollments, sessions, materials, material_contents, kho tệp `tailieu`), `schema_v2.sql`, `schema_v3_so.sql` (kho của Sổ trên Supabase); RLS chặn ở máy chủ; `tao_du_lieu_thu.sql`, `kiem_tra_quyen.sql`.
- `web/index.html` (sinh viên), `web/quan-tri.html` (giảng viên), `web/so-bai-tap.html` (Sổ Bài Tập bản web, sinh từ mã nguồn bằng `build_web_so.js` + `shim_supabase.js` giả `window.claude`).
- Đưa lên Cloudflare Workers, chỉ đăng thư mục `web/`.
- `HUONG_DAN.md`: dựng từ đầu và vận hành hằng ngày.

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
