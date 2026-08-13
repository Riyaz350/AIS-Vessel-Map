const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

// Converts Bengali digits to Arabic digits and strips anything that isn't
// a digit (spaces, commas, stray punctuation the model or voice transcript
// might introduce) — so lookups aren't fooled by formatting differences.
export function normalizeDigits(input) {
  if (input == null) return '';
  return String(input)
    .split('')
    .map((ch) => {
      const idx = BENGALI_DIGITS.indexOf(ch);
      return idx !== -1 ? String(idx) : ch;
    })
    .join('')
    .replace(/[^0-9]/g, '');
}