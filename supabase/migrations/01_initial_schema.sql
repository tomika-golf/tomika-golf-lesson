-- 1. profiles テーブル（ユーザー情報とチケット管理）
-- auth.users（Supabaseの標準ユーザー管理）と連動します
create table public.profiles (
  id uuid references auth.users not null primary key,
  line_user_id text unique,
  name text,
  name_kana text,
  phone text,
  role text default 'customer'::text,
  ticket_man_to_man integer default 0,
  ticket_group integer default 0,
  admin_memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. reservations テーブル（予約情報）
create table public.reservations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'confirmed'::text not null, -- confirmed, completed, cancelled
  lesson_type text not null, -- man-to-man, group
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  options jsonb default '[]'::jsonb,
  customer_memo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. review_notes テーブル（AIカルテ・復習帳 *後続ステップ用*）
create table public.review_notes (
  id uuid default gen_random_uuid() primary key,
  reservation_id uuid references public.reservations(id) on delete cascade not null unique,
  video_url text,
  karte_good text,
  karte_improve text,
  karte_homework text,
  is_draft boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security: データアクセスの鍵) の設定
alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.review_notes enable row level security;

-- 基本的な RLS ポリシー（お客様は自分のデータだけ見れる・操作できる）
create policy "自分自身のプロフィールを閲覧・更新できる" 
on public.profiles for all 
using (auth.uid() = id);

create policy "自分の予約関係を操作できる" 
on public.reservations for all 
using (auth.uid() = user_id);

create policy "自分のカルテを閲覧できる"
on public.review_notes for select
using (
  auth.uid() in (
    select user_id from public.reservations where id = reservation_id
  )
);
