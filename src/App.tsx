import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage,
  PlaybackSettings,
  EntranceEffect,
} from './types/chat';
import { PRESET_SCRIPTS } from './utils/timeline';
import { ParticleSystem } from './utils/particles';
import { Stage512x2400, LightboardState } from './components/Stage512x2400';
import { LightboardTheme } from './components/FanCinemaLightboard';
import { LightboardEditorPanel } from './components/LightboardEditorPanel';
import { ComposerPanel } from './components/ComposerPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { SpeedSettingsPanel } from './components/SpeedSettingsPanel';
import { ExportModal } from './components/ExportModal';
import {
  Tv,
  Film,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Sparkles,
  Send,
  Sliders,
  Clock,
  MessageSquarePlus,
  Layers,
  Crown,
  Radio,
} from 'lucide-react';

export default function App() {
  // Display Mode: 'fan-lightboard' (Single message fan cinema pixel marquee) vs 'stream-chat' (Multi-message live stream)
  const [displayMode, setDisplayMode] = useState<'fan-lightboard' | 'stream-chat'>('fan-lightboard');

  // Single Message Fan Cinema Lightboard State (Personalized for randyseionn -> ユノち)
  const [greetingTitle, setGreetingTitle] = useState('ユノち、お誕生日おめでとう');
  const [greetingBody, setGreetingBody] = useState('素敵な一年になりますように');
  const [senderName, setSenderName] = useState('randyseionn より');
  const [lightboardTheme, setLightboardTheme] = useState<LightboardTheme>('sakura-pink');
  const [lightboardLayout, setLightboardLayout] = useState<'single-char-loop' | 'vertical-tower' | 'classic-board'>('vertical-tower');
  const [titleSize, setTitleSize] = useState(42);
  const [bodySize, setBodySize] = useState(36);
  const [nameSize, setNameSize] = useState(42); // Extra large prominent name!
  const [charSize, setCharSize] = useState(340); // Screen-filling character size!
  const [greetingColumns, setGreetingColumns] = useState<1 | 2>(2); // 1 or 2 vertical greeting columns
  const [isLooping, setIsLooping] = useState(true); // Auto continuous loop
  const [charInterval, setCharInterval] = useState(0.55); // Seconds per char
  const [splitLatinWords, setSplitLatinWords] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Timeline script list for multi-bubble stream mode
  const [timeline, setTimeline] = useState<ChatMessage[]>(() => {
    return PRESET_SCRIPTS[0].messages.map((m) => ({ ...m }));
  });

  // Active bubbles rendered on stage
  const [stageMessages, setStageMessages] = useState<ChatMessage[]>(() => {
    return PRESET_SCRIPTS[0].messages.slice(0, 3).map((m) => ({ ...m }));
  });

  // Playback & stage settings
  const [settings, setSettings] = useState<PlaybackSettings>({
    speed: 1.0,
    entranceDurationScale: 1.0,
    entryInterval: 1.2,
    maxVisibleBubbles: 16,
    bubbleSpacing: 10,
    scrollDirection: 'bottom-to-top',
    align: 'center',
    bubbleMaxWidth: 504, // strict limit <= 512
    bubbleScale: 1.25, // prominent, clear scale
    fontSize: 15,
    showShadows: true,
    enableVfxParticles: true,
    bgMode: 'transparent',
    autoFadeAfterSeconds: 0,
  });

  // Navigation tab in left drawer
  const [activeTab, setActiveTab] = useState<'lightboard' | 'composer' | 'timeline' | 'speed'>('lightboard');

  // Zoom control for 512x2400 stage
  const [zoom, setZoom] = useState(0.38);

  // Playback state for multi-message timeline
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayIndex, setActivePlayIndex] = useState(-1);

  // Export modal state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Quick bottom bar message input
  const [quickInput, setQuickInput] = useState('');

  // Refs
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger entrance VFX particles
  const triggerVfx = useCallback((effect: EntranceEffect) => {
    if (!settings.enableVfxParticles || !particleSystemRef.current) return;
    const ps = particleSystemRef.current;
    const originX = 256; // center of 512px
    const originY = 2100;

    switch (effect) {
      case 'confetti-burst':
        ps.triggerConfetti(originX, originY, 60);
        break;
      case 'coin-fountain':
        ps.triggerCoinFountain(originX, originY, 50);
        break;
      case 'superchat-flare':
        ps.triggerSuperChatFlare(originX, originY, 45);
        break;
      case 'flame-aura':
        ps.triggerFlameAura(originX, originY, 35);
        break;
      case 'cyber-glitch':
        ps.triggerCyberGlitch(originX, originY, 35);
        break;
      default:
        ps.triggerSuperChatFlare(originX, originY, 20);
        break;
    }
  }, [settings.enableVfxParticles]);

  // Trigger Shuffle with celebratory particle explosion
  const handleTriggerShuffle = useCallback(() => {
    setIsShuffling(false);
    setTimeout(() => {
      setIsShuffling(true);
      triggerVfx('confetti-burst');
    }, 50);
  }, [triggerVfx]);

  // Initial auto-shuffle on mount
  useEffect(() => {
    handleTriggerShuffle();
  }, [handleTriggerShuffle]);

  // Push bubble to stage (in stream mode)
  const addBubbleToStage = useCallback((msg: ChatMessage) => {
    setStageMessages((prev) => {
      const next = [...prev, msg];
      if (next.length > settings.maxVisibleBubbles) {
        return next.slice(-settings.maxVisibleBubbles);
      }
      return next;
    });
    triggerVfx(msg.entranceEffect);
  }, [settings.maxVisibleBubbles, triggerVfx]);

  // Handle Timeline Playback loop (for stream chat)
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    if (activePlayIndex >= timeline.length) {
      setIsPlaying(false);
      setActivePlayIndex(-1);
      return;
    }

    if (activePlayIndex === -1) {
      setActivePlayIndex(0);
      return;
    }

    const currentMsg = timeline[activePlayIndex];
    if (currentMsg) {
      addBubbleToStage({
        ...currentMsg,
        id: `play-${activePlayIndex}-${Date.now()}`,
      });
    }

    const baseDelay = currentMsg?.delayBeforeNext ?? settings.entryInterval;
    const effectiveDelay = Math.max(100, (baseDelay * 1000) / settings.speed);

    playTimerRef.current = setTimeout(() => {
      setActivePlayIndex((idx) => idx + 1);
    }, effectiveDelay);

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, activePlayIndex, timeline, settings.speed, settings.entryInterval, addBubbleToStage]);

  // Auto-scroll stage container to bottom in stream chat mode, or top in fan lightboard mode
  useEffect(() => {
    if (stageContainerRef.current) {
      if (displayMode === 'stream-chat') {
        stageContainerRef.current.scrollTo({
          top: stageContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        stageContainerRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    }
  }, [stageMessages.length, displayMode]);

  const handleStartPlay = () => {
    if (timeline.length === 0) return;
    setIsPlaying(true);
    if (activePlayIndex < 0 || activePlayIndex >= timeline.length) {
      setActivePlayIndex(0);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActivePlayIndex(-1);
    setStageMessages([]);
  };

  const handleClearStage = () => {
    setStageMessages([]);
    if (particleSystemRef.current) {
      particleSystemRef.current.clear();
    }
  };

  const handleQuickSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    if (displayMode === 'fan-lightboard') {
      // update lightboard body or title directly
      setGreetingBody(quickInput.trim());
      handleTriggerShuffle();
    } else {
      const quickMsg: ChatMessage = {
        id: `quick-${Date.now()}`,
        username: 'randyseionn',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        type: 'superchat',
        scTier: 5,
        amount: '$50.00',
        message: quickInput.trim(),
        entranceEffect: 'confetti-burst',
        entranceDuration: 0.5,
        delayBeforeNext: 1.0,
      };
      addBubbleToStage(quickMsg);
    }
    setQuickInput('');
  };

  const handleFitHeight = () => {
    if (stageContainerRef.current) {
      const containerHeight = stageContainerRef.current.clientHeight - 60;
      const fitZoom = Math.max(0.15, Math.min(1.0, containerHeight / 2400));
      setZoom(Number(fitZoom.toFixed(2)));
    } else {
      setZoom(0.38);
    }
  };

  const currentLightboardState: LightboardState = {
    greetingTitle,
    greetingBody,
    senderName,
    theme: lightboardTheme,
    layout: lightboardLayout,
    titleSize,
    bodySize,
    nameSize,
    charSize,
    greetingColumns,
    isShuffling,
    isLooping,
    charInterval,
    splitLatinWords,
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* Top Application Navbar */}
      <header className="h-14 border-b border-white/10 bg-zinc-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-rose-500/25">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-wide text-white">
                StreamChat & Fan Cinema Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-semibold">
                512 × 2400 点阵灯牌
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              像素点阵字 · 影院灯牌 Shuffle 洗牌 · 专属大名字 randyseionn · 透明视频导出
            </p>
          </div>
        </div>

        {/* Mode Switcher: Fan Lightboard vs Stream Bubbles */}
        <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setDisplayMode('fan-lightboard');
              setActiveTab('lightboard');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              displayMode === 'fan-lightboard'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>粉丝影院点阵灯牌 (单条大字)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDisplayMode('stream-chat');
              setActiveTab('composer');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              displayMode === 'stream-chat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>经典多条弹幕流</span>
          </button>
        </div>

        {/* Center Canvas Viewport Controls */}
        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
          <span className="text-[11px] text-zinc-400 font-medium px-1">舞台缩放:</span>
          <button
            onClick={() => setZoom((z) => Math.max(0.15, Number((z - 0.05).toFixed(2))))}
            className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs font-bold text-indigo-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.2, Number((z + 0.05).toFixed(2))))}
            className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
          <button
            onClick={handleFitHeight}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="自适应窗口高度"
          >
            <Maximize2 className="w-3 h-3 text-sky-400" />
            <span>适应全屏</span>
          </button>
        </div>

        {/* Right Action: Export Video */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-500 via-indigo-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>导出透明视频 / 剪辑素材</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Sidebar */}
        <aside className="w-96 border-r border-white/10 bg-zinc-900/70 backdrop-blur flex flex-col shrink-0 z-30">
          {/* Sidebar Tab Header */}
          <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/10 bg-black/20">
            <button
              onClick={() => {
                setActiveTab('lightboard');
                setDisplayMode('fan-lightboard');
              }}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                activeTab === 'lightboard'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>影院灯牌</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('composer');
                setDisplayMode('stream-chat');
              }}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                activeTab === 'composer'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>气泡定制</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('timeline');
                setDisplayMode('stream-chat');
              }}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>时间轴</span>
            </button>

            <button
              onClick={() => setActiveTab('speed')}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl font-medium text-[11px] transition-all cursor-pointer ${
                activeTab === 'speed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>大小节奏</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'lightboard' && (
              <LightboardEditorPanel
                greetingTitle={greetingTitle}
                setGreetingTitle={setGreetingTitle}
                greetingBody={greetingBody}
                setGreetingBody={setGreetingBody}
                senderName={senderName}
                setSenderName={setSenderName}
                theme={lightboardTheme}
                setTheme={setLightboardTheme}
                layout={lightboardLayout}
                setLayout={setLightboardLayout}
                titleSize={titleSize}
                setTitleSize={setTitleSize}
                bodySize={bodySize}
                setBodySize={setBodySize}
                nameSize={nameSize}
                setNameSize={setNameSize}
                charSize={charSize}
                setCharSize={setCharSize}
                greetingColumns={greetingColumns}
                setGreetingColumns={setGreetingColumns}
                isLooping={isLooping}
                setIsLooping={setIsLooping}
                charInterval={charInterval}
                setCharInterval={setCharInterval}
                splitLatinWords={splitLatinWords}
                setSplitLatinWords={setSplitLatinWords}
                onTriggerShuffle={handleTriggerShuffle}
              />
            )}

            {activeTab === 'composer' && (
              <ComposerPanel
                onTriggerLive={(msg) => {
                  setDisplayMode('stream-chat');
                  addBubbleToStage(msg);
                }}
                onAddToTimeline={(msg) => setTimeline((prev) => [...prev, msg])}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelinePanel
                timeline={timeline}
                setTimeline={setTimeline}
                isPlaying={isPlaying}
                activePlayIndex={activePlayIndex}
                onPlay={() => {
                  setDisplayMode('stream-chat');
                  handleStartPlay();
                }}
                onPause={handlePause}
                onReset={handleReset}
                onClearStage={handleClearStage}
                onTriggerSingle={(msg) => {
                  setDisplayMode('stream-chat');
                  addBubbleToStage(msg);
                }}
                settings={settings}
              />
            )}

            {activeTab === 'speed' && (
              <SpeedSettingsPanel
                settings={settings}
                setSettings={setSettings}
              />
            )}
          </div>
        </aside>

        {/* Right Stage & Viewport Workspace */}
        <main className="flex-1 flex flex-col bg-zinc-950/80 relative overflow-hidden">
          {/* Stage Top Floating Status Bar */}
          <div className="h-10 border-b border-white/5 px-4 flex items-center justify-between bg-black/40 text-xs shrink-0 z-20">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-300">
                512 × 2400 实时舞台 ({displayMode === 'fan-lightboard' ? '点阵影院灯牌模式' : '多气泡串流'})
              </span>
              <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
                <span>专属名字:</span>
                <span className="text-amber-400 font-bold">{senderName}</span>
                <span>·</span>
                <span>字体:</span>
                <span className="text-pink-400 font-bold font-pixel">DotGothic16 点阵</span>
                <span>·</span>
                <span>名字字号:</span>
                <span className="text-amber-300 font-bold">{nameSize}px</span>
              </div>
            </div>

            {/* Quick Action Bar on top of stage */}
            <div className="flex items-center gap-2">
              {displayMode === 'fan-lightboard' ? (
                <button
                  type="button"
                  onClick={handleTriggerShuffle}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-[11px] font-bold shadow-md transition-all cursor-pointer font-pixel"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>SHUFFLE 洗牌重播</span>
                </button>
              ) : (
                <>
                  {!isPlaying ? (
                    <button
                      onClick={handleStartPlay}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold shadow transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>播发剧本</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePause}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white text-[11px] font-bold shadow transition-all cursor-pointer"
                    >
                      <Pause className="w-3 h-3 fill-white" />
                      <span>暂停</span>
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                    title="重置"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleClearStage}
                    className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                    title="清空当前舞台"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Central 512x2400 Scrollable & Zoomable Stage Container */}
          <div ref={stageContainerRef} className="flex-1 relative overflow-auto bg-dot-pattern flex justify-center">
            <Stage512x2400
              messages={stageMessages}
              settings={settings}
              zoom={zoom}
              displayMode={displayMode}
              lightboardState={currentLightboardState}
              onTriggerShuffle={handleTriggerShuffle}
              onToggleLoop={(val) => setIsLooping(val)}
              onChangeCharInterval={(val) => setCharInterval(val)}
              onChangeSplitLatinWords={(val) => setSplitLatinWords(val)}
              onChangeGreetingColumns={(val) => setGreetingColumns(val)}
              particleSystemRef={particleSystemRef}
              stageCanvasRef={stageCanvasRef}
            />
          </div>

          {/* Bottom Quick Chat Interaction Bar */}
          <footer className="h-14 border-t border-white/10 bg-zinc-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 z-30">
            <form onSubmit={handleQuickSend} className="flex-1 max-w-2xl flex items-center gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={
                  displayMode === 'fan-lightboard'
                    ? '快捷更改贺词并播放 Shuffle (按 Enter 立即生效)...'
                    : '快捷敲击弹幕发送测试 (按 Enter 立即上屏)...'
                }
                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400 transition-all font-pixel"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer font-pixel"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{displayMode === 'fan-lightboard' ? '更新并SHUFFLE' : '发射'}</span>
              </button>
            </form>

            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>透明 Alpha 就绪 (可导出视频)</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        timeline={timeline}
        settings={settings}
        displayMode={displayMode}
        lightboardState={currentLightboardState}
      />
    </div>
  );
}
