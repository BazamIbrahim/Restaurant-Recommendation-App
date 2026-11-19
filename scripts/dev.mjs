import { createServer } from 'node:http';
import { access, readFile, unlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const projectRoot = path.resolve(root, '..');
const maxImageBytes = 10 * 1024 * 1024;
const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
let inferenceActive = false;
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/assets/nemo.js', ['assets/nemo.js', 'text/javascript; charset=utf-8']],
  ['/assets/nemo.css', ['assets/nemo.css', 'text/css; charset=utf-8']],
]);

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function getModelStatus() {
  try {
    const artifacts = path.join(projectRoot, 'ml', 'artifacts', 'food101-research');
    const [metricsText] = await Promise.all([
      readFile(path.join(artifacts, 'metrics.json'), 'utf8'),
      access(path.join(artifacts, 'classifier.joblib')),
      access(path.join(artifacts, 'knn-index.joblib')),
    ]);
    const record = JSON.parse(metricsText);
    const test = record.metrics?.test;
    if (!test || !record.class_count) return { ready: false, message: 'Training metrics are incomplete.' };
    return {
      ready: true,
      model: 'SigLIP 2 frozen image encoder + logistic-regression head + cosine KNN',
      scope: 'Food-101 research labels only',
      classes: record.class_count,
      trainImages: record.train_images,
      testImages: test.images,
      top1Accuracy: test.top1_accuracy,
      top5Accuracy: test.top_k_accuracy,
      macroF1: test.macro_f1,
    };
  } catch {
    return { ready: false, message: 'Local Food-101 model artifacts are not available.' };
  }
}

async function readImageBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxImageBytes) throw Object.assign(new Error('Image exceeds 10 MB.'), { statusCode: 413 });
    chunks.push(chunk);
  }
  if (!size) throw Object.assign(new Error('No image data received.'), { statusCode: 400 });
  return Buffer.concat(chunks);
}

function runPrediction(imagePath) {
  return new Promise((resolve, reject) => {
    const venvPython = process.platform === 'win32'
      ? path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
      : path.join(projectRoot, '.venv', 'bin', 'python');
    access(venvPython).then(() => {
      launch(venvPython);
    }).catch(() => {
      launch(process.env.NEMO_PYTHON || 'python');
    });

    function launch(python) {
      const child = spawn(python, [
        path.join(projectRoot, 'ml', 'predict_food.py'), imagePath,
        '--artifacts', path.join(projectRoot, 'ml', 'artifacts', 'food101-research'),
      ], {
        cwd: projectRoot,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, HF_HUB_OFFLINE: '1' },
      });
      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => child.kill(), 90000);
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { if (stdout.length < 1_000_000) stdout += chunk; });
      child.stderr.on('data', (chunk) => { if (stderr.length < 4_000) stderr += chunk; });
      child.on('error', (error) => { clearTimeout(timeout); reject(error); });
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) return reject(new Error(stderr.includes('No module named')
          ? 'Research model dependencies are missing. Install ml/requirements.txt in the project environment.'
          : 'The local model could not process this image. Check the research server terminal.'));
        try { resolve(JSON.parse(stdout)); }
        catch { reject(new Error('The local model returned an unreadable result.')); }
      });
    }
  });
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  const file = files.get(pathname);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  // Camera capture is enabled only after the user activates the explicit photo button.
  response.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self' https://*.supabase.co; font-src 'self'");
  if (pathname === '/api/model-status' && request.method === 'GET') {
    sendJson(response, 200, await getModelStatus());
    return;
  }
  if (pathname === '/api/search-image' && request.method === 'POST') {
    if (inferenceActive) {
      sendJson(response, 429, { error: 'The local model is processing another image. Please wait a moment.' });
      return;
    }
    const mime = String(request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const extension = imageTypes.get(mime);
    if (!extension) {
      sendJson(response, 415, { error: 'Choose a JPG, PNG, or WebP image.' });
      return;
    }
    const status = await getModelStatus();
    if (!status.ready) {
      sendJson(response, 503, { error: status.message });
      return;
    }
    inferenceActive = true;
    const temporaryImage = path.join(os.tmpdir(), `nemo-image-${randomUUID()}.${extension}`);
    try {
      const image = await readImageBody(request);
      await writeFile(temporaryImage, image, { flag: 'wx' });
      const prediction = await runPrediction(temporaryImage);
      sendJson(response, 200, prediction);
    } catch (error) {
      sendJson(response, error.statusCode || 500, { error: error.statusCode ? error.message : (error.message || 'Image search failed.') });
    } finally {
      await unlink(temporaryImage).catch(() => {});
      inferenceActive = false;
    }
    return;
  }
  if (!file || request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  try {
    const body = await readFile(path.join(root, file[0]));
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Build the NEMO app first with npm run build.');
  }
});

const port = Number(process.env.PORT || 5173);
server.listen(port, '127.0.0.1', () => console.log(`NEMO demo is ready at http://127.0.0.1:${port}`));
