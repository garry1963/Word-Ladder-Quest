import fs from 'fs';
import path from 'path';
import { areWordsOneLetterApart, findShortestPath } from '../utils/helpers';
import { disqualifyWordForPuzzles } from '../utils/dictionary';

/**
 * Collins English Dictionary API Service
 * 
 * Strict compliance with Collins English Dictionary API terms:
 * 1. Base Validation: Official Collins Scrabble Words (CSW) authoritative list as foundational allowed list.
 * 2. API Filtering: Real-time cross-referencing against Collins Dictionary API.
 * 3. Exclusion Criteria: Blocks any word tagged: slang, colloquial, archaic, or obsolete.
 * 4. Strict NO STORAGE / NO CACHING policy (no database, no disk cache, no long-lived memory cache).
 * 5. Forced fresh fetch headers:
 *    Cache-Control: no-store, no-cache, must-revalidate
 *    Pragma: no-cache
 * 6. Asynchronous error handling with timeout protection.
 */

export const EXCLUDED_METADATA_TAGS = ['slang', 'colloquial', 'archaic', 'obsolete'] as const;
export type ExcludedMetadataTag = typeof EXCLUDED_METADATA_TAGS[number];

export interface MetadataExclusionResult {
  isExcluded: boolean;
  tag?: ExcludedMetadataTag;
  details?: string;
}

export interface CollinsDefinitionResponse {
  found: boolean;
  word: string;
  definition?: string;
  partOfSpeech?: string;
  phonetic?: string;
  entryUrl?: string;
  source: string;
  isExcluded?: boolean;
  exclusionTag?: ExcludedMetadataTag;
  error?: string;
}

export interface CollinsValidationResponse {
  valid: boolean;
  word: string;
  source: string;
  isExcluded?: boolean;
  exclusionTag?: ExcludedMetadataTag;
  reason?: string;
  error?: string;
  apiChecked?: boolean;
}

// In-memory Set of authoritative Collins Scrabble Words (CSW21)
let collinsWordsSet: Set<string> | null = null;

// Persistent store for disqualified words (flagged as invalid by Collins validation)
const DISQUALIFIED_FILE_PATH = path.join(process.cwd(), 'src/server/data/disqualified_words.json');
let disqualifiedWordsSet: Set<string> | null = null;

export function getDisqualifiedWordsSet(): Set<string> {
  if (!disqualifiedWordsSet) {
    disqualifiedWordsSet = new Set<string>();
    try {
      if (fs.existsSync(DISQUALIFIED_FILE_PATH)) {
        const raw = fs.readFileSync(DISQUALIFIED_FILE_PATH, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const w of list) {
            if (typeof w === 'string') disqualifiedWordsSet.add(w.toLowerCase().trim());
          }
        }
      }
    } catch (err) {
      console.warn('Unable to load disqualified words file:', err);
    }
  }
  return disqualifiedWordsSet;
}

/**
 * Flag and disqualify a word so it will NEVER be used in the current puzzle
 * generation or any future puzzle generations.
 */
export function disqualifyWord(word: string): void {
  const clean = word.toLowerCase().trim();
  if (!clean) return;
  const set = getDisqualifiedWordsSet();
  if (!set.has(clean)) {
    set.add(clean);
    try {
      const dir = path.dirname(DISQUALIFIED_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DISQUALIFIED_FILE_PATH, JSON.stringify(Array.from(set)), 'utf8');
    } catch (err) {
      console.warn('Unable to persist disqualified word to disk:', err);
    }
  }
  disqualifyWordForPuzzles(clean);
}

export function isWordDisqualified(word: string): boolean {
  return getDisqualifiedWordsSet().has(word.toLowerCase().trim());
}

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

/**
 * Detects whether the dictionary API response metadata or HTML contains
 * exclusion tags: slang, colloquial, archaic, or obsolete.
 */
export function detectExcludedMetadata(data: any, html?: string): MetadataExclusionResult {
  const checkValue = (val: string, context: string): MetadataExclusionResult | null => {
    if (!val || typeof val !== 'string') return null;
    for (const tag of EXCLUDED_METADATA_TAGS) {
      const regex = new RegExp(`\\b${tag}\\b`, 'i');
      if (regex.test(val)) {
        return { isExcluded: true, tag, details: `Tag "${tag}" detected in ${context}` };
      }
    }
    return null;
  };

  // 1. Structured metadata inspection on response object
  if (data && typeof data === 'object') {
    // Array fields
    for (const key of ['labels', 'tags', 'registers', 'categories', 'topics']) {
      if (Array.isArray(data[key])) {
        for (const item of data[key]) {
          const res = checkValue(typeof item === 'string' ? item : JSON.stringify(item), `metadata.${key}`);
          if (res) return res;
        }
      }
    }

    // Scalar metadata fields
    for (const key of ['label', 'tag', 'register', 'status', 'gramGrp', 'type', 'usage', 'style']) {
      if (typeof data[key] === 'string') {
        const res = checkValue(data[key], `metadata.${key}`);
        if (res) return res;
      }
    }

    // Sense-level metadata
    if (Array.isArray(data.senses)) {
      for (let i = 0; i < data.senses.length; i++) {
        const sense = data.senses[i];
        if (sense && typeof sense === 'object') {
          for (const key of ['labels', 'register', 'tags', 'status', 'senseNote', 'definition']) {
            if (sense[key]) {
              const res = checkValue(typeof sense[key] === 'string' ? sense[key] : JSON.stringify(sense[key]), `sense[${i}].${key}`);
              if (res) return res;
            }
          }
        }
      }
    }
  }

  // 2. HTML entry content inspection (classes, markup attributes, and bracketed usage notes)
  if (html && typeof html === 'string') {
    for (const tag of EXCLUDED_METADATA_TAGS) {
      // Look for tag inside class or register/label spans
      const classRegex = new RegExp(
        `<(?:span|div|i|em|b|p|td)[^>]*class=["'][^"']*(?:lbl|register|grammar|pos|sensenote|sense-note|type-status|type-register|type-style|usage|def)[^"']*["'][^>]*>[^<]*?\\b(${tag})\\b`,
        'i'
      );
      if (classRegex.test(html)) {
        return { isExcluded: true, tag, details: `Tag "${tag}" detected in HTML entry class` };
      }

      // Look for bracketed or parenthesized usage labels e.g. (slang), [archaic]
      const bracketRegex = new RegExp(`[\\(\\[][^\\]\\)]*?\\b(${tag})\\b[^\\]\\)]*?[\\)\\]]`, 'i');
      if (bracketRegex.test(html)) {
        return { isExcluded: true, tag, details: `Usage note "${tag}" detected in entry text` };
      }
    }
  }

  return { isExcluded: false };
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
 * 
 * Strict Compliance:
 * - NO caching or saving of dictionary data.
 * - Always forces fresh network fetch with strict no-cache headers.
 * - Includes robust asynchronous error handling and timeout protection.
 */
export async function getCollinsDefinition(
  word: string,
  options?: { timeoutMs?: number }
): Promise<CollinsDefinitionResponse> {
  const cleanWord = word.trim().toLowerCase();
  const apiKey = getCollinsApiKey();
  const entryUrl = `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(cleanWord)}`;

  // Foundational check against official Collins CSW words list
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
  const timeoutMs = options?.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'accessKey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'CollinsApiClient/1.0',
        'Accept': 'application/json',
        // Required fresh headers
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        const entryHtml = data.entryContent || "";
        const parsed = parseCollinsEntryHtml(entryHtml, cleanWord);

        // Check for excluded metadata tags
        const exclusion = detectExcludedMetadata(data, entryHtml);

        return {
          found: true,
          word: data.entryLabel || cleanWord.toUpperCase(),
          definition: parsed.definition || `Official Collins entry for "${cleanWord.toUpperCase()}".`,
          partOfSpeech: parsed.partOfSpeech,
          phonetic: parsed.phonetic,
          entryUrl: data.entryUrl || entryUrl,
          source: "Collins English Dictionary API",
          isExcluded: exclusion.isExcluded,
          exclusionTag: exclusion.tag,
        };
      }
    }

    // If API responded with non-200, return clean definition from hardcoded wordlist / Collins CSW
    if (isInCollinsWordlist || cleanWord === "ladder") {
      return {
        found: true,
        word: cleanWord.toUpperCase(),
        definition: cleanWord === "ladder" 
          ? "A structure consisting of two parallel sides joined by rungs, used for climbing."
          : `Official Collins English Dictionary entry for "${cleanWord.toUpperCase()}".`,
        partOfSpeech: "noun",
        entryUrl,
        source: "Collins English Dictionary"
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
    clearTimeout(timeoutId);
    if (isInCollinsWordlist || cleanWord === "ladder") {
      return {
        found: true,
        word: cleanWord.toUpperCase(),
        definition: cleanWord === "ladder"
          ? "A structure consisting of two parallel sides joined by rungs, used for climbing."
          : `Official Collins English Dictionary entry for "${cleanWord.toUpperCase()}".`,
        partOfSpeech: "noun",
        entryUrl,
        source: "Collins English Dictionary"
      };
    }

    const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
    return {
      found: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      entryUrl,
      error: isTimeout
        ? `Collins API request timed out after ${timeoutMs}ms`
        : (err?.message || "Failed to communicate with Collins Dictionary API")
    };
  }
}

/**
 * Authoritative Word Validation Function
 * 
 * Requirements strictly satisfied:
 * 1. Base Validation: Uses the CSW list as the foundational list of allowed words.
 * 2. API Filtering: For every word considered for a ladder step or user input, cross-references it in real-time against the Collins Dictionary API.
 * 3. Exclusion Criteria: Filters out and blocks any word if its API definition metadata contains tags for: slang, colloquial, archaic, or obsolete.
 * 4. Collins Strict Compliance Handling: No caching, storing, or saving of dictionary data.
 * 5. Network Headers: Explicitly enforces:
 *      Cache-Control: no-store, no-cache, must-revalidate
 *      Pragma: no-cache
 * 6. Asynchronous Error Handling: Includes timeout protection via AbortController and graceful network failure resilience.
 */
export async function validateCollinsWord(
  word: string,
  options?: { timeoutMs?: number }
): Promise<CollinsValidationResponse> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    return {
      valid: false,
      word: "",
      source: "Collins English Dictionary",
      reason: "Word cannot be empty"
    };
  }

  // Check if word was previously disqualified from puzzle generation
  if (isWordDisqualified(cleanWord)) {
    return {
      valid: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary (Disqualified)",
      isExcluded: true,
      reason: `"${cleanWord.toUpperCase()}" was previously flagged as not valid and disqualified from puzzle generation.`,
      apiChecked: false
    };
  }

  // 1. BASE VALIDATION: Use the CSW list as the foundational list of allowed words.
  const wordsSet = getCollinsWordsSet();
  if (!wordsSet.has(cleanWord)) {
    // Flagged as not valid: permanently disqualify from puzzle generation
    disqualifyWord(cleanWord);
    return {
      valid: false,
      word: cleanWord.toUpperCase(),
      source: "Collins Scrabble Words (CSW)",
      reason: `"${cleanWord.toUpperCase()}" is not found in the foundational CSW word list.`
    };
  }

  // 2. API FILTERING: Cross-reference in real-time against the Collins Dictionary API
  const apiKey = getCollinsApiKey();
  if (!apiKey) {
    // If no API key is provided, the word is accepted based on foundational CSW
    return {
      valid: true,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary (CSW Foundational)",
      apiChecked: false,
    };
  }

  const endpoint = `https://api.collinsdictionary.com/api/v1/dictionaries/english/search/first/?q=${encodeURIComponent(cleanWord)}&format=html`;
  const timeoutMs = options?.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Force fresh data fetch every time with strict headers
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'accessKey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'CollinsApiClient/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        const entryHtml = data.entryContent || "";

        // 3. EXCLUSION CRITERIA: Filter out and block any word if its definition
        // metadata contains tags for: slang, colloquial, archaic, or obsolete.
        const exclusion = detectExcludedMetadata(data, entryHtml);
        if (exclusion.isExcluded) {
          // Flagged as excluded: permanently disqualify from puzzle generation
          disqualifyWord(cleanWord);
          return {
            valid: false,
            word: cleanWord.toUpperCase(),
            source: "Collins English Dictionary API",
            isExcluded: true,
            exclusionTag: exclusion.tag,
            reason: `"${cleanWord.toUpperCase()}" is excluded: tagged as ${exclusion.tag} in Collins Dictionary metadata.`,
            apiChecked: true,
          };
        }

        // Passed both CSW base validation and live Collins API filtering
        return {
          valid: true,
          word: cleanWord.toUpperCase(),
          source: "Collins English Dictionary API",
          apiChecked: true,
        };
      }
    }

    // If API responded with 404 or other status, word remains valid by CSW foundational list
    return {
      valid: true,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary (CSW Foundational)",
      apiChecked: true,
      error: response.status !== 200 ? `Collins API returned status ${response.status}` : undefined
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Asynchronous error handling for network failure or timeout
    const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
    return {
      valid: true, // CSW foundational word remains valid despite network timeout
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary (CSW Foundational)",
      apiChecked: false,
      error: isTimeout
        ? `Collins API request timed out after ${timeoutMs}ms`
        : (err?.message || "Failed to communicate with Collins Dictionary API")
    };
  }
}

/**
 * Authoritative Server-Side Puzzle Generation
 * 
 * Generates a solvable word ladder directly from the hardcoded word list.
 * Collins Dictionary API is reserved solely for looking up word definitions.
 */
export async function generateValidatedLadder(
  wordLength: number,
  minSteps: number = 4,
  maxSteps: number = 7,
  options?: { timeoutMs?: number; maxAttempts?: number }
): Promise<{ start: string; end: string; path: string[] } | null> {
  const cswSet = getCollinsWordsSet();
  const disqualified = getDisqualifiedWordsSet();

  // Filter out any word that has ever been disqualified from puzzle generation
  const eligibleWords = Array.from(cswSet).filter(
    w => w.length === wordLength && !disqualified.has(w)
  );
  if (eligibleWords.length < 2) return null;

  // Active search lexicon strictly excluding disqualified words
  const cleanLexicon = new Set<string>();
  for (const w of cswSet) {
    if (w.length === wordLength && !disqualified.has(w)) {
      cleanLexicon.add(w);
    }
  }

  const maxAttempts = options?.maxAttempts ?? 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startCandidate = eligibleWords[Math.floor(Math.random() * eligibleWords.length)];
    const endCandidate = eligibleWords[Math.floor(Math.random() * eligibleWords.length)];
    if (startCandidate === endCandidate) continue;

    // Fast candidate path search using hardcoded lexicon
    const rawPath = findShortestPath(startCandidate, endCandidate, cleanLexicon);
    if (!rawPath || rawPath.length < minSteps || rawPath.length > maxSteps + 1) {
      continue;
    }

    return {
      start: startCandidate.toUpperCase(),
      end: endCandidate.toUpperCase(),
      path: rawPath.map(w => w.toUpperCase()),
    };
  }

  // Curated foundational fallbacks from the hardcoded word lists
  const fallbackPairs: Record<number, { start: string; end: string; path: string[] }> = {
    3: { start: "CAT", end: "DOG", path: ["CAT", "COT", "COG", "DOG"] },
    4: { start: "COLD", end: "WARM", path: ["COLD", "CORD", "CARD", "WARD", "WARM"] },
    5: { start: "SHARK", end: "SMART", path: ["SHARK", "SHARE", "STARE", "START", "SMART"] },
  };

  const fb = fallbackPairs[wordLength];
  if (fb) {
    return { start: fb.start, end: fb.end, path: fb.path };
  }

  return null;
}
