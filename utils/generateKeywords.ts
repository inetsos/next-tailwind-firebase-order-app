export function generateKeywords(input: string): string[] {
  const trimmed = input.trim().toLowerCase();
  const keywords = new Set<string>();

  // 전체 prefix 생성 (ex: "김", "김밥", "김밥 ", "김밥 천", ...)
  for (let i = 1; i <= trimmed.length; i++) {
    keywords.add(trimmed.slice(0, i));
  }

  // 단어별 prefix 생성 (ex: "김밥", "천국" 각각에 대해)
  const words = trimmed.split(' ').filter(Boolean);
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.slice(0, i));
    }
  }

  return Array.from(keywords);
}


export function generateFirestoreKeywordIndex(input: string, maxKeywords = 500): string[] {
  const normalized = Array.from(input.trim().toLowerCase()).slice(0, 100).join('');
  const keywords = new Set<string>();

  // 전체 prefix
  for (let i = 1; i <= normalized.length; i++) {
    keywords.add(normalized.slice(0, i));
  }

  // 단어별 prefix + n-gram (2~3자) 생성
  const words = normalized.split(' ').filter(Boolean);
  for (const word of words) {
    // prefix
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.slice(0, i));
    }

    // n-gram (2~3자)
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= word.length - n; i++) {
        keywords.add(word.slice(i, i + n));
      }
    }
  }

  return Array.from(keywords).slice(0, maxKeywords); // 필요 시 제한
}
