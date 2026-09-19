import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs';

// お客様の個人情報(氏名・電話番号・予約メモ等)や認証トークンをSentryへ送らないため、
// リクエストの本文・Cookie・ヘッダー・クエリ文字列を除去する
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    if (event.request.url) {
      event.request.url = event.request.url.split('?')[0];
    }
  }
  return event;
}

// console.log にLINEユーザーIDなどが含まれるため、コンソール由来のパンくずは送らない
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return breadcrumb.category === 'console' ? null : breadcrumb;
}
