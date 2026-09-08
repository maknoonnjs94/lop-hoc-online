-- =====================================================================
--  THÊM KIỂU CẢNH BÁO: quay (app dò thấy phần mềm quay / chụp màn hình đang chạy)
--  Dán cả file vào Supabase → SQL Editor → Run. Chạy một lần, chạy lại cũng không sao.
-- =====================================================================

alter table public.screenshot_events
  drop constraint if exists screenshot_events_kind_check;

alter table public.screenshot_events
  add constraint screenshot_events_kind_check
  check (kind in ('printscreen', 'win_snip', 'nghi_chup', 'quay', 'in', 'luu'));

select e.at, p.full_name, e.kind, e.material_title
from public.screenshot_events e
left join public.profiles p on p.id = e.user_id
order by e.at desc
limit 20;
