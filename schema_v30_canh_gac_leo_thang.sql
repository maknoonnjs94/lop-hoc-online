-- =====================================================================
-- v30 — CANH GÁC LEO THANG: 3 lần chắc chắn (chụp/quay/in/lưu) → khoá 3 ngày → tái phạm khoá 30 ngày
-- → tái phạm lần nữa cấm vĩnh viễn (2026-09-15)
-- =====================================================================
-- Trang học (web/hoc.html) đã có sẵn bộ "canh gác": bắt chắc chắn khi SINH VIÊN THẬT SỰ BẤM —
-- PrintScreen, Win+Shift+S (dò qua mất tiêu điểm đúng nhịp phím), phần mềm quay màn hình đang chạy,
-- Ctrl+P, Ctrl+S — đủ 3 lần chắc chắn thì trước giờ chỉ ĐÓNG PHIÊN (đăng xuất), đăng nhập lại là vào
-- được ngay. Việc chỉ NGHI (mất tiêu điểm không rõ lý do, phần mềm quay nhẹ như Snipping Tool) không
-- tính vào 3 lần này — chỉ báo nhẹ, không đếm.
--
-- Tệp này thêm hình phạt LEO THANG, khoá thật ở máy chủ (không phải chỉ đóng phiên rồi vào lại được
-- ngay): lần đầu đủ 3 lần → khoá 3 ngày; hết hạn vào lại rồi tái phạm đủ 3 lần nữa → khoá 30 ngày;
-- tái phạm lần thứ ba → cấm vĩnh viễn. Dòng cảnh báo lúc đang đếm (1/3, 2/3) đổi theo mức SẮP TỚI —
-- lần đầu doạ "3 ngày", sau khi đã dính 1 lần thì doạ "30 ngày", dính 2 lần thì doạ "vĩnh viễn".
--
-- Chạy: Supabase → SQL Editor → dán cả tệp → Run. Chạy lại được.
-- Kiểm: /api/trang-thai → "v30_canh_gac": true

-- ---------- cột trạng thái khoá trên hồ sơ ----------
alter table public.profiles add column if not exists cg_muc int not null default 0;       -- số lần đã từng bị khoá do canh gác: 0,1,2,3(=cấm)
alter table public.profiles add column if not exists cg_khoa_den timestamptz;             -- đang khoá tạm tới lúc này; null = không khoá tạm
alter table public.profiles add column if not exists cg_cam boolean not null default false; -- true = cấm vĩnh viễn

-- ---------- sửa lại ràng buộc "kind" cho khớp mọi loại trang học đã dùng từ trước ----------
-- (schema_v6 chỉ cho phép printscreen/in/luu — quay/win_snip/nghi_chup đã âm thầm bị chặn ghi từ lâu)
alter table public.screenshot_events drop constraint if exists screenshot_events_kind_check;
alter table public.screenshot_events add constraint screenshot_events_kind_check
  check (kind in ('printscreen','in','luu','quay','win_snip','nghi_chup'));

-- ---------- chặn tự sửa: chỉ 2 hàm bên dưới (chạy với quyền chủ hàm) mới được đổi 3 cột cg_* ----------
-- Không có việc này thì luật "sinh viên tự sửa hồ sơ của mình" (p_self_upd) cho phép gọi thẳng
-- update(...) từ trình duyệt để tự xoá khoá — RLS không giới hạn theo CỘT, chỉ theo DÒNG.
create or replace function public.chan_tu_sua_cg()
returns trigger language plpgsql as $$
begin
  if current_setting('app.cg_trusted', true) is distinct from 'on' then
    new.cg_muc := old.cg_muc;
    new.cg_khoa_den := old.cg_khoa_den;
    new.cg_cam := old.cg_cam;
  end if;
  return new;
end $$;
drop trigger if exists trg_chan_tu_sua_cg on public.profiles;
create trigger trg_chan_tu_sua_cg before update on public.profiles
  for each row execute function public.chan_tu_sua_cg();

-- ---------- cờ dùng trong is_active(): tài khoản còn dùng được không ----------
-- Sửa lại đúng hàm is_active() sẵn có (RLS của sessions/materials/material_contents đều gọi hàm
-- này) nên KHÔNG cần vá từng policy — khoá xong tự động chặn hết buổi học / tài liệu / nội dung.
create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active
      and not cg_cam
      and (cg_khoa_den is null or cg_khoa_den <= now())
  );
$$;

-- ---------- sinh viên tự leo thang khi đủ 3 lần chắc chắn (RPC, chỉ tự khoá được chính mình) ----------
create or replace function public.canh_gac_leo_thang()
returns table(muc_moi int, khoa_den timestamptz, cam boolean)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m int; vt text;
begin
  if uid is null then raise exception 'chua dang nhap'; end if;
  select coalesce(cg_muc, 0), role into m, vt from public.profiles where id = uid;
  if vt is distinct from 'student' then   -- giảng viên/quản trị lỡ dính (tự thử trang) thì bỏ qua, không khoá
    return query select cg_muc, cg_khoa_den, cg_cam from public.profiles where id = uid; return;
  end if;
  m := m + 1;
  perform set_config('app.cg_trusted', 'on', true);   -- true = chỉ trong lệnh gọi này, tự hết sau khi xong
  if m >= 3 then
    update public.profiles set cg_muc = 3, cg_cam = true, cg_khoa_den = null where id = uid;
  else
    update public.profiles set cg_muc = m,
      cg_khoa_den = now() + (case m when 1 then interval '3 days' else interval '30 days' end)
      where id = uid;
  end if;
  return query select cg_muc, cg_khoa_den, cg_cam from public.profiles where id = uid;
end $$;
grant execute on function public.canh_gac_leo_thang() to authenticated;

-- ---------- giảng viên mở khoá tay (ân xá / sửa nhầm) — xoá sạch lịch sử, tính lại từ đầu ----------
create or replace function public.gv_mo_khoa_cg(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'khong du quyen'; end if;
  perform set_config('app.cg_trusted', 'on', true);
  update public.profiles set cg_muc = 0, cg_khoa_den = null, cg_cam = false where id = p_user;
end $$;
grant execute on function public.gv_mo_khoa_cg(uuid) to authenticated;

-- Tự kiểm: phải ra true
select public.is_active() is not null as canh_gac_ham_song;
