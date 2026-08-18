import { CreateMLCEngine } from '@mlc-ai/web-llm';

export const MODEL_ID = 'Qwen3-1.7B-q4f16_1-MLC';

let enginePromise = null;

export function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.gpu;
}

export function getEngine(onProgress) {
  if (!isWebGPUAvailable()) {
    return Promise.reject(new Error('WebGPU is not available in this browser. Try the latest Chrome or Edge.'));
  }
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => { if (onProgress) onProgress(report); },
    });
  }
  return enginePromise;
}

// Discards the current engine entirely and forces the next getEngine()
// call to build a fresh one. Used as a recovery path when the model
// starts returning empty responses -- resetChat() alone doesn't reliably
// clear this state, but a brand-new engine instance always starts clean.
// Weights are already cached in IndexedDB, so rebuilding is fast.
export async function resetEngine({ interrupt = false } = {}) {
  if (enginePromise) {
    try {
      const engine = await enginePromise;
      if (interrupt) {
        try { engine.interruptGenerate(); } catch (_) { /* not generating -- fine */ }
      }
      await engine.unload(); // releases GPU memory/resources
    } catch (_) {
      // engine may already be broken -- discarding it anyway
    }
  }
  enginePromise = null;
}