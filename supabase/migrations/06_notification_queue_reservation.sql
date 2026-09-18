-- line_notification_queue を予約に紐付け、キャンセル時に未送信リマインダーを削除できるようにする
alter table public.line_notification_queue
  add column reservation_id uuid references public.reservations(id) on delete cascade;

create index line_notification_queue_reservation_idx on public.line_notification_queue (reservation_id);
