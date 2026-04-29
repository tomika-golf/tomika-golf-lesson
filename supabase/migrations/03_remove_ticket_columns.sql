-- チケット機能廃止に伴いカラムを削除
-- ※ Supabaseダッシュボードの SQL Editor で実行してください
alter table public.profiles drop column if exists ticket_man_to_man;
alter table public.profiles drop column if exists ticket_group;
