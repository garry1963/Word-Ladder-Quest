/**
 * Collins English Dictionary API Service
 * 
 * Strict compliance with Collins English Dictionary API terms:
 * 1. Authenticated server-side via environment variable COLLINS_API_KEY (keeps private key safe from browser).
 * 2. No third-party AI integration.
 * 3. Strict NO STORAGE / NO CACHING policy (no database, no disk cache, no long-lived memory cache).
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

  if (!apiKey) {
    return {
      found: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      error: "COLLINS_API_KEY environment variable is not configured. Please add COLLINS_API_KEY to your Vercel project environment variables."
    };
  }

  const endpoint = `https://api.collinsdictionary.com/api/v1/dictionaries/english/search/first/?q=${encodeURIComponent(cleanWord)}&format=html`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'accessKey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      return {
        found: false,
        word: cleanWord.toUpperCase(),
        source: "Collins English Dictionary API",
        error: "Word not found in Collins English Dictionary."
      };
    }

    if (!response.ok) {
      return {
        found: false,
        word: cleanWord.toUpperCase(),
        source: "Collins English Dictionary API",
        error: `Collins API returned status ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    const entryHtml = data.entryContent || "";
    const entryUrl = data.entryUrl || `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(cleanWord)}`;
    const parsed = parseCollinsEntryHtml(entryHtml, cleanWord);

    return {
      found: true,
      word: data.entryLabel || cleanWord.toUpperCase(),
      definition: parsed.definition || "Definition available in Collins English Dictionary.",
      partOfSpeech: parsed.partOfSpeech,
      phonetic: parsed.phonetic,
      entryUrl,
      source: "Collins English Dictionary API"
    };
  } catch (err: any) {
    return {
      found: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      error: err?.message || "Failed to communicate with Collins Dictionary API"
    };
  }
}

/**
 * Validate whether a word exists in Collins English Dictionary
 */
export async function validateCollinsWord(word: string): Promise<CollinsValidationResponse> {
  const cleanWord = word.trim().toLowerCase();
  const apiKey = getCollinsApiKey();

  if (!apiKey) {
    return {
      valid: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      error: "COLLINS_API_KEY environment variable is not configured."
    };
  }

  // Use search endpoint or search/first
  const endpoint = `https://api.collinsdictionary.com/api/v1/dictionaries/english/search/first/?q=${encodeURIComponent(cleanWord)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'accessKey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      const matchedWord = (data.entryLabel || cleanWord).toLowerCase();
      // Confirm the match matches or is closely identical to our word
      const isValid = matchedWord === cleanWord || matchedWord.startsWith(cleanWord);
      return {
        valid: isValid,
        word: cleanWord.toUpperCase(),
        source: "Collins English Dictionary API"
      };
    }

    return {
      valid: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API"
    };
  } catch (err: any) {
    return {
      valid: false,
      word: cleanWord.toUpperCase(),
      source: "Collins English Dictionary API",
      error: err?.message || "Error reaching Collins Dictionary API"
    };
  }
}
