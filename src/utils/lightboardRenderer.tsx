import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { getFontEmbedCSS, toCanvas } from 'html-to-image';
import { LightboardScene } from '../components/LightboardScene';
import type { LightboardState } from '../components/Stage512x2400';

export const FRAME_WIDTH = 512;
export const FRAME_HEIGHT = 2400;

/** Mount the actual preview artwork at native size, independent of editor zoom. */
export async function createLightboardRenderer(state: LightboardState, scale: number) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;';
  const surface = document.createElement('div');
  surface.dataset.exportRoot = 'true';
  // Match the preview viewport's content box, without its editor border/labels.
  surface.style.cssText = `position:relative;width:${FRAME_WIDTH}px;height:${FRAME_HEIGHT}px;box-sizing:border-box;border:2px solid transparent;border-radius:12px;overflow:hidden;`;
  host.appendChild(surface);
  document.body.appendChild(host);
  const root = createRoot(surface);
  const render = (time: number) => flushSync(() => root.render(
    <LightboardScene state={state} scale={scale} renderTime={time} onTriggerShuffle={() => {}} />
  ));
  const dispose = () => { root.unmount(); host.remove(); };

  try {
    render(0);
    await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCSS(surface, { preferredFontFormat: 'woff2' });
    return {
      surface,
      dispose,
      async draw(canvas: HTMLCanvasElement, time: number, background?: string) {
        render(time);
        // A later loop character can require a different CJK font subset.
        surface.getBoundingClientRect();
        await document.fonts.ready;
        // Sample CSS animations at the same clock as the text; never at wall time.
        for (const animation of surface.getAnimations({ subtree: true })) {
          animation.pause();
          animation.currentTime = time * 1000;
        }
        const frame = await toCanvas(surface, {
          width: FRAME_WIDTH, height: FRAME_HEIGHT, pixelRatio: 1,
          fontEmbedCSS, backgroundColor: background,
        });
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法创建导出画布。');
        ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
        ctx.drawImage(frame, 0, 0);
        frame.width = frame.height = 0;
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
