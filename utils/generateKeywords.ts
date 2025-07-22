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
