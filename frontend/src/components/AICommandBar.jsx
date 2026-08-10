import { useState } from "react";

import { parseCommand } from "../lib/aiCommandParser";

import { isWebGPUAvailable } from "../lib/aiEngine";

export default function AICommandBar({ vesselMapRef }) {
  const [text, setText] = useState("");

  const [status, setStatus] = useState("idle"); // idle | loading | thinking | error

  const [progressText, setProgressText] = useState("");

  const [feedback, setFeedback] = useState("");

  if (!isWebGPUAvailable()) {
    return (
      <div style={styles.bar}>
        <span style={styles.errorText}>
          AI commands need WebGPU. Try the latest Chrome or Edge.
        </span>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!text.trim() || status === "loading" || status === "thinking") return;

    setStatus((s) => (s === "idle" ? "loading" : "thinking"));

    setFeedback("");

    try {
      const command = await parseCommand(text, (report) => {
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
      } else if (command.action === "clear_selection") {
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

  return (
    <form onSubmit={handleSubmit} style={styles.bar}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Try: "focus on mmsi 235012345"'
        style={styles.input}
        disabled={status === "loading" || status === "thinking"}
      />

      <button
        type="submit"
        style={styles.button}
        disabled={status === "loading" || status === "thinking"}
      >
        {status === "loading"
          ? "Loading model…"
          : status === "thinking"
            ? "Thinking…"
            : "Go"}
      </button>

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

    width: 380,

    fontFamily: "system-ui, sans-serif",
  },

  input: {
    padding: "8px 10px",
    fontSize: 14,
    border: "1px solid #d1d5db",
    borderRadius: 6,
  },
  button: {
    padding: "8px 10px",
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
