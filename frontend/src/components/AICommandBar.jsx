import { useState, useRef } from "react";

import { parseCommand } from "../lib/aiCommandParser";

import { geocodeLocation } from "../lib/geocode";

import { isWebGPUAvailable } from "../lib/aiEngine";
// import { spokenDigitsToNumeric } from "../lib/normalizeIdentifier";
import { collapseDigitSpaces } from "../lib/normalizeIdentifier";

const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const LANGUAGES = {
  en: {
    code: "en-US",
    label: "EN",
    placeholder: 'Try: "focus on mmsi 235012345" or "zoom to Bangladesh"',
  },

  bn: {
    code: "bn-BD",
    label: "বাং",
    placeholder: 'লিখুন: "mmsi 235012345 এ ফোকাস করো" অথবা "বাংলাদেশে জুম করো"',
  },
};

export default function AICommandBar({ vesselMapRef }) {
  const [text, setText] = useState("");

  const [status, setStatus] = useState("idle"); // idle | loading | thinking | error

  const [progressText, setProgressText] = useState("");

  const [feedback, setFeedback] = useState("");

  const [listening, setListening] = useState(false);

  const [lang, setLang] = useState("en"); // 'en' | 'bn'

  const recognitionRef = useRef(null);

  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef(null);

  // Bumped every time a new command starts. If it no longer matches the

  // value captured when a run began, that run's result is discarded --

  // this is what makes Stop feel instant even though the model itself

  // may keep working a little longer in the background.

  const requestIdRef = useRef(0);

  if (!isWebGPUAvailable()) {
    return (
      <div style={styles.bar}>
        <span style={styles.errorText}>
          AI commands need WebGPU. Try the latest Chrome or Edge.
        </span>
      </div>
    );
  }

  async function runCommand(commandText) {
    if (!commandText.trim() || status === "loading" || status === "thinking")
      return;

    const myRequestId = ++requestIdRef.current;

    setStatus((s) => (s === "idle" ? "loading" : "thinking"));

    setFeedback("");

    try {
      const command = await parseCommand(commandText, (report) => {
        setProgressText(report.text || "Loading model...");
      });

      // Stop was pressed while we were waiting -- drop this stale result.

      if (requestIdRef.current !== myRequestId) return;

      if (command.action === "focus_vessel") {
        const identifier =
          command.identifierType === "imo"
            ? { imo: command.identifier }
            : { mmsi: command.identifier }
            ;

        const result = vesselMapRef.current?.focusVessel(identifier);

        setFeedback(
          result?.found
            ? `Focused on ${result.vessel.name || "vessel"} (MMSI ${result.vessel.mmsi})`
            : `No vessel found for that ${command.identifierType.toUpperCase()}.`,
        );
      } else if (command.action === "focus_location") {
        const place = await geocodeLocation(command.locationName);

        if (requestIdRef.current !== myRequestId) return;

        if (place) {
          vesselMapRef.current?.focusLocation(place.bounds);

          setFeedback(`Focused on ${place.displayName}`);
        } else {
          setFeedback(
            `Couldn't find a location matching "${command.locationName}".`,
          );
        }
      } else if (command.action === "clear_selection") {
        vesselMapRef.current?.clearSelection();

        setFeedback("Selection cleared.");
      } else {
        setFeedback("Sorry, I didn't understand that command.");
      }
    } catch (err) {
      if (requestIdRef.current !== myRequestId) return; // stopped -- ignore the error too

      console.error("[AI] Command failed:", err);

      setFeedback("Something went wrong running the AI command.");
    } finally {
      if (requestIdRef.current === myRequestId) {
        setStatus("ready");

        setText("");
      }
    }
  }

  function handleStop() {
    requestIdRef.current++;
    setStatus("ready");
    setFeedback("Stopped.");
    clearTimeout(silenceTimerRef.current);
    if (listening) recognitionRef.current?.stop();
  }

  function handleSubmit(e) {
    e.preventDefault();

    runCommand(text);
  }

  function handleMicClick() {
    if (!SpeechRecognitionAPI) {
      setFeedback("Voice input is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop(); // manual stop still works too
      return;
    }

    finalTranscriptRef.current = "";
    setText("");

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = LANGUAGES[lang].code;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      // Any new result (interim or final) means the person is still
      // talking -- push the auto-stop deadline out another 2 seconds.
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognitionRef.current?.stop(); // triggers onend below, which submits
      }, 2000);

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const segment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += segment + " ";
        } else {
          interim += segment;
        }
      }
      setText((finalTranscriptRef.current + interim).trim());
    };

    recognition.onerror = (e) => {
      clearTimeout(silenceTimerRef.current);
      console.warn("[Voice] recognition error:", e.error);
      setListening(false);
      const messages = {
        "no-speech": "Didn't catch that — try again.",
        "audio-capture": "No microphone found.",
        "not-allowed": "Microphone permission denied.",
        network: "Voice recognition needs an internet connection.",
      };
      setFeedback(messages[e.error] || "Voice input failed — try again.");
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);
      const rawFinalText = finalTranscriptRef.current.trim();
      const finalText = collapseDigitSpaces(rawFinalText);

      console.debug("[Voice] raw transcript:", JSON.stringify(rawFinalText));
      console.debug(
        "[Voice] after collapsing digit spaces:",
        JSON.stringify(finalText),
      );

      if (finalText) {
        setText(finalText);
        runCommand(finalText);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  const busy = status === "loading" || status === "thinking";

  return (
    <form onSubmit={handleSubmit} style={styles.bar}>
      <div style={styles.row}>
        <div style={styles.langToggle}>
          {Object.entries(LANGUAGES).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setLang(key)}
              style={{
                ...styles.langButton,
                ...(lang === key ? styles.langButtonActive : {}),
              }}
              disabled={busy || listening}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={LANGUAGES[lang].placeholder}
          style={styles.input}
          disabled={busy}
        />

        <button
          type="button"
          onClick={handleMicClick}
          style={{
            ...styles.micButton,
            ...(listening ? styles.micButtonActive : {}),
          }}
          disabled={busy}
          aria-label={listening ? "Stop listening" : "Start voice command"}
        >
          {listening ? "● Listening…" : "🎤"}
        </button>

        <button type="submit" style={styles.button} disabled={busy}>
          {status === "loading"
            ? "Loading model…"
            : status === "thinking"
              ? "Thinking…"
              : "Go"}
        </button>

        {(busy || listening) && (
          <button type="button" onClick={handleStop} style={styles.stopButton}>
            ■ Stop
          </button>
        )}
      </div>

      {status === "loading" && progressText && (
        <div style={styles.progress}>{progressText}</div>
      )}

      {feedback && <div style={styles.feedback}>{feedback}</div>}
    </form>
  );
}

const styles = {
  bar: {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,

    background: "#ffffff",
    borderRadius: 8,
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",

    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: 480,

    fontFamily: "system-ui, sans-serif",
  },

  row: { display: "flex", gap: 6, alignItems: "center" },

  langToggle: {
    display: "flex",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    overflow: "hidden",
  },

  langButton: {
    padding: "8px 8px",
    fontSize: 12,
    border: "none",
    background: "#f9fafb",
    cursor: "pointer",
  },

  langButtonActive: { background: "#2563eb", color: "#fff" },

  input: {
    flex: 1,
    padding: "8px 10px",
    fontSize: 14,
    border: "1px solid #d1d5db",
    borderRadius: 6,
  },

  micButton: {
    padding: "8px 10px",
    fontSize: 14,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#f9fafb",
    cursor: "pointer",
  },

  micButtonActive: {
    border: "1px solid #dc2626",
    background: "#fee2e2",
    color: "#dc2626",
  },

  button: {
    padding: "8px 12px",
    fontSize: 14,
    border: "none",
    borderRadius: 6,
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },

  stopButton: {
    padding: "8px 12px",
    fontSize: 14,
    border: "none",
    borderRadius: 6,
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },

  progress: { fontSize: 12, color: "#6b7280" },

  feedback: { fontSize: 13, color: "#111827" },

  errorText: { fontSize: 13, color: "#b91c1c" },
};
