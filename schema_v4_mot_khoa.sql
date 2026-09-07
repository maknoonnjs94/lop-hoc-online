-- =====================================================================
--  MỖI TÀI KHOẢN SINH VIÊN CHỈ THUỘC MỘT KHÓA HỌC
--  Chạy SAU schema.sql, schema_v2.sql, schema_v3_so.sql.
--  Dán vào Supabase → SQL Editor → New query → Run. Chạy lại nhiều lần được.
--
--  Vì sao cần: một web dạy nhiều môn. Nếu một tài khoản vào được nhiều khóa
--  thì chỉ cần một người mua rồi cho mượn là cả nhóm học ké. Luật dưới đây
--  chặn ngay ở cơ sở dữ liệu, không phụ thuộc giao diện.
--
--  Giáo viên KHÔNG bị chặn, vẫn vào được mọi khóa.
-- =====================================================================

create or replace function public.one_class_per_student()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_other text;
begin
  select role into v_role from public.profiles where id = new.student;
  if v_role is distinct from 'student' then
    return new;                       -- giáo viên, quản trị: không giới hạn
  end if;

  select c.name into v_other
  from public.enrollments e
  join public.classes c on c.id = e.class_id
  where e.student = new.student and e.class_id <> new.class_id
  limit 1;

  if v_other is not null then
    raise exception 'Tài khoản này đang học khóa "%". Mỗi tài khoản sinh viên chỉ thuộc một khóa. Hãy bỏ khỏi khóa cũ, hoặc tạo tài khoản riêng cho khóa mới.', v_other
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_one_class on public.enrollments;
create trigger trg_one_class
  before insert on public.enrollments
  for each row execute function public.one_class_per_student();

-- =====================================================================
--  KIỂM TRA DỮ LIỆU ĐANG CÓ
--  Nếu trước đây lỡ thêm một sinh viên vào nhiều khóa, câu này liệt kê ra.
--  Luật mới chỉ chặn lần thêm sau, không tự xoá dữ liệu cũ.
-- =====================================================================
select p.email,
       coalesce(nullif(p.full_name, ''), '(chưa đặt tên)') as ten,
       count(*) as so_khoa,
       string_agg(c.name, ' | ') as cac_khoa
from public.enrollments e
join public.profiles p on p.id = e.student
join public.classes  c on c.id = e.class_id
where p.role = 'student'
group by p.email, p.full_name
having count(*) > 1
order by so_khoa desc;

-- ---------------------------------------------------------------------
-- Muốn BỎ luật này về sau (cho phép một tài khoản học nhiều khóa):
--   drop trigger if exists trg_one_class on public.enrollments;
-- ---------------------------------------------------------------------
