import type { SupabaseClient } from '@supabase/supabase-js';

// 管理者全員にLINE通知を送る共通関数
export async function notifyAdmins(admin: SupabaseClient, message: string) {
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineToken) return;

  const adminUserIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  if (adminUserIds.length === 0) return;

  const { data: adminProfiles } = await admin
    .from('profiles')
    .select('line_user_id')
    .in('id', adminUserIds);

  const lineUserIds = (adminProfiles ?? []).map(p => p.line_user_id).filter(Boolean) as string[];

  await Promise.all(
    lineUserIds.map(lineUserId =>
      fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${lineToken}` },
        body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: message }] }),
      })
    )
  );
}
