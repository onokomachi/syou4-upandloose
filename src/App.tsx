import { useState, useEffect, useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import {
  Camera, BookOpen, HelpCircle, PenTool, Layers, GitCompare,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Lightbulb, Star, Trophy,
  ZoomIn, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  pages, questions, kanjiList, structure, contrastChips,
  Kanji, Paragraph, ContrastChip
} from './data';

type Mode = 'read' | 'quiz' | 'kanji' | 'structure' | 'contrast';
type Cell = 'up-know' | 'up-unknow' | 'loose-know' | 'loose-unknow';

const SECTION_COLOR: Record<Paragraph['section'], string> = {
  jo: 'border-teal-400 bg-teal-50',
  hon: 'border-stone-300 bg-white',
  ketsu: 'border-teal-400 bg-teal-50',
};

const CONTRAST_SIDE_COLOR: Record<NonNullable<Paragraph['contrast']>['side'], string> = {
  up: 'border-amber-400 bg-amber-50',
  loose: 'border-sky-400 bg-sky-50',
  both: 'border-stone-300 bg-stone-50',
};

export default function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('read');
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

  const [customSelection, setCustomSelection] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [solvedQuestions, setSolvedQuestions] = useState<number[]>([]);
  const [showAllClear, setShowAllClear] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  // Structure mode
  const [expandedPara, setExpandedPara] = useState<number | null>(null);
  const [pulsePara, setPulsePara] = useState<number | null>(null);

  // Contrast table mode
  const [placedChips, setPlacedChips] = useState<Record<Cell, number[]>>({
    'up-know': [], 'up-unknow': [], 'loose-know': [], 'loose-unknow': []
  });
  const [selectedChipId, setSelectedChipId] = useState<number | null>(null);
  const [contrastFeedback, setContrastFeedback] = useState<{ cell: Cell; ok: boolean } | null>(null);

  const currentPage = pages[currentPageIndex];
  const pageQuestions = questions.filter(q => q.pageId === currentPage.id);
  const currentQuestion = pageQuestions[currentQuestionIndex];
  const currentKanjiList = kanjiList.filter(k => k.pageId === currentPage.id);

  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  useEffect(() => {
    setQuizFeedback(null);
    setShowHint(false);
    setFreeTextAnswer('');
    setShowSampleAnswer(false);
    setSelectedKanji(null);
    setCurrentQuestionIndex(0);
    setCustomSelection(null);
  }, [currentPageIndex, mode]);

  useEffect(() => {
    if (solvedQuestions.length === questions.length && questions.length > 0) {
      setShowAllClear(true);
    }
  }, [solvedQuestions.length]);

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(prev => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(prev => prev - 1);
  };
  const handleNextQuestion = () => {
    if (currentQuestionIndex < pageQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuizFeedback(null); setShowHint(false);
      setFreeTextAnswer(''); setShowSampleAnswer(false); setCustomSelection(null);
    }
  };
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuizFeedback(null); setShowHint(false);
      setFreeTextAnswer(''); setShowSampleAnswer(false); setCustomSelection(null);
    }
  };

  const getSelectedText = () => {
    if (!customSelection) return '';
    const start = Math.min(customSelection[0], customSelection[1]);
    const end = Math.max(customSelection[0], customSelection[1]);
    return Array.from(currentPage.text).slice(start, end + 1).join('');
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
      if (isCorrect && !solvedQuestions.includes(currentQuestion.id)) {
        setSolvedQuestions(prev => [...prev, currentQuestion.id]);
      }
      if (!isCorrect) setShowHint(true);
    }
    setCustomSelection(null);
  };

  const handleChoiceAnswer = (choiceIndex: number) => {
    if (currentQuestion?.type === 'choice') {
      const isCorrect = currentQuestion.answer === choiceIndex;
      setQuizFeedback(isCorrect ? 'correct' : 'incorrect');
      if (isCorrect && !solvedQuestions.includes(currentQuestion.id)) {
        setSolvedQuestions(prev => [...prev, currentQuestion.id]);
      }
      if (!isCorrect) setShowHint(true);
    }
  };

  const handleFreeTextSubmit = () => {
    setShowSampleAnswer(true);
    if (currentQuestion && !solvedQuestions.includes(currentQuestion.id)) {
      setSolvedQuestions(prev => [...prev, currentQuestion.id]);
    }
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

  // Structure mode → jump to paragraph in left text
  const handleSelectParagraph = (p: Paragraph) => {
    setExpandedPara(prev => (prev === p.num ? null : p.num));
    if (p.pageId !== currentPage.id) {
      setCurrentPageIndex(pages.findIndex(pg => pg.id === p.pageId));
    }
    setPulsePara(p.num);
    setTimeout(() => setPulsePara(null), 1200);
  };

  // Contrast table handlers
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

  // Render text with interactive spans + paragraph pulse markers
  const renderText = () => {
    const text = currentPage.text;
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
    if (mode === 'quiz' && currentQuestion?.targetText) {
      let startIndex = 0;
      while ((startIndex = text.indexOf(currentQuestion.targetText, startIndex)) !== -1) {
        questionTargetRanges.push({
          start: startIndex, end: startIndex + currentQuestion.targetText.length - 1
        });
        startIndex += currentQuestion.targetText.length;
      }
    }

    // Paragraph pulse: highlight the entire paragraph block of pulsePara on this page
    let pulseRange: { start: number, end: number } | null = null;
    if (pulsePara != null) {
      const paragraphsOnPage = structure.filter(p => p.pageId === currentPage.id);
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

    return chars.map((char, index) => {
      if (char === '\n') return <br key={index} />;

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
        if (mode === 'quiz') {
          setIsDragging(true);
          if (customSelection && customSelection[0] === customSelection[1]) {
            setCustomSelection([customSelection[0], index]);
          } else {
            setCustomSelection([index, index]);
          }
        }
      };

      const handlePointerEnter = () => {
        if (isDragging && mode === 'quiz') {
          setCustomSelection(prev => prev ? [prev[0], index] : [index, index]);
        }
      };

      return (
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
    });
  };

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
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                <Trophy className="text-amber-500 w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">全問クリア！</h2>
                <p className="text-stone-600">
                  すごい！すべての問題を解くことができたね！<br />
                  「アップとルーズで伝える」の組み立てと、筆者の主張がしっかりつかめたかな？
                </p>
              </div>
              <button
                onClick={() => setShowAllClear(false)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full"
              >
                もどる
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-700 flex items-center gap-2">
              <Camera className="text-teal-500" aria-label="カメラ" />
              アップとルーズで伝える 学習アプリ
            </h1>
            <p className="text-xs text-stone-500 ml-9">中谷 日出 ／ 光村図書 小学校4年 上</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold shadow-sm border border-amber-200">
            <Star className="fill-amber-500 text-amber-500" size={20} />
            <span>クリア: {solvedQuestions.length} / {questions.length}問</span>
          </div>
        </div>
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          <ModeButton active={mode === 'read'} onClick={() => setMode('read')} icon={<BookOpen size={18} />} label="読む" color="teal" />
          <ModeButton active={mode === 'quiz'} onClick={() => setMode('quiz')} icon={<HelpCircle size={18} />} label="問題" color="amber" />
          <ModeButton active={mode === 'kanji'} onClick={() => setMode('kanji')} icon={<PenTool size={18} />} label="漢字" color="indigo" />
          <ModeButton active={mode === 'structure'} onClick={() => setMode('structure')} icon={<Layers size={18} />} label="構成マップ" color="teal" />
          <ModeButton active={mode === 'contrast'} onClick={() => setMode('contrast')} icon={<GitCompare size={18} />} label="対比表" color="sky" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left: Text Viewer */}
        <div className="w-3/5 bg-white m-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative">
          <div className="absolute top-4 left-4 text-stone-400 font-medium z-10">
            p.{currentPage.pageNumber}
          </div>
          <div className="absolute top-4 right-4 text-xs text-teal-600 font-bold bg-teal-50 border border-teal-200 px-3 py-1 rounded-full z-10">
            {currentPage.paragraphRange}
          </div>

          <div className={`flex-1 overflow-x-auto p-8 block ${mode === 'quiz' ? 'select-none' : ''}`}>
            <div
              ref={textContainerRef}
              className="h-[65vh] text-2xl leading-[2.5] font-serif text-stone-800 ml-auto w-max px-8 cursor-text"
              style={{ writingMode: 'vertical-rl' }}
              onTouchMove={handleTouchMove}
            >
              {renderText()}
            </div>
          </div>

          <div className="p-4 border-t border-stone-100 flex justify-between items-center bg-stone-50 rounded-b-2xl">
            <button
              onClick={handleNextPage}
              disabled={currentPageIndex === pages.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-full shadow-sm disabled:opacity-50 hover:bg-stone-100 transition-colors font-bold text-stone-600"
            >
              <ChevronLeft /> 次のページ
            </button>
            <div className="text-stone-400 font-medium">{currentPageIndex + 1} / {pages.length}</div>
            <button
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-full shadow-sm disabled:opacity-50 hover:bg-stone-100 transition-colors font-bold text-stone-600"
            >
              前のページ <ChevronRight />
            </button>
          </div>
        </div>

        {/* Right: Action Panel */}
        <div className="w-2/5 m-4 ml-0 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col overflow-y-auto"
            >
              {mode === 'read' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 gap-4">
                  <Camera size={64} className="text-teal-200" />
                  <h2 className="text-2xl font-bold text-stone-700">説明文を読もう</h2>
                  <p>左の文章を読んで、筆者が「アップ」と「ルーズ」をどう説明しているかをつかもう。<br />読み終わったら「問題」「構成マップ」「対比表」で理解を深めてね。</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 w-full max-w-xs">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm">
                      <ZoomIn className="mx-auto mb-1" size={20} />
                      <div className="font-bold">アップ</div>
                      <div className="text-xs">細かい部分を大きく</div>
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-700 text-sm">
                      <Maximize2 className="mx-auto mb-1" size={20} />
                      <div className="font-bold">ルーズ</div>
                      <div className="text-xs">広いはんいを写す</div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'quiz' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-amber-100">
                    <h2 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                      <HelpCircle /> 問題 {currentQuestionIndex + 1} / {pageQuestions.length}
                    </h2>
                    {currentQuestion && solvedQuestions.includes(currentQuestion.id) && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <CheckCircle2 size={16} /> クリア済
                      </span>
                    )}
                  </div>

                  {currentQuestion ? (
                    <div className="flex-1 flex flex-col gap-6">
                      <div className="bg-amber-50 p-6 rounded-xl text-lg font-medium text-stone-800 leading-relaxed">
                        {currentQuestion.question}
                      </div>

                      {currentQuestion.type === 'extract' && (
                        <div className="flex flex-col gap-4 items-center justify-center">
                          <div className="bg-amber-100/50 p-4 rounded-xl text-stone-600 text-center text-sm w-full">
                            <p className="font-bold text-amber-700 mb-1">【えらび方】</p>
                            <p>左の文章の、<strong>最初の文字</strong>と<strong>最後の文字</strong>を<br />ポン、ポンとタッチして選んでね。</p>
                          </div>
                          <button
                            onClick={handleExtractAnswer}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full max-w-md mt-4"
                          >
                            選んだ文字で答える
                          </button>
                        </div>
                      )}

                      {currentQuestion.type === 'choice' && (
                        <div className="flex flex-col gap-3">
                          {currentQuestion.choices?.map((choice, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleChoiceAnswer(idx)}
                              className="text-left p-4 rounded-xl border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50 transition-colors font-medium text-stone-700"
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}

                      {currentQuestion.type === 'free' && (
                        <div className="flex flex-col gap-4">
                          <textarea
                            value={freeTextAnswer}
                            onChange={(e) => setFreeTextAnswer(e.target.value)}
                            placeholder="ここに自分の考えを書いてね..."
                            className="min-h-[120px] p-4 rounded-xl border-2 border-stone-200 focus:border-amber-400 focus:ring-0 resize-none text-lg"
                          />
                          <button
                            onClick={handleFreeTextSubmit}
                            disabled={!freeTextAnswer.trim()}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg disabled:opacity-50"
                          >
                            答え合わせをする
                          </button>
                          {showSampleAnswer && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-green-50 p-4 rounded-xl border border-green-200">
                              <p className="text-green-800 font-bold mb-2">解答例：</p>
                              <p className="text-green-700">{currentQuestion.sampleAnswer}</p>
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

                      {showHint && (
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-indigo-800">
                          <Lightbulb className="shrink-0 text-indigo-500 mt-1" />
                          <p><strong>ヒント：</strong>{currentQuestion.hint}</p>
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
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-4">
                      <HelpCircle size={48} className="opacity-20" />
                      <p>このページには問題はありません。<br />次のページに進んでみよう。</p>
                    </div>
                  )}
                </div>
              )}

              {mode === 'kanji' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2 mb-6 pb-4 border-b border-indigo-100">
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

              {mode === 'structure' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-teal-100">
                    <h2 className="text-xl font-bold text-teal-600 flex items-center gap-2">
                      <Layers /> 文章の組み立てマップ
                    </h2>
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">双括型</span>
                  </div>
                  <p className="text-stone-600 mb-4 text-sm">
                    8つの段落の役割を確かめよう。カードをタップすると、左の本文の段落へジャンプするよ。
                    <span className="text-teal-700 font-bold">序論・結論</span>はティール、<span className="text-amber-600 font-bold">アップの段</span>はアンバー、<span className="text-sky-600 font-bold">ルーズの段</span>はスカイで色分けされているよ。
                  </p>
                  <div className="flex flex-col gap-3">
                    {structure.map(p => {
                      const isAmber = p.contrast?.side === 'up';
                      const isSky = p.contrast?.side === 'loose';
                      const tone = p.section !== 'hon'
                        ? SECTION_COLOR[p.section]
                        : isAmber ? CONTRAST_SIDE_COLOR.up
                        : isSky ? CONTRAST_SIDE_COLOR.loose
                        : 'border-stone-300 bg-white';
                      const sectionBadge =
                        p.section === 'jo' ? { label: '序論', cls: 'bg-teal-500 text-white' }
                        : p.section === 'ketsu' ? { label: '結論', cls: 'bg-teal-500 text-white' }
                        : isAmber ? { label: 'アップ', cls: 'bg-amber-500 text-white' }
                        : isSky ? { label: 'ルーズ', cls: 'bg-sky-500 text-white' }
                        : { label: '本論', cls: 'bg-stone-500 text-white' };
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

              {mode === 'contrast' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-sky-600 flex items-center gap-2 mb-4 pb-4 border-b border-sky-100">
                    <GitCompare /> アップ ⇄ ルーズ 対比表
                  </h2>
                  <p className="text-stone-600 text-sm mb-4">
                    下の<strong>カード</strong>をタップ → <strong>表のマス</strong>をタップ で入れていこう。<br />
                    正しいマスに入ると残るよ。まちがえると赤く光って戻るからもう一度考えてみよう。
                  </p>

                  {/* 2x2 table */}
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

                  {/* Chips */}
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
