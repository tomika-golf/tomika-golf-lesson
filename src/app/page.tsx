import Link from "next/link";
import Image from "next/image";
import { LiffRedirectHandler } from "@/components/LiffRedirectHandler";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <LiffRedirectHandler />

      {/* ========== ① ヒーロー ========== */}
      <section className="relative h-screen min-h-[600px] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="富加ゴルフ レッスン風景"
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>

        <div className="absolute top-0 left-0 right-0 z-10 px-6 py-5 flex justify-between items-center">
          <span className="text-white text-xl font-bold tracking-widest drop-shadow-lg">⛳ 富加ゴルフ</span>
        </div>

        <div className="relative z-10 px-6 pb-16 text-white max-w-2xl mx-auto w-full">
          <div className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 shadow">
            🎉 5月限定キャンペーン実施中
          </div>
          <p className="text-sm font-bold tracking-widest text-green-300 mb-3 uppercase">Tomika Golf Lesson</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-snug mb-4 drop-shadow-lg">
            毎週の練習、そろそろ<br />「結果」に変えませんか？
          </h1>
          <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-8">
            芝・バンカーでの実践練習、専属プロの一貫指導、そしてあなた専用の「AIレッスンカルテ」。<br />
            富加ゴルフのレッスンで、目標スコアへ最短距離で向かいましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/booking" className="text-center bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-xl transition-all transform hover:-translate-y-1 text-lg">
              今すぐ予約する
            </Link>
            <Link href="/mypage" className="text-center border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:text-gray-900 transition-all text-lg">
              マイページへ
            </Link>
          </div>
        </div>
      </section>

      {/* ========== ② 3つの特徴 ========== */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-green-700 text-sm font-bold tracking-widest mb-2">OUR FEATURES</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">富加ゴルフ、3つのこだわり</h2>
          <div className="space-y-6">
            {[
              {
                icon: "🌿",
                title: "マット練習からの卒業。本番さながらの「実践環境」",
                desc: "練習場では綺麗に打てるのに、コースに出るとスコアが崩れる…そんな悩みを解消します。芝やバンカーからの本格的なショット練習で、スコアに直結する技術を身につけます。",
                imgSrc: "/grass.png",
                imgAlt: "芝での実践練習"
              },
              {
                icon: "📱",
                title: "教わったことを忘れない。「AI搭載のレッスンカルテ」",
                desc: "毎回のレッスン内容はあなた専用のマイページに蓄積。「前回のコツ何だっけ？」をなくし、自主練の質を劇的に高めます。",
                imgSrc: null,
                imgAlt: null
              },
              {
                icon: "🏌️",
                title: "指導がブレないから迷わない。「専属プロの一貫指導」",
                desc: "毎回違うコーチから違うアドバイスを受けて混乱する心配はありません。蓄積したカルテをもとに、ブレることなく目標スコアへ導きます。",
                imgSrc: null,
                imgAlt: null
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                {item.imgSrc && (
                  <div className="relative h-48 w-full">
                    <Image src={item.imgSrc} alt={item.imgAlt || ""} fill style={{ objectFit: "cover" }} />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl mt-1">{item.icon}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ③ レッスンメニュー ========== */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-green-700 text-sm font-bold tracking-widest mb-2">LESSON MENU</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">レッスンメニュー</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border-2 border-green-600 rounded-2xl p-6 relative">
              <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">マンツーマン</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">完全個別指導<br /><span className="text-3xl text-green-700">50<span className="text-base">分</span></span></h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                50分間プロを独り占め。あなたのスイングを徹底分析し、課題を一緒に改善していきます。じっくり取り組みたい方に最適です。
              </p>
              <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg">✅ 短期間で確実にスコアを伸ばしたい方向け</p>
            </div>
            <div className="border-2 border-green-600 rounded-2xl p-6 relative">
              <div className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">マンツーマン</div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">集中個別指導<br /><span className="text-3xl text-green-700">25<span className="text-base">分</span></span></h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                25分間・一点集中でポイントを絞った指導。「今日はここだけ直したい」という方や、忙しい方でも通いやすいメニューです。
              </p>
              <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg">✅ 気軽にコツコツ続けたい方向け</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ④ 料金プラン ========== */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-green-700 text-sm font-bold tracking-widest mb-2">PRICE</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">料金プラン</h2>
          <p className="text-center text-xs text-gray-500 mb-8">表示価格はすべて税込・ボール代込みです</p>

          {/* 5月限定バナー */}
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 mb-6 text-center">
            <span className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">🎉 5月限定キャンペーン価格</span>
            <p className="text-gray-700 text-sm mt-3 leading-relaxed">
              5月中は特別価格でレッスンをご体験いただけます。<br />
              <span className="text-red-500 font-bold">6月より正規料金に変更予定ですので、お早めにどうぞ！</span>
            </p>
          </div>

          {/* 料金カード */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border-2 border-green-600 p-5 text-center shadow-sm">
              <p className="text-xs font-bold text-green-700 mb-2">マンツーマン</p>
              <p className="text-2xl font-extrabold text-gray-900 mb-1">50分</p>
              <p className="text-4xl font-black text-green-700 leading-none">¥3,000</p>
              <p className="text-xs text-gray-400 mt-2">税込・ボール代込み</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-green-600 p-5 text-center shadow-sm">
              <p className="text-xs font-bold text-green-700 mb-2">マンツーマン</p>
              <p className="text-2xl font-extrabold text-gray-900 mb-1">25分</p>
              <p className="text-4xl font-black text-green-700 leading-none">¥1,500</p>
              <p className="text-xs text-gray-400 mt-2">税込・ボール代込み</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">※6月以降の正規料金は別途ご案内いたします</p>
        </div>
      </section>

      {/* ========== ⑤ 講師紹介 ========== */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-green-700 text-sm font-bold tracking-widest mb-2">INSTRUCTOR</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">講師紹介</h2>
          <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 mx-auto sm:mx-0">
              <Image
                src="/instructor.png"
                alt="松山 正直 インストラクター"
                fill
                style={{ objectFit: "cover" }}
                className="rounded-full border-4 border-green-200 shadow-lg"
              />
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">USGTF認定 ゴルフレッスンプロ 2級</span>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded">富加ゴルフ 支配人</span>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-3">松山 正直</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                富加ゴルフの支配人として、長年にわたりお客様のゴルフと向き合い続けてきました。
                「このショットどうすれば？」という何気ない質問から、スイングの根本的な改善まで、
                現場でお客様とともに積み上げてきた実践的な知見を持っています。
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                このたびUSGTF公認のゴルフレッスンプロ資格を取得し、
                その経験を体系的なレッスンとしてお届けします。
              </p>
              <div className="bg-white border-l-4 border-green-500 pl-4 py-2 rounded-r-lg">
                <p className="text-xs text-green-700 font-bold mb-1">レッスンで大切にしていること</p>
                <p className="text-sm text-gray-700 leading-snug">
                  「まずあなたの悩みをしっかり聞くこと」が出発点です。マンツーマンだからこそ、
                  あなたが今一番解決したいことを丁寧に引き出し、的確なアドバイスで一緒に改善していきます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ⑥ アクセス ========== */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-green-700 text-sm font-bold tracking-widest mb-2">ACCESS</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">アクセス・施設情報</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative w-full h-52 bg-gray-200 flex items-center justify-center">
              <a
                href="https://maps.google.com/?q=岐阜県加茂郡富加町加治田260"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-gray-600 hover:text-green-700 transition-colors"
              >
                <span className="text-4xl">📍</span>
                <span className="font-bold text-sm">Googleマップで見る</span>
                <span className="text-xs text-gray-400">岐阜県加茂郡富加町加治田260</span>
              </a>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex gap-3 items-start">
                <span className="text-green-700 font-bold w-24 flex-shrink-0">📍 住所</span>
                <span className="text-gray-700">岐阜県加茂郡富加町加治田260（富加ゴルフ内）</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-green-700 font-bold w-24 flex-shrink-0">🚗 駐車場</span>
                <span className="text-gray-700">20台以上完備（無料）</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-green-700 font-bold w-24 flex-shrink-0">⏰ レッスン枠</span>
                <span className="text-gray-700">予約カレンダーより空き枠を確認ください</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ⑦ FAQ ========== */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-green-700 text-sm font-bold tracking-widest mb-2">FAQ</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">よくある質問</h2>
          <div className="space-y-4">
            {[
              { q: "初心者でも大丈夫ですか？", a: "もちろん大歓迎です！基礎を徹底しながら、お一人おひとりに合わせたペースで誠実に指導いたします。クラブの握り方から丁寧にお教えします。" },
              { q: "50分と25分、どちらを選べばいいですか？", a: "しっかり時間をかけて複数の課題に取り組みたい方には50分、「今日はここだけ直したい」という集中練習や初めての体験には25分がおすすめです。迷ったらお気軽にご相談ください。" },
              { q: "ボール代は別途かかりますか？", a: "はい、ボール代は別途必要です。富加ゴルフの通常のサービスをご利用いただき、レッスン料金は別途お支払いいただく形になります。" },
              { q: "キャンセルはいつまで可能ですか？", a: "レッスン開始の3時間前まで、マイページからキャンセルが可能です。それ以降のキャンセルはお電話またはLINEにてご連絡ください。" },
            ].map((item, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden group">
                <summary className="p-5 cursor-pointer font-bold text-gray-900 flex justify-between items-center select-none hover:bg-gray-100 transition-colors">
                  <span>Q. {item.q}</span>
                  <span className="text-green-600 ml-2 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  A. {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ⑧ CTA（最後の誘導） ========== */}
      <section className="bg-green-700 py-16 px-6 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow">
            🎉 5月限定キャンペーン実施中
          </div>
          <h2 className="text-2xl font-extrabold mb-3">まずは1回、体験してみませんか？</h2>
          <p className="text-green-200 text-sm mb-2">ご予約の流れはとても簡単！</p>
          <ol className="text-sm text-white/90 text-left inline-block space-y-2 mb-8 mt-2">
            <li className="flex gap-2"><span className="font-bold text-green-300">①</span>予約カレンダーから希望の日時を選んで予約完了</li>
            <li className="flex gap-2"><span className="font-bold text-green-300">②</span>当日、プロによるマンツーマンレッスンを受講</li>
            <li className="flex gap-2"><span className="font-bold text-green-300">③</span>レッスン後、あなた専用の「AIカルテ」がマイページに届きます</li>
          </ol>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="bg-white text-green-700 font-extrabold py-4 px-8 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg">
              📅 予約カレンダーを見る
            </Link>
            <Link href="/mypage" className="border-2 border-white text-white font-bold py-4 px-8 rounded-full hover:bg-white/10 transition-all text-lg">
              👤 マイページへ
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white text-center py-6 text-xs text-gray-400">
        <p>⛳ 富加ゴルフ / 岐阜県加茂郡富加町加治田260</p>
        <p className="mt-1">© 2026 Tomika Golf. All rights reserved.</p>
      </footer>
    </div>
  );
}
