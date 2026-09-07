-- =====================================================================
--  TẠO DỮ LIỆU THỬ + ĐẶT QUYỀN QUẢN TRỊ
--  Dán vào Supabase → SQL Editor → Run. Chạy lại nhiều lần cũng không nhân đôi.
--
--  ĐỔI email ở dòng ngay bên dưới thành email tài khoản đã tạo ở Authentication.
-- =====================================================================
do $$
declare
  v_email text := 'ph.ngoc.ued@gmail.com';        -- <<< ĐỔI Ở ĐÂY
  v_name  text := 'Phạm Anh Ngọc';                -- tên hiện trên trang học
  v_uid   uuid;
  v_class uuid;
  v_ses   uuid;
  v_m     uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email);
  if v_uid is null then
    raise exception 'Chưa có tài khoản dùng email %. Vào Authentication → Users → Add user tạo trước đã.', v_email;
  end if;

  -- 1) Đặt quyền quản trị cho mình
  insert into public.profiles (id, full_name, role, active)
  values (v_uid, v_name, 'admin', true)
  on conflict (id) do update set role = 'admin', full_name = excluded.full_name, active = true;

  -- 2) Lớp thử
  select id into v_class from public.classes where name = 'Lớp thử · Hóa phân tích' limit 1;
  if v_class is null then
    insert into public.classes (name, subject, owner)
    values ('Lớp thử · Hóa phân tích', 'Hóa phân tích', v_uid)
    returning id into v_class;
  end if;

  -- 3) Tự ghi danh vào lớp thử để thấy đúng những gì sinh viên thấy
  insert into public.enrollments (class_id, student) values (v_class, v_uid) on conflict do nothing;

  -- 4) Một buổi đã mở
  select id into v_ses from public.sessions where class_id = v_class and no = 1 limit 1;
  if v_ses is null then
    insert into public.sessions (class_id, no, title, held_on, note, published)
    values (v_class, 1, 'Buổi thử · Nồng độ dung dịch', current_date,
            'Buổi mẫu để kiểm tra hệ thống. Xoá đi khi dùng thật.', true)
    returning id into v_ses;

    -- 4a) Video (đổi link thành video của mình khi dùng thật)
    insert into public.materials (session_id, kind, title, order_no)
    values (v_ses, 'video', 'Video thử', 1) returning id into v_m;
    insert into public.material_contents (material_id, url)
    values (v_m, 'https://www.youtube.com/watch?v=aircAruvnKk');

    -- 4b) Ghi chú
    insert into public.materials (session_id, kind, title, order_no)
    values (v_ses, 'text', 'Ghi chú buổi 1', 2) returning id into v_m;
    insert into public.material_contents (material_id, body)
    values (v_m, 'Đọc được dòng này nghĩa là hệ thống đã chạy đúng.');

    -- 4c) Đáp án khoá 7 ngày — phải thấy TÊN nhưng KHÔNG mở được nội dung
    insert into public.materials (session_id, kind, title, open_at, order_no)
    values (v_ses, 'answer', 'Đáp án (mở sau 7 ngày)', now() + interval '7 days', 3)
    returning id into v_m;
    insert into public.material_contents (material_id, body)
    values (v_m, 'Nội dung này KHÔNG được hiện ra trước ngày mở.');
  end if;

  -- 5) Một buổi còn nháp — phải KHÔNG thấy trên trang học
  if not exists (select 1 from public.sessions where class_id = v_class and no = 2) then
    insert into public.sessions (class_id, no, title, note, published)
    values (v_class, 2, 'Buổi nháp (chưa mở)', 'Buổi này chưa bật nên sinh viên không thấy.', false);
  end if;

  raise notice 'Xong. Đăng nhập bằng % để xem lớp thử.', v_email;
end $$;

-- Kiểm tra nhanh sau khi chạy
select p.full_name, p.role, u.email from public.profiles p join auth.users u on u.id = p.id;
select name, subject from public.classes;
select no, title, published from public.sessions order by no;
