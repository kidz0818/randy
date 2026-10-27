import React from 'react';
import { LightboardTheme, LightboardLayout } from './FanCinemaLightboard';
import {
  Sparkles,
  Sliders,
  Type,
  Palette,
  RotateCcw,
  Crown,
  Heart,
  Repeat,
  Tv,
  Layers,
  Columns,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';

interface LightboardEditorPanelProps {
  greetingTitle: string;
  setGreetingTitle: (val: string) => void;
  greetingBody: string;
  setGreetingBody: (val: string) => void;
  senderName: string;
  setSenderName: (val: string) => void;
  theme: LightboardTheme;
  setTheme: (val: LightboardTheme) => void;
  layout: LightboardLayout;
  setLayout: (val: LightboardLayout) => void;
  titleSize: number;
  setTitleSize: (val: number) => void;
  bodySize: number;
  setBodySize: (val: number) => void;
  nameSize: number;
  setNameSize: (val: number) => void;
  charSize: number;
  setCharSize: (val: number) => void;
  greetingColumns?: 1 | 2;
  setGreetingColumns?: (val: 1 | 2) => void;
  isLooping: boolean;
  setIsLooping: (val: boolean) => void;
  charInterval: number;
  setCharInterval: (val: number) => void;
  splitLatinWords: boolean;
  setSplitLatinWords: (val: boolean) => void;
  onTriggerShuffle: () => void;
}

export const LightboardEditorPanel: React.FC<LightboardEditorPanelProps> = ({
  greetingTitle,
  setGreetingTitle,
  greetingBody,
  setGreetingBody,
  senderName,
  setSenderName,
  theme,
  setTheme,
  layout,
  setLayout,
  titleSize,
  setTitleSize,
  bodySize,
  setBodySize,
  nameSize,
  setNameSize,
  charSize,
  setCharSize,
  greetingColumns = 2,
  setGreetingColumns,
  isLooping,
  setIsLooping,
  charInterval,
  setCharInterval,
  splitLatinWords,
  setSplitLatinWords,
  onTriggerShuffle,
}) => {
  const themes: { id: LightboardTheme; label: string; desc: string; iconColor: string }[] = [
    {
      id: 'sakura-pink',
      label: '💖 樱花粉金 (Sakura Birthday)',
      desc: '偶像生日应援经典配色，粉白灯光与金粉闪耀',
      iconColor: 'bg-rose-500',
    },
    {
      id: 'cinema-gold',
      label: '🌟 经典剧院金 (Cinema Marquee)',
      desc: '好莱坞/复古影院灯箱，温暖金黄灯泡轮转',
      iconColor: 'bg-amber-400',
    },
    {
      id: 'cyber-neon',
      label: '⚡ 赛博霓虹 (Cyber Matrix)',
      desc: '高科技冷光青蓝与紫电，极客炫酷点阵感',
      iconColor: 'bg-cyan-400',
    },
    {
      id: 'rainbow-rave',
      label: '🌈 绚彩舞台 (Rainbow Rave)',
      desc: '狂欢派对霓虹跑马灯，色彩斑斓绚丽多姿',
      iconColor: 'bg-pink-500',
    },
  ];

  const handleResetToUserGreeting = () => {
    setGreetingTitle('ユノち、お誕生日おめでとう');
    setGreetingBody('素敵な一年になりますように');
    setSenderName('randyseionn より');
    setTitleSize(42);
    setBodySize(36);
    setNameSize(42);
    setCharSize(340);
    setCharInterval(0.55);
  };

  return (
    <div className="space-y-4 text-xs text-zinc-300">
      {/* Top Header with Reset */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white text-sm">粉丝点阵灯牌设定</span>
        </div>
        <button
          type="button"
          onClick={handleResetToUserGreeting}
          className="text-[11px] text-zinc-400 hover:text-indigo-300 cursor-pointer"
        >
          恢复专属贺词
        </button>
      </div>

      {/* Primary Layout Mode Selector: Vertical Tower vs Giant Single-Char Loop vs Classic */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-pink-400" />
            <span>呈现形态选择 (Display Layout)</span>
          </span>
          <span className="text-[10px] text-pink-400 font-mono font-bold">按需切换</span>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1">
          {/* Mode 1: Vertical Full Screen Tower (User Requested Primary Mode) */}
          <button
            type="button"
            onClick={() => setLayout('vertical-tower')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              layout === 'vertical-tower'
                ? 'border-indigo-400 bg-indigo-950/50 shadow-lg shadow-indigo-500/20'
                : 'border-white/5 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`p-2 rounded-lg ${layout === 'vertical-tower' ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              <Columns className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">🏛️ 直直竖排影院灯牌 (当前模式 · 推荐)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">全屏一体化</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                名字 <span className="text-amber-300 font-bold">randyseionn より</span> 稳居顶部冠冕牌匾；中央仅展示直立贺语，可自由选择【单排直立】或【双排并列】，贺语间无框隔断，整体一体化浮空发光！
              </p>
            </div>
          </button>

          {/* Mode 2: Giant Single Char Loop */}
          <button
            type="button"
            onClick={() => setLayout('single-char-loop')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              layout === 'single-char-loop'
                ? 'border-pink-500 bg-pink-950/40 shadow-lg shadow-pink-500/10'
                : 'border-white/5 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`p-2 rounded-lg ${layout === 'single-char-loop' ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              <Repeat className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">🔤 单字全屏循环播放</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-300 font-bold">逐字轮播</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                每个字放大至 <span className="text-pink-300 font-mono font-bold">340px+ 极限占满屏幕</span>，直直地一个字一个字高速洗牌轮播，无限循环。
              </p>
            </div>
          </button>

          {/* Mode 3: Classic Marquee Board */}
          <button
            type="button"
            onClick={() => setLayout('classic-board')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              layout === 'classic-board'
                ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-500/10'
                : 'border-white/5 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`p-2 rounded-lg ${layout === 'classic-board' ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">🎫 经典三行横排灯牌</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                标题、贺语、大名字三段式横排卡片，四周环绕跑马灯灯泡与整体 Shuffle 动画。
              </p>
            </div>
          </button>
        </div>
      </div>


      {/* Single Char Loop Specialized Controls */}
      {layout === 'single-char-loop' && (
        <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-3">
          <div className="flex items-center justify-between font-semibold text-white">
            <span className="flex items-center gap-1.5 text-pink-300">
              <Sliders className="w-4 h-4 text-pink-400" />
              <span>单字循环参数控制 (Loop Settings)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                isLooping
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-white/10'
              }`}
            >
              {isLooping ? <Repeat className="w-3.5 h-3.5 animate-spin-slow" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isLooping ? '自动无限循环中' : '循环已暂停'}</span>
            </button>
          </div>

          {/* Char Size Slider: 200px - 440px */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">单字屏幕字号 (占满屏幕):</span>
              <span className="font-mono text-pink-300 font-bold text-sm">{charSize}px</span>
            </div>
            <input
              type="range"
              min={200}
              max={440}
              step={10}
              value={charSize}
              onChange={(e) => setCharSize(parseInt(e.target.value, 10))}
              className="w-full accent-pink-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>适中 (200px)</span>
              <span className="text-pink-400 font-bold">推荐超大 (340px)</span>
              <span>极限撑满 (440px)</span>
            </div>
          </div>

          {/* Char Interval / Speed Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium flex items-center gap-1">
                <FastForward className="w-3 h-3 text-amber-400" />
                <span>换字节奏速度 (秒/字):</span>
              </span>
              <span className="font-mono text-amber-300 font-bold text-sm">{charInterval.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.5}
              step={0.05}
              value={charInterval}
              onChange={(e) => setCharInterval(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>极速轮播 (0.2s)</span>
              <span className="text-amber-400">标准 (0.55s)</span>
              <span>慢速驻留 (1.5s)</span>
            </div>
          </div>

          {/* Split Latin Words Toggle */}
          <div className="pt-1 flex items-center justify-between border-t border-white/10">
            <div>
              <span className="text-xs text-zinc-200 font-medium block">名字拆分为单字母轮播</span>
              <span className="text-[10px] text-zinc-400">开启后 r-a-n-d-y-s-e-i-o-n-n 逐字母满屏循环</span>
            </div>
            <button
              type="button"
              onClick={() => setSplitLatinWords(!splitLatinWords)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                splitLatinWords
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {splitLatinWords ? '已开启逐字母' : '整词展示'}
            </button>
          </div>
        </div>
      )}

      {/* Vertical Tower Specialized Column Controls */}
      {layout === 'vertical-tower' && (
        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3.5">
          <div className="flex items-center justify-between font-semibold text-white">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>竖排贺语排数与字号控制</span>
            </span>
            <span className="text-[10px] text-amber-300 font-mono font-bold">无边框一体化</span>
          </div>

          {/* Column Count Selection: 1 vs 2 */}
          <div className="space-y-1.5 p-2.5 rounded-lg bg-black/40 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium text-xs flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-indigo-400" />
                <span>贺语直立排数切换:</span>
              </span>
              <span className="text-[10px] text-indigo-300 font-mono font-bold">
                {greetingColumns === 1 ? '一排贺语 (单列贯穿)' : '两排贺语 (双列并排)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setGreetingColumns?.(1)}
                className={`p-2 rounded-lg border text-center font-bold text-xs font-pixel transition cursor-pointer ${
                  greetingColumns === 1
                    ? 'border-rose-400 bg-rose-950/70 text-white shadow-md shadow-rose-500/25'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <div>🔤 一排贺语 (单列)</div>
                <div className="text-[9px] font-normal text-zinc-400 mt-0.5">全句居中单列连续贯穿</div>
              </button>
              <button
                type="button"
                onClick={() => setGreetingColumns?.(2)}
                className={`p-2 rounded-lg border text-center font-bold text-xs font-pixel transition cursor-pointer ${
                  greetingColumns === 2
                    ? 'border-indigo-400 bg-indigo-950/70 text-white shadow-md shadow-indigo-500/25'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <div>🏛️ 两排贺语 (双列)</div>
                <div className="text-[9px] font-normal text-zinc-400 mt-0.5">标语与愿望对称双列并排</div>
              </button>
            </div>

            <div className="text-[10px] text-emerald-300/90 flex items-center gap-1 pt-0.5">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>贺语之间已去除多余边框隔断，整体一体化呈现，排版更加浑然天成！</span>
            </div>
          </div>

          {/* Top Sender Name Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>顶部专属大名字字号 (Top Name):</span>
              </span>
              <span className="font-mono text-amber-400 font-bold text-sm">{nameSize}px</span>
            </div>
            <input
              type="range"
              min={22}
              max={54}
              step={2}
              value={nameSize}
              onChange={(e) => setNameSize(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Title Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">
                {greetingColumns === 1 ? '竖排贺语字号 (全句单列):' : '第 1 列 祝贺标语字号:'}
              </span>
              <span className="font-mono text-rose-300 font-bold text-sm">{titleSize}px</span>
            </div>
            <input
              type="range"
              min={26}
              max={68}
              step={2}
              value={titleSize}
              onChange={(e) => setTitleSize(parseInt(e.target.value, 10))}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Body Size */}
          {greetingColumns === 2 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 font-medium">第 2 列 美好愿望字号:</span>
                <span className="font-mono text-amber-200 font-bold text-sm">{bodySize}px</span>
              </div>
              <input
                type="range"
                min={22}
                max={58}
                step={2}
                value={bodySize}
                onChange={(e) => setBodySize(parseInt(e.target.value, 10))}
                className="w-full accent-amber-300 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* Big Shuffle Action Button */}
      <button
        type="button"
        onClick={onTriggerShuffle}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-rose-500 via-amber-400 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-pixel"
      >
        <RotateCcw className="w-4 h-4 animate-spin-slow" />
        <span>🔀 重新播放大大个 SHUFFLE 洗牌特效</span>
      </button>

      {/* Text Lines Inputs */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Type className="w-4 h-4 text-indigo-400" />
          <span>贺语内容设定 (3段式贺语结构)</span>
        </div>

        {/* Line 1: Title */}
        <div>
          <label className="block text-zinc-400 mb-1 text-[11px]">
            第 1 行：核心祝福标语 (Greeting Title)
          </label>
          <input
            type="text"
            value={greetingTitle}
            onChange={(e) => setGreetingTitle(e.target.value)}
            placeholder="ユノち、お誕生日おめでとう"
            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-pixel focus:outline-none focus:border-rose-400"
          />
        </div>

        {/* Line 2: Body */}
        <div>
          <label className="block text-zinc-400 mb-1 text-[11px]">
            第 2 行：美好愿景正文 (Greeting Wish)
          </label>
          <input
            type="text"
            value={greetingBody}
            onChange={(e) => setGreetingBody(e.target.value)}
            placeholder="素敵な一年になりますように"
            className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-pixel focus:outline-none focus:border-rose-400"
          />
        </div>

        {/* Line 3: Big Sender Name */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <label className="text-zinc-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span className="font-bold text-amber-300">第 3 行：专属大名字 (Big Name)</span>
            </label>
            <span className="text-[10px] text-amber-400 font-mono">突出放大</span>
          </div>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="randyseionn より"
            className="w-full bg-black/60 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-amber-300 font-pixel font-bold focus:outline-none focus:border-amber-400 shadow-sm"
          />
        </div>
      </div>

      {/* Lightboard Color Themes */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Palette className="w-4 h-4 text-purple-400" />
          <span>灯牌视觉主题 (Lightboard Theme)</span>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                theme === t.id
                  ? 'border-indigo-400 bg-indigo-600/20 shadow-md'
                  : 'border-white/5 bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${t.iconColor} shrink-0 mt-0.5 shadow-sm`} />
              <div>
                <div className="font-bold text-xs text-white">{t.label}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
