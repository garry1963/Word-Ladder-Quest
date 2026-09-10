import fs from 'fs';
import path from 'path';

/**
 * Collins English Dictionary API Service
 * 
 * Strict compliance with Collins English Dictionary API terms:
 * 1. Authenticated server-side via environment variable COLLINS_API_KEY (keeps private key safe from browser).
 * 2. No third-party AI integration.
 * 3. Strict NO STORAGE / NO CACHING policy (no database, no disk cache, no long-lived memory cache).
 * 4. Incorporates official Collins Scrabble Words (CSW) authoritative list for comprehensive validation.
 */

export interface CollinsDefinitionResponse {
  found: boolean;
  word: string;
  definition?: string;
  partOfSpeech?: string;
  phonetic?: string;
  entryUrl?: string;
  source: string;
  error?: string;
}

export interface CollinsValidationResponse {
  valid: boolean;
  word: string;
  source: string;
  error?: string;
}

// In-memory Set of authoritative Collins Scrabble Words (CSW21)
let collinsWordsSet: Set<string> | null = null;

export function getCollinsWordsSet(): Set<string> {
  if (!collinsWordsSet) {
    collinsWordsSet = new Set<string>();
    try {
      const candidates = [
        path.join(process.cwd(), 'src/server/data/collins_csw21.txt'),
        path.join(process.cwd(), 'dist/collins_csw21.txt'),
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          const lines = content.split(/\r?\n/);
          for (let i = 0; i < lines.length; i++) {
            const w = lines[i].trim().toLowerCase();
            if (w) collinsWordsSet.add(w);
          }
          break;
        }
      }
    } catch (err) {
      console.warn('Unable to load server-side collins_csw21.txt:', err);
    }
  }
  return collinsWordsSet;
}

export function getCollinsApiKey(): string | null {
  return (
    process.env.COLLINS_API_KEY ||
    process.env.COLLINS_ENGLISH_DICTIONARY_API_KEY ||
    process.env.COLLINS_KEY ||
    null
  );
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCollinsEntryHtml(html: string, word: string) {
  let phonetic: string | undefined;
  let partOfSpeech: string | undefined;
  let definition: string | undefined;

  // Extract phonetic pronunciation (e.g. <span class="pron"> or <span class="ipa">)
  const pronMatch = html.match(/<span[^>]*class=["'][^"']*(?:pron|ipa)[^"']*["'][^>]*>(.*?)<\/span>/i);
  if (pronMatch) {
    const raw = stripHtmlTags(pronMatch[1]);
    if (raw) phonetic = raw.startsWith('/') || raw.startsWith('[') ? raw : `/${raw}/`;
  }

  // Extract part of speech (e.g. <span class="pos">, <span class="gramGrp">)
  const posMatch = html.match(/<span[^>]*class=["'][^"']*(?:pos|gramGrp)[^"']*["'][^>]*>(.*?)<\/span>/i);
  if (posMatch) {
    const raw = stripHtmlTags(posMatch[1]);
    if (raw) partOfSpeech = raw;
  }

  // Extract definition text from <span class="def">, <div class="def">, or <span class="sense">
  const defMatch = html.match(/<(?:span|div|p)[^>]*class=["'][^"']*\bdef\b[^"']*["'][^>]*>(.*?)<\/(?:span|div|p)>/i) ||
                    html.match(/<(?:span|div|p)[^>]*class=["'][^"']*\bsense\b[^"']*["'][^>]*>(.*?)<\/(?:span|div|p)>/i);
  if (defMatch) {
    const raw = stripHtmlTags(defMatch[1]);
    if (raw) definition = raw;
  }

  // Fallback if class names differ: extract first meaningful descriptive sentence from entry content
  if (!definition) {
    const cleanText = stripHtmlTags(html);
    if (cleanText) {
      // Avoid returning just the word title
      const textWithoutWord = cleanText.replace(new RegExp(`^${word}\\b`, 'i'), '').trim();
      definition = textWithoutWord.length > 200 
        ? textWithoutWord.slice(0, 200) + '...' 
        : textWithoutWord || cleanText;
    }
  }

  return { phonetic, partOfSpeech, definition };
}

/**
 * Fetch a definition directly from Collins English Dictionary API
 */
export async function getCollinsDefinition(word: string): Promise<CollinsDefinitionResponse> {
  const cleanWord = word.trim().toLowerCase();
  const apiKey = getCollinsApiKey();
  const entryUrl = `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(cleanWord)}`;

  // Check official Collins words list
  const wordsSet = getCollinsWordsSet();
  const isInCollinsWordlist = wordsSet.has(cleanWord);

  if (!apiKey) {
    return {
      found: isInCollinsWordlist,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary",
      entryUrl,
      definition: isInCollinsWordlist ? `Official Collins English Dictionary entry for "${cleanWord.toUpperCase()}".` : undefined,
      error: !isInCollinsWordlist ? "Word not found in Collins English Dictionary." : undefined
    };
  }

  const endpoint = `https://api.collinsdictionary.com/api/v1/dictionaries/english/search/first/?q=${encodeURIComponent(cleanWord)}&format=html`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'accessKey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'CollinsApiClient/1.0',
        'Accept': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      const entryHtml = data.entryContent || "";
      const parsed = parseCollinsEntryHtml(entryHtml, cleanWord);

      return {
        found: true,
        word: data.entryLabel || cleanWord.toUpperCase(),
        definition: parsed.definition || `Official Collins entry for "${cleanWord.toUpperCase()}".`,
        partOfSpeech: parsed.partOfSpeech,
        phonetic: parsed.phonetic,
        entryUrl: data.entryUrl || entryUrl,
        source: "Collins English Dictionary API"
      };
    }

    // If API returned 404 or non-200, check official Collins dictionary set
    if (isInCollinsWordlist) {
      return {
        found: true,
        word: cleanWord.toUpperCase(),
        definition: `Official Collins English Dictionary verified word.`,
        entryUrl,
        source: "Collins English Dictionary (CSW)"
      };
    }

    return {
      found: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      entryUrl,
      error: response.status === 404 ? "Word not found in Collins English Dictionary." : `Collins API returned status ${response.status}`
    };
  } catch (err: any) {
    if (isInCollinsWordlist) {
      return {
        found: true,
        word: cleanWord.toUpperCase(),
        definition: `Official Collins English Dictionary verified word.`,
        entryUrl,
        source: "Collins English Dictionary (CSW)"
      };
    }

    return {
      found: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      entryUrl,
      error: err?.message || "Failed to communicate with Collins Dictionary API"
    };
  }
}

/**
 * Validate whether any user entered word exists in Collins English Dictionary
 */
export async function validateCollinsWord(word: string): Promise<CollinsValidationResponse> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    return {
      valid: false,
      word: "",
      source: "Collins English Dictionary"
    };
  }

  // 1. Authoritative Collins Scrabble Words (CSW) check
  const wordsSet = getCollinsWordsSet();
  if (wordsSet.has(cleanWord)) {
    return {
      valid: true,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary (Official CSW)"
    };
  }

  // 2. Query Collins Dictionary API if API key is present
  const apiKey = getCollinsApiKey();
  if (apiKey) {
    const endpoint = `https://api.collinsdictionary.com/api/v1/dictionaries/english/search/first/?q=${encodeURIComponent(cleanWord)}&format=html`;
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'accessKey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'CollinsApiClient/1.0',
          'Accept': 'application/json',
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        const matchedWord = (data.entryLabel || cleanWord).toLowerCase();
        const isValid = matchedWord === cleanWord || matchedWord.startsWith(cleanWord);
        if (isValid) {
          return {
            valid: true,
            word: cleanWord.toUpperCase(),
            source: "Collins English Dictionary API"
          };
        }
      }
    } catch {
      // Ignore API network errors and continue
    }
  }

  return {
    valid: false,
    word: cleanWord.toUpperCase(),
    source: "Collins English Dictionary"
  };
}
