"use client";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-2 border-b pb-4">プライバシーポリシー</h1>
        <p className="text-xs text-gray-400 mb-8">（個人情報の取扱いに関する方針）</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <p>富加ゴルフ（以下「当スクール」）は、本サービス（レッスン予約・管理システム）を通じて取得するお客様の個人情報について、個人情報の保護に関する法律（個人情報保護法）およびその他関連法令を遵守し、以下のとおり適切に取り扱います。</p>

          {/* 1. 事業者情報 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第1条　事業者情報</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap w-28">名　称</td>
                  <td className="py-2">富加ゴルフ</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">所在地</td>
                  <td className="py-2">岐阜県加茂郡富加町加治田260</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">連絡先</td>
                  <td className="py-2">kohaku.tomika@gmail.com</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 2. 取得する個人情報 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第2条　取得する個人情報</h2>
            <p className="mb-3">当スクールは、本サービスの提供にあたり、以下の個人情報を取得します。</p>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-800 mb-1">① LINEログインにより自動取得する情報</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>LINEユーザーID（内部的な識別子）</li>
                  <li>LINE表示名</li>
                  <li>LINEプロフィール画像URL</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">② お客様が任意に入力する情報</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>氏名・氏名（ふりがな）</li>
                  <li>電話番号</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">③ サービス利用を通じて生成・記録される情報</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>レッスン予約履歴（日時・内容）</li>
                  <li>レッスンカルテ（インストラクターが記録した課題・改善策・練習方法）</li>
                  <li>管理者メモ（スクール内部でのみ参照される補足情報）</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. 利用目的 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第3条　利用目的</h2>
            <p className="mb-2">取得した個人情報は、以下の目的のみに利用します。</p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>レッスンの予約受付・確認・変更・キャンセル処理</li>
              <li>レッスンカルテの作成・配信・管理</li>
              <li>LINEメッセージによる予約確認・カルテ公開通知などの重要連絡</li>
              <li>お問い合わせへの回答</li>
              <li>利用状況の集計・サービス改善</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">※上記以外の目的で個人情報を利用する場合は、あらかじめご本人の同意を得ます。</p>
          </section>

          {/* 4. AIによる処理 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第4条　AIによる情報処理</h2>
            <p className="mb-2">当スクールは、インストラクターがレッスンカルテを作成する際に、外部のAIサービス（Anthropic社およびGoogle社が提供するAPIを含む）を利用することがあります。この処理においてカルテの内容（課題・改善策等）が一時的にAIサービスへ送信されます。</p>
            <ul className="list-disc ml-6 space-y-1 mt-2">
              <li>送信されるのはカルテのテキスト内容のみです。氏名・電話番号・LINEユーザーIDは含まれません。</li>
              <li>AIの処理結果はインストラクターが確認・編集したうえで保存されます。</li>
              <li>利用するAIサービスは業務上の必要に応じて変更される場合があります。</li>
            </ul>
          </section>

          {/* 5. 第三者提供・委託 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第5条　第三者提供・業務委託</h2>
            <p className="mb-3">当スクールは、法令に基づく場合またはご本人の同意がある場合を除き、個人情報を第三者に提供しません。</p>
            <p className="mb-2">本サービスの運営のために、以下のサービスに個人情報の一部が処理・保管されます。</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-200 mt-2">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">サービス名</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">提供会社</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">処理される情報</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">用途</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">クラウドデータベースサービス</td>
                    <td className="border border-gray-200 px-3 py-2">米国企業</td>
                    <td className="border border-gray-200 px-3 py-2">全ての登録情報</td>
                    <td className="border border-gray-200 px-3 py-2">データベース・認証基盤</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">クラウドホスティングサービス</td>
                    <td className="border border-gray-200 px-3 py-2">米国企業</td>
                    <td className="border border-gray-200 px-3 py-2">アクセスログ</td>
                    <td className="border border-gray-200 px-3 py-2">サーバー・ホスティング</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">LINE Messaging API</td>
                    <td className="border border-gray-200 px-3 py-2">LINE株式会社（日本）</td>
                    <td className="border border-gray-200 px-3 py-2">LINEユーザーID</td>
                    <td className="border border-gray-200 px-3 py-2">通知メッセージ送信</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">AI生成API（Anthropic）</td>
                    <td className="border border-gray-200 px-3 py-2">Anthropic, PBC（米国）</td>
                    <td className="border border-gray-200 px-3 py-2">カルテテキスト</td>
                    <td className="border border-gray-200 px-3 py-2">カルテ文章生成支援</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">AI生成API（Google）</td>
                    <td className="border border-gray-200 px-3 py-2">Google LLC（米国）</td>
                    <td className="border border-gray-200 px-3 py-2">カルテテキスト</td>
                    <td className="border border-gray-200 px-3 py-2">カルテ文章生成支援（利用時）</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">※ 各サービスのプライバシーポリシーが適用されます。</p>
          </section>

          {/* 6. 保存期間 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第6条　保存期間</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><span className="font-semibold">アカウント情報（氏名・電話番号等）：</span>最後のご利用から3年間、または削除依頼があるまで</li>
              <li><span className="font-semibold">予約・受講履歴：</span>同上</li>
              <li><span className="font-semibold">レッスンカルテ：</span>同上</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">保存期間を超えたデータは速やかに削除いたします。</p>
          </section>

          {/* 7. セキュリティ */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第7条　安全管理措置</h2>
            <p>当スクールは、個人情報の漏えい・滅失・毀損の防止のために、以下の安全管理措置を講じます。</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>通信の暗号化（HTTPS/TLS）</li>
              <li>アクセス権限の最小化（管理者アカウントのロールによる制限）</li>
              <li>LINE IDトークンの署名検証による認証</li>
              <li>個人情報へのアクセスを業務上必要な担当者に限定</li>
            </ul>
          </section>

          {/* 8. 権利行使 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第8条　個人情報の開示・訂正・削除のご請求</h2>
            <p className="mb-3">ご本人は、当スクールが保有する自己の個人情報について、開示・訂正・追加・削除・利用停止・消去・第三者提供の停止を請求することができます。</p>
            <p className="mb-2">ご請求は以下の窓口までメールにてお申し付けください。本人確認のうえ、合理的な期間内（原則として2週間以内）に対応いたします。</p>
            <div className="bg-gray-50 rounded-lg p-4 mt-3">
              <p className="font-semibold text-gray-800 mb-1">個人情報取扱窓口</p>
              <p>富加ゴルフ　担当：個人情報管理者</p>
              <p>メールアドレス：<a href="mailto:kohaku.tomika@gmail.com" className="text-green-700 underline">kohaku.tomika@gmail.com</a></p>
              <p className="text-xs text-gray-500 mt-2">件名に「個人情報に関するお問い合わせ」とご記入ください。</p>
            </div>
          </section>

          {/* 9. Cookie */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第9条　Cookie（クッキー）の利用</h2>
            <p>本サービスでは、ログイン状態の維持を目的としてCookieを使用します。Cookieにはお客様を特定できる情報は含まれておらず、セッション管理のみに使用します。ブラウザの設定によりCookieを無効にすることができますが、その場合、ログインが正常に機能しない場合があります。</p>
          </section>

          {/* 10. ポリシーの変更 */}
          <section>
            <h2 className="font-bold text-base text-gray-900 mb-3 border-l-4 border-green-700 pl-3">第10条　プライバシーポリシーの変更</h2>
            <p>当スクールは、法令の改正や事業内容の変更に伴い、本ポリシーを改定することがあります。改定後のポリシーは本ページに掲載した時点から効力を生じるものとします。重要な変更がある場合は、LINEメッセージ等にてお知らせします。</p>
          </section>

        </div>

        <div className="mt-12 text-center text-xs text-gray-400 border-t pt-6">
          <p>附則：2025年4月11日 制定</p>
          <p>最終改訂：2026年4月28日</p>
          <div className="mt-4">
            <button onClick={() => window.history.back()} className="text-green-700 font-bold underline">
              ← 戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
