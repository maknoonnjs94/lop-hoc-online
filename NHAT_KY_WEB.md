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
- Worker `worker.js` cạnh file tĩnh: `/api/tao-tai-khoan`, `/api/cap-lai-mat-khau`, `/api/stream/*` — cả ba secret (`SUPABASE_SERVICE_ROLE_KEY`, `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`) đã có, Stream trả 200.
- App máy tính bản **1.0.16** (khoá theo mã máy thật; địa chỉ giangduonghoahoc; icon logo Giảng đường): vỏ Electron tải thẳng trang web, cửa sổ được hệ điều hành chống chụp/quay, dò phần mềm quay, tự cập nhật (Windows) qua R2.

M còn phải làm (soát lại 2026-09-10 bằng `/api/trang-thai`):

1. ~~Quyết định `REQUIRE_APP`** trong `web/index.html` (đang `false`). Bật `true` là **khoá sạch điện thoại và máy tính bảng**, vì app chỉ có bản Windows/macOS. Đã chốt 11/9: dùng BAT_BUOC_APP = video, chỉ video bài giảng cần app.~~ **Xong.**
2. Chạy đủ luồng test bằng app thật 1.0.16 trở lên (khoá theo mã máy), xem cột "đã gắn máy (app)" trong danh sách sinh viên.

Đã xong hết phần cài đặt máy chủ — không còn gì treo:

- **SQL:** v9, v10, v10b, v11, v12, v14, v16, v17, v18, v19, v20, v21, v22 — `/api/trang-thai` báo `true` cả loạt. **v23 (`schema_v23_hoi_dap_rieng.sql`) chưa chạy** — chạy xong thì mục Hỏi đáp riêng mới sống.
- **Secret của Worker:** đủ ba (`SUPABASE_SERVICE_ROLE_KEY` dài 219 ký tự, `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`); Cloudflare Stream trả 200.
- **Kho tệp bài nộp:** kho bainop đã tạo được (một số dự án Supabase khoá storage.objects, dự án này thì không).
- **Hồ sơ admin trùng:** đã dọn — `doc_ho_so.so_dong = 1`.

Cách tự kiểm sau này, khỏi mở Supabase:

```
curl -s https://lop-hoc-online.giangduonghoahoc.workers.dev/api/trang-thai
```

Đã xong: m chạy v10b, câu kiểm tra cho thấy `sv.thu@example.com` đã đi trọn luồng lúc 17:39 (08/9): `must_change_pw = false`, `onboarded_at` có giờ, tên "Bành Thị Lệ Xuân", giới tính nữ → giao diện Peach. Lần "chưa thấy" trước đó là app/trình duyệt còn giữ trang cũ. Muốn xem lại luồng lần đầu thì đặt lại bằng `update public.profiles set must_change_pw = true, onboarded_at = null where email = 'sv.thu@example.com';`.

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

## 2026-09-16 (khuya) — Chuẩn hoá cả loạt + ngắt dòng lời giải (đợt 75)

Hai việc m nêu: nút chuẩn hoá cho **cả loạt** (vốn đã có từ đợt 70 nhưng t nhét lẫn vào hàng chip
lọc nên không ai thấy — giờ tách thành hàng nút riêng, ghi rõ *N câu*), và **ngắt dòng lời giải**.

Về ngắt dòng: trước đây chỉ ngắt sau dấu **. ! ?** và trước một danh sách từ cố định; dấu hai chấm
chỉ tính khi bản gốc đã có xuống dòng — mà chữ bóc từ PDF dính liền một mạch. Giờ ngắt sau dấu ":"
(chừa `1:2`, `10:30`, `http://`) và thêm các từ mở đầu bước của Hoá phân tích.

Bộ thử `So_Bai_Tap_HUS/Tools/thu_cong_thuc.js` lên **46 phép, 46/46 đạt** — thêm nhóm ngắt dòng,
số mũ dương rời (`× 10 5`), và ca `donSoMu` không được thò tay vào trong `$…# Nhật ký làm việc — Lớp học online (web + app máy tính)

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
- Worker `worker.js` cạnh file tĩnh: `/api/tao-tai-khoan`, `/api/cap-lai-mat-khau`, `/api/stream/*` — cả ba secret (`SUPABASE_SERVICE_ROLE_KEY`, `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`) đã có, Stream trả 200.
- App máy tính bản **1.0.16** (khoá theo mã máy thật; địa chỉ giangduonghoahoc; icon logo Giảng đường): vỏ Electron tải thẳng trang web, cửa sổ được hệ điều hành chống chụp/quay, dò phần mềm quay, tự cập nhật (Windows) qua R2.

M còn phải làm (soát lại 2026-09-10 bằng `/api/trang-thai`):

1. ~~Quyết định `REQUIRE_APP`** trong `web/index.html` (đang `false`). Bật `true` là **khoá sạch điện thoại và máy tính bảng**, vì app chỉ có bản Windows/macOS. Đã chốt 11/9: dùng BAT_BUOC_APP = video, chỉ video bài giảng cần app.~~ **Xong.**
2. Chạy đủ luồng test bằng app thật 1.0.16 trở lên (khoá theo mã máy), xem cột "đã gắn máy (app)" trong danh sách sinh viên.

Đã xong hết phần cài đặt máy chủ — không còn gì treo:

- **SQL:** v9, v10, v10b, v11, v12, v14, v16, v17, v18, v19, v20, v21, v22 — `/api/trang-thai` báo `true` cả loạt. **v23 (`schema_v23_hoi_dap_rieng.sql`) chưa chạy** — chạy xong thì mục Hỏi đáp riêng mới sống.
- **Secret của Worker:** đủ ba (`SUPABASE_SERVICE_ROLE_KEY` dài 219 ký tự, `CF_ACCOUNT_ID`, `CF_STREAM_TOKEN`); Cloudflare Stream trả 200.
- **Kho tệp bài nộp:** kho bainop đã tạo được (một số dự án Supabase khoá storage.objects, dự án này thì không).
- **Hồ sơ admin trùng:** đã dọn — `doc_ho_so.so_dong = 1`.

Cách tự kiểm sau này, khỏi mở Supabase:

```
curl -s https://lop-hoc-online.giangduonghoahoc.workers.dev/api/trang-thai
```

Đã xong: m chạy v10b, câu kiểm tra cho thấy `sv.thu@example.com` đã đi trọn luồng lúc 17:39 (08/9): `must_change_pw = false`, `onboarded_at` có giờ, tên "Bành Thị Lệ Xuân", giới tính nữ → giao diện Peach. Lần "chưa thấy" trước đó là app/trình duyệt còn giữ trang cũ. Muốn xem lại luồng lần đầu thì đặt lại bằng `update public.profiles set must_change_pw = true, onboarded_at = null where email = 'sv.thu@example.com';`.

---

.

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

## 2026-09-10 — Bảng dung lượng trong tab Kho tệp

**M hỏi:** video up lên lưu trên cloud đúng không, xem dung lượng ở đâu?

**Đã làm:** tab **Kho tệp** thêm ba ô số liệu, đo trực tiếp mỗi lần mở tab:
- Video · Cloudflare Stream: gọi `/api/stream/danh-sach`, cộng `giay` và `kich_thuoc` → số video, tổng phút lưu, dung lượng, ước tính USD/tháng (5 USD / 1 000 phút lưu).
- Tệp tài liệu · Supabase: đệ quy `storage.from("tailieu").list()` (thư mục con theo id buổi), cộng `metadata.size`.
- Ảnh đại diện · Supabase + ô tổng có thanh phần trăm so với 1 GB gói miễn phí.

**Trạng thái SQL:** `/api/trang-thai` báo v9, v10, v11, v12, v14, v16, v17 đều đã chạy — không còn file nào chờ.

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
