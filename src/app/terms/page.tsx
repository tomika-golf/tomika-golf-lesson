"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-8 border-b pb-4">利用規約</h1>

        <div className="space-y-7 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第1条（適用）</h2>
            <p>本規約は、富加ゴルフ（以下「当スクール」）が提供するレッスン予約システム（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく方（以下「ユーザー」）は、本規約に同意したうえでご利用ください。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第2条（利用登録・認証）</h2>
            <p className="mb-2">本サービスは、LINE株式会社が提供するLINEログイン（LIFF）を使用して認証を行います。LINEアプリからアクセスすることで、パスワードなしで自動的にログインされます。</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>初回ログイン時にお名前の登録が必要です。</li>
              <li>ユーザーは自身のLINEアカウントの管理責任を負うものとします。</li>
              <li>登録されたお名前は、管理者が正確な情報に基づき修正することがあります。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第3条（レッスンの予約）</h2>
            <p className="mb-2">レッスンの予約は、本サービスの予約画面から行うものとします。</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>予約可能なレッスン種別は、マンツーマンレッスン（50分）およびグループレッスン（25分）です。</li>
              <li>予約が確定すると、LINEメッセージで確認通知が届きます。</li>
              <li>前日および当日の朝8時にLINEリマインド通知が届きます。</li>
              <li>予約枠はGoogleカレンダーと連動して管理されます。表示されている枠のみご予約いただけます。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第4条（キャンセルポリシー）</h2>
            <p className="mb-2">キャンセルは以下のルールに従って行ってください。</p>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="font-semibold text-green-800 mb-1">レッスン開始の3時間前まで</p>
                <p>マイページの「キャンセル」ボタンからご自身でキャンセルできます。キャンセル理由の選択が必要です。</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="font-semibold text-orange-800 mb-1">レッスン開始の3時間を切った場合</p>
                <p>マイページの「コーチに連絡」ボタンからコーチへLINE通知を送信してください。実際のキャンセル処理はコーチが行います。システム上での直接キャンセルはできません。</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">※ 当日キャンセルが繰り返される場合、以後の予約をお断りすることがあります。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第5条（レッスンカルテ）</h2>
            <p className="mb-2">受講完了後、インストラクターがレッスンカルテを作成します。</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>カルテはマイページの「過去の履歴とカルテ」からご確認いただけます。</li>
              <li>カルテには「課題」「改善策」「練習方法」の3項目が記載されます。</li>
              <li>カルテの作成にはAIによる文章生成支援が使用される場合があります。最終的な内容はインストラクターが確認・編集します。</li>
              <li>カルテはご本人のみが閲覧できます。他のユーザーへの公開は行われません。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第6条（AIチャット相談室）</h2>
            <p className="mb-2">マイページ内のAIチャット相談室は、ご自身の過去のカルテ内容をもとに、練習方法や疑問点についてAIが回答する機能です。</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>回答はAIが自動生成するものであり、インストラクターによる個別指導の代替ではありません。</li>
              <li>AIの回答内容については正確性を保証するものではありません。重要な判断はインストラクターにご相談ください。</li>
              <li>チャット機能の利用にあたり、ご自身のカルテテキストがAIサービスへ送信されます。詳細はプライバシーポリシーをご確認ください。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第7条（禁止事項）</h2>
            <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>他者へのなりすましや虚偽情報の登録</li>
              <li>不当な予約・キャンセルの繰り返し（いわゆる「無断キャンセル」を含む）</li>
              <li>本サービスのシステムに不正にアクセスする行為</li>
              <li>他のユーザーや当スクールの業務を妨害する行為</li>
              <li>公序良俗に反する行為</li>
              <li>その他、当スクールが不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第8条（サービスの変更・停止）</h2>
            <p>当スクールは、メンテナンスやシステム障害、その他やむを得ない理由により、本サービスを一時停止または変更することがあります。これによりユーザーに生じた損害について、当スクールの故意または重大な過失がある場合を除き、責任を負わないものとします。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第9条（免責事項）</h2>
            <p>当スクールは、以下の事項について一切の責任を負わないものとします。</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>天災・停電・通信障害等の不可抗力によるサービスの中断</li>
              <li>ユーザーの設定ミス・操作ミスによる予約の失敗やデータの消失</li>
              <li>AIチャット相談室の回答内容の正確性・完全性</li>
              <li>LINEサービスの障害により通知が届かない場合</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第10条（規約の変更）</h2>
            <p>当スクールは、必要と判断した場合に本規約を変更することができます。重要な変更がある場合はLINEメッセージまたは本サービス内でお知らせします。変更後に本サービスをご利用いただいた場合、改定後の規約に同意したものとみなします。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2 border-l-4 border-green-700 pl-3">第11条（準拠法・管轄）</h2>
            <p>本規約は日本法に準拠するものとします。本サービスに関して生じた紛争については、岐阜地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>

        </div>

        <div className="mt-12 text-center text-xs text-gray-400 border-t pt-6">
          <p>附則：2025年4月11日 制定</p>
          <p>最終改訂：2026年4月29日</p>
          <div className="mt-4">
            <button onClick={() => window.history.back()} className="text-brand font-bold underline">戻る</button>
          </div>
        </div>
      </div>
    </div>
  );
}
