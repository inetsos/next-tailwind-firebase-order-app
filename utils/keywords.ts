export function generateSimplePrefixKeywords(input: string): string[] {
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

export function generateAdvancedSearchKeywords(input: string): string[] {
  // 하드코딩된 설정값들
  const maxKeywords = 300;
  const minNGram = 2;
  const maxNGram = 4;
  const minKeywordLength = 2;
  const stopwords = new Set(['의', '가', '은', '는', '을', '를', '에', '로']);

  const normalized = input.trim().toLowerCase();
  const keywordsFreq = new Map<string, number>();

  // 문자열 전체 길이 제한 (최대 100자)
  const limitedInput = Array.from(normalized).slice(0, 100).join('');

  // 키워드 추가 함수
  function addKeyword(keyword: string) {
    if (
      keyword.length < minKeywordLength || // 너무 짧은 키워드 제외
      stopwords.has(keyword) ||            // 불용어 제외
      keyword.trim() === ''                 // 공백 제거
    ) {
      return;
    }
    keywordsFreq.set(keyword, (keywordsFreq.get(keyword) || 0) + 1);
  }

  // 전체 prefix 생성
  for (let i = 1; i <= limitedInput.length; i++) {
    addKeyword(limitedInput.slice(0, i));
  }

  // 단어별 prefix + n-gram 생성
  const words = limitedInput.split(' ').filter(Boolean);
  for (const word of words) {
    // prefix
    for (let i = 1; i <= word.length; i++) {
      addKeyword(word.slice(0, i));
    }

    // n-gram (minNGram ~ maxNGram)
    for (let n = minNGram; n <= maxNGram; n++) {
      if (n > word.length) continue;
      for (let i = 0; i <= word.length - n; i++) {
        addKeyword(word.slice(i, i + n));
      }
    }
  }

  // 빈도 내림차순 + 길이 오름차순 정렬
  const sortedKeywords = Array.from(keywordsFreq.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].length - b[0].length;
    })
    .map(([keyword]) => keyword);

  // 최대 개수 제한 후 반환
  return sortedKeywords.slice(0, maxKeywords);
}
