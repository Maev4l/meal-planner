// Deterministic name → Ardoise accent color, for avatars/marks. Everyone (incl. "you") is uniform.
const PALETTE = ['#e9806a', '#e7c24d', '#9cc08a', '#df6253', '#cbb9e8'];

export const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

// Colors for an ordered list of names, nudged so no two ADJACENT entries share a color
// (keeps each name's deterministic color unless it collides with its neighbour).
export const colorsForNames = (names = []) => {
  const out = [];
  names.forEach((name, idx) => {
    let c = colorForName(name);
    if (idx > 0 && c === out[idx - 1]) {
      const start = PALETTE.indexOf(c);
      for (let k = 1; k < PALETTE.length; k++) {
        const cand = PALETTE[(start + k) % PALETTE.length];
        if (cand !== out[idx - 1]) {
          c = cand;
          break;
        }
      }
    }
    out.push(c);
  });
  return out;
};

// Real initials, not the first two characters: "The Sue Family" was rendering as
// "TH" and "Jean-Raymond" as "JE". Words split on whitespace, hyphens and
// apostrophes, so "Jean-Raymond" gives JR and "O'Brien" gives OB. A single word
// keeps two letters, because one letter reads as an accident at avatar sizes.
export const initialsOf = (name = '') => {
  const words = name.trim().split(/[\s\-'’]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};
