import { CreateMLCEngine } from "@mlc-ai/web-llm";
export const MODEL_ID = "Qwen3-1.7B-q4f16_1-MLC";

let enginePromise = null;

export function isWebGPUAvailable() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

export function getEngine(onProgress) {
  if (!isWebGPUAvailable()) {
    return Promise.reject(
      new Error(
        "WebGPU is not available in this browser. Try the latest Chrome or Edge.",
      ),
    );
  }

  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        // report.progress is a 0-1 float; report.text is a human-readable status

        if (onProgress) onProgress(report);
      },
    });
  }

  return enginePromise;
}
