import React, { useEffect, useRef } from 'react';
import { ChatMessage, PlaybackSettings } from '../types/chat';
import { BubbleCard } from './BubbleCard';
import { ParticleSystem } from '../utils/particles';
import { LightboardScene } from './LightboardScene';
import type {
  LightboardTheme,
  LightboardLayout,
} from './FanCinemaLightboard';

export interface LightboardState {
  greetingTitle: string;
  greetingBody: string;
  senderName: string;
  theme: LightboardTheme;
  layout: LightboardLayout;
  titleSize: number;
  bodySize: number;
  nameSize: number;
  charSize: number;
  greetingColumns?: 1 | 2;
  isShuffling: boolean;
  isLooping: boolean;
  charInterval: number;
  splitLatinWords?: boolean;
  positionY?: number;
}

interface Stage512x2400Props {
  messages: ChatMessage[];
  settings: PlaybackSettings;
  zoom: number;
  displayMode?: 'fan-lightboard' | 'stream-chat';
  lightboardState?: LightboardState;
  onTriggerShuffle?: () => void;
  onToggleLoop?: (val: boolean) => void;
  onChangeCharInterval?: (val: number) => void;
  onChangeSplitLatinWords?: (val: boolean) => void;
  onChangeGreetingColumns?: (cols: 1 | 2) => void;
  particleSystemRef?: React.MutableRefObject<ParticleSystem | null>;
  stageCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const Stage512x2400: React.FC<Stage512x2400Props> = ({
  messages,
  settings,
  zoom,
  displayMode = 'fan-lightboard',
  lightboardState,
  onTriggerShuffle,
  onToggleLoop,
  onChangeCharInterval,
  onChangeSplitLatinWords,
  onChangeGreetingColumns,
  particleSystemRef,
  stageCanvasRef,
  containerRef,
}) => {
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = stageCanvasRef || localCanvasRef;
  const pSystem = useRef<ParticleSystem>(new ParticleSystem(512, 2400));

  // Sync ref
  useEffect(() => {
    if (particleSystemRef) {
      particleSystemRef.current = pSystem.current;
    }
  }, [particleSystemRef]);

  // Canvas render loop for particle VFX
  useEffect(() => {
    let animId: number;
    const canvas = activeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      ctx.clearRect(0, 0, 512, 2400);

      if (settings.enableVfxParticles) {
        pSystem.current.update();
        pSystem.current.render(ctx);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [activeCanvasRef, settings.enableVfxParticles]);

  // Background styling
  const getBgStyle = () => {
    switch (settings.bgMode) {
      case 'transparent':
        return 'bg-checkerboard';
      case 'dark':
        return 'bg-zinc-950';
      case 'green':
        return 'bg-[#00FF00]';
      case 'light':
        return 'bg-zinc-100';
      default:
        return 'bg-checkerboard';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-start justify-center p-4 min-h-full overflow-auto"
      style={{
        perspective: '1000px',
      }}
    >
      {/* Scaled Wrapper for 512x2400 */}
      <div
        className="relative transition-transform duration-200 origin-top shadow-2xl rounded-2xl"
        style={{
          width: '512px',
          height: '2400px',
          transform: `scale(${zoom})`,
          marginBottom: `${(2400 * zoom) - 2400}px`,
        }}
      >
        {/* Main Stage Canvas & DOM Window */}
        <div
          data-testid="stage-512x2400-viewport"
          className={`relative w-[512px] h-[2400px] rounded-xl overflow-hidden border-2 border-indigo-500/30 select-none shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${getBgStyle()}`}
        >
          {/* Subtle Dimensions Overlay Indicator (Top) */}
          <div className="absolute top-2 left-2 z-30 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10 text-[11px] font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>512 × 2400 px</span>
            <span className="text-zinc-500">|</span>
            <span className="text-amber-300">
              {displayMode === 'fan-lightboard'
                ? lightboardState?.layout === 'single-char-loop'
                  ? '单字满屏循环播放模式'
                  : lightboardState?.layout === 'vertical-tower'
                  ? '竖排全屏塔模式'
                  : '影院横排灯牌模式'
                : `${messages.length} 气泡`}
            </span>
          </div>

          {/* Width Limit Marker lines (512px bounds) */}
          <div className="absolute inset-y-0 left-0 w-[1px] bg-sky-500/20 pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-[1px] bg-sky-500/20 pointer-events-none z-20" />

          {/* Content Layer based on displayMode */}
          {displayMode === 'fan-lightboard' && lightboardState ? (
            /* Mode 1: Fan Cinema Pixel Marquee Lightboard */
            <LightboardScene
              state={lightboardState}
              scale={settings.bubbleScale}
              onChangeGreetingColumns={onChangeGreetingColumns}
              onTriggerShuffle={onTriggerShuffle}
              onToggleLoop={onToggleLoop}
              onChangeCharInterval={onChangeCharInterval}
              onChangeSplitLatinWords={onChangeSplitLatinWords}
            />
          ) : (
            /* Mode 2: Multi-bubble Livestream Stack */
            <div
              className={`absolute inset-0 px-3 py-6 flex flex-col z-10 box-border pointer-events-auto ${
                settings.scrollDirection === 'bottom-to-top'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
              style={{
                gap: `${settings.bubbleSpacing}px`,
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`w-full flex ${
                    settings.align === 'center'
                      ? 'justify-center'
                      : settings.align === 'right'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <BubbleCard
                    message={msg}
                    scale={settings.bubbleScale}
                    entranceScale={1 / settings.speed}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Particle System Canvas Layer (Overlaid on bubbles/lightboard) */}
          <canvas
            ref={activeCanvasRef}
            width={512}
            height={2400}
            className="absolute inset-0 w-[512px] h-[2400px] pointer-events-none z-20"
          />
        </div>
      </div>
    </div>
  );
};

