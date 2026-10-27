import JSZip from 'jszip';
import { Muxer, ArrayBufferTarget } from 'webm-muxer';

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'zipping' | 'completed' | 'error';
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  message: string;
}

/** Encode every completed frame with an explicit timestamp, regardless of render speed.
 * WebCodecs does not guarantee alpha encoding; use PNG for transparent output.
 */
export async function exportFramesToWebM(
  canvas: HTMLCanvasElement,
  drawFrameAtTime: (timeSec: number) => Promise<void> | void,
  totalDurationSec: number,
  fps = 30,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('当前浏览器不支持逐帧视频编码，请使用新版 Chrome / Edge 或导出 PNG 序列。');
  }
  const config: VideoEncoderConfig = {
    codec: 'vp09.00.10.08', width: canvas.width, height: canvas.height,
    bitrate: 16_000_000, framerate: fps, latencyMode: 'quality', alpha: 'discard',
  };
  const support = await VideoEncoder.isConfigSupported(config);
  if (!support.supported) throw new Error('当前浏览器不支持此尺寸的视频编码，请导出 PNG 序列。');
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'V_VP9', width: canvas.width, height: canvas.height, frameRate: fps } });
  let encodingError: Error | undefined;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => {
      try { muxer.addVideoChunk(chunk, metadata); }
      catch (error) { encodingError = error instanceof Error ? error : new Error(String(error)); }
    },
    error: (error) => { encodingError = error; },
  });
  const totalFrames = Math.max(1, Math.floor(totalDurationSec * fps));
  try {
    encoder.configure(config);
    for (let frame = 0; frame < totalFrames; frame++) {
      if (encodingError) throw encodingError;
      await drawFrameAtTime(frame / fps);
      const timestamp = Math.round(frame * 1_000_000 / fps);
      const videoFrame = new VideoFrame(canvas, {
        timestamp, duration: Math.round((frame + 1) * 1_000_000 / fps) - timestamp,
      });
      try { encoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 }); }
      finally { videoFrame.close(); }
      // Bound encoder memory on slower machines without skipping any frames.
      if (encoder.encodeQueueSize >= 4) await encoder.flush();
      onProgress?.({ phase: 'rendering', currentFrame: frame + 1, totalFrames,
        percentage: Math.round((frame + 1) / totalFrames * 99),
        message: `正在渲染视频第 ${frame + 1} / ${totalFrames} 帧…`,
      });
    }
    await encoder.flush();
    if (encodingError) throw encodingError;
    muxer.finalize();
    onProgress?.({ phase: 'completed', currentFrame: totalFrames, totalFrames, percentage: 100, message: '视频导出完成。' });
    return new Blob([target.buffer], { type: 'video/webm' });
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
}

/**
 * Exports frame-by-frame PNG sequence bundled in a ZIP archive.
 * Guarantees zero dropped frames and 100% lossless transparent RGBA.
 */
export async function exportFrameSequenceZip(
  canvas: HTMLCanvasElement,
  drawFrameAtTime: (timeSec: number) => Promise<void> | void,
  totalDurationSec: number,
  fps = 30,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('chat_bubble_sequence_512x2400') || zip;
  const totalFrames = Math.max(1, Math.floor(totalDurationSec * fps));

  if (onProgress) {
    onProgress({
      phase: 'preparing',
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      message: '正在准备离线无损帧渲染...',
    });
  }

  for (let frame = 0; frame < totalFrames; frame++) {
    const timeSec = frame / fps;
    await drawFrameAtTime(timeSec);

    // Get transparent PNG data blob
    const blob = await new Promise<Blob | null>((res) => {
      canvas.toBlob((b) => res(b), 'image/png');
    });

    if (!blob) throw new Error(`第 ${frame + 1} 帧保存失败，请重试。`);
    if (blob) {
      const paddedIndex = String(frame + 1).padStart(5, '0');
      folder.file(`frame_${paddedIndex}.png`, blob);
    }

    if (onProgress && frame % 5 === 0) {
      const pct = Math.round(((frame + 1) / totalFrames) * 85);
      onProgress({
        phase: 'rendering',
        currentFrame: frame + 1,
        totalFrames,
        percentage: pct,
        message: `正在无损渲染第 ${frame + 1} / ${totalFrames} 帧...`,
      });
    }
  }

  if (onProgress) {
    onProgress({
      phase: 'zipping',
      currentFrame: totalFrames,
      totalFrames,
      percentage: 90,
      message: '正在打包压缩透明 PNG 序列 ZIP...',
    });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }, (metadata) => {
    if (onProgress) {
      const pct = 90 + Math.round(metadata.percent * 0.1);
      onProgress({
        phase: 'zipping',
        currentFrame: totalFrames,
        totalFrames,
        percentage: Math.min(99, pct),
        message: `压缩打包中... ${Math.round(metadata.percent)}%`,
      });
    }
  });

  if (onProgress) {
    onProgress({
      phase: 'completed',
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      message: 'PNG 序列包生成完毕。请在剪辑软件中按所选帧率导入图像序列。',
    });
  }

  return zipBlob;
}

/**
 * Utility to trigger download of Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

