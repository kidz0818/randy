import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

let server, browser, page;
before(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? ['--no-sandbox', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [],
  });
  page = await browser.newPage({ viewport: { width: 800, height: 2450 }, deviceScaleFactor: 1 });
  // Make the pixel regression independent of Google Fonts availability.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: '',
  }));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);
  await page.evaluate(() => { document.getElementById('root').style.display = 'none'; });
});
after(async () => { await browser?.close(); await server?.close(); });

const state = {
  greetingTitle: 'HAPPY', greetingBody: 'BIRTHDAY', senderName: 'RANDY',
  titleSize: 62, bodySize: 54, nameSize: 42, charSize: 340,
  greetingColumns: 2, isLooping: true, isShuffling: false, charInterval: .55,
};

for (const layout of ['single-char-loop', 'vertical-tower', 'classic-board']) {
  for (const theme of ['sakura-pink', 'cinema-gold', 'cyber-neon', 'rainbow-rave']) {
    test(`${layout} / ${theme}: exported pixels match browser-rendered artwork`, async () => {
      await page.evaluate(async state => {
        const { createLightboardRenderer } = await import('/src/utils/lightboardRenderer.tsx');
        window.renderer = await createLightboardRenderer(state, 1);
        window.canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 2400;
        await renderer.draw(canvas, .37, '#09090b');
        renderer.surface.parentElement.style.left = '0px';
        renderer.surface.style.backgroundColor = '#09090b';
      }, { ...state, layout, theme });
      try {
        const screenshot = await page.locator('[data-export-root]').screenshot();
        const metrics = await page.evaluate(async base64 => {
          const img = new Image();
          img.src = `data:image/png;base64,${base64}`;
          await img.decode();
          const reference = document.createElement('canvas');
          reference.width = 512; reference.height = 2400;
          reference.getContext('2d').drawImage(img, 0, 0);
          const expected = reference.getContext('2d').getImageData(0, 0, 512, 2400).data;
          const actual = canvas.getContext('2d').getImageData(0, 0, 512, 2400).data;
          let difference = 0, changed = 0;
          for (let i = 0; i < actual.length; i += 4) {
            let max = 0;
            for (let c = 0; c < 3; c++) {
              const delta = Math.abs(actual[i + c] - expected[i + c]);
              difference += delta; max = Math.max(max, delta);
            }
            if (max > 20) changed++;
          }
          return { mean: difference / (512 * 2400 * 3), changed: changed / (512 * 2400) };
        }, screenshot.toString('base64'));
        assert.ok(metrics.mean < 2, JSON.stringify(metrics));
        assert.ok(metrics.changed < .03, JSON.stringify(metrics));
      } finally { await page.evaluate(() => renderer.dispose()); }
    });
  }
}

test('transparent PNG keeps ambient alpha; animation is deterministic; PNG ZIP includes every frame', async () => {
  const result = await page.evaluate(async state => {
    const { createLightboardRenderer } = await import('/src/utils/lightboardRenderer.tsx');
    const { exportFrameSequenceZip } = await import('/src/utils/videoExporter.ts');
    const { default: JSZip } = await import('/node_modules/.vite/deps/jszip.js');
    const renderer = await createLightboardRenderer({ ...state, layout: 'single-char-loop', theme: 'sakura-pink' }, 1);
    const c = document.createElement('canvas'); c.width = 512; c.height = 2400;
    try {
      await renderer.draw(c, .1);
      const first = c.toDataURL();
      const pixels = c.getContext('2d').getImageData(0, 0, 512, 2400).data;
      let translucent = 0, opaque = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0 && pixels[i] < 255) translucent++;
        if (pixels[i] === 255) opaque++;
      }
      await renderer.draw(c, .75);
      const next = c.toDataURL();
      await renderer.draw(c, .1);
      const repeat = c.toDataURL();
      const repeatPixels = c.getContext('2d').getImageData(0, 0, 512, 2400).data;
      let repeatedDifference = 0;
      for (let i = 0; i < pixels.length; i++) repeatedDifference = Math.max(repeatedDifference, Math.abs(pixels[i] - repeatPixels[i]));
      const zip = await JSZip.loadAsync(await exportFrameSequenceZip(c, t => renderer.draw(c, t), .1, 30));
      const entries = Object.keys(zip.files).filter(name => name.endsWith('.png'));
      return { repeatedDifference, translucent, opaque, corner: pixels[3], deterministic: first === repeat, animated: first !== next, entries };
    } finally { renderer.dispose(); }
  }, state);
  assert.equal(result.corner, 0);
  assert.ok(result.translucent > 1000);
  assert.ok(result.opaque > 1000);
  // Browser blur/alpha compositing can round a few 8-bit levels differently.
  assert.ok(result.repeatedDifference <= 4, JSON.stringify(result));
  assert.ok(result.animated);
  assert.equal(result.entries.length, 3);
  assert.ok(result.entries.at(-1).endsWith('frame_00003.png'));
});

test('WebM encodes slow asynchronous frames with exact timeline duration and releases renderer', async () => {
  const result = await page.evaluate(async state => {
    const { createLightboardRenderer } = await import('/src/utils/lightboardRenderer.tsx');
    const { exportFramesToWebM } = await import('/src/utils/videoExporter.ts');
    const renderer = await createLightboardRenderer({ ...state, layout: 'classic-board', theme: 'cinema-gold' }, 1);
    const c = document.createElement('canvas'); c.width = 512; c.height = 2400;
    const times = [];
    let url;
    try {
      const blob = await exportFramesToWebM(c, async time => {
        times.push(time);
        await new Promise(resolve => setTimeout(resolve, 50));
        await renderer.draw(c, time, '#09090b');
      }, .2, 30);
      const video = document.createElement('video');
      url = URL.createObjectURL(blob); video.src = url;
      await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; });
      return { times, duration: video.duration, width: video.videoWidth, height: video.videoHeight, bytes: blob.size };
    } finally { if (url) URL.revokeObjectURL(url); renderer.dispose(); }
  }, state);
  assert.equal(result.times.length, 6);
  assert.equal(result.times[0], 0);
  assert.equal(result.times[5], 5 / 30);
  assert.ok(Math.abs(result.duration - .2) < .04, JSON.stringify(result));
  assert.equal(result.width, 512);
  assert.equal(result.height, 2400);
  assert.ok(result.bytes > 1000);
  assert.equal(await page.locator('[data-export-root]').count(), 0);
});
