/**
 * List of common Vietnamese sensitive and profanity words
 * (This is a simplified blacklist for moderation demonstration purposes)
 */
const VIETNAMESE_BAD_WORDS = [
  'đm', 'dm', 'đ.m', 'd.m', 'đéo', 'deo', 'cặc', 'cac', 'lồn', 'lon', 
  'chó', 'cho', 'ngu', 'cl', 'vl', 'vcl', 'đĩ', 'di', 'điếm', 'diem',
  'mẹ kiếp', 'me kiep', 'móa', 'moa', 'khốn nạn', 'khon nan', 'bố láo', 'bo lao'
];

/**
 * Normalizes Vietnamese tone marks to make search easier
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
};

/**
 * Checks if a string contains any bad words and returns the detected list
 * Uses boundary checking to prevent false positives (e.g. "ngu" inside "nguồn")
 */
export const detectBadWords = (content: string): string[] => {
  if (!content) return [];
  
  const normalizedContent = normalizeText(content);
  const detected: string[] = [];

  for (const word of VIETNAMESE_BAD_WORDS) {
    const normalizedWord = normalizeText(word);
    
    // Create a regex to match the bad word with word boundary on normalized text
    // Handles Vietnamese characters and standard boundary markers
    const regex = new RegExp(`(?:^|\\s|[.,!?;:/\\'""\\(\\)\\[\\]\\{\\}])${normalizedWord}(?:$|\\s|[.,!?;:/\\'""\\(\\)\\[\\]\\{\\}])`, 'i');
    
    if (regex.test(normalizedContent)) {
      // Find the original matched word in the content for highlighting if needed
      detected.push(word);
    }
  }

  return detected;
};

/**
 * Helper to check if a content is suspected of violation
 */
export const isSuspectedContent = (content: string): boolean => {
  return detectBadWords(content).length > 0;
};
