/**
 * この単元アプリだけの設定。
 *
 * 国語の読解アプリ（ごんぎつね・一つの花・アップとルーズ・白いぼうし）は、App.tsx・TitleScreen.tsx・
 * lib/・scripts/ を共通にして、単元ごとにちがうものを **このファイルと data.ts だけ** に置く。
 * 1つのアプリで直したことを、ファイルをコピーするだけでほかのアプリにも入れられるようにするため。
 */

export const UNIT = {
  /** 学級ポータルの app_id（カタログ・apps テーブルと一致させる）。localStorage のキーの頭にも使う */
  appId: 'upandloose',
  title: 'アップとルーズで伝える',
  /** タイトル画面の大きな文字。accent の部分だけ色を付ける */
  titleMain: 'アップとルーズで',
  titleAccent: '伝える',
  author: '中谷 日出',
  publisher: '光村図書 国語 4年上',
  url: 'https://syou4-upandloose.vercel.app',
  /** マスコットの呼び名（吹き出しの説明などに使う） */
  mascotName: 'ピントせんせい',
  /** 物語文なら「場面」、説明文なら「だん落」 */
  sceneWord: 'だん落',
  /** 使い方の1枚目 */
  onboardingHello: 'カメラ博士の「ピントせんせい」がいっしょに学ぶよ。まちがえても大丈夫！ヒントを出してくれるから、あきらめないでね。',
} as const;

/** だん落の区切り（初め・中・終わり）。data.ts の structure[].section のキー */
export const SECTIONS: Record<string, { label: string; card: string; badge: string; text: string }> = {
  hajime: { label: '初め', card: 'border-sky-300 bg-sky-50', badge: 'bg-sky-500 text-white', text: 'text-sky-600' },
  naka: { label: '中', card: 'border-orange-300 bg-orange-50', badge: 'bg-orange-500 text-white', text: 'text-orange-600' },
  owari: { label: '終わり', card: 'border-emerald-400 bg-emerald-50', badge: 'bg-emerald-500 text-white', text: 'text-emerald-600' },
};

/** だん落マップの見出し */
export const STRUCTURE = {
  title: 'だん落の組み立てマップ',
  tag: '初め・中・終わり',
  intro: 'それぞれのだん落のはたらきを見てみよう。カードをタップすると、左の本文へジャンプし、読みどころが開くよ。',
};

/** 読みどころカードの見出し（data.ts の structure[].feeling.who のキー） */
export const WHO_LABEL: Record<string, string> = {
  up: 'アップ',
  loose: 'ルーズ',
  writer: '筆者の説明',
  theme: '筆者の考え',
};

/**
 * 対比表（2×2）。data.ts の contrastChips[].correctCell は `${行のkey}-${列のkey}` か 'distractor'。
 * summary の **〜** は太字で出す。
 */
export const CONTRAST = {
  title: 'アップ ⇄ ルーズ 対比表',
  guide: '第4・第5だん落から、アップとルーズで「よく分かること」と「分からないこと」を整理しよう。',
  rows: [
    { key: 'up', label: 'アップ', cls: 'text-sky-700 bg-sky-100' },
    { key: 'loose', label: 'ルーズ', cls: 'text-orange-700 bg-orange-100' },
  ],
  cols: [
    { key: 'know', label: 'よく\n分かること', cls: 'text-emerald-700 bg-emerald-50', border: 'border-emerald-200' },
    { key: 'unknow', label: '分から\nないこと', cls: 'text-rose-700 bg-rose-50', border: 'border-rose-200' },
  ],
  summaryTitle: '完成！筆者がいちばん伝えたいことは——',
  summary: 'アップは**細かい部分**、ルーズは**広いはんい**の様子がよく分かる。でも、どちらにも**伝えられないこと**がある。だから送り手は、伝えたいことに合わせて、アップとルーズを**選んだり、組み合わせたり**する必要がある。',
};
