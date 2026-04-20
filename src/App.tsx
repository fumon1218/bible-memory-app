import React, { useState, useEffect } from 'react';
import { categories as defaultCategories, verses as defaultVerses, type Verse } from './data/verses';
import { BookOpen, Brain, ChevronLeft, Check, Book, Heart, Volume2, Flame, Settings, Plus, Type, Pencil, Trash2, Share2 } from 'lucide-react';
import { cn } from './lib/utils';

type ViewMode = 'HOME' | 'CATEGORY' | 'STUDY' | 'QUIZ' | 'SETTINGS';

const FAVORITES_ID = 0;

type FontSize = 'sm' | 'base' | 'lg' | 'xl';
const fontTheme = {
  sm: { list: 'text-sm md:text-base', study: 'text-lg md:text-xl', quiz: 'text-lg md:text-xl' },
  base: { list: 'text-base md:text-lg', study: 'text-[22px] md:text-[32px]', quiz: 'text-xl md:text-[28px]' },
  lg: { list: 'text-lg md:text-xl', study: 'text-[28px] md:text-[40px]', quiz: 'text-[24px] md:text-[32px]' },
  xl: { list: 'text-xl md:text-2xl', study: 'text-[36px] md:text-[48px]', quiz: 'text-[28px] md:text-[36px]' },
};

export default function App() {
  const [view, setView] = useState<ViewMode>('HOME');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Custom Data States
  const [customCategories, setCustomCategories] = useState<{id: number, name: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('bible_custom_cats') || '[]'); } catch { return []; }
  });
  const [customVerses, setCustomVerses] = useState<Verse[]>(() => {
    try { return JSON.parse(localStorage.getItem('bible_custom_verses') || '[]'); } catch { return []; }
  });
  
  const [editedVerses, setEditedVerses] = useState<Record<string, {reference: string, text: string}>>(() => {
    try { return JSON.parse(localStorage.getItem('bible_edited_verses') || '{}'); } catch { return {}; }
  });
  
  // Font Size State
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('bible_font_size') as FontSize) || 'base';
  });

  const mergedCategories = [...defaultCategories, ...customCategories];
  const mergedVerses = [...defaultVerses, ...customVerses].map(v => {
    if (editedVerses[v.id]) {
      return { ...v, reference: editedVerses[v.id].reference, text: editedVerses[v.id].text };
    }
    return v;
  });

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bible_favorites') || '[]'); } catch { return []; }
  });

  // Streak
  const [streak, setStreak] = useState(0);

  // Daily Verse
  const [dailyVerse, setDailyVerse] = useState<Verse | null>(null);

  // Save state to localStorage
  useEffect(() => localStorage.setItem('bible_custom_cats', JSON.stringify(customCategories)), [customCategories]);
  useEffect(() => localStorage.setItem('bible_custom_verses', JSON.stringify(customVerses)), [customVerses]);
  useEffect(() => localStorage.setItem('bible_edited_verses', JSON.stringify(editedVerses)), [editedVerses]);
  useEffect(() => localStorage.setItem('bible_font_size', fontSize), [fontSize]);
  useEffect(() => localStorage.setItem('bible_favorites', JSON.stringify(favorites)), [favorites]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('bible_last_visit');
    let currentStreak = parseInt(localStorage.getItem('bible_streak') || '0', 10);

    if (lastVisit !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastVisit === yesterday.toDateString()) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      
      localStorage.setItem('bible_last_visit', today);
      localStorage.setItem('bible_streak', currentStreak.toString());
    }
    setStreak(currentStreak);

    // Initial random daily verse
    let seed = 0;
    for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);
    setDailyVerse(mergedVerses[seed % mergedVerses.length]);
  }, [mergedVerses.length]); // Dependency added to ensure it picks up dynamically

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const handleAddCategory = (name: string) => {
    const newId = Date.now();
    const prefix = mergedCategories.length + 1;
    const newCat = { id: newId, name: `${prefix}. ${name}` };
    setCustomCategories(prev => [...prev, newCat]);
    return newId;
  };

  const handleAddVerse = (categoryId: number, reference: string, text: string) => {
    const catName = mergedCategories.find(c => c.id === categoryId)?.name || '';
    const newVerse: Verse = {
      id: `custom-${Date.now()}`,
      categoryId,
      categoryName: catName,
      reference,
      text
    };
    setCustomVerses(prev => [...prev, newVerse]);
  };

  const handleEditVerse = (id: string, newRef: string, newText: string) => {
    if (id.toString().startsWith('custom-')) {
      setCustomVerses(prev => prev.map(v => v.id === id ? { ...v, reference: newRef, text: newText } : v));
    } else {
      setEditedVerses(prev => ({ ...prev, [id]: { reference: newRef, text: newText } }));
    }
  };

  const handleDeleteVerse = (id: string) => {
    if (id.toString().startsWith('custom-')) {
      setCustomVerses(prev => prev.filter(v => v.id !== id));
      // Remove from favorites if exists
      setFavorites(prev => prev.filter(favId => favId !== id));
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('이 브라우저에서는 음성 읽기 기능을 지원하지 않습니다.');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: '성경 암송 수첩',
      text: '성경 구절을 암송하고 학습하는 나만의 암송 수첩입니다.',
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert('앱 링크가 클립보드에 복사되었습니다. 친구들에게 전달해 보세요!');
      }
    } catch (err) {
      // Ignore abort errors
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const currentCategoryName = selectedCategoryId === FAVORITES_ID 
    ? "나의 말씀 (즐겨찾기)" 
    : mergedCategories.find(c => c.id === selectedCategoryId)?.name;
  
  const categoryVerses = selectedCategoryId === FAVORITES_ID
    ? mergedVerses.filter(v => favorites.includes(v.id))
    : mergedVerses.filter(v => v.categoryId === selectedCategoryId);

  const navigateTo = (mode: ViewMode, categoryId?: number) => {
    if (categoryId !== undefined) {
      setSelectedCategoryId(categoryId);
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setView(mode);
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col text-natural-text font-serif">
      <header 
        className="bg-natural-sidebar border-b border-natural-border sticky top-0 z-10 px-4 pb-4 md:py-6 relative"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between mt-1 md:mt-0">
          <div className="flex items-center gap-2">
            {view !== 'HOME' && (
              <button 
                onClick={() => view === 'CATEGORY' ? navigateTo('HOME') : navigateTo('CATEGORY')}
                className="p-3 -ml-3 text-natural-muted hover:text-natural-text transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                aria-label="뒤로가기"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            <h1 className="text-xl font-bold text-natural-accent flex items-center gap-2 tracking-tight">
              <BookOpen size={22} className="text-natural-accent" />
              {view === 'HOME' ? '암송 수첩' : view === 'SETTINGS' ? '설정' : currentCategoryName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex text-xs font-semibold text-natural-muted bg-natural-badge px-3 py-1.5 rounded-lg items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#80c080]"></span>
              오프라인 활성
            </div>
            <button 
              onClick={handleShare}
              className="p-3 md:p-2 rounded-full text-natural-muted hover:bg-[#e0e0d5] hover:text-natural-accent transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
              aria-label="공유하기"
            >
              <Share2 size={22} />
            </button>
            <button 
              onClick={() => view === 'SETTINGS' ? navigateTo('HOME') : navigateTo('SETTINGS')}
              className={cn(
                "p-3 md:p-2 -mr-2 rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]",
                view === 'SETTINGS' ? "bg-natural-accent text-white" : "text-natural-muted hover:bg-[#e0e0d5] hover:text-natural-accent"
              )}
              aria-label="설정"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>
      </header>

      <main 
        className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col pt-6 md:pt-8 space-y-8"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
      >
        {view === 'HOME' && (
          <HomeView 
            categories={mergedCategories}
            allVerses={mergedVerses}
            onSelect={(id) => navigateTo('CATEGORY', id)} 
            streak={streak} 
            dailyVerse={dailyVerse} 
            favoritesCount={favorites.length}
            fontClass={fontTheme[fontSize].list}
          />
        )}
        {view === 'CATEGORY' && (
          <CategoryView 
            verses={categoryVerses} 
            onStudy={() => navigateTo('STUDY')} 
            onQuiz={() => navigateTo('QUIZ')}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onSpeak={speak}
            onEditVerse={handleEditVerse}
            onDeleteVerse={handleDeleteVerse}
            fontClass={fontTheme[fontSize].list}
          />
        )}
        {view === 'STUDY' && <StudyMode verses={categoryVerses} onSpeak={speak} fontClass={fontTheme[fontSize].study} />}
        {view === 'QUIZ' && <QuizMode verses={categoryVerses} globalVerses={mergedVerses} fontClass={fontTheme[fontSize].quiz} />}
        {view === 'SETTINGS' && (
          <SettingsView 
            fontSize={fontSize} 
            setFontSize={setFontSize}
            mergedCategories={mergedCategories}
            onAddCategory={handleAddCategory}
            onAddVerse={handleAddVerse}
          />
        )}
      </main>
    </div>
  );
}

function HomeView({ categories, allVerses, onSelect, streak, dailyVerse, favoritesCount, fontClass }: { 
  categories: {id: number, name: string}[];
  allVerses: Verse[];
  onSelect: (id: number) => void; 
  streak: number; 
  dailyVerse: Verse | null; 
  favoritesCount: number;
  fontClass: string;
}) {
  return (
    <div className="space-y-8 flex-1">
      <div className="bg-natural-sidebar border border-natural-border rounded-3xl p-6 md:p-8 shadow-[0_10px_30px_rgba(90,90,64,0.05)]">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-natural-text font-bold text-lg md:text-xl tracking-wide flex items-center gap-2">
            오늘의 말씀
          </h2>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-natural-border text-sm font-bold text-[#d48a6a] shadow-sm">
            <Flame size={16} fill="currentColor" />
            {streak}일 연속 암송!
          </div>
        </div>
        
        {dailyVerse && (
          <div className="bg-natural-card rounded-2xl p-6 md:p-8 border border-natural-border shadow-[0_4px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-natural-accent"></div>
            <p className="text-sm font-semibold text-natural-muted mb-3">{dailyVerse.reference}</p>
            <p className={cn("text-natural-text leading-relaxed", fontClass)}>"{dailyVerse.text}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 즐겨찾기 폴더 (상단 강조) */}
        <button
          onClick={() => onSelect(FAVORITES_ID)}
          className="bg-natural-card border-[2px] border-[#d48a6a]/30 hover:border-[#d48a6a] hover:shadow-[0_10px_30px_rgba(212,138,106,0.1)] px-6 py-5 rounded-[24px] flex items-center justify-between text-left transition-all active:scale-[0.98] col-span-1 md:col-span-2 relative overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <Heart size={22} className="text-[#d48a6a]" fill="currentColor" />
            <span className="text-lg font-bold text-[#b86c4d]">나의 말씀 (즐겨찾기)</span>
          </div>
          <span className="text-xs bg-[#f8ecec] text-[#d48a6a] px-3 py-1.5 rounded-md font-bold tracking-wider">{favoritesCount}구절</span>
        </button>

        {/* 일반 카테고리 */}
        {categories.map((cat) => {
          const count = allVerses.filter(v => v.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="bg-natural-card border border-natural-border hover:border-natural-accent hover:shadow-[0_10px_30px_rgba(90,90,64,0.05)] px-6 py-5 rounded-[24px] flex items-center justify-between text-left transition-all active:scale-[0.98]"
            >
              <span className="text-[17px] font-medium text-natural-text">{cat.name}</span>
              <span className="text-xs bg-natural-badge text-natural-accent px-3 py-1.5 rounded-md font-semibold tracking-wider">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryView({ verses, onStudy, onQuiz, favorites, onToggleFavorite, onSpeak, onEditVerse, onDeleteVerse, fontClass }: { 
  verses: Verse[], 
  onStudy: () => void, 
  onQuiz: () => void,
  favorites: string[],
  onToggleFavorite: (id: string) => void,
  onSpeak: (text: string) => void,
  onEditVerse: (id: string, ref: string, text: string) => void,
  onDeleteVerse: (id: string) => void,
  fontClass: string
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRef, setEditRef] = useState('');
  const [editText, setEditText] = useState('');

  const startEdit = (v: Verse) => {
    setEditingId(v.id);
    setEditRef(v.reference);
    setEditText(v.text);
  };

  const handleSaveEdit = () => {
    if (!editRef.trim() || !editText.trim()) return;
    onEditVerse(editingId!, editRef.trim(), editText.trim());
    setEditingId(null);
  };

  if (verses.length === 0) {
    return (
      <div className="text-center py-24 text-natural-muted flex flex-col items-center gap-4">
        <Heart size={48} className="opacity-20" />
        <p className="text-lg">항목이 없습니다.</p>
        <p className="text-sm">목록에서 하트 버튼을 누르거나 직접 말씀을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 flex flex-col flex-1">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <button 
          onClick={onStudy}
          className="bg-natural-card border border-natural-border hover:border-natural-accent rounded-[24px] p-6 lg:p-8 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_30px_rgba(90,90,64,0.05)] text-natural-text"
        >
          <Book size={32} className="text-natural-accent" />
          <span className="text-lg font-semibold">학습 모드</span>
          <span className="text-sm text-natural-muted hidden sm:block">빈칸 채우기</span>
        </button>
        <button 
          onClick={onQuiz}
          className="bg-natural-card border border-natural-border hover:border-natural-accent rounded-[24px] p-6 lg:p-8 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_30px_rgba(90,90,64,0.05)] text-natural-text"
        >
          <Brain size={32} className="text-natural-accent" />
          <span className="text-lg font-semibold">퀴즈 모드</span>
          <span className="text-sm text-natural-muted hidden sm:block">구절 맞추기</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-natural-border mb-6">
          <span className="pb-3 border-b-2 border-natural-accent font-semibold text-natural-accent text-lg">
            목록 ({verses.length})
          </span>
        </div>
        
        <div className="space-y-4">
          {verses.map(v => {
            if (editingId === v.id) {
              return (
                <div key={v.id} className="bg-natural-card rounded-[24px] p-6 md:p-8 border-2 border-natural-accent shadow-md relative animate-in fade-in zoom-in-95 duration-200">
                  <input 
                    value={editRef} 
                    onChange={e => setEditRef(e.target.value)} 
                    placeholder="출처 (예: 요한복음 3:16)"
                    className="w-full mb-3 p-4 bg-natural-bg border border-natural-border rounded-xl font-semibold focus:outline-none focus:border-natural-accent text-sm md:text-base text-natural-text"
                  />
                  <textarea 
                    value={editText} 
                    onChange={e => setEditText(e.target.value)} 
                    rows={4}
                    placeholder="말씀 내용..."
                    className="w-full p-4 bg-natural-bg border border-natural-border rounded-xl focus:outline-none focus:border-natural-accent text-base md:text-lg resize-none mb-4 text-natural-text"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="flex-1 min-h-[48px] bg-natural-accent text-white font-bold rounded-xl active:scale-95 transition-transform text-sm md:text-base shadow-sm">
                      저장
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 min-h-[48px] bg-natural-border/50 hover:bg-natural-border text-natural-text font-bold rounded-xl active:scale-95 transition-all text-sm md:text-base">
                      취소
                    </button>
                    {v.id.toString().startsWith('custom-') && (
                      <button 
                        onClick={() => {
                          if(confirm('이 구절을 정말 삭제할까요?')) {
                            onDeleteVerse(v.id);
                          }
                        }} 
                        className="px-4 min-h-[48px] bg-[#f8ecec] hover:bg-[#f1dada] text-[#d48a6a] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center"
                        aria-label="삭제"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            const isFav = favorites.includes(v.id);
            return (
              <div key={v.id} className="bg-natural-card rounded-[24px] p-6 md:p-8 border border-natural-border shadow-[0_4px_10px_rgba(0,0,0,0.02)] relative group hover:border-[#d48a6a]/30 transition-colors">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="text-xs md:text-sm font-semibold tracking-wide text-natural-muted">{v.reference}</div>
                  <div className="flex gap-1 md:gap-2">
                    <button onClick={() => startEdit(v)} className="p-3 md:p-2 -mr-1 rounded-full text-natural-muted hover:bg-natural-sidebar hover:text-natural-accent transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" aria-label="수정">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => onSpeak(v.text)} className="p-3 md:p-2 -mr-1 rounded-full text-natural-muted hover:bg-natural-sidebar hover:text-natural-accent transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" aria-label="읽어주기">
                      <Volume2 size={20} />
                    </button>
                    <button onClick={() => onToggleFavorite(v.id)} className="p-3 md:p-2 -mr-1 rounded-full text-natural-muted hover:bg-[#f8ecec] transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" aria-label="즐겨찾기">
                      <Heart size={20} className={isFav ? "text-[#d48a6a]" : ""} fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
                <p className={cn("text-natural-text leading-relaxed", fontClass)}>"{v.text}"</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StudyMode({ verses, onSpeak, fontClass }: { verses: Verse[], onSpeak: (text: string) => void, fontClass: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [level, setLevel] = useState<number>(30);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());

  const currentVerse = verses[currentIndex];
  // Basic space tokenizer
  const words = currentVerse.text.split(' ');

  const hiddenIndices = new Set<number>();
  if (level > 0) {
    const threshold = level / 100;
    // Use a more stable hash that works for the first verse (currentIndex 0)
    // and ensures 30% is a subset of 60%
    words.forEach((_, i) => {
      const seed = (i + 1) * (currentIndex + 7);
      const hash = Math.abs(Math.sin(seed * 12.9898)) % 1;
      if (level === 100 || hash < threshold) {
        hiddenIndices.add(i);
      }
    });
  }

  useEffect(() => {
    setRevealedWords(new Set());
  }, [currentIndex, level]);

  const toggleReveal = (index: number) => {
    setRevealedWords(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const nextVerse = () => currentIndex < verses.length - 1 && setCurrentIndex(i => i + 1);
  const prevVerse = () => currentIndex > 0 && setCurrentIndex(i => i - 1);

  return (
    <div className="space-y-6 flex flex-col flex-1 pb-4">
      <div className="flex justify-between items-center pb-4 border-b border-natural-border gap-2">
        <span className="text-sm font-semibold text-natural-muted tracking-wider whitespace-nowrap">
          {currentIndex + 1} / {verses.length}
        </span>
        <div className="flex bg-natural-sidebar p-1 rounded-xl overflow-x-auto snap-x hide-scrollbar">
          {[0, 30, 60, 100].map(btnLvl => (
            <button
              key={btnLvl}
              onClick={() => setLevel(btnLvl)}
              className={cn(
                "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap min-h-[36px]",
                level === btnLvl ? "bg-natural-card text-natural-accent shadow-sm" : "text-natural-muted hover:text-natural-text"
              )}
            >
              {btnLvl === 0 ? "원문" : `${btnLvl}%`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-natural-card border border-natural-border shadow-[0_10px_30px_rgba(90,90,64,0.05)] rounded-[32px] p-8 md:p-14 min-h-[45vh] flex flex-col justify-center items-center relative">
        <span className="absolute top-6 right-6 md:top-8 md:right-8 bg-natural-badge px-3 py-1.5 rounded-lg text-xs text-natural-accent font-semibold tracking-wider">
          학습모드
        </span>
        
        <div className="flex items-center gap-3 mb-6 md:mb-10 mt-4">
          <div className="text-sm md:text-base font-semibold tracking-[2px] text-natural-muted uppercase text-center">
            {currentVerse.reference}
          </div>
          <button 
            onClick={() => onSpeak(currentVerse.text)} 
            className="p-3 md:p-2 rounded-full text-natural-muted hover:bg-natural-sidebar hover:text-natural-accent transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" 
            aria-label="읽어주기"
          >
            <Volume2 size={24} />
          </button>
        </div>
        
        <div className={cn("leading-[2.2] text-center text-natural-text max-w-[800px]", fontClass)}>
          {words.map((word, i) => {
            const isHidden = hiddenIndices.has(i) && !revealedWords.has(i);
            return (
              <span 
                key={i}
                onClick={() => hiddenIndices.has(i) && toggleReveal(i)}
                className={cn(
                  "inline-block mx-1 transition-all",
                  hiddenIndices.has(i) ? "cursor-pointer" : ""
                )}
              >
                <span className={cn(
                  "transition-all duration-300",
                  isHidden 
                    ? "inline-block min-w-[2.5em] h-[1.3em] border-b-[3px] border-natural-border text-transparent align-middle bg-natural-sidebar/30 rounded-md" 
                    : hiddenIndices.has(i) 
                      ? "border-b-[3px] border-natural-accent text-natural-text" 
                      : "text-natural-text"
                )}>
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-auto pt-6">
        <button
          onClick={prevVerse}
          disabled={currentIndex === 0}
          className="flex-1 py-4 bg-transparent border-2 border-natural-accent text-natural-accent rounded-full font-medium disabled:opacity-30 active:scale-95 transition-all text-base"
        >
          이전
        </button>
        <button
          onClick={nextVerse}
          disabled={currentIndex === verses.length - 1}
          className="flex-1 py-4 bg-natural-accent border-2 border-natural-accent text-white rounded-full font-medium disabled:opacity-30 active:scale-95 transition-all text-base"
        >
          다음
        </button>
      </div>
    </div>
  );
}

function QuizMode({ verses, globalVerses, fontClass }: { verses: Verse[], globalVerses: Verse[], fontClass: string }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  
  const [quizSeq, setQuizSeq] = useState<{verse: Verse, options: string[]}[]>([]);

  useEffect(() => {
    if (verses.length === 0) return;
    const shuffled = [...verses].sort(() => 0.5 - Math.random()).slice(0, 10);
    const allReferencesList = Array.from(new Set(globalVerses.map(v => v.reference)));
    
    const seq = shuffled.map(v => {
      const wrongList = allReferencesList.filter(ref => ref !== v.reference).sort(() => 0.5 - Math.random()).slice(0, 3);
      const opts = [...wrongList, v.reference].sort(() => 0.5 - Math.random());
      return { verse: v, options: opts };
    });
    
    setQuizSeq(seq);
  }, [verses, globalVerses]);

  if (verses.length === 0) {
    return (
      <div className="text-center py-24 text-natural-muted flex flex-col items-center gap-4">
        <Brain size={48} className="opacity-20" />
        <p className="text-lg">퀴즈를 풀 구절이 없습니다.</p>
      </div>
    );
  }

  if (quizSeq.length === 0) return null;
  
  if (isFinished) {
    return (
      <div className="bg-natural-card border border-natural-border rounded-[32px] p-10 md:p-16 text-center shadow-[0_10px_30px_rgba(90,90,64,0.05)] mt-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-natural-sidebar rounded-full flex items-center justify-center mb-8">
          <Check size={40} className="text-natural-accent" />
        </div>
        <h2 className="text-3xl font-bold text-natural-text mb-4">퀴즈 완료!</h2>
        <p className="text-lg text-natural-muted mb-10">
          총 {quizSeq.length}문제 중 <strong className="text-natural-accent text-2xl mx-1">{score}</strong>문제를 맞추셨습니다.
        </p>
        <button 
          onClick={() => {
            setQuestionIndex(0);
            setScore(0);
            setIsFinished(false);
            setSelectedAnswer(null);
          }}
          className="w-full max-w-[280px] py-4 bg-natural-accent text-white font-medium rounded-full active:scale-95 transition-all text-lg tracking-wide"
        >
          다시 하기
        </button>
      </div>
    );
  }

  const currentQ = quizSeq[questionIndex];
  const isAnswered = selectedAnswer !== null;

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    if (option === currentQ.verse.reference) {
      setScore(s => s + 1);
    }
    
    setTimeout(() => {
      if (questionIndex < quizSeq.length - 1) {
        setQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setIsFinished(true);
      }
    }, 1200);
  };

  return (
    <div className="space-y-8 flex flex-col flex-1 pb-8">
      <div className="flex justify-between items-center pb-4 border-b border-natural-border">
        <span className="text-sm font-semibold text-natural-muted tracking-wider">
          질문 {questionIndex + 1} / {quizSeq.length}
        </span>
        <span className="px-3 py-1 bg-natural-badge text-natural-accent rounded-lg text-sm font-bold">
          점수: {score}
        </span>
      </div>

      <div className="bg-natural-card border border-natural-border rounded-[32px] p-8 md:p-12 shadow-[0_10px_30px_rgba(90,90,64,0.05)] min-h-[250px] flex items-center justify-center relative">
        <span className="absolute top-6 right-6 md:top-8 md:right-8 bg-natural-sidebar px-3 py-1.5 rounded-lg text-xs text-natural-muted font-bold tracking-wider">
          Q{questionIndex + 1}
        </span>
        <p className={cn("leading-[1.8] text-natural-text text-center font-serif", fontClass)}>
          "{currentQ.verse.text}"
        </p>
      </div>

      <div className="space-y-3 mt-4">
        <h3 className="text-xs font-bold tracking-[2px] text-natural-muted ml-2 mb-4 uppercase">
          이 구절은 어디일까요?
        </h3>
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {currentQ.options.map(opt => {
            const isSelected = selectedAnswer === opt;
            const isCorrect = opt === currentQ.verse.reference;
            
            let btnClass = "bg-natural-card border-natural-border hover:border-natural-accent text-natural-text";
            if (isAnswered) {
              if (isCorrect) btnClass = "bg-natural-accent border-natural-accent text-white shadow-md";
              else if (isSelected) btnClass = "bg-[#d49a9a] border-[#d49a9a] text-white";
              else btnClass = "bg-natural-bg border-natural-border text-natural-muted opacity-60";
            }

            return (
              <button
                key={opt}
                disabled={isAnswered}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "w-full min-h-[64px] p-5 border shadow-[0_2px_8px_rgba(0,0,0,0.02)] rounded-[20px] font-medium text-left transition-all text-base md:text-lg flex items-center",
                  btnClass,
                  !isAnswered && "active:scale-[0.98]"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsView({ 
  fontSize, setFontSize, 
  mergedCategories, onAddCategory, onAddVerse 
}: {
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  mergedCategories: {id: number, name: string}[];
  onAddCategory: (name: string) => number;
  onAddVerse: (categoryId: number, reference: string, text: string) => void;
}) {
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  
  const [selCatId, setSelCatId] = useState<number | ''>('');
  const [ref, setRef] = useState('');
  const [vText, setVText] = useState('');
  const [message, setMessage] = useState('');

  const fontOptions: { id: FontSize, label: string }[] = [
    { id: 'sm', label: '작게' },
    { id: 'base', label: '보통' },
    { id: 'lg', label: '크게' },
    { id: 'xl', label: '아주 크게' }
  ];

  const handleSaveCategory = () => {
    if (!newCatName.trim()) return;
    const newId = onAddCategory(newCatName.trim());
    setSelCatId(newId);
    setNewCatName('');
    setIsAddingCat(false);
  };

  const handleSaveVerse = () => {
    if (!selCatId || !ref.trim() || !vText.trim()) {
      setMessage('카테고리, 구절, 내용을 모두 입력해주세요.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    onAddVerse(Number(selCatId), ref.trim(), vText.trim());
    setRef('');
    setVText('');
    setMessage(`'${ref}' 구절이 성공적으로 추가되었습니다!`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-10 flex-1 pb-10">
      
      {/* 글자 크기 설정 */}
      <section className="bg-natural-card border border-natural-border shadow-[0_10px_30px_rgba(90,90,64,0.05)] rounded-[32px] p-8 md:p-10 text-natural-text">
        <h3 className="text-sm font-bold tracking-[2px] text-natural-muted uppercase mb-6 flex items-center gap-2 border-b border-natural-border pb-4">
          <Type size={20} className="text-natural-accent"/> 
          글자 크기 설정
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fontOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFontSize(opt.id)}
              className={cn(
                "py-4 px-2 rounded-2xl border font-bold transition-all",
                fontSize === opt.id 
                  ? "bg-natural-accent border-natural-accent text-white shadow-md" 
                  : "bg-natural-bg border-natural-border text-natural-muted hover:border-natural-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        <div className="mt-8 p-6 bg-natural-sidebar rounded-2xl text-center">
          <p className={cn("text-natural-text font-serif leading-relaxed", fontTheme[fontSize].list)}>
            태초에 하나님이 천지를 창조하시니라
          </p>
        </div>
      </section>

      {/* 데이터 직접 추가 */}
      <section className="bg-natural-card border border-natural-border shadow-[0_10px_30px_rgba(90,90,64,0.05)] rounded-[32px] p-8 md:p-10 text-natural-text">
        <h3 className="text-sm font-bold tracking-[2px] text-natural-muted uppercase mb-6 flex items-center gap-2 border-b border-natural-border pb-4">
          <Plus size={20} className="text-natural-accent"/> 
          새로운 구절 추가
        </h3>
        
        <div className="space-y-6">
          
          {/* 카테고리 선택 영역 */}
          <div>
            <label className="block text-sm font-bold text-natural-muted mb-2">카테고리</label>
            {isAddingCat ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="예: 금요 철야 기도 모음" 
                  className="flex-1 min-h-[56px] px-5 bg-natural-bg border border-natural-border rounded-2xl focus:outline-none focus:border-natural-accent focus:ring-1 focus:ring-natural-accent text-lg" 
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveCategory} 
                    className="flex-1 sm:flex-none px-6 py-3 bg-natural-accent text-white font-bold rounded-2xl active:scale-95 transition-transform"
                  >
                    확인
                  </button>
                  <button 
                    onClick={() => setIsAddingCat(false)} 
                    className="flex-1 sm:flex-none px-6 py-3 bg-natural-border text-natural-text font-bold rounded-2xl active:scale-95 transition-transform"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <select 
                value={selCatId} 
                onChange={e => {
                  if(e.target.value === 'new') setIsAddingCat(true);
                  else setSelCatId(Number(e.target.value));
                }} 
                className="w-full min-h-[56px] px-4 bg-natural-bg border border-natural-border rounded-2xl focus:outline-none focus:border-natural-accent focus:ring-1 focus:ring-natural-accent text-base md:text-lg appearance-none cursor-pointer"
              >
                <option value="" disabled>--- 추가할 카테고리 선택 ---</option>
                {mergedCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="new">+ 새 주제(카테고리) 만들기...</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-natural-muted mb-2">구절 출처</label>
            <input 
              value={ref} 
              onChange={e => setRef(e.target.value)} 
              placeholder="예: 창세기 1:1" 
              className="w-full min-h-[56px] px-5 bg-natural-bg border border-natural-border rounded-2xl focus:outline-none focus:border-natural-accent focus:ring-1 focus:ring-natural-accent text-lg" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-natural-muted mb-2">말씀 내용</label>
            <textarea 
              value={vText} 
              onChange={e => setVText(e.target.value)} 
              placeholder="외우고 싶은 말씀을 입력하세요..." 
              rows={4} 
              className="w-full p-5 bg-natural-bg border border-natural-border rounded-2xl focus:outline-none focus:border-natural-accent focus:ring-1 focus:ring-natural-accent text-lg resize-none" 
            />
          </div>
          
          <button 
            onClick={handleSaveVerse} 
            className="w-full bg-natural-accent text-white min-h-[64px] rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform shadow-md mt-4"
          >
            앱에 추가하기
          </button>
          
          {message && (
            <div className="text-center text-sm font-bold text-[#6aaa6a] bg-[#eef5ee] p-4 rounded-xl mt-4 animate-in fade-in slide-in-from-bottom-2">
              {message}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

