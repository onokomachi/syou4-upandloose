import { useState, useEffect, useRef } from 'react';
import { BookOpen, HelpCircle, PenTool, Palette, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Lightbulb, Star, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pages, questions, kanjiList, Kanji } from './data';

type Mode = 'read' | 'quiz' | 'kanji' | 'sensory';
type Highlight = { text: string; type: 'color' | 'smell' | 'sound'; pageId: number };

export default function App() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('read');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  
  // Custom Selection State (for iPad touch support)
  const [customSelection, setCustomSelection] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Gamification State
  const [solvedQuestions, setSolvedQuestions] = useState<number[]>([]);
  const [showAllClear, setShowAllClear] = useState(false);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  const currentPage = pages[currentPageIndex];
  const pageQuestions = questions.filter(q => q.pageId === currentPage.id);
  const currentQuestion = pageQuestions[currentQuestionIndex];
  const currentKanjiList = kanjiList.filter(k => k.pageId === currentPage.id);

  const textContainerRef = useRef<HTMLDivElement>(null);

  // Global pointer up to stop dragging
  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // Reset states when page or mode changes
  useEffect(() => {
    setQuizFeedback(null);
    setShowHint(false);
    setFreeTextAnswer('');
    setShowSampleAnswer(false);
    setSelectedKanji(null);
    setCurrentQuestionIndex(0);
    setCustomSelection(null);
  }, [currentPageIndex, mode]);

  // Check for all clear
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
      setQuizFeedback(null);
      setShowHint(false);
      setFreeTextAnswer('');
      setShowSampleAnswer(false);
      setCustomSelection(null);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuizFeedback(null);
      setShowHint(false);
      setFreeTextAnswer('');
      setShowSampleAnswer(false);
      setCustomSelection(null);
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
      alert("本文の文字をタッチして選んでからボタンを押してね！");
      return;
    }
    
    if (currentQuestion?.type === 'extract' && Array.isArray(currentQuestion.answer)) {
      const isCorrect = currentQuestion.answer.some(ans => selectedText.includes(ans) || ans.includes(selectedText));
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

  const handleAddHighlight = (type: 'color' | 'smell' | 'sound') => {
    const selectedText = getSelectedText().trim();
    if (!selectedText) {
      alert("色をぬりたい言葉をタッチして選んでね！");
      return;
    }
    setHighlights(prev => [...prev, { text: selectedText, type, pageId: currentPage.id }]);
    setCustomSelection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || (mode !== 'quiz' && mode !== 'sensory')) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.hasAttribute('data-index')) {
      const index = parseInt(element.getAttribute('data-index')!, 10);
      setCustomSelection(prev => prev ? [prev[0], index] : [index, index]);
    }
  };

  // Render text with interactive spans for touch support
  const renderText = () => {
    const text = currentPage.text;
    const chars = Array.from(text);

    // Calculate highlight ranges
    const highlightRanges: { start: number, end: number, type: string }[] = [];
    if (mode === 'sensory') {
      const pageHighlights = highlights.filter(h => h.pageId === currentPage.id);
      pageHighlights.forEach(h => {
        let startIndex = 0;
        while ((startIndex = text.indexOf(h.text, startIndex)) !== -1) {
          highlightRanges.push({ start: startIndex, end: startIndex + h.text.length - 1, type: h.type });
          startIndex += h.text.length;
        }
      });
    }

    // Calculate kanji ranges
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

    // Calculate question target ranges
    const questionTargetRanges: { start: number, end: number }[] = [];
    if (mode === 'quiz' && currentQuestion?.targetText) {
      let startIndex = 0;
      while ((startIndex = text.indexOf(currentQuestion.targetText, startIndex)) !== -1) {
        questionTargetRanges.push({ start: startIndex, end: startIndex + currentQuestion.targetText.length - 1 });
        startIndex += currentQuestion.targetText.length;
      }
    }

    return chars.map((char, index) => {
      if (char === '\n') return <br key={index} />;

      const isSelected = customSelection && index >= Math.min(customSelection[0], customSelection[1]) && index <= Math.max(customSelection[0], customSelection[1]);
      const highlight = highlightRanges.find(r => index >= r.start && index <= r.end);
      const kanji = kanjiRanges.find(r => index >= r.start && index <= r.end);
      const isQuestionTarget = questionTargetRanges.some(r => index >= r.start && index <= r.end);

      let className = "transition-colors duration-100 ";
      
      if (isSelected) {
        className += "bg-orange-300 text-orange-900 rounded-sm ";
      } else if (highlight) {
        if (highlight.type === 'color') className += "bg-red-200 text-red-900 rounded-sm ";
        if (highlight.type === 'smell') className += "bg-yellow-200 text-yellow-900 rounded-sm ";
        if (highlight.type === 'sound') className += "bg-blue-200 text-blue-900 rounded-sm ";
      } else if (kanji) {
        className += "text-blue-600 font-bold cursor-pointer border-b-2 border-blue-400 pb-1 ";
      }

      if (isQuestionTarget) {
        className += "underline decoration-red-500 decoration-[3px] underline-offset-4 ";
      }

      const handlePointerDown = (e: React.PointerEvent) => {
        if (mode === 'kanji') {
          if (kanji) setSelectedKanji(kanji.kanji);
          return;
        }
        if (mode === 'quiz' || mode === 'sensory') {
          setIsDragging(true);
          if (customSelection && customSelection[0] === customSelection[1]) {
            // Second tap: complete the range
            setCustomSelection([customSelection[0], index]);
          } else {
            // First tap or reset
            setCustomSelection([index, index]);
          }
        }
      };

      const handlePointerEnter = () => {
        if (isDragging && (mode === 'quiz' || mode === 'sensory')) {
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
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                <Trophy className="text-yellow-500 w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">全問クリア！</h2>
                <p className="text-stone-600">すごい！すべての問題を解くことができたね！<br/>「白いぼうし」のお話がもっとよくわかったかな？</p>
              </div>
              <button 
                onClick={() => setShowAllClear(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full"
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
          <h1 className="text-2xl font-bold text-stone-700 flex items-center gap-2">
            <BookOpen className="text-emerald-500" />
            白いぼうし 学習アプリ
          </h1>
          <div className="flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-bold shadow-sm border border-orange-200">
            <Star className="fill-orange-500 text-orange-500" size={20} />
            <span>クリア: {solvedQuestions.length} / {questions.length}問</span>
          </div>
        </div>
        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
          <ModeButton active={mode === 'read'} onClick={() => setMode('read')} icon={<BookOpen size={18}/>} label="読む" color="emerald" />
          <ModeButton active={mode === 'quiz'} onClick={() => setMode('quiz')} icon={<HelpCircle size={18}/>} label="問題" color="orange" />
          <ModeButton active={mode === 'kanji'} onClick={() => setMode('kanji')} icon={<PenTool size={18}/>} label="漢字" color="blue" />
          <ModeButton active={mode === 'sensory'} onClick={() => setMode('sensory')} icon={<Palette size={18}/>} label="色ぬり" color="purple" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: Text Viewer */}
        <div className="w-3/5 bg-white m-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col relative">
          {/* Page Indicator */}
          <div className="absolute top-4 left-4 text-stone-400 font-medium z-10">
            p.{currentPage.pageNumber}
          </div>
          
          {/* Text Area - Fixed truncation by using block layout with ml-auto */}
          <div className={`flex-1 overflow-x-auto p-8 block ${mode === 'quiz' || mode === 'sensory' ? 'select-none' : ''}`}>
            <div 
              ref={textContainerRef}
              className="h-[65vh] text-2xl leading-[2.5] font-serif text-stone-800 ml-auto w-max px-8 cursor-text"
              style={{ writingMode: 'vertical-rl' }}
              onTouchMove={handleTouchMove}
            >
              {renderText()}
            </div>
          </div>

          {/* Navigation */}
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
              className="flex-1 bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col"
            >
              {mode === 'read' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 gap-4">
                  <BookOpen size={64} className="text-emerald-200" />
                  <h2 className="text-2xl font-bold text-stone-700">お話を読もう</h2>
                  <p>左の文章を読んで、お話の世界を想像してみよう。<br/>読み終わったら「問題」に挑戦してみてね。</p>
                </div>
              )}

              {mode === 'quiz' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-orange-100">
                    <h2 className="text-xl font-bold text-orange-600 flex items-center gap-2">
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
                      <div className="bg-orange-50 p-6 rounded-xl text-lg font-medium text-stone-800 leading-relaxed">
                        {currentQuestion.question}
                      </div>

                      {/* Extract Question UI */}
                      {currentQuestion.type === 'extract' && (
                        <div className="flex flex-col gap-4 items-center justify-center flex-1">
                          <div className="bg-orange-100/50 p-4 rounded-xl text-stone-600 text-center text-sm w-full">
                            <p className="font-bold text-orange-700 mb-1">【えらび方】</p>
                            <p>左の文章の、<strong>最初の文字</strong>と<strong>最後の文字</strong>を<br/>ポン、ポンとタッチして選んでね。</p>
                          </div>
                          <button 
                            onClick={handleExtractAnswer}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg w-full max-w-md mt-4"
                          >
                            選んだ文字で答える
                          </button>
                        </div>
                      )}

                      {/* Choice Question UI */}
                      {currentQuestion.type === 'choice' && (
                        <div className="flex flex-col gap-3">
                          {currentQuestion.choices?.map((choice, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleChoiceAnswer(idx)}
                              className="text-left p-4 rounded-xl border-2 border-stone-200 hover:border-orange-400 hover:bg-orange-50 transition-colors font-medium text-stone-700"
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Free Text Question UI */}
                      {currentQuestion.type === 'free' && (
                        <div className="flex flex-col gap-4 flex-1">
                          <textarea 
                            value={freeTextAnswer}
                            onChange={(e) => setFreeTextAnswer(e.target.value)}
                            placeholder="ここに自分の考えを書いてね..."
                            className="flex-1 p-4 rounded-xl border-2 border-stone-200 focus:border-orange-400 focus:ring-0 resize-none text-lg"
                          />
                          <button 
                            onClick={handleFreeTextSubmit}
                            disabled={!freeTextAnswer.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full shadow-md transition-transform active:scale-95 text-lg disabled:opacity-50"
                          >
                            答え合わせをする
                          </button>
                          
                          {showSampleAnswer && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="bg-green-50 p-4 rounded-xl border border-green-200">
                              <p className="text-green-800 font-bold mb-2">解答例：</p>
                              <p className="text-green-700">{currentQuestion.sampleAnswer}</p>
                              <p className="text-sm text-green-600 mt-2">※自分の考えと似ているところはあるかな？</p>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Feedback & Hint */}
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
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800">
                          <Lightbulb className="shrink-0 text-blue-500 mt-1" />
                          <p><strong>ヒント：</strong>{currentQuestion.hint}</p>
                        </div>
                      )}

                      {/* Question Navigation */}
                      {pageQuestions.length > 1 && (
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-orange-100">
                          <button 
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 text-orange-600 font-bold disabled:opacity-30 flex items-center gap-1 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <ChevronLeft size={20} /> 前の問題
                          </button>
                          <button 
                            onClick={handleNextQuestion}
                            disabled={currentQuestionIndex === pageQuestions.length - 1}
                            className="px-4 py-2 text-orange-600 font-bold disabled:opacity-30 flex items-center gap-1 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            次の問題 <ChevronRight size={20} />
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-4">
                      <HelpCircle size={48} className="opacity-20" />
                      <p>このページには問題はありません。<br/>次のページに進んでみよう。</p>
                    </div>
                  )}
                </div>
              )}

              {mode === 'kanji' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2 mb-6 pb-4 border-b border-blue-100">
                    <PenTool /> 新出漢字を学ぼう
                  </h2>
                  <p className="text-stone-600 mb-6">左の文章の青い文字をタップすると、漢字の読み方や意味がわかるよ。</p>
                  
                  {selectedKanji ? (
                    <motion.div 
                      key={selectedKanji.char}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-blue-50 rounded-2xl p-8 border border-blue-100 flex flex-col items-center text-center gap-6"
                    >
                      <div className="text-8xl font-serif text-blue-900 bg-white w-40 h-40 rounded-2xl shadow-sm flex items-center justify-center border-2 border-blue-200">
                        {selectedKanji.char}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-500 mb-1">読み方</div>
                        <div className="text-2xl font-bold text-stone-800">{selectedKanji.reading}</div>
                      </div>
                      <div className="w-full h-px bg-blue-200"></div>
                      <div>
                        <div className="text-sm font-bold text-blue-500 mb-1">意味</div>
                        <div className="text-lg text-stone-700">{selectedKanji.meaning}</div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/50 text-blue-400 font-medium">
                      左の文章から青い漢字を選んでね
                    </div>
                  )}
                </div>
              )}

              {mode === 'sensory' && (
                <div className="flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-purple-600 flex items-center gap-2 mb-6 pb-4 border-b border-purple-100">
                    <Palette /> 情景を想像しよう
                  </h2>
                  <div className="bg-purple-50 p-4 rounded-xl text-purple-800 text-sm mb-6">
                    <p className="font-bold mb-1">【えらび方】</p>
                    <p>左の文章の、<strong>最初の文字</strong>と<strong>最後の文字</strong>をポン、ポンとタッチして選んでから、下のボタンで色をぬってみよう！</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button onClick={() => handleAddHighlight('color')} className="flex items-center gap-4 p-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-red-400 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">色</div>
                      <div>
                        <div className="font-bold text-red-800 text-lg">色がわかる言葉</div>
                        <div className="text-red-600 text-sm">例：白い、青々と、黄色</div>
                      </div>
                    </button>
                    
                    <button onClick={() => handleAddHighlight('smell')} className="flex items-center gap-4 p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 shadow-sm group-hover:scale-110 transition-transform">匂</div>
                      <div>
                        <div className="font-bold text-yellow-800 text-lg">においがする言葉</div>
                        <div className="text-yellow-700 text-sm">例：レモンのにおい</div>
                      </div>
                    </button>

                    <button onClick={() => handleAddHighlight('sound')} className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-left group">
                      <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">音</div>
                      <div>
                        <div className="font-bold text-blue-800 text-lg">音が聞こえる言葉</div>
                        <div className="text-blue-600 text-sm">例：シャボン玉のはじけるような</div>
                      </div>
                    </button>
                  </div>

                  <div className="mt-auto pt-6">
                    <button 
                      onClick={() => setHighlights(prev => prev.filter(h => h.pageId !== currentPage.id))}
                      className="text-stone-400 hover:text-stone-600 text-sm underline"
                    >
                      このページの色ぬりをリセットする
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: 'emerald' | 'orange' | 'blue' | 'purple' }) {
  const colorMap = {
    emerald: 'bg-emerald-500 text-white shadow-md',
    orange: 'bg-orange-500 text-white shadow-md',
    blue: 'bg-blue-500 text-white shadow-md',
    purple: 'bg-purple-500 text-white shadow-md',
  };
  
  const inactiveColorMap = {
    emerald: 'text-emerald-700 hover:bg-emerald-100',
    orange: 'text-orange-700 hover:bg-orange-100',
    blue: 'text-blue-700 hover:bg-blue-100',
    purple: 'text-purple-700 hover:bg-purple-100',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${active ? colorMap[color] : inactiveColorMap[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
