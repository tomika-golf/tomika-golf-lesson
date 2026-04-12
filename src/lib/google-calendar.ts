import { google } from 'googleapis';

export const getCalendarClient = () => {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  // 環境変数から読み込んだ際の改行文字(\n)を実際の改行に変換します
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google API credentials are not set in environment variables.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    // 将来的に予約枠の取得だけでなく予定変更もできるようにする
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });

  return google.calendar({ version: 'v3', auth });
};
