import React, { useState } from 'react';
import { ChatMessage, PlaybackSettings } from '../types/chat';
import { calculateTotalRuntime } from '../utils/timeline';
import {
  ExportProgress,
  recordStreamToWebM,
  exportFrameSequenceZip,
  downloadBlob,
} from '../utils/videoExporter';
import { SUPERCHAT_TIERS } from '../utils/superchat';
import { getScrambledText } from '../utils/shuffleText';
import { segmentGreetingToChars } from '../utils/charLoop';
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
  const [exportFormat, setExportFormat] = useState<'webm-alpha' | 'png-sequence' | 'chroma-green'>('webm-alpha');
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
      totalDuration = Number(Math.max(6.0, Math.min(30.0, tokens.length * interval)).toFixed(1));
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

    if (displayMode === 'fan-lightboard' && lightboardState) {
      ctx.save();

      // ==========================================
      // Mode 1: Single-Char Fullscreen Loop
      // ==========================================
      if (lightboardState.layout === 'single-char-loop') {
        const tokens = segmentGreetingToChars(
          lightboardState.greetingTitle,
          lightboardState.greetingBody,
          lightboardState.senderName,
          lightboardState.splitLatinWords
        );
        const interval = lightboardState.charInterval || 0.55;
        const totalTokens = tokens.length || 1;
        const charIdx = Math.floor(timeSec / interval) % totalTokens;
        const activeTok = tokens[charIdx] || { char: 'ユ', section: 'title' };

        const timeInChar = timeSec % interval;
        const scrambleP = Math.min(1, timeInChar / 0.16);
        const seed = Math.floor(timeSec * 35);
        const dispChar = scrambleP >= 1 ? activeTok.char : getScrambledText(activeTok.char, scrambleP, seed);

        const boardW = 490;
        const boardH = 680;
        const boardX = 11;
        const boardY = (2400 - boardH) / 2; // vertically centered in 2400

        // Outer Marquee Frame
        ctx.beginPath();
        ctx.roundRect(boardX, boardY, boardW, boardH, 24);
        ctx.fillStyle = '#09090b';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = lightboardState.theme === 'cinema-gold' ? '#FBBF24' : '#FB7185';
        ctx.stroke();

        // Inner Screen
        const innerM = 12;
        const innerX = boardX + innerM;
        const innerY = boardY + innerM;
        const innerW = boardW - innerM * 2;
        const innerH = boardH - innerM * 2;

        ctx.beginPath();
        ctx.roundRect(innerX, innerY, innerW, innerH, 18);
        ctx.fillStyle = '#030712';
        ctx.fill();

        // Header
        ctx.font = 'bold 12px "DotGothic16", monospace';
        ctx.fillStyle = lightboardState.theme === 'cinema-gold' ? '#FDE047' : '#FDA4AF';
        ctx.textAlign = 'center';
        ctx.fillText(`★ CELEBRATION [${charIdx + 1}/${totalTokens} 字] ★`, 256, innerY + 36);

        // Subheader
        ctx.font = '11px "DotGothic16", monospace';
        ctx.fillStyle = '#9CA3AF';
        ctx.fillText('ユノちへ贈るお祝い点阵ボード', 256, innerY + 60);

        // Giant Character
        let fSize = lightboardState.charSize || 340;
        if (activeTok.char.length > 8) fSize = Math.min(68, fSize * 0.22);
        else if (activeTok.char.length > 4) fSize = Math.min(96, fSize * 0.32);
        else if (activeTok.char.length > 1) fSize = Math.min(180, fSize * 0.55);

        ctx.font = `900 ${fSize}px "DotGothic16", monospace`;
        ctx.fillStyle = lightboardState.theme === 'cinema-gold' ? '#FFDF00' : '#FDA4AF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = lightboardState.theme === 'cinema-gold' ? 'rgba(251, 191, 36, 0.95)' : 'rgba(251, 113, 133, 0.95)';
        ctx.shadowBlur = 40;
        ctx.fillText(dispChar, 256, innerY + innerH / 2);
        ctx.shadowBlur = 0; // reset

        // Bottom Sender Line with Hearts
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 13px "DotGothic16", monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`💖 SENDER: ${lightboardState.senderName} 💖`, 256, innerY + innerH - 28);

        ctx.restore();
        return;
      }

      // ==========================================
      // Mode 2: Vertical Full-Screen Tower (2400px 贯穿三联竖排灯塔)
      // ==========================================
      if (lightboardState.layout === 'vertical-tower') {
        const boardWidth = 496;
        const boardHeight = 2360;
        const boardX = 8;
        const boardY = 20;

        const shuffleP = Math.min(1, timeSec / 1.6);
        const seed = Math.floor(timeSec * 32);
        const dispTitle = getScrambledText(lightboardState.greetingTitle, shuffleP, seed);
        const dispBody = getScrambledText(lightboardState.greetingBody, shuffleP, seed + 17);
        const dispName = getScrambledText(lightboardState.senderName, shuffleP, seed + 43);

        const titleChars = Array.from(dispTitle);
        const bodyChars = Array.from(dispBody);
        const nameChars = Array.from(dispName);

        const bulbColor = lightboardState.theme === 'cinema-gold' ? '#FBBF24' : '#FB7185';
        const titleColor = lightboardState.theme === 'cinema-gold' ? '#FDE047' : '#FDA4AF';
        const bodyColor = lightboardState.theme === 'cinema-gold' ? '#FEF08A' : '#FFE4E6';
        const nameColor = '#FFD700';

        // Outer Marquee Tower Frame
        ctx.beginPath();
        ctx.roundRect(boardX, boardY, boardWidth, boardHeight, 28);
        ctx.fillStyle = '#09090b';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = bulbColor;
        ctx.stroke();

        // Top Bulbs Row (18 bulbs)
        const bulbCount = 18;
        const stepX = (boardWidth - 40) / (bulbCount - 1);
        for (let i = 0; i < bulbCount; i++) {
          const bx = boardX + 20 + i * stepX;
          const by = boardY + 16;
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fillStyle = (i % 2 === Math.floor(timeSec * 2) % 2) ? bulbColor : 'rgba(255,255,255,0.3)';
          ctx.fill();
        }

        // Bottom Bulbs Row (18 bulbs)
        for (let i = 0; i < bulbCount; i++) {
          const bx = boardX + 20 + i * stepX;
          const by = boardY + boardHeight - 16;
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.fillStyle = (i % 2 !== Math.floor(timeSec * 2) % 2) ? bulbColor : 'rgba(255,255,255,0.3)';
          ctx.fill();
        }

        // Side Vertical Bulbs (26 bulbs per side)
        const sideCount = 26;
        const stepY = (boardHeight - 120) / (sideCount - 1);
        for (let i = 0; i < sideCount; i++) {
          const by = boardY + 60 + i * stepY;
          // Left bulb
          ctx.beginPath();
          ctx.arc(boardX + 10, by, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = (i % 2 === Math.floor(timeSec * 2) % 2) ? bulbColor : 'rgba(255,255,255,0.25)';
          ctx.fill();

          // Right bulb
          ctx.beginPath();
          ctx.arc(boardX + boardWidth - 10, by, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = (i % 2 !== Math.floor(timeSec * 2) % 2) ? bulbColor : 'rgba(255,255,255,0.25)';
          ctx.fill();
        }

        // Inner Acrylic LED Matrix Screen
        const innerM = 18;
        const innerX = boardX + innerM;
        const innerY = boardY + innerM + 12;
        const innerW = boardWidth - innerM * 2;
        const innerH = boardHeight - innerM * 2 - 24;

        ctx.beginPath();
        ctx.roundRect(innerX, innerY, innerW, innerH, 20);
        ctx.fillStyle = '#030712';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.stroke();

        // Top Header Plaque with VIP Sender Name (用户定制：名字在上面)
        ctx.font = 'bold 11px "DotGothic16", monospace';
        ctx.fillStyle = '#F472B6';
        ctx.textAlign = 'center';
        ctx.fillText('★ SPECIAL PRESENT · FAN LIGHTBOARD ★', 256, innerY + 28);

        // Prominent Top VIP Sender Name with Hearts (用户定制：名字旁的皇冠换成爱心，字号完全跟随设定)
        const topNameFSize = lightboardState.nameSize || 42;
        ctx.font = `900 ${topNameFSize}px "DotGothic16", monospace`;
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 24;
        ctx.textBaseline = 'middle';
        ctx.fillText(`💖 ${dispName} 💖`, 256, innerY + 66);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 12px "DotGothic16", monospace';
        ctx.fillStyle = titleColor;
        ctx.fillText('★ ユノちへ贈るお祝い電飾ボード ★', 256, innerY + 98);

        // Inner Vertical Greetings Area (无边框一体化浮空发光)
        const greetingCols = lightboardState.greetingColumns || 2;
        const colY = innerY + 125;
        const colH = innerH - 180;

        if (greetingCols === 1) {
          // Option A: 1 Continuous Vertical Column (一排贺语 · 完全跟随用户设定字号)
          const combinedChars = [...titleChars, ...bodyChars];
          const stepY = colH / Math.max(1, combinedChars.length);
          const fSize = lightboardState.titleSize || 42; // 直接使用用户调节的字号
          ctx.font = `900 ${fSize}px "DotGothic16", monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          combinedChars.forEach((ch, idx) => {
            const isTitle = idx < titleChars.length;
            ctx.fillStyle = isTitle ? titleColor : bodyColor;
            ctx.shadowColor = bulbColor;
            ctx.shadowBlur = 25;
            ctx.fillText(ch, 256, colY + idx * stepY + stepY / 2);
          });
          ctx.shadowBlur = 0;
        } else {
          // Option B: 2 Parallel Vertical Columns (两排贺语 · 完全跟随用户设定字号)
          const col1X = 175;
          const col2X = 337;

          // Column 1: Title
          const tStep = colH / Math.max(1, titleChars.length);
          const tFSize = lightboardState.titleSize || 42; // 直接使用用户调节的祝贺字号
          ctx.font = `900 ${tFSize}px "DotGothic16", monospace`;
          ctx.fillStyle = titleColor;
          ctx.shadowColor = bulbColor;
          ctx.shadowBlur = 25;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          titleChars.forEach((ch, idx) => {
            ctx.fillText(ch, col1X, colY + idx * tStep + tStep / 2);
          });
          ctx.shadowBlur = 0;

          // Column 2: Body (Wish)
          const bStep = colH / Math.max(1, bodyChars.length);
          const bFSize = lightboardState.bodySize || 36; // 直接使用用户调节的愿望字号
          ctx.font = `bold ${bFSize}px "DotGothic16", monospace`;
          ctx.fillStyle = bodyColor;
          ctx.shadowColor = bulbColor;
          ctx.shadowBlur = 20;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          bodyChars.forEach((ch, idx) => {
            ctx.fillText(ch, col2X, colY + idx * bStep + bStep / 2);
          });
          ctx.shadowBlur = 0;
        }

        // Bottom Footer Marquee Plaque
        ctx.font = 'bold 12px "DotGothic16", monospace';
        ctx.fillStyle = '#E5E7EB';
        ctx.textAlign = 'center';
        ctx.fillText('★ HAPPY BIRTHDAY DECORATION BOARD ★', 256, innerY + innerH - 24);

        ctx.restore();
        return;
      }

      // ==========================================
      // Mode 3: Classic Marquee Board (横排经典灯牌)
      // ==========================================
      const bScale = Math.max(0.9, Math.min(1.4, settings.bubbleScale || 1.2));
      const boardWidth = Math.min(504, 490);
      const boardHeight = Math.round(340 * bScale);
      const boardX = (512 - boardWidth) / 2;
      const boardY = 2400 - boardHeight - 160;

      const shuffleP = Math.min(1, timeSec / 1.8);
      const seed = Math.floor(timeSec * 30);
      const dispTitle = getScrambledText(lightboardState.greetingTitle, shuffleP, seed);
      const dispBody = getScrambledText(lightboardState.greetingBody, shuffleP, seed + 17);
      const dispName = getScrambledText(lightboardState.senderName, shuffleP, seed + 43);

      // Outer Marquee Frame
      ctx.beginPath();
      ctx.roundRect(boardX, boardY, boardWidth, boardHeight, 24);
      ctx.fillStyle = '#09090b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = lightboardState.theme === 'cinema-gold' ? '#FBBF24' : '#FB7185';
      ctx.stroke();

      // Inner LED Matrix Screen
      const innerMargin = 12;
      const innerX = boardX + innerMargin;
      const innerY = boardY + innerMargin;
      const innerW = boardWidth - innerMargin * 2;
      const innerH = boardHeight - innerMargin * 2;

      ctx.beginPath();
      ctx.roundRect(innerX, innerY, innerW, innerH, 16);
      ctx.fillStyle = '#030712';
      ctx.fill();

      // Header Tag
      ctx.font = 'bold 12px "DotGothic16", monospace';
      ctx.fillStyle = '#F472B6';
      ctx.textAlign = 'center';
      ctx.fillText('★ FAN CINEMA SPECIAL CELEBRATION ★', 256, innerY + 32);

      // Line 1: Title (直接使用用户设定的祝贺字号)
      ctx.font = `bold ${lightboardState.titleSize || 36}px "DotGothic16", monospace`;
      ctx.fillStyle = lightboardState.theme === 'cinema-gold' ? '#FDE047' : '#FDA4AF';
      ctx.fillText(dispTitle, 256, innerY + 85);

      // Line 2: Body (直接使用用户设定的愿望字号)
      ctx.font = `500 ${lightboardState.bodySize || 26}px "DotGothic16", monospace`;
      ctx.fillStyle = '#FFE4E6';
      ctx.fillText(dispBody, 256, innerY + 140);

      // Heart Message Sender Tag
      ctx.font = 'bold 12px "DotGothic16", monospace';
      ctx.fillStyle = '#F472B6';
      ctx.fillText('💖 MESSAGE SENDER 💖', 256, innerY + 200);

      // Line 3: Big Sender Name (直接使用用户设定的大名字字号)
      ctx.font = `900 ${lightboardState.nameSize || 42}px "DotGothic16", monospace`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(dispName, 256, innerY + 250);

      ctx.restore();
      return;
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

    try {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 512;
      offscreenCanvas.height = 2400;

      if (exportFormat === 'png-sequence') {
        // Lossless transparent PNG sequence in ZIP
        const zipBlob = await exportFrameSequenceZip(
          offscreenCanvas,
          async (timeSec) => {
            await renderFrameToCanvas(offscreenCanvas, timeSec, 'transparent');
          },
          totalDuration,
          fps,
          (p) => setProgress(p)
        );

        downloadBlob(zipBlob, `StreamChat_512x2400_${displayMode}_${fps}fps.zip`);
      } else {
        // Real-time canvas recording into WebM with alpha or green screen
        const bg = exportFormat === 'chroma-green' ? 'chroma-green' : 'transparent';
        const startTime = performance.now();
        const durationMs = totalDuration * 1000;

        // Render continuously on canvas during recording
        const animInterval = setInterval(() => {
          const elapsedSec = (performance.now() - startTime) / 1000;
          renderFrameToCanvas(offscreenCanvas, elapsedSec, bg);
        }, 1000 / fps);

        const videoBlob = await recordStreamToWebM(
          offscreenCanvas,
          durationMs,
          fps,
          (p) => setProgress(p)
        );

        clearInterval(animInterval);
        downloadBlob(
          videoBlob,
          `StreamChat_512x2400_${displayMode}_${exportFormat === 'chroma-green' ? 'GreenScreen' : 'Alpha'}.webm`
        );
      }
    } catch (err) {
      console.error('Export failed:', err);
      setProgress({
        phase: 'error',
        currentFrame: 0,
        totalFrames: 0,
        percentage: 0,
        message: '导出失败，请重试或尝试 PNG 序列格式。',
      });
    } finally {
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
            <h2 className="font-bold text-white text-base">导出透明视频 / 剪辑素材 (Export)</h2>
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
              内置透明通道与点阵 Shuffle 动效，直接拖入视频剪辑软件。
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
              onClick={() => setExportFormat('webm-alpha')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                exportFormat === 'webm-alpha'
                  ? 'border-indigo-400 bg-indigo-600/20 shadow-md'
                  : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <Film className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <span>透明视频 (Transparent WebM / VP9 Alpha)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    推荐
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  原生内置透明 Alpha 通道，适用于 DaVinci Resolve、Premiere Pro、OBS、Final Cut。
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
                  <span>无损透明 PNG 图片序列 (.ZIP)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    剪辑万能
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  逐帧离线渲染，100%零丢帧与完美透明度。任意剪辑软件直接「导入为图像序列」。
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
                  标准 #00FF00 纯绿背景，剪辑软件中使用「超级键 / 超级色度键」一键抠出。
                </div>
              </div>
            </button>
          </div>
        </div>

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
