"use client";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <h1 className="text-2xl font-bold mb-8 border-b pb-4">プライバシーポリシー</h1>
        
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <p>富加ゴルフ（以下、「当スクール」）は、本システムを通じて提供するサービス（以下、「本サービス」）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」）を定めます。</p>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. 収集する個人情報</h2>
            <p>本サービスでは、LINEログインにより以下の情報を取得します：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>LINEの表示名・プロフィール画像</li>
              <li>LINE固有のユーザー識別子（内部的なID）</li>
              <li>その他、ユーザーが任意に登録する氏名、電話番号、予約・受講履歴</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. 利用目的</h2>
            <p>当スクールは、収集した個人情報を以下の目的で利用します：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>レッスンの予約管理および受付業務</li>
              <li>レッスンカルテの作成と提供（AIによる清書を含む）</li>
              <li>当スクールからの重要な連絡、およびお問い合わせへの回答</li>
              <li>利用状況の分析によるサービス改善</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. 個人情報の第三者提供</h2>
            <p>当スクールは、法令に基づき開示が必要な場合、またはユーザーの同意がある場合を除き、個人情報を第三者に提供することはありません。ただし、本サービスの運営に必要な範囲で技術パートナー（クラウドサーバー、AI提供元等）に業務を委託することがあります。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. セキュリティ</h2>
            <p>当スクールは、ユーザーの個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざん及び漏えいなどの防止に努めます。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. 個人情報の開示・訂正・削除</h2>
            <p>ユーザー本人が自身の個人情報の照会、訂正、削除を希望する場合には、当スクール窓口までご連絡ください。速やかに対応いたします。</p>
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
