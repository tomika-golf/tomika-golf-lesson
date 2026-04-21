export type CheckBookingRulesParams = {
  lessonType: 'man-to-man' | 'group';
  isOverride?: boolean;
  userProfile: {
    ticket_man_to_man: number;
    ticket_group: number;
  } | null;
  userReservations: {
    status: string;
    lesson_type: string;
  }[];
};

export type RuleCheckResult = {
  isAllowed: boolean;
  errorMessage?: string;
};

/**
 * 予約ビジネスルール判定。
 * 現在はチケット有無・初回制限なしで常に許可。
 */
export function checkBookingRules({
  isOverride = false,
}: CheckBookingRulesParams): RuleCheckResult {
  // 管理者オーバーライドも含め常に許可
  return { isAllowed: true };
}
