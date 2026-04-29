-- #14: 受講ステータス変更履歴
create table public.reservation_status_logs (
  id uuid default gen_random_uuid() primary key,
  reservation_id uuid references public.reservations(id) on delete cascade not null,
  changed_by text not null,
  old_status text not null,
  new_status text not null,
  changed_at timestamp with time zone default timezone('utc', now()) not null
);

create index reservation_status_logs_reservation_idx on public.reservation_status_logs (reservation_id, changed_at desc);

-- #15: 管理者操作ログ
create table public.admin_operation_logs (
  id uuid default gen_random_uuid() primary key,
  admin_username text not null,
  action text not null,
  target_id text,
  detail text,
  performed_at timestamp with time zone default timezone('utc', now()) not null
);

create index admin_operation_logs_performed_idx on public.admin_operation_logs (performed_at desc);
