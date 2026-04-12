export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-8 border-b pb-4">利用規約</h1>
        
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-gray-900 mb-2">第1条（適用）</h2>
            <p>本規約は、富加ゴルフ（以下、「当スクール」）が提供するレッスン予約システム（以下、「本サービス」）の利用条件を定めるものです。利用者の皆様（以下、「ユーザー」）には、本規約に従って本サービスをご利用いただきます。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第2条（利用登録・認証）</h2>
            <p>本サービスは、LINE株式会社が提供するLINEログインを利用して認証を行います。ユーザーは自身のLINEアカウントの管理責任を負うものとします。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第3条（予約とキャンセル）</h2>
            <p>レッスンの予約およびキャンセルは、本サービス上の規定に従って行うものとします。キャンセル期限（原則レッスン開始の3時間前）を過ぎた場合、チケットの払い戻しや振替は行えません。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第4条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、不当な予約・キャンセルの繰り返し、他者へのなりすまし、公序良俗に反する行為を行ってはなりません。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第5条（免責事項）</h2>
            <p>当スクールは、本サービスの中断、遅延、停止、データの消失によりユーザーに生じた損害について、当スクールの故意または重大な過失がある場合を除き、一切の責任を負わないものとします。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第6条（規約の変更）</h2>
            <p>当スクールは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。</p>
          </section>
        </div>

        <div className="mt-12 text-center text-xs text-gray-400">
          <p>附則：2025年4月11日 制定</p>
          <div className="mt-4">
            <button onClick={() => window.history.back()} className="text-brand font-bold underline">戻る</button>
          </div>
        </div>
      </div>
    </div>
  );
}
