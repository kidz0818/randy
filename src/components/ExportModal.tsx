import React, { useState } from 'react';
import { ChatMessage, PlaybackSettings } from '../types/chat';
import { calculateTotalRuntime } from '../utils/timeline';
import {
  ExportProgress,
  exportFramesToWebM,
  exportFrameSequenceZip,
  downloadBlob,
} from '../utils/videoExporter';
import { SUPERCHAT_TIERS } from '../utils/superchat';
import { segmentGreetingToChars } from '../utils/charLoop';
import { createLightboardRenderer } from '../utils/lightboardRenderer';
import { LightboardState } from './Stage512x2400';
import {
  Download,
  Film,
  Archive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: ChatMessage[];
  settings: PlaybackSettings;
  displayMode?: 'fan-lightboard' | 'stream-chat';
  lightboardState?: LightboardState;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  timeline,
  settings,
  displayMode = 'fan-lightboard',
  lightboardState,
}) => {
  const [exportFormat, setExportFormat] = useState<'webm' | 'png-sequence' | 'chroma-green'>('png-sequence');
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [fps, setFps] = useState<30 | 60>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  if (!isOpen) return null;

  let totalDuration = 5.0;
  if (displayMode === 'fan-lightboard' && lightboardState) {
    if (lightboardState.layout === 'single-char-loop') {
      const tokens = segmentGreetingToChars(
        lightboardState.greetingTitle,
        lightboardState.greetingBody,
        lightboardState.senderName,
        lightboardState.splitLatinWords
      );
      const interval = lightboardState.charInterval || 0.55;
      totalDuration = Number(Math.max(6.0, tokens.length * Math.max(0.15, interval)).toFixed(1));
    } else {
      totalDuration = 5.0;
    }
  } else {
    totalDuration = calculateTotalRuntime(timeline, settings.speed, settings.entryInterval);
  }

  /**
   * High fidelity offline frame renderer for 512x2400 canvas.
   * Draws active bubbles and VFX at precise timestamp `timeSec`.
   */
  const renderFrameToCanvas = async (
    targetCanvas: HTMLCanvasElement,
    timeSec: number,
    bgMode: 'transparent' | 'chroma-green'
  ) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    // Reset background
    ctx.clearRect(0, 0, 512, 2400);
    if (bgMode === 'chroma-green') {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, 512, 2400);
    }

    // Default: Multi-bubble Livestream render
    let accumulatedTime = 0;
    const visibleMessages: { msg: ChatMessage; age: number }[] = [];

    for (let i = 0; i < timeline.length; i++) {
      const msg = timeline[i];
      const delay = (msg.delayBeforeNext ?? settings.entryInterval) / settings.speed;

      if (timeSec >= accumulatedTime) {
        const age = timeSec - accumulatedTime;
        visibleMessages.push({ msg, age });
      }
      accumulatedTime += delay;
    }

    // Keep only maxVisibleBubbles
    const sliceCount = Math.min(settings.maxVisibleBubbles, visibleMessages.length);
    const activeSlice = visibleMessages.slice(-sliceCount);

    // Render bubbles bottom-to-top or top-to-bottom
    const bubbleGap = settings.bubbleSpacing;
    const startY = settings.scrollDirection === 'bottom-to-top' ? 2320 : 60;

    let currentY = startY;

    // Iterate through bubbles to draw
    const toRender = settings.scrollDirection === 'bottom-to-top' ? [...activeSlice].reverse() : activeSlice;

    for (const item of toRender) {
      const { msg, age } = item;
      const animDur = (msg.entranceDuration || 0.5) / settings.speed;
      const progress = Math.min(1, age / animDur);

      // Entrance animation transform
      let alpha = 1;
      let offsetX = 0;
      let scale = 1;

      if (progress < 1) {
        if (msg.entranceEffect === 'slide-right') {
          offsetX = (1 - progress) * 200;
          alpha = progress;
        } else if (msg.entranceEffect === 'slide-left') {
          offsetX = -(1 - progress) * 200;
          alpha = progress;
        } else if (msg.entranceEffect === 'bounce-pop' || msg.entranceEffect === 'superchat-flare') {
          scale = 0.5 + progress * 0.5;
          alpha = progress;
        } else {
          offsetX = (1 - progress) * 100;
          alpha = progress;
        }
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      const bScale = settings.bubbleScale || 1.35;
      const bubbleWidth = Math.min(504, settings.bubbleMaxWidth);
      const bubbleX = (512 - bubbleWidth) / 2 + offsetX;

      // Draw SuperChat or Regular Bubble on Canvas
      if (msg.type === 'superchat') {
        const tier = msg.scTier || 3;
        const tierStyle = SUPERCHAT_TIERS[tier] || SUPERCHAT_TIERS[3];
        const headerHeight = Math.round(46 * bScale);
        const bodyHeight = Math.round(56 * bScale);
        const totalHeight = headerHeight + bodyHeight;

        const drawY = settings.scrollDirection === 'bottom-to-top' ? currentY - totalHeight : currentY;

        ctx.translate(bubbleX + bubbleWidth / 2, drawY + totalHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(bubbleX + bubbleWidth / 2), -(drawY + totalHeight / 2));

        // Rounded rect path
        ctx.beginPath();
        const r = Math.round(16 * bScale);
        ctx.roundRect(bubbleX, drawY, bubbleWidth, totalHeight, r);
        ctx.clip();

        // Header
        ctx.fillStyle = tierStyle.headerBg;
        ctx.fillRect(bubbleX, drawY, bubbleWidth, headerHeight);

        const avatarR = Math.round(16 * bScale);
        const avatarCenterX = bubbleX + avatarR + Math.round(14 * bScale);
        const avatarCenterY = drawY + headerHeight / 2;

        // Header text
        ctx.fillStyle = tierStyle.headerText;
        ctx.font = `bold ${Math.round(15 * bScale)}px sans-serif`;
        ctx.fillText(msg.username, avatarCenterX + avatarR + Math.round(10 * bScale), drawY + headerHeight * 0.45);

        ctx.font = `${Math.round(11 * bScale)}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('SuperChat', avatarCenterX + avatarR + Math.round(10 * bScale), drawY + headerHeight * 0.78);

        // Amount badge
        ctx.font = `bold ${Math.round(16 * bScale)}px sans-serif`;
        ctx.fillStyle = tierStyle.headerText;
        ctx.textAlign = 'right';
        ctx.fillText(msg.amount || tierStyle.defaultAmount, bubbleX + bubbleWidth - Math.round(16 * bScale), drawY + headerHeight * 0.58);
        ctx.textAlign = 'left';

        // Message Body
        ctx.fillStyle = tierStyle.bodyBg;
        ctx.fillRect(bubbleX, drawY + headerHeight, bubbleWidth, bodyHeight);

        ctx.fillStyle = tierStyle.bodyText;
        ctx.font = `${Math.round(14 * bScale)}px sans-serif`;
        ctx.fillText(msg.message, bubbleX + Math.round(18 * bScale), drawY + headerHeight + Math.round(30 * bScale));

        // Avatar placeholder circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (settings.scrollDirection === 'bottom-to-top') {
          currentY -= totalHeight + bubbleGap;
        } else {
          currentY += totalHeight + bubbleGap;
        }
      } else {
        // Regular / Member Chat
        const bubbleHeight = Math.round(66 * bScale);
        const drawY = settings.scrollDirection === 'bottom-to-top' ? currentY - bubbleHeight : currentY;

        ctx.translate(bubbleX + bubbleWidth / 2, drawY + bubbleHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(bubbleX + bubbleWidth / 2), -(drawY + bubbleHeight / 2));

        ctx.fillStyle = msg.type === 'member' ? 'rgba(6, 78, 59, 0.92)' : 'rgba(24, 24, 27, 0.9)';
        ctx.beginPath();
        ctx.roundRect(bubbleX, drawY, bubbleWidth, bubbleHeight, Math.round(16 * bScale));
        ctx.fill();
        ctx.strokeStyle = msg.type === 'member' ? 'rgba(52, 211, 153, 0.5)' : 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const avatarR = Math.round(15 * bScale);
        const avatarCenterX = bubbleX + avatarR + Math.round(14 * bScale);
        const avatarCenterY = drawY + bubbleHeight / 2;

        // Username
        ctx.fillStyle = msg.type === 'member' ? '#6EE7B7' : '#38BDF8';
        ctx.font = `bold ${Math.round(15 * bScale)}px sans-serif`;
        ctx.fillText(msg.username, avatarCenterX + avatarR + Math.round(10 * bScale), drawY + bubbleHeight * 0.4);

        // Content
        ctx.fillStyle = '#F4F4F5';
        ctx.font = `${Math.round(14 * bScale)}px sans-serif`;
        ctx.fillText(msg.message, avatarCenterX + avatarR + Math.round(10 * bScale), drawY + bubbleHeight * 0.74);

        // Avatar circle
        ctx.fillStyle = '#4B5563';
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (settings.scrollDirection === 'bottom-to-top') {
          currentY -= bubbleHeight + bubbleGap;
        } else {
          currentY += bubbleHeight + bubbleGap;
        }
      }
    }
  };

  const handleStartExport = async () => {
    setIsExporting(true);

    let lightboardRenderer: Awaited<ReturnType<typeof createLightboardRenderer>> | undefined;
    setProgress({ phase: 'preparing', currentFrame: 0, totalFrames: Math.floor(totalDuration * fps), percentage: 0, message: '正在准备预览样式与字体…' });
    try {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 512;
      offscreenCanvas.height = 2400;
      if (displayMode === 'fan-lightboard' && lightboardState) {
        lightboardRenderer = await createLightboardRenderer(lightboardState, settings.bubbleScale);
      }
      const previewBackground = settings.bgMode === 'light' ? '#f4f4f5'
        : settings.bgMode === 'green' ? '#00ff00'
        : settings.bgMode === 'dark' ? '#09090b' : undefined;
      const background = exportFormat === 'chroma-green' ? '#00ff00'
        : exportFormat === 'webm' ? (previewBackground || '#09090b')
        : transparentBackground ? undefined : previewBackground;
      const drawFrame = async (time: number) => {
        if (lightboardRenderer) {
          await lightboardRenderer.draw(offscreenCanvas, time, background);
        } else {
          await renderFrameToCanvas(offscreenCanvas, time, 'transparent');
          if (background) {
            const ctx = offscreenCanvas.getContext('2d')!;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, 512, 2400);
            ctx.restore();
          }
        }
      };
      if (exportFormat === 'png-sequence') {
        const zipBlob = await exportFrameSequenceZip(offscreenCanvas, drawFrame, totalDuration, fps, setProgress);
        downloadBlob(zipBlob, `StreamChat_512x2400_${displayMode}_${fps}fps.zip`);
      } else {
        const videoBlob = await exportFramesToWebM(offscreenCanvas, drawFrame, totalDuration, fps, setProgress);
        downloadBlob(videoBlob, `StreamChat_512x2400_${displayMode}_${exportFormat === 'chroma-green' ? 'GreenScreen' : 'Preview'}.webm`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setProgress({
        phase: 'error',
        currentFrame: 0,
        totalFrames: 0,
        percentage: 0,
        message: err instanceof Error ? err.message : '导出失败，请重试或尝试 PNG 序列格式。',
      });
    } finally {
      lightboardRenderer?.dispose();
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-white/20 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-white text-base">导出视频 / 无损图片序列</h2>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dimension & Aspect Specs Banner */}
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-300">
              精准规格：512 宽 × 2400 高 ({displayMode === 'fan-lightboard' ? '粉丝影院点阵灯牌' : '垂直直播弹幕列'})
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              灯牌与预览共用画面，保留点阵、氛围光与动效；不包含编辑按钮。
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
            {totalDuration}s 预估
          </span>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-400">选择导出格式</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setExportFormat('webm')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                exportFormat === 'webm'
                  ? 'border-indigo-400 bg-indigo-600/20 shadow-md'
                  : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <Film className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <span>完整画面视频 (WebM)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    视频
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  逐帧编码，保留预览底色；透明预览以深色底输出。需要透明光晕请选择 PNG 序列。
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => setExportFormat('png-sequence')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                exportFormat === 'png-sequence'
                  ? 'border-indigo-400 bg-indigo-600/20 shadow-md'
                  : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <Archive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <span>无损 PNG 图片序列 (.ZIP)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    保真推荐
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  逐帧保存点阵、光晕和透明度。在支持的剪辑软件中选择「导入为图像序列」。
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => setExportFormat('chroma-green')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                exportFormat === 'chroma-green'
                  ? 'border-indigo-400 bg-indigo-600/20 shadow-md'
                  : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <div className="w-5 h-5 rounded bg-[#00FF00] shrink-0 mt-0.5 border border-black/30" />
              <div>
                <div className="font-bold text-xs text-white">绿幕抠像视频 (Chroma Key Green Video)</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  纯绿背景视频。抠像会影响半透明光晕；需要完整光晕建议使用 PNG 序列。
                </div>
              </div>
            </button>
          </div>
        </div>

        {exportFormat === 'png-sequence' && (
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={transparentBackground} disabled={isExporting}
              onChange={(event) => setTransparentBackground(event.target.checked)} />
            透明底色（仅去除舞台底色，保留灯牌背景、点阵与光晕）
          </label>
        )}

        {/* Frame Rate Selection */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/10 text-xs">
          <span className="text-zinc-400 font-medium">导出帧率 (Frame Rate):</span>
          <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/40">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setFps(30)}
              className={`px-3 py-1 font-mono font-medium transition-all ${
                fps === 30 ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 FPS (快速轻量)
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setFps(60)}
              className={`px-3 py-1 font-mono font-medium transition-all ${
                fps === 60 ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              60 FPS (丝滑高刷)
            </button>
          </div>
        </div>

        {/* Progress Display */}
        {progress && (
          <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">{progress.message}</span>
              <span className="font-mono font-bold text-indigo-400">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs transition-all cursor-pointer"
            >
              关闭
            </button>
          )}

          <button
            type="button"
            disabled={isExporting}
            onClick={handleStartExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在渲染导出中...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>开始生成并下载</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

