import { getEngine, resetEngine } from "./aiEngine";

// The exact shape every AI response must match. WebLLM enforces this

// at generation time (constrained decoding), so malformed JSON should

// essentially never happen — but we still validate defensively below.

const COMMAND_SCHEMA = {
  type: "object",

  properties: {
    action: {
      type: "string",

      enum: ["focus_vessel", "clear_selection", "focus_location", "unknown"],
    },

    identifierType: {
      type: "string",

      enum: ["mmsi", "imo", "none", "name"],
    },

    identifier: { type: "string" },
    locationName: { type: "string" },
  },

  required: ["action", "identifierType", "identifier", "locationName"],
};

// '/no_think' disables Qwen3's chain-of-thought reasoning mode for this

// turn. We don't need reasoning for a simple extraction task, and

// skipping it makes responses noticeably faster.

const SYSTEM_PROMPT = `You are a command parser for a ship-tracking map application. /no_think 

The user may write in English or Bengali (বাংলা) script, including Bengali 

numerals (০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯). Understand the command regardless of 

language or script. 

Extract the user's intent into JSON only, matching this exact shape: 

{ "action": "focus_vessel" | "focus_location" | "clear_selection" | "unknown", 

  "identifierType": "mmsi" | "imo" | "name" | "none", 

  "identifier": "<the vessel number as a string, using standard Arabic 

    digits 0-9 even if the user wrote Bengali digits, or empty string>", 

  "locationName": "<a place name in English if you know the English name, 

    otherwise transliterated, or empty string>" } 

  

Rules: 

- If the user asks to find, show, focus on, go to, or track a VESSEL by 

  MMSI (a 9-digit number) or IMO (typically a 7-digit number), set action 

  to "focus_vessel" and fill in identifierType and identifier, always as 

  standard Arabic digits regardless of what script the user typed them in. 
 
- If the user asks to find, show, or focus on a vessel BY NAME, set action to "focus_vessel", identifierType to

"name", and identifier to the vessel's name exactly as the user said it but with all capital letter.

- If the user asks to focus on, zoom to, show, or go to a PLACE (a 

  country, city, port, sea, strait, or region — in English or Bengali), set action to 

  "focus_location" and set locationName to the place's common English 

  name if you know it , so it can be looked up on a 

  standard map database. Leave identifierType as "none" and identifier 

  as "". 

- If the user asks to clear, deselect, or close the vessel details 

  (in either language), set action to "clear_selection". 

- If the request doesn't match any of these, set action to "unknown". 

- Output ONLY the JSON object. No explanation, no markdown fences.`;

export async function parseCommand(userText, onProgress) {
  const engine = await getEngine(onProgress);
  return runOnce(engine, userText, false, onProgress);
}

async function runOnce(engine, userText, isRetry, onProgress) {
  const reply = await engine.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
    response_format: {
      type: "json_object",
      schema: JSON.stringify(COMMAND_SCHEMA),
    },
    temperature: 0,
  });

  const raw = reply.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[AI] Failed to parse model output as JSON:", raw, err);

    if (!isRetry) {
      // Empty output usually means the engine's internal state is stuck.
      // Tear it down completely and get a fresh instance, rather than
      // trying to nurse the same corrupted one back to health.
      await resetEngine();
      const freshEngine = await getEngine(onProgress);
      return runOnce(freshEngine, userText, true, onProgress);
    }

    return {
      action: "unknown",
      identifierType: "none",
      identifier: "",
      locationName: "",
    };
  }
}
