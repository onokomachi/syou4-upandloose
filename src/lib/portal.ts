/**
 * 学級ポータルへの学習記録の送信。
 *
 * このアプリは zustand を使っていない（素の useState と localStorage）ので、
 * learning-app-kit/sync の createSyncedStorage は使えない。
 * 代わりに createPusher で明示的に送る。
 *
 * 送るのは「どの設問を何回やって何回正解したか」だけ。
 * 本文・解答・氏名は一切送らない。端末の匿名IDしか付かない。
 */
import { createPusher, type PushRow } from 'learning-app-kit/sync';

export const APP_ID = 'upandloose';

/**
 * 環境変数を安全に読む。
 * Vite の外（テストや素のNodeでの読み込み）では import.meta.env 自体が存在せず、
 * そのまま参照するとモジュールを読んだ瞬間に例外になる。
 */
function env(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'): string | undefined {
  return (import.meta as { env?: Record<string, string | undefined> }).env?.[key];
}

const push = createPusher({
  appId: APP_ID,
  supabaseUrl: env('VITE_SUPABASE_URL'),
  supabaseKey: env('VITE_SUPABASE_PUBLISHABLE_KEY'),
});

interface WrongEntryLike {
  questionId: number;
  wrongCount: number;
}

/**
 * アプリの状態を、ポータルが受け取る形に直す。
 *
 * clearCount は「周回で正解した回数」、wrongLog は「まちがえた回数」なので、
 * 試行回数は両者の和になる。片方しか無い設問（正解だけ／誤答だけ）も拾う。
 */
export function toRows(
  clearCount: Record<number, number>,
  wrongLog: readonly WrongEntryLike[],
): PushRow[] {
  const wrong = new Map<number, number>();
  for (const w of wrongLog) wrong.set(w.questionId, w.wrongCount);

  const ids = new Set<number>([
    ...Object.keys(clearCount).map(Number),
    ...wrong.keys(),
  ]);

  const rows: PushRow[] = [];
  for (const id of ids) {
    if (!Number.isFinite(id)) continue;
    const corrects = clearCount[id] ?? 0;
    const attempts = corrects + (wrong.get(id) ?? 0);
    if (attempts === 0) continue;
    rows.push({ skill_id: `q-${id}`, attempts, corrects });
  }
  return rows.sort((a, b) => a.skill_id.localeCompare(b.skill_id));
}

/** 状態が変わるたびに呼んでよい。まとめて数秒後に1回だけ送られる。 */
export function syncToPortal(
  clearCount: Record<number, number>,
  wrongLog: readonly WrongEntryLike[],
): void {
  push(toRows(clearCount, wrongLog));
}
