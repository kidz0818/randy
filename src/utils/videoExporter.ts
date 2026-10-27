import JSZip from 'jszip';

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'zipping' | 'completed' | 'error';
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  message: string;
}

/**
 * Checks supported WebM MIME types for alpha video.
 */
export function getSupportedAlphaMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

/**
 * Records real-time canvas animation into transparent WebM.
 */
export async function recordStreamToWebM(
  canvas: HTMLCanvasElement,
  durationMs: number,
  fps = 60,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const mimeType = getSupportedAlphaMimeType();
  const stream = canvas.captureStream(fps);
  
  return new Promise((resolve, reject) => {
    try {
      const recordedChunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 16_000_000, // 16 Mbps for high fidelity 512x2400
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
        if (onProgress) {
          onProgress({
            phase: 'completed',
            currentFrame: Math.floor((durationMs / 1000) * fps),
            totalFrames: Math.floor((durationMs / 1000) * fps),
            percentage: 100,
            message: '视频录制导出成功！',
          });
        }
        resolve(finalBlob);
      };

      recorder.onerror = (err) => {
        reject(err);
      };

      recorder.start(100);

      const startTime = performance.now();
      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const pct = Math.min(99, Math.round((elapsed / durationMs) * 100));
        if (onProgress) {
          onProgress({
            phase: 'rendering',
            currentFrame: Math.floor((elapsed / 1000) * fps),
            totalFrames: Math.floor((durationMs / 1000) * fps),
            percentage: pct,
            message: `正在录制透明视频... ${pct}%`,
          });
        }

        if (elapsed >= durationMs) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 100);
    } catch (err) {
      reject(err);
    }
  });
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
      message: '透明序列包生成完毕！可直接拖入 Premiere / DaVinci / Final Cut 剪辑。',
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
