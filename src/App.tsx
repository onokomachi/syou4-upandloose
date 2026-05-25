import { useState, useEffect, useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import {
  Camera, BookOpen, HelpCircle, PenTool, Layers, GitCompare,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Lightbulb, Star, Trophy,
  ZoomIn, Maximize2, Flame, RotateCcw, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  pages, questions, kanjiList, structure, contrastChips, rubyMap,
  type Kanji, type Paragraph, type ContrastChip, type Question
} from './data';
import { TitleScreen, OnboardingSlides } from './TitleScreen';
import { MascotPinto, SpeechBubble } from './Mascot';
import type { MascotExpression } from './Mascot';

type Screen = 'title' | 'onboarding' | 'learn';
type Mode = 'read' | 'quiz' | 'kanji' | 'structure' | 'contrast';
type Cell = 'up-know' | 'up-unknow' | 'loose-know' | 'loose-unknow';

interface WrongEntry {
  questionId: number;
  wrongCount: number;
  lastWrong: string; // YYYY-MM-DD
}

const SECTION_COLOR: Record<Paragraph['section'], string> = {
  hajime: 'border-teal-400 bg-teal-50',
  naka: 'border-stone-300 bg-white',
  owari: 'border-teal-400 bg-teal-50',
};

const SECTION_LABEL: Record<Paragraph['section'], string> = {
  hajime: '初め',
  naka: '中',
  owari: '終わり',
};

const CONTRAST_SIDE_COLOR: Record<NonNullable<Paragraph['contrast']>['side'], string> = {
  up: 'border-amber-400 bg-amber-50',
  loose: 'border-sky-400 bg-sky-50',
  both: 'border-stone-300 bg-stone-50',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function App() {
  // ── Screen routing ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('title');

  // ── Streak ──────────────────────────────────────────────────────────────────
  const [streak, setStreak] = useState(0);

  // ── Wrong log ───────────────────────────────────────────────────────────────
  const [wrongLog, setWrongLog] = useState<WrongEntry[]>([]);

  // ── Review mode ─────────────────────────────────────────────────────────────
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Question[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);

  // ── Learning state ──────────────────────────────────────────────────────────
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('read');
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

  const [customSelection, setCustomSelection] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [solvedQuestions, setSolvedQuestions] = useState<number[]>([]);
  const [showAllClear, setShowAllClear] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  // Structure mode
  const [expandedPara, setExpandedPara] = useState<number | null>(null);
  const [pulsePara, setPulsePara] = useState<number | null>(null);

  // Read mode (paragraph stepper)
  const [readParaNum, setReadParaNum] = useState<number>(1);

  // Contrast table mode
  const [placedChips, setPlacedChips] = useState<Record<Cell, number[]>>({
    'up-know': [], 'up-unknow': [], 'loose-know': [], 'loose-unknow': []
  });
  const [selectedChipId, setSelectedChipId] = useState<number | null>(null);
  const [contrastFeedback, setContrastFeedback] = useState<{ cell: Cell; ok: boolean } | null>(null);

  // Mascot
  const [mascotExpression, setMascotExpression] = useState<MascotExpression>('default');
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotBubble, setMascotBubble] = useState(false);

  const textContainerRef = useRef<HTMLDivElement>(null);

  // ── localStorage init ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedSolved = localStorage.getItem('solvedQuestions');
    if (savedSolved) setSolvedQuestions(JSON.parse(savedSolved));

    const savedWrong = localStorage.getItem('wrongLog');
    if (savedWrong) setWrongLog(JSON.parse(savedWrong));

    const savedStreak = localStorage.getItem('streak');
    const savedLastDay = localStorage.getItem('lastLearnDay');
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (savedLastDay === today) {
      setStreak(savedStreak ? parseInt(savedStreak) : 1);
    } else if (savedLastDay === yesterday) {
      const newStreak = (savedStreak ? parseInt(savedStreak) : 0) + 1;
      setStreak(newStreak);
      localStorage.setItem('streak', String(newStreak));
      localStorage.setItem('lastLearnDay', today);
    } else {
      setStreak(1);
      localStorage.setItem('streak', '1');
      localStorage.setItem('lastLearnDay', today);
    }
  }, []);

  // ── Persist solved questions ─────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('solvedQuestions', JSON.stringify(solvedQuestions));
  }, [solvedQuestions]);

  // ── Persist wrong log ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('wrongLog', JSON.stringify(wrongLog));
  }, [wrongLog]);

  // ── All-clear trigger ────────────────────────────────────────────────────────
  useEffect(() => {
    if (solvedQuestions.length === questions.length && questions.length > 0) {
      setShowAllClear(true);
    }
  }, [solvedQuestions.length]);

  // ── Pointer up ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // ── Page / mode change: reset quiz state ────────────────────────────────────
  useEffect(() => {
    setQuizFeedback(null);
    setHintLevel(0);
    setFreeTextAnswer('');
    setShowSampleAnswer(false);
    setSelectedKanji(null);
    setCurrentQuestionIndex(0);
    setCustomSelection(null);
    if (mode === 'read') {
      const currentPara = structure.find(p => p.num === readParaNum);
      if (!currentPara || currentPara.pageId !== pages[currentPageIndex].id) {
        const firstPara = structure.find(p => p.pageId === pages[currentPageIndex].id);
        if (firstPara) setReadParaNum(firstPara.num);
      }
    }
  }, [currentPageIndex, mode]);

  // ── Mascot helpers ──────────────────────────────────────────────────────────
  const showMascot = (expr: MascotExpression, msg: string) => {
    setMascotExpression(expr);
    setMascotMessage(msg);
    setMascotBubble(true);
    setTimeout(() => setMascotBubble(false), 3500);
  };

  // ── Answer helpers ──────────────────────────────────────────────────────────
  const recordCorrect = (questionId: number) => {
    if (!solvedQuestions.includes(questionId)) {
      setSolvedQuestions(prev => [...prev, questionId]);
    }
    showMascot('celebrating', 'すごい！正解！よくできたね！');
  };

  const recordWrong = (questionId: number) => {
    const today = todayStr();
    setWrongLog(prev => {
      const existing = prev.find(e => e.questionId === questionId);
      if (existing) {
        return prev.map(e =>
          e.questionId === questionId
            ? { ...e, wrongCount: e.wrongCount + 1, lastWrong: today }
            : e
        );
      }
      return [...prev, { questionId, wrongCount: 1, lastWrong: today }];
    });
    showMascot('encouraging', 'おしい！ヒントを見てもう一度チャレンジ！');
  };

  // ── Review queue builder ─────────────────────────────────────────────────────
  const buildReviewQueue = (): Question[] => {
    const today = todayStr();
    return wrongLog
      .filter(e => e.lastWrong < today)
      .map(e => questions.find(q => q.id === e.questionId))
      .filter((q): q is Question => q != null);
  };

  const reviewCount = buildReviewQueue().length;

  const handleStartReview = () => {
    const queue = buildReviewQueue();
    if (queue.length === 0) return;
    setReviewQueue(queue);
    setReviewIdx(0);
    setReviewMode(true);
    setQuizFeedback(null);
    setHintLevel(0);
    setFreeTextAnswer('');
    setShowSampleAnswer(false);
    setCustomSelection(null);
    setScreen('learn');
  };

  const handleReviewNext = () => {
    if (reviewIdx < reviewQueue.length - 1) {
      setReviewIdx(i => i + 1);
      setQuizFeedback(null);
      setHintLevel(0);
      setFreeTextAnswer('');
      setShowSampleAnswer(false);
      setCustomSelection(null);
    } else {
      setReviewMode(false);
      setReviewQueue([]);
      showMascot('celebrating', 'ふりかえり完了！よくがんばった！');
    }
  };

  // Active question depends on mode
  const currentPage = pages[currentPageIndex];
  const pageQuestions = questions.filter(q => q.pageId === currentPage.id);
  const normalQuestion = pageQuestions[currentQuestionIndex];
  const currentQuestion: Question | undefined = reviewMode ? reviewQueue[reviewIdx] : normalQuestion;

  const currentKanjiList = kanjiList.filter(k => k.pageId === currentPage.id);

  // ── Hint cycling ─────────────────────────────────────────────────────────────
  const handleHint = () => {
    if (!currentQuestion) return;
    if (hintLevel === 0) {
      setHintLevel(1);
      showMascot('thinking', 'ちょっとだけヒントだよ！');
    } else if (hintLevel === 1 && currentQuestion.hint2) {
      setHintLevel(2);
      showMascot('thinking', 'もうすこしくわしいヒントだよ！');
    } else {
      setHintLevel(3);
      showMascot('encouraging', '答えは本文の中にあるよ。よく読んでみて！');
    }
  };

  const getHintText = () => {
    if (!currentQuestion) return '';
    if (hintLevel === 1) return currentQuestion.hint;
    if (hintLevel === 2) return currentQuestion.hint2 ?? currentQuestion.hint;
    if (hintLevel === 3) {
      if (currentQuestion.targetText) return `本文の「${currentQuestion.targetText.slice(0, 8)}…」の近くを探してみよう。`;
      if (Array.isArray(currentQuestion.answer) && currentQuestion.answer.length > 0) {
        return `答えは${currentQuestion.answer[0].length}文字くらいだよ。`;
      }
      return currentQuestion.hint2 ?? currentQuestion.hint;
    }
    return '';
  };

  const hintLabel =
    hintLevel === 0 ? 'ヒント①を見る' :
    hintLevel === 1 ? 'ヒント②を見る' :
    hintLevel === 2 ? 'ヒント③を見る' : 'ヒントを見た';

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(prev => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1);
  };
  const handleNextQuestion = () => {
    if (currentQuestionIndex < pageQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuizFeedback(null); setHintLevel(0);
      setFreeTextAnswer(''); setShowSampleAnswer(false); setCustomSelection(null);
    }
  };
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuizFeedback(null); setHintLevel(0);
      setFreeTextAnswer(''); setShowSampleAnswer(false); setCustomSelection(null);
    }
  };

  // ── Extract answer ──────────────────────────────────────────────────────────
  const getSelectedText = () => {
    if (!customSelection) return '';
    const start = Math.min(customSelection[0], customSelection[1]);
    const end = Math.max(customSelection[0], customSelection[1]);
    // For review mode, the question may belong to a different page
    const targetPage = reviewMode
      ? pages.find(p => p.id === currentQuestion?.pageId) ?? currentPage
      : currentPage;
    return Array.from(targetPage.text).slice(start, end + 1).join('');
  };

  const handleExtractAnswer = () => {
    const selectedText = getSelectedText().trim();
    if (!selectedText) {
      alert('本文の文字をタッチして選んでからボタンを押してね！');
      return;
    }
    if (currentQuestion?.type === 'extract' && Array.isArray(currentQuestion.answer)) {
      const isCorrect = currentQuestion.answer.some(
        ans => selectedText.includes(ans) || ans.includes(selectedText)
      );
      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) {
        recordCorrect(currentQuestion.id);
      } else {
        recordWrong(currentQuestion.id);
        if (hintLevel === 0) setHintLevel(1);
      }
    }
    setCustomSelection(null);
  };

  const handleChoiceAnswer = (choiceIndex: number) => {
    if (currentQuestion?.type === 'choice') {
      const isCorrect = currentQuestion.answer === choiceIndex;
      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect) {
        recordCorrect(currentQuestion.id);
      } else {
        recordWrong(currentQuestion.id);
        if (hintLevel === 0) setHintLevel(1);
      }
    }
  };

  const handleFreeTextSubmit = () => {
    setShowSampleAnswer(true);
    if (currentQuestion) recordCorrect(currentQuestion.id);
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (!isDragging || mode !== 'quiz') return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.hasAttribute('data-index')) {
      const index = parseInt(element.getAttribute('data-index')!, 10);
      setCustomSelection(prev => prev ? [prev[0], index] : [index, index]);
    }
  };

  // ── Structure mode ──────────────────────────────────────────────────────────
  const handleSelectParagraph = (p: Paragraph) => {
    setExpandedPara(prev => (prev === p.num ? null : p.num));
    if (p.pageId !== currentPage.id) {
      setCurrentPageIndex(pages.findIndex(pg => pg.id === p.pageId));
    }
    setPulsePara(p.num);
    setTimeout(() => setPulsePara(null), 1200);
  };

  // ── Read mode ───────────────────────────────────────────────────────────────
  const readPara = structure.find(p => p.num === readParaNum) ?? structure[0];
  const readParaBody = (() => {
    const targetPage = pages.find(pg => pg.id === readPara.pageId);
    if (!targetPage) return '';
    const paragraphsOnPage = structure.filter(p => p.pageId === readPara.pageId);
    const idxInPage = paragraphsOnPage.findIndex(p => p.num === readPara.num);
    const segments = targetPage.text.split('\n');
    return segments[idxInPage] ?? '';
  })();

  const handleStepRead = (delta: 1 | -1) => {
    const next = readParaNum + delta;
    if (next < 1 || next > structure.length) return;
    const nextPara = structure.find(p => p.num === next)!;
    setReadParaNum(next);
    if (nextPara.pageId !== currentPage.id) {
      setCurrentPageIndex(pages.findIndex(pg => pg.id === nextPara.pageId));
    }
    setPulsePara(next);
    setTimeout(() => setPulsePara(null), 1200);
  };

  // ── Contrast table ──────────────────────────────────────────────────────────
  const handleSelectChip = (chip: ContrastChip) => {
    if ((Object.values(placedChips) as number[][]).some(arr => arr.includes(chip.id))) return;
    setSelectedChipId(prev => (prev === chip.id ? null : chip.id));
  };
  const handlePlaceChip = (cell: Cell) => {
    if (selectedChipId == null) return;
    const chip = contrastChips.find(c => c.id === selectedChipId);
    if (!chip) return;
    if (chip.correctCell === cell) {
      setPlacedChips(prev => ({ ...prev, [cell]: [...prev[cell], chip.id] }));
      setContrastFeedback({ cell, ok: true });
    } else {
      setContrastFeedback({ cell, ok: false });
    }
    setSelectedChipId(null);
    setTimeout(() => setContrastFeedback(null), 800);
  };
  const handleResetContrast = () => {
    setPlacedChips({ 'up-know': [], 'up-unknow': [], 'loose-know': [], 'loose-unknow': [] });
    setSelectedChipId(null);
    setContrastFeedback(null);
  };
  const contrastComplete =
    placedChips['up-know'].length === 1 && placedChips['up-unknow'].length === 1 &&
    placedChips['loose-know'].length === 1 && placedChips['loose-unknow'].length === 1;

  // ── renderText ──────────────────────────────────────────────────────────────
  // In review mode we show the page the current review question belongs to
  const displayPage = reviewMode && currentQuestion
    ? (pages.find(p => p.id === currentQuestion.pageId) ?? currentPage)
    : currentPage;

  const renderText = () => {
    const text = displayPage.text;
    const chars = Array.from(text);

    const kanjiRanges: { start: number, end: number, kanji: Kanji }[] = [];
    if (mode === 'kanji') {
      currentKanjiList.forEach(k => {
        let startIndex = 0;
        while ((startIndex = text.indexOf(k.char, startIndex)) !== -1) {
          kanjiRanges.push({ start: startIndex, end: startIndex + k.char.length - 1, kanji: k });
          startIndex += k.char.length;
        }
      });
    }

    const questionTargetRanges: { start: number, end: number }[] = [];
    if ((mode === 'quiz' || reviewMode) && currentQuestion?.targetText) {
      let startIndex = 0;
      while ((startIndex = text.indexOf(currentQuestion.targetText, startIndex)) !== -1) {
        questionTargetRanges.push({
          start: startIndex, end: startIndex + currentQuestion.targetText.length - 1
        });
        startIndex += currentQuestion.targetText.length;
      }
    }

    let pulseRange: { start: number, end: number } | null = null;
    if (pulsePara != null) {
      const paragraphsOnPage = structure.filter(p => p.pageId === displayPage.id);
      const idxInPage = paragraphsOnPage.findIndex(p => p.num === pulsePara);
      if (idxInPage >= 0) {
        const segments = text.split('\n');
        if (idxInPage < segments.length) {
          let offset = 0;
          for (let i = 0; i < idxInPage; i++) offset += segments[i].length + 1;
          pulseRange = { start: offset, end: offset + segments[idxInPage].length - 1 };
        }
      }
    }

    const paraStarts = new Set<number>([0]);
    chars.forEach((ch, i) => { if (ch === '\n' && i + 1 < chars.length) paraStarts.add(i + 1); });

    return chars.flatMap((char, index): ReactNode[] => {
      if (char === '\n') return [<br key={`br-${index}`} />];

      const isSelected = customSelection &&
        index >= Math.min(customSelection[0], customSelection[1]) &&
        index <= Math.max(customSelection[0], customSelection[1]);
      const kanji = kanjiRanges.find(r => index >= r.start && index <= r.end);
      const isQuestionTarget = questionTargetRanges.some(r => index >= r.start && index <= r.end);
      const isPulse = pulseRange && index >= pulseRange.start && index <= pulseRange.end;

      let className = 'transition-colors duration-200 ';
      if (isSelected) {
        className += 'bg-amber-300 text-amber-900 rounded-sm ';
      } else if (kanji) {
        className += 'text-indigo-600 font-bold cursor-pointer border-b-2 border-indigo-400 pb-1 ';
      }
      if (isQuestionTarget) {
        className += 'underline decoration-red-500 decoration-[3px] underline-offset-4 ';
      }
      if (isPulse) {
        className += 'bg-amber-100 ';
      }

      const handlePointerDown = () => {
        if (mode === 'kanji') {
          if (kanji) setSelectedKanji(kanji.kanji);
          return;
        }
        if (mode === 'quiz' || reviewMode) {
          setIsDragging(true);
          if (customSelection && customSelection[0] === customSelection[1]) {
            setCustomSelection([customSelection[0], index]);
          } else {
            setCustomSelection([index, index]);
          }
        }
      };

      const handlePointerEnter = () => {
        if (isDragging && (mode === 'quiz' || reviewMode)) {
          setCustomSelection(prev => prev ? [prev[0], index] : [index, index]);
        }
      };

      const ruby = rubyMap[char];

      const inner = (
        <span
          key={index}
          data-index={index}
          className={className}
          onPointerDown={handlePointerDown}
          onPointerEnter={handlePointerEnter}
        >
          {char}
        </span>
      );

      const element: ReactNode = ruby ? (
        <ruby key={index} className="ruby-wrapper">
          {inner}
          <rt className="text-[0.5em] text-stone-500 font-normal">{ruby}</rt>
        </ruby>
      ) : inner;
      if (paraStarts.has(index)) {
        return [<span key={`ind-${index}`} aria-hidden>　</span>, element];
      }
      return [element];
    });
  };

  // ── Screen routing ──────────────────────────────────────────────────────────
  if (screen === 'title') {
    return (
      <TitleScreen
        solvedCount={solvedQuestions.length}
        streak={streak}
        reviewCount={reviewCount}
        onStart={() => setScreen('learn')}
        onReview={handleStartReview}
        onShowOnboarding={() => setScreen('onboarding')}
      />
    );
  }

  if (screen === 'onboarding') {
    return <OnboardingSlides onDone={() => setScreen('learn')} />;
  }

  // ── Quiz panel helper: which question set to show ───────────────────────────
  const quizQuestion = currentQuestion;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-800">
      {/* All Clear Modal */}
      <AnimatePresence>
        {showAllClear && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAllClear(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl max-w-md text-center"
              onClick={e => e.stopPropagation()}
            >
              <MascotPinto expression="celebrating" size={100} />
              <div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">全問クリア！</h2>
                <p className="text-stone-600">
                  すごい！すべての問題を解くことができたね！<br />
                  「アップとルーズで伝える」の組み立てと、筆者の主張がしっかりつかめたかな？
                </p>
              </div>
              <button
                onClick={() => setShowAllClear(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full"
              >
                もどる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white shadow-sm px-3 py-2 flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setScreen('title')} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500 shrink-0" aria-label="タイトルへ">
            <Home size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-stone-700 flex items-center gap-1.5 truncate">
              <Camera className="text-blue-500 shrink-0" size={18} aria-label="カメラ" />
              アップとルーズで伝える
            </h1>
            <p className="text-[10px] text-stone-500 ml-6 truncate">中谷 日出 ／ 光村図書 4年上</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 shrink-0">
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold border border-blue-200 text-xs">
              <Star className="fill-blue-400 text-blue-400" size={12} />
              <span>{solvedQuestions.length}/{questions.length}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-0.5 text-orange-600 text-xs font-bold">
                <Flame size={12} className="text-orange-500" />
                <span>{streak}日</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {reviewMode && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold border border-amber-200">
              <RotateCcw size={12} />
              {reviewIdx + 1}/{reviewQueue.length}
            </div>
          )}
          <div className="flex gap-0.5 bg-stone-100 p-0.5 rounded-lg">
            <ModeButton active={mode === 'read'} onClick={() => { setReviewMode(false); setMode('read'); }} icon={<BookOpen size={16} />} label="読む" color="teal" />
            <ModeButton active={mode === 'quiz' || reviewMode} onClick={() => { setReviewMode(false); setMode('quiz'); }} icon={<HelpCircle size={16} />} label="問題" color="amber" />
            <ModeButton active={mode === 'kanji'} onClick={() => { setReviewMode(false); setMode('kanji'); }} icon={<PenTool size={16} />} label="漢字" color="indigo" />
            <ModeButton active={mode === 'structure'} onClick={() => { setReviewMode(false); setMode('structure'); }} icon={<Layers size={16} />} label="構成" color="teal" />
            <ModeButton active={mode === 'contrast'} onClick={() => { setReviewMode(false); setMode('contrast'); }} icon={<GitCompare size={16} />} label="対比" color="sky" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Text Viewer */}
        <div className="w-3/5 bg-white m-2 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative">
          <div className="absolute top-2 left-3 text-stone-400 font-medium text-sm z-10">
            p.{displayPage.pageNumber}
          </div>
          <div className="absolute top-2 right-3 text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full z-10">
            {displayPage.paragraphRange}
          </div>

          <div className={`flex-1 overflow-x-auto px-5 pt-8 pb-2 block ${(mode === 'quiz' || reviewMode) ? 'select-none' : ''}`}>
            <div
              ref={textContainerRef}
              className="h-full min-h-[55vh] text-xl leading-[2.3] font-serif text-stone-800 ml-auto w-max px-5 cursor-text"
              style={{ writingMode: 'vertical-rl' }}
              onTouchMove={handleTouchMove}
            >
              {renderText()}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-stone-100 flex justify-between items-center bg-stone-50 rounded-b-2xl">
            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === pages.length - 1}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm disabled:opacity-50 hover:bg-stone-100 transition-colors font-bold text-stone-600 text-sm"
            >
              <ChevronLeft size={16} /> 次のページ
            </button>
            <div className="text-stone-400 font-medium text-sm">{currentPageIndex + 1} / {pages.length}</div>
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="flex items-center gap-1 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm disabled:opacity-50 hover:bg-stone-100 transition-colors font-bold text-stone-600 text-sm"
            >
              前のページ <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Action Panel */}
        <div className="w-2/5 m-2 ml-0 flex flex-col gap-2 relative">
          {/* Floating mascot — overlays panel content; bubble appears above to avoid pane-edge clipping */}
          <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
            <div className="relative">
              <SpeechBubble message={mascotMessage} visible={mascotBubble} position="top" />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <MascotPinto expression={mascotExpression} size={56} />
              </motion.div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={reviewMode ? `review-${reviewIdx}` : mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 p-4 pb-20 flex flex-col overflow-y-auto"
            >
              {/* Review mode panel */}
              {reviewMode && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-100">
                    <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                      <RotateCcw /> ふりかえり問題 {reviewIdx + 1} / {reviewQueue.length}
                    </h2>
                    {quizQuestion && solvedQuestions.includes(quizQuestion.id) && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <CheckCircle2 size={16} /> クリア済
                      </span>
                    )}
                  </div>
                  {quizQuestion && <QuizBody
                    question={quizQuestion}
                    quizFeedback={quizFeedback}
                    hintLevel={hintLevel}
                    hintLabel={hintLabel}
                    hintText={getHintText()}
                    freeTextAnswer={freeTextAnswer}
                    showSampleAnswer={showSampleAnswer}
                    onExtract={handleExtractAnswer}
                    onChoice={handleChoiceAnswer}
                    onFreeTextChange={setFreeTextAnswer}
                    onFreeTextSubmit={handleFreeTextSubmit}
                    onHint={handleHint}
                  />}
                  <div className="mt-4 pt-4 border-t border-amber-100 flex justify-end">
                    <button
                      onClick={handleReviewNext}
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full transition-colors flex items-center gap-1"
                    >
                      {reviewIdx < reviewQueue.length - 1 ? '次の問題' : 'ふりかえり完了'} <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {!reviewMode && mode === 'read' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-teal-100">
                    <h2 className="text-xl font-bold text-teal-600 flex items-center gap-2">
                      <BookOpen /> だん落ごとに読もう
                    </h2>
                    <span className="text-xs text-teal-700 font-bold bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                      {readParaNum} / {structure.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      readPara.section === 'hajime' ? 'bg-teal-500 text-white'
                        : readPara.section === 'owari' ? 'bg-teal-500 text-white'
                        : readPara.contrast?.side === 'up' ? 'bg-amber-500 text-white'
                        : readPara.contrast?.side === 'loose' ? 'bg-sky-500 text-white'
                        : 'bg-stone-500 text-white'
                    }`}>
                      {readPara.section === 'hajime' ? SECTION_LABEL.hajime
                        : readPara.section === 'owari' ? SECTION_LABEL.owari
                        : readPara.contrast?.side === 'up' ? 'アップ'
                        : readPara.contrast?.side === 'loose' ? 'ルーズ'
                        : SECTION_LABEL.naka}
                    </span>
                    <span className="text-sm font-bold text-stone-700">¶{readPara.num}　{readPara.role}</span>
                  </div>

                  <div className="flex-1 bg-stone-50 rounded-2xl border border-stone-200 p-5 overflow-y-auto leading-loose text-lg text-stone-800 font-serif">
                    {Array.from('　' + readParaBody).map((ch, i) => {
                      const r = rubyMap[ch];
                      if (r) {
                        return (
                          <ruby key={i}>
                            {ch}
                            <rt className="text-[0.5em] text-stone-500 font-normal">{r}</rt>
                          </ruby>
                        );
                      }
                      return <span key={i}>{ch}</span>;
                    })}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={() => handleStepRead(-1)}
                      disabled={readParaNum === 1}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-teal-200 rounded-full text-teal-700 font-bold disabled:opacity-30 hover:bg-teal-50"
                    >
                      <ChevronLeft size={18} /> 前のだん落
                    </button>
                    <button
                      onClick={() => handleStepRead(1)}
                      disabled={readParaNum === structure.length}
                      className="flex items-center gap-1 px-4 py-2 bg-teal-500 text-white rounded-full font-bold disabled:opacity-30 hover:bg-teal-600"
                    >
                      次のだん落 <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-amber-700">
                      <ZoomIn className="inline" size={14} /> <span className="font-bold">アップ</span>=細かい部分を大きく
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-2 text-sky-700">
                      <Maximize2 className="inline" size={14} /> <span className="font-bold">ルーズ</span>=広いはんい
                    </div>
                  </div>
                </div>
              )}

              {!reviewMode && mode === 'quiz' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-100">
                    <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                      <HelpCircle /> 問題 {currentQuestionIndex + 1} / {pageQuestions.length}
                    </h2>
                    {quizQuestion && solvedQuestions.includes(quizQuestion.id) && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <CheckCircle2 size={16} /> クリア済
                      </span>
                    )}
                  </div>

                  {quizQuestion ? (
                    <QuizBody
                      question={quizQuestion}
                      quizFeedback={quizFeedback}
                      hintLevel={hintLevel}
                      hintLabel={hintLabel}
                      hintText={getHintText()}
                      freeTextAnswer={freeTextAnswer}
                      showSampleAnswer={showSampleAnswer}
                      onExtract={handleExtractAnswer}
                      onChoice={handleChoiceAnswer}
                      onFreeTextChange={setFreeTextAnswer}
                      onFreeTextSubmit={handleFreeTextSubmit}
                      onHint={handleHint}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-4">
                      <HelpCircle size={48} className="opacity-20" />
                      <p>このページには問題はありません。<br />次のページに進んでみよう。</p>
                    </div>
                  )}

                  {pageQuestions.length > 1 && (
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-amber-100">
                      <button
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 text-amber-600 font-bold disabled:opacity-30 flex items-center gap-1 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <ChevronLeft size={20} /> 前の問題
                      </button>
                      <button
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === pageQuestions.length - 1}
                        className="px-4 py-2 text-amber-600 font-bold disabled:opacity-30 flex items-center gap-1 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        次の問題 <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!reviewMode && mode === 'kanji' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2 mb-3 pb-2 border-b border-indigo-100">
                    <PenTool /> 新出漢字を学ぼう
                  </h2>
                  <p className="text-stone-600 mb-6">左の文章のインディゴ色の文字をタップすると、漢字の読み方や意味がわかるよ。</p>
                  {selectedKanji ? (
                    <motion.div
                      key={selectedKanji.char}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-indigo-50 rounded-2xl p-8 border border-indigo-100 flex flex-col items-center text-center gap-5"
                    >
                      <div className="text-8xl font-serif text-indigo-900 bg-white w-40 h-40 rounded-2xl shadow-sm flex items-center justify-center border-2 border-indigo-200">
                        {selectedKanji.char}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-indigo-500 mb-1">読み方</div>
                        <div className="text-2xl font-bold text-stone-800">{selectedKanji.reading}</div>
                      </div>
                      <div className="w-full h-px bg-indigo-200" />
                      <div>
                        <div className="text-sm font-bold text-indigo-500 mb-1">意味</div>
                        <div className="text-lg text-stone-700">{selectedKanji.meaning}</div>
                      </div>
                      {selectedKanji.example && (
                        <>
                          <div className="w-full h-px bg-indigo-200" />
                          <div>
                            <div className="text-sm font-bold text-indigo-500 mb-1">本文での使い方</div>
                            <div className="text-lg text-stone-700">{selectedKanji.example}</div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50 text-indigo-400 font-medium p-6 text-center">
                      左の文章からインディゴ色の漢字を選んでね<br />
                      （このページの新出漢字: {currentKanjiList.map(k => k.char).join('・') || 'なし'}）
                    </div>
                  )}
                </div>
              )}

              {!reviewMode && mode === 'structure' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-teal-100">
                    <h2 className="text-xl font-bold text-teal-600 flex items-center gap-2">
                      <Layers /> 文章の組み立てマップ
                    </h2>
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">初め・中・終わり</span>
                  </div>
                  <p className="text-stone-600 mb-4 text-sm">
                    8つのだん落のはたらきを見てみよう。カードをタップすると、左の本文のだん落へジャンプするよ。
                    <span className="text-teal-700 font-bold">初め・終わり</span>はティール、<span className="text-amber-600 font-bold">アップのだん落</span>はアンバー、<span className="text-sky-600 font-bold">ルーズのだん落</span>はスカイで色分けされているよ。
                  </p>
                  <div className="flex flex-col gap-3">
                    {structure.map(p => {
                      const isAmber = p.contrast?.side === 'up';
                      const isSky = p.contrast?.side === 'loose';
                      const tone = p.section !== 'naka'
                        ? SECTION_COLOR[p.section]
                        : isAmber ? CONTRAST_SIDE_COLOR.up
                        : isSky ? CONTRAST_SIDE_COLOR.loose
                        : 'border-stone-300 bg-white';
                      const sectionBadge =
                        p.section === 'hajime' ? { label: SECTION_LABEL.hajime, cls: 'bg-teal-500 text-white' }
                        : p.section === 'owari' ? { label: SECTION_LABEL.owari, cls: 'bg-teal-500 text-white' }
                        : isAmber ? { label: 'アップ', cls: 'bg-amber-500 text-white' }
                        : isSky ? { label: 'ルーズ', cls: 'bg-sky-500 text-white' }
                        : { label: SECTION_LABEL.naka, cls: 'bg-stone-500 text-white' };
                      const isExpanded = expandedPara === p.num;
                      return (
                        <button
                          key={p.num}
                          onClick={() => handleSelectParagraph(p)}
                          className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${tone} ${isExpanded ? 'shadow-md ring-2 ring-teal-300' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-stone-700 border border-stone-200 shrink-0">
                              ¶{p.num}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sectionBadge.cls}`}>{sectionBadge.label}</span>
                                <span className="font-bold text-stone-700">{p.role}</span>
                              </div>
                              <div className="text-sm text-stone-600">{p.summary}</div>
                              {isExpanded && p.contrast && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 grid grid-cols-2 gap-2">
                                  <div className="bg-white/80 rounded-lg p-2 border border-green-200">
                                    <div className="text-xs font-bold text-green-700 mb-1">わかること</div>
                                    <div className="text-xs text-stone-700">{p.contrast.knowable}</div>
                                  </div>
                                  <div className="bg-white/80 rounded-lg p-2 border border-red-200">
                                    <div className="text-xs font-bold text-red-700 mb-1">わからないこと</div>
                                    <div className="text-xs text-stone-700">{p.contrast.unknowable}</div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!reviewMode && mode === 'contrast' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-sky-600 flex items-center gap-2 mb-3 pb-2 border-b border-sky-100">
                    <GitCompare /> アップ ⇄ ルーズ 対比表
                  </h2>
                  <p className="text-stone-600 text-sm mb-4">
                    下の<strong>カード</strong>をタップ → <strong>表のマス</strong>をタップ で入れていこう。<br />
                    正しいマスに入ると残るよ。まちがえると赤く光って戻るからもう一度考えてみよう。
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div></div>
                    <div className="text-center text-xs font-bold text-green-700 bg-green-50 rounded-lg py-2">わかること</div>
                    <div className="text-center text-xs font-bold text-red-700 bg-red-50 rounded-lg py-2">わからないこと</div>

                    <div className="flex items-center justify-center text-sm font-bold text-amber-700 bg-amber-100 rounded-lg">アップ</div>
                    <Cell2x2 cell="up-know" placed={placedChips} chips={contrastChips} feedback={contrastFeedback} onPlace={handlePlaceChip} />
                    <Cell2x2 cell="up-unknow" placed={placedChips} chips={contrastChips} feedback={contrastFeedback} onPlace={handlePlaceChip} />

                    <div className="flex items-center justify-center text-sm font-bold text-sky-700 bg-sky-100 rounded-lg">ルーズ</div>
                    <Cell2x2 cell="loose-know" placed={placedChips} chips={contrastChips} feedback={contrastFeedback} onPlace={handlePlaceChip} />
                    <Cell2x2 cell="loose-unknow" placed={placedChips} chips={contrastChips} feedback={contrastFeedback} onPlace={handlePlaceChip} />
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-bold text-stone-500 mb-2">語句カード</div>
                    <div className="flex flex-wrap gap-2">
                      {contrastChips.map(chip => {
                        const placed = (Object.values(placedChips) as number[][]).some(arr => arr.includes(chip.id));
                        if (placed) return null;
                        const isSelected = selectedChipId === chip.id;
                        return (
                          <button
                            key={chip.id}
                            onClick={() => handleSelectChip(chip)}
                            className={`px-3 py-2 rounded-full text-sm font-medium border-2 transition-all ${isSelected ? 'bg-stone-800 text-white border-stone-800 scale-105' : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'}`}
                          >
                            {chip.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {contrastComplete && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-auto bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <p className="font-bold text-teal-700 mb-1">完成！筆者の主張は——</p>
                      <p className="text-stone-700 text-sm">
                        アップとルーズには伝えられること／伝えられないことがあるからこそ、
                        <strong>送り手は伝えたいことに合わせてアップとルーズを選んだり組み合わせたりする</strong>必要がある。
                      </p>
                    </motion.div>
                  )}

                  <button onClick={handleResetContrast} className="mt-4 text-stone-400 hover:text-stone-600 text-sm underline self-start">
                    リセットする
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ── QuizBody ─────────────────────────────────────────────────────────────────
function QuizBody({
  question,
  quizFeedback,
  hintLevel,
  hintLabel,
  hintText,
  freeTextAnswer,
  showSampleAnswer,
  onExtract,
  onChoice,
  onFreeTextChange,
  onFreeTextSubmit,
  onHint,
}: {
  question: Question;
  quizFeedback: 'correct' | 'incorrect' | null;
  hintLevel: 0 | 1 | 2 | 3;
  hintLabel: string;
  hintText: string;
  freeTextAnswer: string;
  showSampleAnswer: boolean;
  onExtract: () => void;
  onChoice: (idx: number) => void;
  onFreeTextChange: (v: string) => void;
  onFreeTextSubmit: () => void;
  onHint: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="bg-amber-50 p-6 rounded-xl text-lg font-medium text-stone-800 leading-relaxed whitespace-pre-line">
        {question.question}
      </div>

      {question.type === 'extract' && (
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="bg-amber-100/50 p-4 rounded-xl text-stone-600 text-center text-sm w-full">
            <p className="font-bold text-amber-700 mb-1">【えらび方】</p>
            <p>左の文章の、<strong>最初の文字</strong>と<strong>最後の文字</strong>を<br />ポン、ポンとタッチして選んでね。</p>
          </div>
          <button
            onClick={onExtract}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full max-w-md mt-4"
          >
            選んだ文字で答える
          </button>
        </div>
      )}

      {question.type === 'choice' && (
        <div className="flex flex-col gap-3">
          {question.choices?.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => onChoice(idx)}
              className="text-left p-4 rounded-xl border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-colors font-medium text-stone-700"
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {question.type === 'free' && (
        <div className="flex flex-col gap-4">
          <textarea
            value={freeTextAnswer}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder="ここに自分の考えを書いてね..."
            className="min-h-[120px] p-4 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:ring-0 resize-none text-lg"
          />
          <button
            onClick={onFreeTextSubmit}
            disabled={!freeTextAnswer.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg disabled:opacity-50"
          >
            答え合わせをする
          </button>
          {showSampleAnswer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-green-50 p-4 rounded-xl border border-green-200">
              <p className="text-green-800 font-bold mb-2">解答例：</p>
              <p className="text-green-700">{question.sampleAnswer}</p>
              <p className="text-sm text-green-600 mt-2">※自分の考えと似ているところはあるかな？</p>
            </motion.div>
          )}
        </div>
      )}

      {quizFeedback && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-4 rounded-xl flex items-center gap-3 font-bold text-lg ${quizFeedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {quizFeedback === 'correct' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
          {quizFeedback === 'correct' ? '大正解！よくできました！' : 'ざんねん、もう一度考えてみよう！'}
        </motion.div>
      )}

      {/* Tiered hint */}
      {hintLevel > 0 && hintText && (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-indigo-800">
          <Lightbulb className="shrink-0 text-indigo-500 mt-1" />
          <div>
            <p className="font-bold text-indigo-600 text-xs mb-1">ヒント{'①②③'.charAt(hintLevel - 1)}</p>
            <p>{hintText}</p>
          </div>
        </div>
      )}

      {hintLevel < 3 && (
        <button
          onClick={onHint}
          className="flex items-center gap-2 self-start text-indigo-500 hover:text-indigo-700 text-sm font-bold border border-indigo-200 hover:border-indigo-400 rounded-full px-4 py-2 transition-colors"
        >
          <Lightbulb size={16} />
          {hintLabel}
        </button>
      )}
    </div>
  );
}

// ── Cell2x2 ──────────────────────────────────────────────────────────────────
function Cell2x2({
  cell, placed, chips, feedback, onPlace
}: {
  cell: Cell;
  placed: Record<Cell, number[]>;
  chips: ContrastChip[];
  feedback: { cell: Cell; ok: boolean } | null;
  onPlace: (cell: Cell) => void;
}) {
  const chipId = placed[cell][0];
  const chip = chipId != null ? chips.find(c => c.id === chipId) : null;
  const fb = feedback && feedback.cell === cell ? feedback : null;
  const baseColor = cell.startsWith('up-') ? 'border-amber-200' : 'border-sky-200';
  const flash =
    fb?.ok === false ? 'bg-red-200 border-red-400 animate-pulse' :
    fb?.ok === true ? 'bg-green-100 border-green-400' :
    chip ? 'bg-white border-stone-300' : 'bg-stone-50';
  return (
    <button
      onClick={() => onPlace(cell)}
      className={`min-h-[64px] rounded-xl border-2 p-2 text-xs transition-all ${baseColor} ${flash}`}
    >
      {chip ? (
        <span className="text-stone-700 font-medium">{chip.text}</span>
      ) : (
        <span className="text-stone-400">タップして入れる</span>
      )}
    </button>
  );
}

// ── ModeButton ───────────────────────────────────────────────────────────────
function ModeButton({
  active, onClick, icon, label, color
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  color: 'teal' | 'amber' | 'indigo' | 'sky';
}) {
  const colorMap: Record<typeof color, string> = {
    teal: 'bg-teal-500 text-white shadow-md',
    amber: 'bg-amber-500 text-white shadow-md',
    indigo: 'bg-indigo-500 text-white shadow-md',
    sky: 'bg-sky-500 text-white shadow-md',
  };
  const inactiveColorMap: Record<typeof color, string> = {
    teal: 'text-teal-700 hover:bg-teal-100',
    amber: 'text-amber-700 hover:bg-amber-100',
    indigo: 'text-indigo-700 hover:bg-indigo-100',
    sky: 'text-sky-700 hover:bg-sky-100',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all ${active ? colorMap[color] : inactiveColorMap[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
