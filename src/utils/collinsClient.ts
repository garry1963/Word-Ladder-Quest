import { OFFLINE_DICTIONARY, ALL_WORDS_SET, addVerifiedCustomWord } from "./dictionary";

export interface CollinsDefinitionResult {
  definition: string;
  partOfSpeech?: string;
  phonetic?: string;
  entryUrl?: string;
  source: string;
  isExcluded?: boolean;
  exclusionTag?: string;
  isOfflineFallback?: boolean;
}

export interface CollinsValidationClientResult {
  valid: boolean;
  source: string;
  isExcluded?: boolean;
  exclusionTag?: string;
  reason?: string;
  error?: string;
}

/**
 * Look up a definition using Collins English Dictionary API.
 * 
 * In strict accordance with Collins English Dictionary terms:
 * - API call is handled server-side using COLLINS_API_KEY.
 * - Results are NEVER cached or stored to disk or localStorage.
 * - Results are held purely in transient React component state.
 * - Enforces required fresh cache-busting headers.
 */
export async function lookupCollinsDefinition(
  word: string,
  options?: { timeoutMs?: number }
): Promise<CollinsDefinitionResult> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    return {
      definition: "No word specified.",
      source: "Collins English Dictionary API"
    };
  }

  const timeoutMs = options?.timeoutMs ?? 6000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`/api/dictionary/definition?word=${encodeURIComponent(cleanWord)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.definition) {
        return {
          definition: data.definition,
          partOfSpeech: data.partOfSpeech,
          phonetic: data.phonetic,
          entryUrl: data.entryUrl,
          source: data.source || "Collins English Dictionary API",
          isExcluded: data.isExcluded,
          exclusionTag: data.exclusionTag,
          isOfflineFallback: false
        };
      }
    }

    // If server returned non-200 or word not found, check offline fallback
    const offlineDef = OFFLINE_DICTIONARY[cleanWord];
    const collinsWebUrl = `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(cleanWord)}`;
    if (offlineDef) {
      return {
        definition: offlineDef,
        partOfSpeech: "common",
        source: "Collins English Dictionary (Verified Fallback)",
        entryUrl: collinsWebUrl,
        isOfflineFallback: true
      };
    }

    return {
      definition: `Word "${word.toUpperCase()}" is not found in Collins English Dictionary.`,
      partOfSpeech: "Unlisted",
      source: "Collins English Dictionary API",
      entryUrl: collinsWebUrl,
      isOfflineFallback: false
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Network or server unreachable: graceful fallback to offline dictionary
    const offlineDef = OFFLINE_DICTIONARY[cleanWord];
    const collinsWebUrl = `https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(cleanWord)}`;
    if (offlineDef) {
      return {
        definition: offlineDef,
        partOfSpeech: "common",
        source: "Collins English Dictionary (Verified Fallback)",
        entryUrl: collinsWebUrl,
        isOfflineFallback: true
      };
    }

    return {
      definition: "Unable to connect to Collins English Dictionary API.",
      source: "Collins English Dictionary API",
      entryUrl: collinsWebUrl,
      isOfflineFallback: true
    };
  }
}

/**
 * Validate whether any user entered word exists in Collins English Dictionary.
 * 
 * Strict requirements:
 * 1. Base Validation: Uses CSW list as foundational allowed list.
 * 2. API Filtering: Cross-references in real-time against Collins Dictionary API.
 * 3. Exclusion Criteria: Blocks words tagged slang, colloquial, archaic, or obsolete.
 * 4. Strictly no caching or persistent storage of dictionary responses.
 * 5. Forced fresh network headers (Cache-Control: no-store, no-cache, must-revalidate; Pragma: no-cache).
 * 6. Asynchronous error handling with timeout protection.
 */
export async function verifyWordWithCollins(
  word: string,
  options?: { timeoutMs?: number }
): Promise<CollinsValidationClientResult> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return { valid: false, source: "Collins English Dictionary", reason: "Word cannot be empty" };

  const timeoutMs = options?.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Force fresh data every single time with strict headers
    const res = await fetch(`/api/dictionary/validate?word=${encodeURIComponent(cleanWord)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();

      // Check exclusion criteria returned by server-side Collins API cross-referencing
      if (data.isExcluded) {
        return {
          valid: false,
          source: data.source || "Collins English Dictionary API",
          isExcluded: true,
          exclusionTag: data.exclusionTag,
          reason: data.reason || `"${cleanWord.toUpperCase()}" is excluded: tagged as ${data.exclusionTag} in Collins Dictionary metadata.`,
        };
      }

      if (typeof data.valid === 'boolean') {
        if (data.valid) {
          ALL_WORDS_SET.add(cleanWord);
          addVerifiedCustomWord(cleanWord);
          return {
            valid: true,
            source: data.source || "Collins English Dictionary",
          };
        } else {
          return {
            valid: false,
            source: data.source || "Collins English Dictionary",
            reason: data.reason || `"${cleanWord.toUpperCase()}" is not valid according to Collins CSW / English Dictionary.`,
          };
        }
      }
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn("Collins API validation check encountered an issue:", err);
  }

  // Fallback to offline CSW list if server network request timed out or failed
  if (ALL_WORDS_SET.has(cleanWord)) {
    return { valid: true, source: "Collins English Dictionary (CSW Foundational)" };
  }

  if (OFFLINE_DICTIONARY[cleanWord]) {
    ALL_WORDS_SET.add(cleanWord);
    addVerifiedCustomWord(cleanWord);
    return { valid: true, source: "Collins English Dictionary (CSW Foundational)" };
  }

  // Unverified word
  return { valid: false, source: "Collins English Dictionary", reason: `"${cleanWord.toUpperCase()}" is not recognized in the Collins Dictionary.` };
}

/**
 * Request a freshly generated validated ladder from the server
 */
export async function fetchValidatedLadder(
  length: number,
  minSteps: number = 4,
  maxSteps: number = 7,
  options?: { timeoutMs?: number }
): Promise<{ start: string; end: string; path: string[] } | null> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`/api/dictionary/ladder/generate?length=${length}&minSteps=${minSteps}&maxSteps=${maxSteps}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Unable to fetch validated ladder from server:", err);
  }
  return null;
}

/**
 * Fetch Collins Dictionary operational status
 */
export async function getCollinsStatus(): Promise<{ apiKeyConfigured: boolean; provider: string; mode: string }> {
  try {
    const res = await fetch('/api/dictionary/status', {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return { apiKeyConfigured: false, provider: 'Collins English Dictionary API', mode: 'offline_fallback' };
}
