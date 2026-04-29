-- ログイン試行記録テーブル（ブルートフォース対策）
create table public.login_attempts (
  id uuid default gen_random_uuid() primary key,
  ip text not null,
  attempted_at timestamp with time zone default timezone('utc', now()) not null
);

create index login_attempts_ip_time_idx on public.login_attempts (ip, attempted_at);
