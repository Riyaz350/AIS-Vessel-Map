import { getEngine } from "./aiEngine";

// The exact shape every AI response must match. WebLLM enforces this

// at generation time (constrained decoding), so malformed JSON should

// essentially never happen — but we still validate defensively below.

const COMMAND_SCHEMA = {
  type: "object",

  properties: {
    action: {
      type: "string",

      enum: ["focus_vessel", "clear_selection", 'focus_location', "unknown"],
    },

    identifierType: {
      type: "string",

      enum: ["mmsi", "imo", "none"],
    },

    identifier: { type: "string" },
    locationName: { type: 'string' },
  },

  required: ["action", "identifierType", 'identifier', 'locationName'],
};

// '/no_think' disables Qwen3's chain-of-thought reasoning mode for this

// turn. We don't need reasoning for a simple extraction task, and

// skipping it makes responses noticeably faster.

const SYSTEM_PROMPT = `You are a command parser for a ship-tracking map application. /no_think
Extract the user's intent into JSON only, matching this exact shape:
{ "action": "focus_vessel" | "focus_location" | "clear_selection" | "unknown",
  "identifierType": "mmsi" | "imo" | "none",
  "identifier": "<the vessel number as a string, or empty string>",
  "locationName": "<a place name, or empty string>" }

Rules:
- If the user asks to find, show, focus on, go to, or track a VESSEL by
  MMSI (a 9-digit number) or IMO (typically a 7-digit number, sometimes
  written like 'IMO 9321483'), set action to "focus_vessel" and fill in
  identifierType and identifier. Leave locationName empty.
- If the user asks to focus on, zoom to, show, or go to a PLACE set action to
  "focus_location", set locationName to that place name exactly as the
  user said it, and leave identifierType as "none" and identifier as "".
- If the user asks to clear, deselect, or close the vessel details, set
  action to "clear_selection", identifierType to "none", locationName to "".
- If the request doesn't match any of these, set action to "unknown".
- Output ONLY the JSON object. No explanation, no markdown fences.`;

export async function parseCommand(userText, onProgress) {
  const engine = await getEngine(onProgress);

  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },

      { role: "user", content: userText },
    ],

    response_format: {
      type: "json_object",

      schema: JSON.stringify(COMMAND_SCHEMA),
    },

    temperature: 0, // deterministic — we want extraction, not creativity
  });

  const raw = reply.choices[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw);

    return parsed;
  } catch (err) {
    console.warn("[AI] Failed to parse model output as JSON:", raw, err);

    return { action: "unknown", identifierType: "none", identifier: "", locationName: '' };
  }
}
