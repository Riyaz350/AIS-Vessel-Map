import { CreateMLCEngine } from "@mlc-ai/web-llm";

// q4f16_1 = 4-bit quantized, fp16 activations — the smallest/fastest

// prebuilt Qwen3-1.7B build WebLLM ships, ideal for in-browser use.

export const MODEL_ID = "Qwen3-1.7B-q4f16_1-MLC";

let enginePromise = null;

export function isWebGPUAvailable() {
  return typeof navigator !== "undefined" && !!navigator.gpu;
}

// Returns a shared engine instance, creating (and downloading/compiling)

// it only once no matter how many components call this.

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
