import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getScrambledText } from '../utils/shuffleText';
import { segmentGreetingToChars, getNextLoopIndex, CharToken } from '../utils/charLoop';
import {
  Sparkles,
  Crown,
  Heart,
  Cake,
  Star,
  RotateCcw,
  Play,
  Pause,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlignVerticalJustifyCenter,
  Tv,
} from 'lucide-react';

export type LightboardTheme = 'sakura-pink' | 'cinema-gold' | 'cyber-neon' | 'rainbow-rave';
export type LightboardLayout = 'single-char-loop' | 'vertical-tower' | 'classic-board';

export interface FanCinemaLightboardProps {
  greetingTitle: string;
  greetingBody: string;
  senderName: string;
  theme?: LightboardTheme;
  layout?: LightboardLayout;
  titleSize?: number;
  bodySize?: number;
  nameSize?: number;
  charSize?: number; // For giant single character (e.g. 260px - 440px)
  greetingColumns?: 1 | 2; // 1 for single upright column, 2 for dual parallel upright columns
  onChangeGreetingColumns?: (cols: 1 | 2) => void;
  isShuffling?: boolean;
  onTriggerShuffle?: () => void;
  scale?: number;
  isLooping?: boolean;
  onToggleLoop?: (loop: boolean) => void;
  charInterval?: number; // in seconds
  onChangeCharInterval?: (interval: number) => void;
  splitLatinWords?: boolean;
  onChangeSplitLatinWords?: (val: boolean) => void;
  renderTime?: number; // Export clock in seconds; disables live timers.
  onCharChange?: (charIndex: number, char: string) => void;
}

export const FanCinemaLightboard: React.FC<FanCinemaLightboardProps> = ({
  greetingTitle = 'ユノち、お誕生日おめでとう',
  greetingBody = '素敵な一年になりますように',
  senderName = 'randyseionn より',
  theme = 'sakura-pink',
  layout = 'single-char-loop',
  titleSize = 28,
  bodySize = 22,
  nameSize = 36,
  charSize = 340, // Giant screen-filling font size (340px)
  greetingColumns = 2,
  onChangeGreetingColumns,
  isShuffling = false,
  onTriggerShuffle,
  scale = 1,
  isLooping = true,
  onToggleLoop,
  charInterval = 0.55,
  onChangeCharInterval,
  splitLatinWords = false,
  onChangeSplitLatinWords,
  onCharChange,
  renderTime,
}) => {
  // Break text into character tokens
  const tokens = useMemo(() => {
    return segmentGreetingToChars(greetingTitle, greetingBody, senderName, splitLatinWords);
  }, [greetingTitle, greetingBody, senderName, splitLatinWords]);

  // Current looping character index
  const [liveCharIndex, setCurrentCharIndex] = useState(0);
  const currentCharIndex = renderTime === undefined ? liveCharIndex
    : (isLooping ? Math.floor(renderTime / Math.max(0.15, charInterval)) % Math.max(1, tokens.length) : 0);
  const [localLooping, setLocalLooping] = useState(isLooping);

  // Sync external looping state
  useEffect(() => {
    setLocalLooping(isLooping);
  }, [isLooping]);

  // Scramble decode effect state for current character
  const [charScrambleProgress, setCharScrambleProgress] = useState(1);
  const [charScrambleSeed, setCharScrambleSeed] = useState(0);

  // Keep index within bounds if tokens change
  useEffect(() => {
    if (currentCharIndex >= tokens.length && tokens.length > 0) {
      setCurrentCharIndex(0);
    }
  }, [tokens.length, currentCharIndex]);

  // Trigger character switch scramble
  const triggerCharScramble = () => {
    setCharScrambleProgress(0);
    const start = performance.now();
    const duration = Math.min(220, charInterval * 1000 * 0.45);

    let frameId: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setCharScrambleProgress(p);
      setCharScrambleSeed((s) => s + 1);
      if (p < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  };

  // Auto-looping timer effect for 'single-char-loop' mode
  useEffect(() => {
    if (renderTime !== undefined || layout !== 'single-char-loop' || !localLooping || tokens.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentCharIndex((prev) => {
        const next = getNextLoopIndex(prev, tokens.length, 1);
        triggerCharScramble();
        if (onCharChange && tokens[next]) {
          onCharChange(next, tokens[next].char);
        }
        return next;
      });
    }, Math.max(150, charInterval * 1000));

    return () => clearInterval(timer);
  }, [layout, localLooping, tokens.length, charInterval, onCharChange, renderTime]);

  // Handle global shuffle
  const [fullProgress, setFullProgress] = useState(1);
  const [fullSeed, setFullSeed] = useState(0);

  useEffect(() => {
    if (renderTime !== undefined || !isShuffling) {
      setFullProgress(1);
      return;
    }

    setFullProgress(0);
    triggerCharScramble();
    const startTime = performance.now();
    const duration = 1800;

    let animId: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      setFullProgress(p);
      setFullSeed((s) => s + 1);

      if (p < 1) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isShuffling, renderTime]);

  // Manual next/prev char controls
  const handleNextChar = () => {
    if (tokens.length === 0) return;
    const next = getNextLoopIndex(currentCharIndex, tokens.length, 1);
    setCurrentCharIndex(next);
    triggerCharScramble();
    if (onCharChange && tokens[next]) {
      onCharChange(next, tokens[next].char);
    }
  };

  const handlePrevChar = () => {
    if (tokens.length === 0) return;
    const prev = getNextLoopIndex(currentCharIndex, tokens.length, -1);
    setCurrentCharIndex(prev);
    triggerCharScramble();
    if (onCharChange && tokens[prev]) {
      onCharChange(prev, tokens[prev].char);
    }
  };

  const toggleLoop = () => {
    const next = !localLooping;
    setLocalLooping(next);
    if (onToggleLoop) onToggleLoop(next);
  };

  // Current active character token
  const activeToken: CharToken = tokens[currentCharIndex] || {
    id: 'placeholder',
    char: 'ユ',
    section: 'title',
    isPunctuation: false,
  };

  // Scramble preview for single char
  const displaySingleChar = useMemo(() => {
    if (charScrambleProgress >= 1) return activeToken.char;
    return getScrambledText(activeToken.char, charScrambleProgress, charScrambleSeed);
  }, [activeToken.char, charScrambleProgress, charScrambleSeed]);

  // Both the live view and export use the same text, sizes, themes and markup.
  const exportInterval = Math.max(0.15, charInterval);
  const scrambleDuration = Math.min(0.22, exportInterval * 0.45);
  const exportCharProgress = renderTime === undefined || !isLooping || renderTime < exportInterval
    ? 1 : Math.min(1, (renderTime % exportInterval) / scrambleDuration);
  const renderedChar = renderTime === undefined ? displaySingleChar
    : getScrambledText(activeToken.char, exportCharProgress, Math.floor(renderTime * 60));
  const renderedProgress = renderTime === undefined ? fullProgress
    : (isShuffling ? Math.min(1, renderTime / 1.8) : 1);
  const renderedSeed = renderTime === undefined ? fullSeed : Math.floor(renderTime * 60);

  // Themes
  // Themes with rich luminous neon lightboard styling
  const getThemeStyles = () => {
    switch (theme) {
      case 'cinema-gold':
        return {
          frameBorder: 'border-amber-400/90',
          frameBg: 'bg-gradient-to-b from-stone-950 via-zinc-950 to-amber-950/80',
          bulbColor: '#FBBF24',
          titleColor: '#FDE047',
          bodyColor: '#FEF08A',
          nameColor: '#FFD700',
          charColor: '#FFDF00',
          charGlow: 'drop-shadow(0 0 35px rgba(251, 191, 36, 0.95)) drop-shadow(0 0 70px rgba(245, 158, 11, 0.6))',
          glow: '0 0 50px rgba(245, 158, 11, 0.6), inset 0 0 35px rgba(245, 158, 11, 0.3)',
          accentGlow: 'drop-shadow(0 0 16px rgba(253, 224, 71, 0.95))',
          textGlowTitle: '0 0 10px #FDE047, 0 0 25px #F59E0B, 0 0 50px #D97706, 0 0 90px rgba(245, 158, 11, 0.9)',
          textGlowBody: '0 0 8px #FEF08A, 0 0 20px #FBBF24, 0 0 40px #D97706, 0 0 70px rgba(245, 158, 11, 0.75)',
          textGlowName: '0 0 15px #FFD700, 0 0 30px #F59E0B, 0 0 60px #B45309, 0 0 110px rgba(251, 191, 36, 0.95)',
          columnBg: 'bg-black/60 border-amber-500/30 shadow-[inset_0_0_25px_rgba(245,158,11,0.2)]',
          nameUnderline: 'from-transparent via-amber-400 to-transparent',
          badgeBg: 'bg-amber-500/25 text-amber-300 border-amber-400/50',
          pillActive: 'bg-amber-400 text-black',
        };
      case 'cyber-neon':
        return {
          frameBorder: 'border-cyan-400/90',
          frameBg: 'bg-gradient-to-b from-zinc-950 via-slate-950 to-cyan-950/80',
          bulbColor: '#22D3EE',
          titleColor: '#67E8F9',
          bodyColor: '#A5F3FC',
          nameColor: '#00F0FF',
          charColor: '#22D3EE',
          charGlow: 'drop-shadow(0 0 35px rgba(34, 211, 238, 0.95)) drop-shadow(0 0 70px rgba(6, 182, 212, 0.6))',
          glow: '0 0 50px rgba(6, 182, 212, 0.6), inset 0 0 35px rgba(6, 182, 212, 0.3)',
          accentGlow: 'drop-shadow(0 0 16px rgba(34, 211, 238, 0.95))',
          textGlowTitle: '0 0 10px #67E8F9, 0 0 25px #06B6D4, 0 0 50px #0891B2, 0 0 90px rgba(6, 182, 212, 0.9)',
          textGlowBody: '0 0 8px #A5F3FC, 0 0 20px #22D3EE, 0 0 40px #0891B2, 0 0 70px rgba(6, 182, 212, 0.75)',
          textGlowName: '0 0 15px #00F0FF, 0 0 30px #06B6D4, 0 0 60px #0E7490, 0 0 110px rgba(34, 211, 238, 0.95)',
          columnBg: 'bg-black/60 border-cyan-500/30 shadow-[inset_0_0_25px_rgba(6,182,212,0.2)]',
          nameUnderline: 'from-transparent via-cyan-400 to-transparent',
          badgeBg: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50',
          pillActive: 'bg-cyan-400 text-black',
        };
      case 'rainbow-rave':
        return {
          frameBorder: 'border-pink-500/90',
          frameBg: 'bg-gradient-to-b from-purple-950/90 via-zinc-950 to-rose-950/80',
          bulbColor: '#F43F5E',
          titleColor: '#F472B6',
          bodyColor: '#FBCFE8',
          nameColor: '#FFE4E6',
          charColor: '#FF69B4',
          charGlow: 'drop-shadow(0 0 35px rgba(244, 63, 94, 0.95)) drop-shadow(0 0 70px rgba(236, 72, 153, 0.6))',
          glow: '0 0 55px rgba(244, 63, 94, 0.65), inset 0 0 35px rgba(236, 72, 153, 0.35)',
          accentGlow: 'drop-shadow(0 0 16px rgba(244, 63, 94, 0.95))',
          textGlowTitle: '0 0 10px #F472B6, 0 0 25px #EC4899, 0 0 50px #DB2777, 0 0 90px rgba(236, 72, 153, 0.9)',
          textGlowBody: '0 0 8px #FBCFE8, 0 0 20px #F472B6, 0 0 40px #DB2777, 0 0 70px rgba(236, 72, 153, 0.75)',
          textGlowName: '0 0 15px #FFD700, 0 0 30px #F59E0B, 0 0 60px #E11D48, 0 0 110px rgba(244, 63, 94, 0.95)',
          columnBg: 'bg-black/60 border-pink-500/30 shadow-[inset_0_0_25px_rgba(236,72,153,0.2)]',
          nameUnderline: 'from-transparent via-pink-400 to-transparent',
          badgeBg: 'bg-pink-500/25 text-pink-300 border-pink-400/50',
          pillActive: 'bg-pink-500 text-white',
        };
      case 'sakura-pink':
      default:
        return {
          frameBorder: 'border-rose-400/90',
          frameBg: 'bg-gradient-to-b from-zinc-950 via-rose-950/50 to-pink-950/70',
          bulbColor: '#FB7185',
          titleColor: '#FDA4AF',
          bodyColor: '#FFE4E6',
          nameColor: '#FFD700',
          charColor: '#FDA4AF',
          charGlow: 'drop-shadow(0 0 35px rgba(251, 113, 133, 0.95)) drop-shadow(0 0 70px rgba(244, 63, 94, 0.6))',
          glow: '0 0 50px rgba(251, 113, 133, 0.6), inset 0 0 35px rgba(244, 63, 94, 0.35)',
          accentGlow: 'drop-shadow(0 0 16px rgba(251, 113, 133, 0.95))',
          textGlowTitle: '0 0 10px #FDA4AF, 0 0 25px #FB7185, 0 0 50px #F43F5E, 0 0 90px rgba(244, 63, 94, 0.9)',
          textGlowBody: '0 0 8px #FFE4E6, 0 0 20px #FDA4AF, 0 0 40px #F43F5E, 0 0 70px rgba(244, 63, 94, 0.75)',
          textGlowName: '0 0 15px #FFD700, 0 0 30px #F59E0B, 0 0 60px #E11D48, 0 0 110px rgba(251, 113, 133, 0.95)',
          columnBg: 'bg-black/60 border-rose-500/30 shadow-[inset_0_0_25px_rgba(244,63,94,0.2)]',
          nameUnderline: 'from-transparent via-rose-400 to-transparent',
          badgeBg: 'bg-rose-500/25 text-rose-300 border-rose-400/50',
          pillActive: 'bg-rose-400 text-black',
        };
    }
  };

  const style = getThemeStyles();
  const horizontalBulbs = 18;
  const verticalBulbsCount = 26;


  // Responsive font size for Latin word vs single CJK character
  const effectiveCharSize = useMemo(() => {
    const len = activeToken.char.length;
    if (len > 8) {
      // e.g. "randyseionn"
      return Math.min(68, Math.round(charSize * 0.22));
    }
    if (len > 4) {
      return Math.min(96, Math.round(charSize * 0.32));
    }
    if (len > 1) {
      return Math.min(180, Math.round(charSize * 0.55));
    }
    return charSize; // Full screen giant single char
  }, [activeToken.char, charSize]);

  // Section display badge
  const sectionLabel = useMemo(() => {
    switch (activeToken.section) {
      case 'title':
        return { text: '祝贺标语 · ユノち、お誕生日おめでとう', icon: Cake, color: 'text-rose-400' };
      case 'body':
        return { text: '美好愿望 · 素敵な一年になりますように', icon: Star, color: 'text-amber-300' };
      case 'sender':
        return { text: `专属署名 · ${senderName}`, icon: Crown, color: 'text-amber-400' };
      default:
        return { text: '粉丝影院灯牌', icon: Sparkles, color: 'text-zinc-300' };
    }
  }, [activeToken.section, senderName]);

  // =========================================================================
  // LAYOUT 1: SINGLE CHARACTER SCREEN-FILLING LOOP (用户指定：占满屏幕的一个字一个字循环播放)
  // =========================================================================
  if (layout === 'single-char-loop') {
    return (
      <div
        className="relative w-full max-w-[508px] my-4 select-none box-border flex flex-col items-center"
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {/* Outer Cinema Marquee Frame with Glowing Chasing Bulbs */}
        <div
          className={`relative w-full rounded-3xl p-3 border-4 ${style.frameBorder} ${style.frameBg} transition-all duration-300 shadow-2xl`}
          style={{
            boxShadow: style.glow,
          }}
        >
          {/* Top Marquee Bulbs Row */}
          <div className="flex justify-between items-center px-2 py-1">
            {Array.from({ length: horizontalBulbs }).map((_, i) => (
              <div
                key={`top-${i}`}
                className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-a' : 'animate-bulb-b'}`}
                style={{
                  backgroundColor: style.bulbColor,
                  color: style.bulbColor,
                }}
              />
            ))}
          </div>

          {/* Inner Acrylic LED Dot Matrix Screen */}
          <div className="relative rounded-2xl bg-zinc-950/95 bg-led-matrix p-5 my-2 border border-white/10 overflow-hidden shadow-inner flex flex-col items-center text-center min-h-[580px] justify-between">
            {/* Subtle CRT reflection & scanlines */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/50 pointer-events-none" />

            {/* Top Bar: Section & Progress Indicator */}
            <div className="relative z-10 flex items-center justify-between w-full pb-2.5 border-b border-white/10">
              <div className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider border flex items-center gap-1.5 ${style.badgeBg}`}>
                <sectionLabel.icon className="w-3.5 h-3.5 animate-bounce" />
                <span className="truncate max-w-[200px]">{sectionLabel.text}</span>
              </div>

              {/* Loop Counter Pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono font-bold text-zinc-200">
                <span className="text-amber-400 font-pixel">
                  {currentCharIndex + 1}
                </span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-400">{tokens.length}</span>
                <span className="text-[10px] text-zinc-400">字</span>
              </div>
            </div>

            {/* Sub-header: Current Full Sentence Highlight Preview */}
            <div className="relative z-10 w-full px-2 py-1.5 my-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center">
              <span className="font-pixel text-xs text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>ユノちへ贈るお祝い点阵ボード</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              </span>
            </div>

            {/* GIGANTIC SCREEN-FILLING CHARACTER CONTAINER (占满屏幕的巨型单字) */}
            <div className="relative z-10 w-full flex-1 flex items-center justify-center my-4 overflow-hidden min-h-[360px]">
              {/* Dot matrix character glow backdrop */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-30 blur-2xl pointer-events-none"
                style={{
                  color: style.bulbColor,
                  fontSize: `${effectiveCharSize}px`,
                }}
              >
                {renderedChar}
              </div>

              {/* Foreground Massive Pixel Character */}
              <div
                key={`char-${currentCharIndex}-${activeToken.char}`}
                className="font-pixel font-black tracking-normal leading-none select-none text-center transition-all transform duration-150 animate-in fade-in zoom-in-90"
                style={{
                  fontSize: `${effectiveCharSize}px`,
                  color: style.charColor,
                  filter: style.charGlow,
                  textShadow: `0 0 30px ${style.bulbColor}, 0 0 60px ${style.bulbColor}`,
                }}
              >
                {renderedChar}
              </div>
            </div>

            {/* Character Punctuation or Meaning Indicator */}
            <div className="relative z-10 flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                {activeToken.section === 'sender' ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" /> SENDER: randyseionn
                  </span>
                ) : (
                  <span>FULLSCREEN DOT MATRIX LOOP</span>
                )}
              </span>
            </div>

            {/* Interactive Loop Playback Controller (循环播放控制器) */}
            <div className="relative z-10 w-full pt-3 border-t border-white/10 flex flex-col gap-2">
              {/* Timeline dots / Mini Progress Bar */}
              <div className="w-full flex items-center justify-center gap-1 overflow-x-hidden px-2">
                {tokens.slice(0, 36).map((tok, idx) => (
                  <button
                    key={tok.id}
                    type="button"
                    onClick={() => {
                      setCurrentCharIndex(idx);
                      triggerCharScramble();
                    }}
                    className={`h-1.5 transition-all rounded-full cursor-pointer ${
                      idx === currentCharIndex
                        ? 'w-6 bg-amber-400 shadow-[0_0_8px_#FBBF24]'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                    title={`第 ${idx + 1} 字: ${tok.char}`}
                  />
                ))}
              </div>

              {/* Playback Action Buttons */}
              <div className="flex items-center justify-between mt-1 px-1">
                {/* Prev Char */}
                <button
                    data-export-control="true"
                  type="button"
                  onClick={handlePrevChar}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-zinc-200 hover:text-white transition cursor-pointer"
                  title="上一个字"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[10px]">上一个字</span>
                </button>

                {/* Center: Play/Pause Loop & Shuffle */}
                <div className="flex items-center gap-2">
                  <button
                    data-export-control="true"
                    type="button"
                    onClick={toggleLoop}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-pixel transition cursor-pointer shadow-md ${
                      localLooping
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {localLooping ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>暂停循环</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>循环播放</span>
                      </>
                    )}
                  </button>

                  {/* Shuffle Button */}
                  <button
                    data-export-control="true"
                    type="button"
                    onClick={() => {
                      triggerCharScramble();
                      if (onTriggerShuffle) onTriggerShuffle();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 hover:text-white text-xs border border-rose-500/30 font-pixel transition cursor-pointer"
                    title="重新 Shuffle 洗牌当前字"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>SHUFFLE</span>
                  </button>
                </div>

                {/* Next Char */}
                <button
                    data-export-control="true"
                  type="button"
                  onClick={handleNextChar}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-zinc-200 hover:text-white transition cursor-pointer"
                  title="下一个字"
                >
                  <span className="text-[10px]">下一个字</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Marquee Bulbs Row */}
          <div className="flex justify-between items-center px-2 py-1">
            {Array.from({ length: horizontalBulbs }).map((_, i) => (
              <div
                key={`bottom-${i}`}
                className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-b' : 'animate-bulb-a'}`}
                style={{
                  backgroundColor: style.bulbColor,
                  color: style.bulbColor,
                }}
              />
            ))}
          </div>
        </div>

        {/* Ambient Footer Tag */}
        <div className="mt-3 flex items-center justify-center gap-2 text-zinc-400 font-pixel text-xs">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
          <span>CELEBRATING YUNO WITH RANDYSEIONN</span>
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
        </div>
      </div>
    );
  }

  // =========================================================================
  // LAYOUT 2: VERTICAL FULL-SCREEN TOWER (直直竖排全屏塔 · 2400px 贯穿)
  // 用户定制：上下框具备影院跑马灯灯牌质感、贺语与名字100%完全展示、多重霓虹发亮效果
  // =========================================================================
  if (layout === 'vertical-tower') {
    const vTitle = getScrambledText(greetingTitle, renderedProgress, renderedSeed);
    const vBody = getScrambledText(greetingBody, renderedProgress, renderedSeed + 17);
    const vName = getScrambledText(senderName, renderedProgress, renderedSeed + 43);

    const titleChars = Array.from(vTitle);
    const bodyChars = Array.from(vBody);
    const nameChars = Array.from(vName);

    return (
      <div
        className="relative w-full h-[2360px] max-w-[508px] my-2 select-none box-border flex flex-col items-center"
        style={{
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
        }}
      >
        {/* Giant Cinema Marquee Tower Frame */}
        <div
          className={`relative w-full h-full rounded-3xl p-3 border-4 ${style.frameBorder} ${style.frameBg} transition-all duration-300 shadow-2xl flex flex-col justify-between overflow-hidden`}
          style={{
            boxShadow: style.glow,
          }}
        >
          {/* Left Vertical Chasing Bulbs Rail (贯穿2400px灯塔侧边跑马灯) */}
          <div className="absolute left-1.5 top-14 bottom-14 flex flex-col justify-between items-center pointer-events-none z-20">
            {Array.from({ length: verticalBulbsCount }).map((_, i) => (
              <div
                key={`left-bulb-${i}`}
                className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-a' : 'animate-bulb-b'}`}
                style={{
                  backgroundColor: style.bulbColor,
                  color: style.bulbColor,
                  boxShadow: `0 0 10px ${style.bulbColor}`,
                }}
              />
            ))}
          </div>

          {/* Right Vertical Chasing Bulbs Rail (贯穿2400px灯塔侧边跑马灯) */}
          <div className="absolute right-1.5 top-14 bottom-14 flex flex-col justify-between items-center pointer-events-none z-20">
            {Array.from({ length: verticalBulbsCount }).map((_, i) => (
              <div
                key={`right-bulb-${i}`}
                className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-b' : 'animate-bulb-a'}`}
                style={{
                  backgroundColor: style.bulbColor,
                  color: style.bulbColor,
                  boxShadow: `0 0 10px ${style.bulbColor}`,
                }}
              />
            ))}
          </div>

          {/* ============================================================ */}
          {/* TOP MARQUEE FRAME: Authentic Cinema Marquee Header (影院灯牌顶框) */}
          {/* ============================================================ */}
          <div className="relative z-10 w-full flex flex-col pt-1 pb-2 px-1">
            {/* Top Chasing Bulbs Row */}
            <div className="flex justify-between items-center px-2 py-1 mb-2">
              {Array.from({ length: horizontalBulbs }).map((_, i) => (
                <div
                  key={`vtop-${i}`}
                  className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-a' : 'animate-bulb-b'}`}
                  style={{
                    backgroundColor: style.bulbColor,
                    color: style.bulbColor,
                    boxShadow: `0 0 12px ${style.bulbColor}`,
                  }}
                />
              ))}
            </div>

            {/* Theatre Marquee Header Plaque */}
            <div className="mx-2 p-3 rounded-2xl bg-black/80 border-2 border-white/15 backdrop-blur-md shadow-2xl flex flex-col items-center gap-2.5">
              {/* Row 1: Ribbon Badge + Column Switcher + Shuffle Button */}
              <div className="flex items-center justify-between w-full border-b border-white/10 pb-2.5">
                {/* Cinema Ribbon Badge */}
                <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-widest border flex items-center gap-1.5 ${style.badgeBg} shadow-md`}>
                  <Cake className="w-3.5 h-3.5 animate-bounce text-rose-400" />
                  <span>SPECIAL PRESENT</span>
                </div>

                {/* 1-Col vs 2-Col Quick Switcher on Header */}
                <div data-export-control="true" className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/15 shadow-inner">
                  <button
                    data-export-control="true"
                    type="button"
                    onClick={() => onChangeGreetingColumns?.(1)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-pixel font-bold transition cursor-pointer ${
                      greetingColumns === 1
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="单列直立贯穿 (一排贺语)"
                  >
                    1 排贺语
                  </button>
                  <button
                    data-export-control="true"
                    type="button"
                    onClick={() => onChangeGreetingColumns?.(2)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-pixel font-bold transition cursor-pointer ${
                      greetingColumns === 2
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="双列并排直立 (两排贺语)"
                  >
                    2 排贺语
                  </button>
                </div>

                {/* Shuffle Button on Header */}
                <button
                    data-export-control="true"
                  type="button"
                  onClick={() => {
                    triggerCharScramble();
                    if (onTriggerShuffle) onTriggerShuffle();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 hover:text-white text-xs border border-rose-500/40 font-pixel transition cursor-pointer shadow"
                  title="重播点阵 Shuffle 效果"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="text-[11px]">SHUFFLE</span>
                </button>
              </div>

              {/* Row 2: Prominent Top VIP Sender Name Plaque (用户定制：名字在上面，爱心环绕) */}
              <div className="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-950/70 via-black/90 to-rose-950/70 border-2 border-rose-400/60 shadow-[0_0_25px_rgba(244,63,94,0.35)] backdrop-blur-md">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-500 animate-pulse shrink-0 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                <span
                  className="font-pixel font-black tracking-wider text-center select-none truncate"
                  style={{
                    fontSize: `${nameSize}px`,
                    color: style.nameColor,
                    textShadow: style.textGlowName,
                  }}
                >
                  {vName}
                </span>
                <Heart className="w-5 h-5 text-rose-400 fill-rose-500 animate-pulse shrink-0 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
              </div>

              {/* Row 3: Subtitle Banner with Neon Glow */}
              <div className="w-full text-center py-0.5">
                <span
                  className="font-pixel text-xs font-bold tracking-wider"
                  style={{
                    color: style.titleColor,
                    textShadow: style.textGlowTitle,
                  }}
                >
                  ★ ユノちへ贈るお祝い電飾ボード ★
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* INNER FULL HEIGHT VERTICAL SCREEN (贯穿长屏主画面 · 无框一体化) */}
          {/* 用户定制：直立的只有贺语，无中缝隔断边框，整体一体化浮空发光 */}
          {/* ============================================================ */}
          <div className="relative flex-1 mx-3 my-2 rounded-2xl bg-zinc-950/95 bg-led-matrix p-4 border-2 border-white/15 overflow-hidden shadow-inner flex flex-col justify-between">
            {/* CRT Scanline & Laser Sweep Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/60 pointer-events-none" />
            <div
              className="absolute left-0 right-0 h-44 bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none animate-neon-scan"
              style={{
                boxShadow: `0 0 30px ${style.bulbColor}`,
              }}
            />

            {/* Subtle Mode & Ambient Guide Bar */}
            <div className="relative z-10 w-full flex items-center justify-between pb-2 border-b border-white/10 px-2 text-zinc-400">
              <span className="font-pixel text-[11px] text-rose-300 font-bold tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3 fill-rose-400 text-rose-400" />
                {greetingColumns === 1 ? '单列直立贯穿 · GREETING' : '祝福标语 · TITLE'}
              </span>
              <span className="font-pixel text-[10px] text-zinc-400 font-mono tracking-widest">
                {greetingColumns === 1 ? '1 COLUMN' : '2 COLUMNS'} · BORDERLESS LED
              </span>
              {greetingColumns === 2 ? (
                <span className="font-pixel text-[11px] text-amber-200 font-bold tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> 美好愿望 · WISH
                </span>
              ) : (
                <span className="font-pixel text-[11px] text-amber-300 font-bold tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> 愿望相伴 · WISH
                </span>
              )}
            </div>

            {/* 
              VERTICAL GREETING DISPLAY AREA
              NO dividing boxes or column borders!
              Floating directly on the dark LED matrix canvas for unified aesthetic!
            */}
            {greetingColumns === 1 ? (
              /* Option A: 1 Single Continuous Vertical Column (一排贺语) */
              <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-between py-4 px-2">
                {[...titleChars, ...bodyChars].map((ch, idx) => (
                  <div
                    key={`g1-char-${idx}-${ch}`}
                    className="flex items-center justify-center transition-all duration-150 transform hover:scale-115"
                  >
                    <span
                      className="font-pixel font-black tracking-normal leading-none select-none text-center"
                      style={{
                        fontSize: `${titleSize}px`,
                        color: idx < titleChars.length ? style.titleColor : style.bodyColor,
                        textShadow: idx < titleChars.length ? style.textGlowTitle : style.textGlowBody,
                      }}
                    >
                      {ch}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Option B: 2 Parallel Vertical Columns (两排贺语 · 无中缝边框) */
              <div className="relative z-10 w-full flex-1 flex justify-center items-stretch gap-10 px-4 py-4">
                {/* Column 1: Title (Borderless) */}
                <div className="flex-1 flex flex-col items-center justify-between py-2">
                  {titleChars.map((ch, idx) => (
                    <div
                      key={`g2-t-${idx}-${ch}`}
                      className="flex items-center justify-center transition-all duration-150 transform hover:scale-115"
                    >
                      <span
                        className="font-pixel font-black tracking-normal leading-none select-none text-center"
                        style={{
                          fontSize: `${titleSize}px`,
                          color: style.titleColor,
                          textShadow: style.textGlowTitle,
                        }}
                      >
                        {ch}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Column 2: Body (Borderless) */}
                <div className="flex-1 flex flex-col items-center justify-between py-2">
                  {bodyChars.map((ch, idx) => (
                    <div
                      key={`g2-b-${idx}-${ch}`}
                      className="flex items-center justify-center transition-all duration-150 transform hover:scale-115"
                    >
                      <span
                        className="font-pixel font-bold tracking-normal leading-none select-none text-center"
                        style={{
                          fontSize: `${bodySize}px`,
                          color: style.bodyColor,
                          textShadow: style.textGlowBody,
                        }}
                      >
                        {ch}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* BOTTOM MARQUEE FRAME: Theatrical Marquee Base (影院灯牌底框) */}
          {/* ============================================================ */}
          <div className="relative z-10 w-full flex flex-col pb-1 pt-2 px-1">
            {/* Theatrical Marquee Base Plaque */}
            <div className="mx-2 mb-2 p-2.5 rounded-2xl bg-black/70 border-2 border-white/15 backdrop-blur-md shadow-xl flex items-center justify-around text-zinc-400 font-pixel text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="text-zinc-200 tracking-wider">
                ★ HAPPY BIRTHDAY DECORATION BOARD ★
              </span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            </div>

            {/* Bottom Chasing Bulbs Row */}
            <div className="flex justify-between items-center px-2 py-1">
              {Array.from({ length: horizontalBulbs }).map((_, i) => (
                <div
                  key={`vbottom-${i}`}
                  className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-b' : 'animate-bulb-a'}`}
                  style={{
                    backgroundColor: style.bulbColor,
                    color: style.bulbColor,
                    boxShadow: `0 0 12px ${style.bulbColor}`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  // =========================================================================
  // LAYOUT 3: CLASSIC 3-TIER MARQUEE BOARD (经典三行影院卡片灯牌)
  // =========================================================================
  const displayTitle = getScrambledText(greetingTitle, renderedProgress, renderedSeed);
  const displayBody = getScrambledText(greetingBody, renderedProgress, renderedSeed + 17);
  const displayName = getScrambledText(senderName, renderedProgress, renderedSeed + 43);

  return (
    <div
      className="relative w-full max-w-[504px] my-4 select-none box-border"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'center center',
      }}
    >
      <div
        className={`relative rounded-3xl p-3 border-4 ${style.frameBorder} ${style.frameBg} transition-all duration-300 shadow-2xl`}
        style={{
          boxShadow: style.glow,
        }}
      >
        {/* Top Marquee Bulbs Row */}
        <div className="flex justify-between items-center px-2 py-1">
          {Array.from({ length: horizontalBulbs }).map((_, i) => (
            <div
              key={`top-${i}`}
              className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-a' : 'animate-bulb-b'}`}
              style={{
                backgroundColor: style.bulbColor,
                color: style.bulbColor,
              }}
            />
          ))}
        </div>

        {/* Inner Acrylic LED Dot Matrix Screen */}
        <div className="relative rounded-2xl bg-zinc-950/95 bg-led-matrix p-6 my-2 border border-white/10 overflow-hidden shadow-inner flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/40 pointer-events-none" />

          {/* Top Cinema Banner Header */}
          <div className="relative z-10 flex items-center justify-between w-full mb-5 pb-2.5 border-b border-white/10">
            <div className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-widest border flex items-center gap-1.5 ${style.badgeBg}`}>
              <Cake className="w-3.5 h-3.5 animate-bounce" />
              <span>SPECIAL CELEBRATION</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-pixel">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>FAN LIGHTBOARD</span>
            </div>

            {onTriggerShuffle && (
              <button
                    data-export-control="true"
                type="button"
                onClick={onTriggerShuffle}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-zinc-300 hover:text-white transition-all cursor-pointer font-pixel"
                title="重播点阵 Shuffle 效果"
              >
                <RotateCcw className="w-3 h-3" />
                <span>SHUFFLE</span>
              </button>
            )}
          </div>

          {/* Main Greeting Content Container */}
          <div className="relative z-10 w-full space-y-5 my-2">
            {/* Line 1: Main Birthday Greeting Title */}
            <div className="relative">
              <div
                className="font-pixel font-bold tracking-wide leading-tight break-words px-2"
                style={{
                  fontSize: `${titleSize}px`,
                  color: style.titleColor,
                  filter: style.accentGlow,
                }}
              >
                {displayTitle}
              </div>
            </div>

            {/* Line 2: Wish / Body */}
            <div className="relative px-2">
              <div
                className="font-pixel font-medium tracking-wider leading-relaxed break-words"
                style={{
                  fontSize: `${bodySize}px`,
                  color: style.bodyColor,
                }}
              >
                {displayBody}
              </div>
            </div>

            {/* Glowing Divider */}
            <div className={`w-3/4 h-[2px] mx-auto bg-gradient-to-r ${style.nameUnderline} my-3 opacity-80`} />

            {/* Line 3: HUGE Sender Name */}
            <div className="relative pt-1 pb-2">
              <div className="inline-flex items-center gap-2 mb-1.5">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                <span className="font-pixel text-xs tracking-widest text-zinc-400 uppercase">
                  MESSAGE SENDER
                </span>
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
              </div>

              {/* Big Name Display */}
              <div
                className="font-pixel font-black tracking-wider leading-snug break-words px-2"
                style={{
                  fontSize: `${nameSize}px`,
                  color: style.nameColor,
                  filter: `drop-shadow(0 0 16px ${style.bulbColor})`,
                }}
              >
                {displayName}
              </div>
            </div>
          </div>

          {/* Bottom Ambience Sparkles */}
          <div className="relative z-10 flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/10 w-full text-zinc-500 font-pixel text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>★ HAPPY BIRTHDAY DECORATION BOARD ★</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        {/* Bottom Marquee Bulbs Row */}
        <div className="flex justify-between items-center px-2 py-1">
          {Array.from({ length: horizontalBulbs }).map((_, i) => (
            <div
              key={`bottom-${i}`}
              className={`w-2.5 h-2.5 rounded-full ${i % 2 === 0 ? 'animate-bulb-b' : 'animate-bulb-a'}`}
              style={{
                backgroundColor: style.bulbColor,
                color: style.bulbColor,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

