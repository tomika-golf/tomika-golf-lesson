-- profiles にラベル列を追加（富加町ゴルフ部 等の特別ラベル管理）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';

-- クーポンコード管理テーブル
CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 初期クーポンコード（103）を登録
INSERT INTO public.coupon_codes (code, description)
VALUES ('103', '初期登録コード')
ON CONFLICT (code) DO NOTHING;
