export type CheckBookingRulesParams = {
  lessonType: 'man-to-man' | 'group';
  isOverride?: boolean; // 管理者による強制実行（オーバーライド）かどうか
  userProfile: {
    ticket_man_to_man: number;
    ticket_group: number;
  } | null;
  userReservations: {
    status: string;    // 'confirmed', 'completed', 'cancelled'
    lesson_type: string;
  }[];
};

export type RuleCheckResult = {
  isAllowed: boolean;
  errorMessage?: string;
};

/**
 * 富加ゴルフの予約ビジネスルール（初回制限、チケット制限）を判定します。
 */
export function checkBookingRules({
  lessonType,
  isOverride = false,
  userProfile,
  userReservations,
}: CheckBookingRulesParams): RuleCheckResult {
  // ■ 1. アナログ例外対応：オーバーライド（管理者強制実行）
  // 管理者権限による強制実行の場合は、チケ不足や初回制限などの全ルールを無視して許可します
  if (isOverride) {
    return { isAllowed: true };
  }

  // プロフィール情報がない場合はエラー（原則あり得ないが念のため）
  if (!userProfile) {
    return { isAllowed: false, errorMessage: 'ユーザー情報の取得に失敗しました。' };
  }

  // キャンセルされていない、自分自身の該当レッスン種別（マンツー/グループ）の予約履歴を取得
  const activeReservations = userReservations.filter(
    (res) => res.status !== 'cancelled' && res.lesson_type === lessonType
  );

  const pastTotalCount = activeReservations.length; // 今までに取った（取っている）予約の合計数
  const completedCount = activeReservations.filter((res) => res.status === 'completed').length; // 受講完了した数

  // ■ 2. 初回体験の制限ルール
  // 「1回目のレッスンが未受講（完了ステータスになっていない）状態では、2回目の予約を取得不可」
  if (pastTotalCount === 1 && completedCount === 0) {
    return {
      isAllowed: false,
      errorMessage: '初回体験レッスンを受講完了するまで、次の予約はお取りできません。',
    };
  }

  // ■ 3. チケット制限ルール
  if (lessonType === 'group') {
    // グループのルール：「3回目以降の予約はグループ用チケットの残数が必要」
    // （過去2回分の予約枠は体験＋1回目のため取れる）
    if (pastTotalCount >= 2 && userProfile.ticket_group <= 0) {
      return {
        isAllowed: false,
        errorMessage: 'グループ用チケットがありません。フロントにてチケットを追加してください。',
      };
    }
  } else if (lessonType === 'man-to-man') {
    // マンツーマンのルール：「2回目以降の予約は自由に取得可能」（要件5.2）
    // （ただし将来的にチケット残数と連動させるならここにロジックを追加）
  }

  // すべてのチェックをクリア
  return { isAllowed: true };
}
