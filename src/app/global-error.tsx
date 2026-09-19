'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
        <h1 style={{ fontSize: '1.25rem' }}>エラーが発生しました</h1>
        <p style={{ marginTop: '1rem', color: '#555' }}>
          お手数ですが、ページを再読み込みしてください。
          <br />
          改善しない場合は、店舗までご連絡ください。
        </p>
      </body>
    </html>
  );
}
