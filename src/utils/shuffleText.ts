export const MATRIX_CHARS = 'ユノちお誕生日おめでとう素敵な一年になりますようにアイウエオカキクケコサシスセソタチツテトABCDEF0123456789★☆💖✨!@#$%&*';

/**
 * Computes a shuffled text state based on progress (0 to 1).
 * Characters progressively lock from left to right, while trailing characters flicker randomly.
 */
export function getScrambledText(targetText: string, progress: number, seed = 0): string {
  if (progress >= 1) return targetText;
  if (progress <= 0) {
    // Return all random glyphs of same length
    return Array.from({ length: targetText.length }, (_, i) => {
      const char = targetText[i];
      if (char === ' ' || char === '\n') return char;
      return MATRIX_CHARS[(seed + i * 7) % MATRIX_CHARS.length];
    }).join('');
  }

  const chars = targetText.split('');
  const lockIndex = Math.floor(progress * chars.length);

  return chars.map((char, index) => {
    if (char === ' ' || char === '\n') return char;
    if (index < lockIndex) {
      return char;
    }
    // Shuffling character
    const charIndex = Math.abs(Math.sin(seed * 997 + index * 131) * MATRIX_CHARS.length) | 0;
    return MATRIX_CHARS[charIndex % MATRIX_CHARS.length];
  }).join('');
}
