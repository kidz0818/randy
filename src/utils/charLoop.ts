/**
 * Utility functions for character-by-character looping and vertical text segmentation.
 */

export interface CharToken {
  id: string;
  char: string;
  section: 'title' | 'body' | 'sender';
  isPunctuation: boolean;
}

/**
 * Splits greeting text into individual character tokens for giant single-char loop or vertical layout.
 */
export function segmentGreetingToChars(
  title: string,
  body: string,
  sender: string,
  splitLatinWords = false
): CharToken[] {
  const tokens: CharToken[] = [];
  let counter = 0;

  const punctuationRegex = /^[、。！？!?,.·・✨★☆💖👑~〜]$/;

  // Section 1: Title
  for (const ch of Array.from(title.trim())) {
    if (ch === ' ' || ch === '\t') continue;
    tokens.push({
      id: `title-${counter++}`,
      char: ch,
      section: 'title',
      isPunctuation: punctuationRegex.test(ch),
    });
  }

  // Section 2: Body
  for (const ch of Array.from(body.trim())) {
    if (ch === ' ' || ch === '\t') continue;
    tokens.push({
      id: `body-${counter++}`,
      char: ch,
      section: 'body',
      isPunctuation: punctuationRegex.test(ch),
    });
  }

  // Section 3: Sender
  if (splitLatinWords) {
    for (const ch of Array.from(sender.trim())) {
      tokens.push({
        id: `sender-${counter++}`,
        char: ch,
        section: 'sender',
        isPunctuation: punctuationRegex.test(ch),
      });
    }
  } else {
    // If sender contains Latin word + Japanese particle (e.g. "randyseionn より")
    // Keep words or characters clean
    const parts = sender.trim().split(/\s+/);
    for (const part of parts) {
      if (/^[a-zA-Z0-9_]+$/.test(part)) {
        // e.g. "randyseionn"
        tokens.push({
          id: `sender-${counter++}`,
          char: part,
          section: 'sender',
          isPunctuation: false,
        });
      } else {
        for (const ch of Array.from(part)) {
          tokens.push({
            id: `sender-${counter++}`,
            char: ch,
            section: 'sender',
            isPunctuation: punctuationRegex.test(ch),
          });
        }
      }
    }
  }

  return tokens;
}

/**
 * Calculates next looping index.
 */
export function getNextLoopIndex(currentIndex: number, total: number, step = 1): number {
  if (total <= 0) return 0;
  return (((currentIndex + step) % total) + total) % total;
}
