# アップとルーズで伝える（syou4-upandloose）

学級ポータルの一部。種類: **kokugo**／app_id: `upandloose`。

## このアプリだけのこと
- 単元ごとにちがうものは **`src/unit.ts`（題名・場面の区切り・人物・対比表）と `src/data.ts`（本文・設問・漢字）だけ**。
  画面（App.tsx・TitleScreen.tsx など）は国語4アプリ共通の共通ファイルなので、ここでは直さない。
- 設問の `id` は学習記録の記号。**一度付けた番号は変えない**（新しい問題は後ろの番号）。設問を直したら `npm run catalog` で
  kit のカタログを作り直す（kit のリポジトリがとなりにあるとき）。
- 教科書の本文を載せている単元は、学校の授業の範囲で使う（広く公開・有償化するなら著作権を確かめる）。
- 説明文。読みの力のキーは物語文と同じで、名前だけ説明文用に読みかえている（`src/data.ts` の SKILLS）。

## 確かめ方
- `npm run check`（型チェック・ビルド・このアプリの自動チェック・学級ポータルのルール点検）
- 共通ファイルを kit の版にそろえる: `npx learning-app-kit-platform fix`

<!-- platform:begin（learning-app-kit が配る。手で書きかえない。直すときは kit の platform/CLAUDE.common.md） -->
## 学級ポータル共通のルール（learning-app-kit が配る。ここは手で書きかえない）

このリポジトリは、複数のアプリがつながった1つの仕組み（学級ポータル）の一部です。
1つのアプリだけを見て直すと、ほかのアプリ・先生用画面（PRISM）・データベースとずれます。

- **構成**: `learning-app-kit`（共通部品・記録の送信・カタログ・実力の階段）／単元アプリ（算数・国語）／
  `class-portal-teacher`（PRISM・先生用）／`class-portal-kids`（子ども用ハブ）／Supabase `gakkyu-portal`／
  `onokomachi-master-DB`（知識集）。
- **始めと終わり**: 作業の前に kb スキルで関係する知見を引く。直したこと・分かったことは最後に kb save で残す。
- **共通ファイルは、このリポジトリで直さない。** どれが共通ファイルかは `npm run platform` が教える。
  直すときは learning-app-kit の `platform/families/<種類>/files/` を直して kit の版を上げ、
  各アプリで kit を上げてから `npx learning-app-kit-platform fix` で配る（1つのアプリだけ直すと、直しが届かない）。
- **記録の名前（skillId）はカタログの skill_id と同じ文字列にする。** レベルIDがすでに `compare-basic` なら、
  前に何かを足さない。問題・レベルを足したり名前を変えたりしたら、カタログを作り直して kit に入れる（portal-connect スキル）。
- **送る記録の形・データベースの表・PRISM の画面に関わる変更**は、関係するリポジトリを全部つないだセッションで行う。
  単体のセッションで気づいたら、直さずに PR とユーザーへの報告に「全体セッションで直すこと」として書く。
- **kit はコミットのSHAで固定している。** 上げるときは `npx learning-app-kit-platform update` → `npm run check`。
- **新しいアプリは、作りはじめに `npx learning-app-kit-platform init <種類>`**（math / kokugo / portal / standalone）。
  CLAUDE.md・共通ファイル・CI・build 前の点検がそろう。そのあと CLAUDE.md の上の段にアプリだけのことを書く。
- 子どもの氏名は扱わない（出席番号だけ）。APIキー・トークン・パスワードはファイルにも知識集にも書かない。
- **終わる前に `npm run check` を通す**（このルールの点検 `npm run platform` も入っている）。
- PR の本文に「ほかのアプリ・PRISM・データベースへの影響」を1行書く（無ければ「なし」）。
- 毎週月曜の朝、各アプリの CI が kit を最新に上げ、点検が通れば「kit を最新に上げる（自動）」の PR を作る。持ち主はマージするだけ。
  失敗のメールが来たら（kit の変更でアプリが通らない）、全体セッションで直す。
- Vercel の build の前にもこの点検が走る（`prebuild`）。ずれたままでは本番に出ない。
<!-- platform:end -->
