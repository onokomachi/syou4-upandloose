import { useState } from 'react';
import { ChevronRight, ChevronLeft, Flame, BookOpen, Lightbulb, RotateCcw, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MascotPinto, SpeechBubble } from './Mascot';
import { questions } from './data';

interface TitleScreenProps {
  solvedCount: number;
  streak: number;
  reviewCount: number;
  onStart: () => void;
  onReview: () => void;
  onShowOnboarding: () => void;
}

export function TitleScreen({ solvedCount, streak, reviewCount, onStart, onReview, onShowOnboarding }: TitleScreenProps) {
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const total = questions.length;
  const progress = total > 0 ? solvedCount / total : 0;

  const greeting =
    solvedCount === 0 ? 'はじめまして！いっしょにがんばろう！'
    : solvedCount === total ? 'ぜんぶクリア！もういちど挑戦しよう！'
    : `のこり${total - solvedCount}問。おうえんしてるよ！`;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-50 rounded-full translate-y-1/2 -translate-x-1/2 opacity-60" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-blue-400 text-sm font-bold tracking-widest uppercase">
            <Camera size={16} />
            <span>光村図書 国語 4年上</span>
          </div>
          <h1 className="text-4xl font-black text-stone-800 leading-tight">
            アップとルーズで
            <span className="text-blue-500">伝える</span>
          </h1>
          <p className="text-stone-500 mt-2 text-sm">中谷 日出 ／ 学習アプリ</p>
        </div>

        {/* Mascot + bubble */}
        <div className="relative flex flex-col items-center">
          <div className="relative inline-block">
            <SpeechBubble message={greeting} visible={bubbleVisible} position="top" />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              onClick={() => setBubbleVisible(v => !v)}
              className="cursor-pointer"
            >
              <MascotPinto expression={solvedCount === total ? 'celebrating' : solvedCount > 0 ? 'encouraging' : 'happy'} size={120} />
            </motion.div>
          </div>
          <p className="text-xs text-stone-400 mt-2">ピントせんせい</p>
        </div>

        {/* Progress */}
        <div className="w-full bg-stone-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-stone-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-stone-600">問題クリア</span>
            <span className="font-black text-blue-600">{solvedCount} / {total}問</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 text-sm font-bold text-orange-600">
              <Flame size={16} className="text-orange-500" />
              <span>{streak}日連続学習中！</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xl rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors"
          >
            {solvedCount > 0 ? 'つづきから学ぶ' : 'はじめる'}
            <ChevronRight size={24} />
          </motion.button>

          {reviewCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onReview}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-2xl shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={20} />
              ふりかえり問題 ({reviewCount}問)
            </motion.button>
          )}

          <button
            onClick={onShowOnboarding}
            className="text-stone-400 hover:text-stone-600 text-sm underline text-center transition-colors"
          >
            このアプリの使い方を見る
          </button>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    icon: <MascotPinto expression="happy" size={100} />,
    title: 'ピントせんせいといっしょに！',
    body: 'カメラ博士の「ピントせんせい」がいっしょに学ぶよ。まちがえても大丈夫！ヒントを出してくれるから、あきらめないでね。',
    color: 'bg-blue-50 border-blue-200',
    accent: 'text-blue-600',
  },
  {
    icon: <BookOpen size={80} className="text-teal-500" />,
    title: '5つのモードで学ぼう',
    body: '「読む」でだん落ごとに読んで、「問題」で理解を確かめて、「漢字」「構成マップ」「対比表」で深く学べるよ。',
    color: 'bg-teal-50 border-teal-200',
    accent: 'text-teal-600',
  },
  {
    icon: <Lightbulb size={80} className="text-amber-500" />,
    title: '3だんかいのヒント',
    body: 'わからなくてもあきらめないで！ヒントボタンを押すと、だんだんくわしいヒントが出てくるよ。',
    color: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-600',
  },
  {
    icon: <RotateCcw size={80} className="text-indigo-500" />,
    title: 'ふりかえり問題で完ぺきに',
    body: 'まちがえた問題は「ふりかえり」に記録されるよ。タイトル画面から「ふりかえり問題」を選んで、もう一度チャレンジしよう！',
    color: 'bg-indigo-50 border-indigo-200',
    accent: 'text-indigo-600',
  },
] as const;

interface OnboardingProps {
  onDone: () => void;
}

export function OnboardingSlides({ onDone }: OnboardingProps) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-8">
        {/* Step indicator */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === idx ? 'w-8 bg-blue-500' : 'w-2 bg-stone-300'}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className={`w-full rounded-3xl border-2 p-8 flex flex-col items-center gap-6 ${slide.color}`}
          >
            <div className="flex items-center justify-center h-28">{slide.icon}</div>
            <div className="text-center">
              <h2 className={`text-2xl font-black mb-3 ${slide.accent}`}>{slide.title}</h2>
              <p className="text-stone-600 leading-relaxed">{slide.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="w-full flex justify-between items-center">
          {idx > 0 ? (
            <button
              onClick={() => setIdx(i => i - 1)}
              className="flex items-center gap-1 text-stone-500 hover:text-stone-700 font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <ChevronLeft size={20} /> もどる
            </button>
          ) : (
            <div />
          )}

          {idx < SLIDES.length - 1 ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setIdx(i => i + 1)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              つぎへ <ChevronRight size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDone}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              はじめる！ <ChevronRight size={20} />
            </motion.button>
          )}
        </div>

        <button onClick={onDone} className="text-stone-400 hover:text-stone-600 text-sm underline transition-colors">
          スキップ
        </button>
      </div>
    </div>
  );
}
