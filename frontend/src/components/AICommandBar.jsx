import { useState, useRef } from "react";
import { parseCommand } from "../lib/aiCommandParser";
import { isWebGPUAvailable } from "../lib/aiEngine";
import { geocodeLocation } from '../lib/geocode';

const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function AICommandBar({ vesselMapRef }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | thinking | error
  const [progressText, setProgressText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // latest recognized text, used once silence timer fires
  const silenceTimerRef = useRef(null); // debounce timer giving the user a beat to keep talking

  const SILENCE_DELAY_MS = 2000;

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
    setStatus((s) => (s === "idle" ? "loading" : "thinking"));
    setFeedback("");

    try {
      const command = await parseCommand(commandText, (report) => {
        setProgressText(report.text || "Loading model...");
      });

      if (command.action === "focus_vessel") {
        const identifier =
          command.identifierType === "imo"
            ? { imo: command.identifier }
            : { mmsi: command.identifier };
        const result = vesselMapRef.current?.focusVessel(identifier);
        setFeedback(
          result?.found
            ? `Focused on ${result.vessel.name || "vessel"} (MMSI ${result.vessel.mmsi})`
            : `No vessel found for that ${command.identifierType.toUpperCase()}.`,
        );
      } else if (command.action === 'focus_location') {
        try {
          const place = await geocodeLocation(command.locationName);
          if (place) {
            vesselMapRef.current?.focusLocation(place.bounds);
            setFeedback(`Focused on ${place.displayName}`);
          } else {
            setFeedback(`Couldn't find a location matching "${command.locationName}".`);
          }
        } catch (err) {
          console.error('[Geocode] lookup failed:', err);
          setFeedback('Location lookup failed — check your internet connection.');
        }
      }
      else if (command.action === "clear_selection") {
        vesselMapRef.current?.clearSelection();
        setFeedback("Selection cleared.");
      } else {
        setFeedback("Sorry, I didn't understand that command.");
      }
    } catch (err) {
      console.error("[AI] Command failed:", err);
      setFeedback("Something went wrong running the AI command.");
    } finally {
      setStatus("ready");
      setText("");
    }
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
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    // Keep the session open across natural pauses instead of ending after the
    // first phrase — we handle "are they done talking?" ourselves below, so
    // someone can pause and then add more (e.g. "focus on mmsi 235012345"
    // ... pause ... "actually wait, 235012399") before it submits.
    recognition.continuous = true;
    recognition.interimResults = true; // fire repeatedly as words come in, not just once at the end

    function clearSilenceTimer() {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    recognition.onstart = () => {
      transcriptRef.current = "";
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
      clearSilenceTimer();
      const finalText = transcriptRef.current;
      transcriptRef.current = "";
      if (finalText.trim()) {
        runCommand(finalText); // submit whatever was captured once the session actually ends
      }
    };

    recognition.onerror = (e) => {
      console.warn("[Voice] recognition error:", e.error);
      clearSilenceTimer();
      const messages = {
        "no-speech": "Didn't catch that — try again.",
        "audio-capture": "No microphone found.",
        "not-allowed": "Microphone permission denied.",
        network: "Voice recognition needs an internet connection.",
      };
      setFeedback(messages[e.error] || "Voice input failed — try again.");
      // onend fires right after onerror and will handle setListening(false)
      // and submitting anything already captured.
    };

    recognition.onresult = (event) => {
      // event.results is a live list; each entry may still be interim (still
      // being revised) or final. Concatenate everything recognized so far so
      // the box shows exactly what it's hearing, word by word.
      let transcript = "";
      let isFinal = false;

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }

      // Chrome's recognizer often splits a spoken number (e.g. an MMSI)
      // across multiple result chunks, each prefixed with its own leading
      // space, which leaves a gap in the middle of the number. Collapse
      // whitespace that sits directly between two digits so split numbers
      // get glued back together, while leaving normal word spacing alone.
      transcript = transcript.replace(/(\d)\s+(?=\d)/g, "$1");

      transcriptRef.current = transcript;
      setText(transcript); // updates on every interim chunk, not just at the end

      // Any new speech — interim or final — means the user is still going,
      // so cancel any pending "they're done" timer and start fresh.
      clearSilenceTimer();

      if (isFinal) {
        // Give them SILENCE_DELAY_MS to keep adding to the command before
        // we actually stop listening and submit it.
        silenceTimerRef.current = setTimeout(() => {
          recognitionRef.current?.stop(); // triggers onend, which submits
        }, SILENCE_DELAY_MS);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  const busy = status === "loading" || status === "thinking";

  return (
    <form onSubmit={handleSubmit} style={styles.bar}>
      <div style={styles.row}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Try: "focus on mmsi 235012345" or use the mic'
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
          title={
            SpeechRecognitionAPI
              ? "Speak a command"
              : "Voice input not supported in this browser"
          }
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
    width: 420,
    fontFamily: "system-ui, sans-serif",
  },
  row: { display: "flex", gap: 6 },
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
    border: "1px solid #dc2626", // was borderColor — now matches the shorthand it's overriding
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
  progress: { fontSize: 12, color: "#6b7280" },
  feedback: { fontSize: 13, color: "#111827" },
  errorText: { fontSize: 13, color: "#b91c1c" },
};
