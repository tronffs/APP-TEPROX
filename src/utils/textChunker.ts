/**
 * High-Performance Semantic Text Chunker for Unlimited Lengths (1,000,000+ words)
 * Zero memory spikes, linear O(N) scanning, safe for books, novels and massive documents.
 */

export interface TextChunk {
  index: number;
  text: string;
  wordCount: number;
  charCount: number;
  estimatedSec: number;
}

/**
 * Ultra-fast word counter: scans character codes in O(N) time with 0 array allocations.
 * Essential for 1,000,000+ words without UI lag or memory pressure.
 */
export function fastWordCount(text: string): number {
  if (!text) return 0;
  let inWord = false;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // whitespace: space (32), newline (10), carriage return (13), tab (9)
    if (code === 32 || code === 10 || code === 13 || code === 9) {
      inWord = false;
    } else if (!inWord) {
      inWord = true;
      count++;
    }
  }
  return count;
}

/**
 * Splits massive texts into natural semantic reading chunks (default ~160-220 words)
 * Handles paragraph breaks first, then sentence breaks (. ! ?), with fallback for long clauses.
 */
export function splitTextIntoChunks(
  fullText: string,
  targetWordsPerChunk: number = 180
): TextChunk[] {
  if (!fullText || !fullText.trim()) return [];

  // Normalize newlines in O(N)
  const normalized = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double newlines (paragraphs)
  const rawParagraphs = normalized.split(/\n{2,}/);
  const chunkTexts: string[] = [];
  let currentBuffer = '';
  let currentBufferWords = 0;

  for (let p = 0; p < rawParagraphs.length; p++) {
    const para = rawParagraphs[p].trim();
    if (!para) continue;

    const pWords = fastWordCount(para);

    // If paragraph fits in current buffer
    if (currentBufferWords + pWords <= targetWordsPerChunk) {
      currentBuffer = currentBuffer ? `${currentBuffer}\n\n${para}` : para;
      currentBufferWords += pWords;
    } else {
      // Flush current buffer if it has content
      if (currentBuffer) {
        chunkTexts.push(currentBuffer);
        currentBuffer = '';
        currentBufferWords = 0;
      }

      // If the paragraph itself exceeds target, break by sentences
      if (pWords > targetWordsPerChunk) {
        // Fast sentence splitting
        const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
        let sentBuffer = '';
        let sentBufferWords = 0;

        for (let s = 0; s < sentences.length; s++) {
          const sent = sentences[s].trim();
          if (!sent) continue;
          const sWords = fastWordCount(sent);

          if (sentBufferWords + sWords <= targetWordsPerChunk) {
            sentBuffer = sentBuffer ? `${sentBuffer} ${sent}` : sent;
            sentBufferWords += sWords;
          } else {
            if (sentBuffer) {
              chunkTexts.push(sentBuffer);
            }
            sentBuffer = sent;
            sentBufferWords = sWords;
          }
        }

        if (sentBuffer) {
          currentBuffer = sentBuffer;
          currentBufferWords = sentBufferWords;
        }
      } else {
        currentBuffer = para;
        currentBufferWords = pWords;
      }
    }
  }

  if (currentBuffer) {
    chunkTexts.push(currentBuffer);
  }

  // Map to structured TextChunk objects
  return chunkTexts.map((text, idx) => {
    const words = fastWordCount(text);
    return {
      index: idx,
      text,
      wordCount: words,
      charCount: text.length,
      estimatedSec: Math.max(1, Math.round((words / 140) * 60)),
    };
  });
}

/**
 * Generates sample text for testing high-capacity reading (e.g. 1,000, 10,000, or 100,000+ words)
 */
export function generateMassiveSampleText(targetWords: number, lang: 'es' | 'en' = 'es'): string {
  const spanishSentences = [
    'En un rincón apacible de la vasta biblioteca del tiempo, las palabras cobran vida propia a través de la voz.',
    'Cada capítulo desvela nuevos horizontes, personajes memorables y reflexiones sobre la naturaleza del conocimiento.',
    'La tecnología de síntesis de voz permite recorrer millones de palabras sin interrupciones ni fatiga.',
    'Los antiguos filósofos afirmaban que la lectura en voz alta fortalece el entendimiento y el alma.',
    'El lector continuo avanza párrafo tras párrafo con cadencia suave, entonación precisa y claridad absoluta.',
    'A través de los siglos, la narración oral ha sido el puente que une generaciones enteras.',
    'El flujo sonoro no se detiene, transportando ideas complejas con la sencillez de una conversación íntima.',
    'Exploramos relatos de ciencia, misterio, poesía y viajes hacia mundos desconocidos que aguardan en cada línea.'
  ];

  const englishSentences = [
    'In a quiet corner of the endless library of time, words spring into life through the spoken human voice.',
    'Each new chapter reveals vast horizons, unforgettable characters, and deep reflections upon discovery.',
    'Modern voice synthesis technology enables listening through millions of words smoothly and reliably.',
    'Ancient scholars long believed that reading aloud sharpens comprehension and deepens human insight.',
    'The continuous speech reader progresses seamlessly paragraph after paragraph with graceful rhythm.',
    'Across centuries and continents, storytelling has remained the vibrant bridge uniting all generations.',
    'The stream of sound never falters, conveying profound thoughts with the warmth of a personal conversation.',
    'We explore tales of science, adventure, philosophy, and uncharted realms waiting inside each passage.'
  ];

  const pool = lang === 'es' ? spanishSentences : englishSentences;
  const resultParagraphs: string[] = [];
  let currentWords = 0;
  let paragraphIndex = 1;

  while (currentWords < targetWords) {
    const sentenceCount = 5 + Math.floor(Math.random() * 4);
    const sentences: string[] = [];

    for (let i = 0; i < sentenceCount; i++) {
      const sentence = pool[(paragraphIndex * 7 + i) % pool.length];
      sentences.push(sentence);
    }

    const paraHeader = lang === 'es' 
      ? `§ ${paragraphIndex}. Lectura de alta capacidad:`
      : `§ ${paragraphIndex}. High-capacity reading test:`;

    const paragraph = `${paraHeader} ${sentences.join(' ')}`;
    const pWordCount = fastWordCount(paragraph);
    resultParagraphs.push(paragraph);
    currentWords += pWordCount;
    paragraphIndex++;
  }

  return resultParagraphs.join('\n\n');
}
