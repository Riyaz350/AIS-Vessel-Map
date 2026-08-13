const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

export function normalizeDigits(input) {
  if (input == null) return "";
  return String(input)
    .split("")
    .map((ch) => {
      const idx = BENGALI_DIGITS.indexOf(ch);
      return idx !== -1 ? String(idx) : ch;
    })
    .join("")
    .replace(/[^0-9]/g, "");
}
export function collapseDigitSpaces(text) {
  return text.replace(/(\d)\s+(?=\d)/g, "$1");
}

const WORD_TO_DIGIT = {
  zero: "0",
  oh: "0",
  o: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

// Speech recognition often spells long digit sequences out as words
// ("two three five zero...") instead of numerals, especially when
// spoken slowly with pauses. This finds runs of 4+ consecutive
// number-words in a transcript and collapses each run into the
// numeral string it represents, leaving the rest of the sentence
// untouched -- so "focus on mmsi two three five zero one two three
// four five" becomes "focus on mmsi 235012345".
export function spokenDigitsToNumeric(text) {
  const words = text.split(/\s+/);
  const result = [];
  let run = [];

  const flushRun = () => {
    if (run.length >= 4) {
      result.push(run.map((w) => WORD_TO_DIGIT[w.toLowerCase()]).join(""));
    } else {
      result.push(...run);
    }
    run = [];
  };

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (WORD_TO_DIGIT[clean] !== undefined) {
      run.push(clean);
    } else {
      flushRun();
      result.push(word);
    }
  }
  flushRun();

  return result.join(" ");
}
