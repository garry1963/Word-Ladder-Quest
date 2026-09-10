import { OFFLINE_DICTIONARY } from "./dictionary";

export interface CollinsDefinitionResult {
  definition: string;
  partOfSpeech?: string;
  phonetic?: string;
  entryUrl?: string;
  source: string;
  isOfflineFallback?: boolean;
}

/**
 * Look up a definition using Collins English Dictionary API.
 * 
 * In strict accordance with Collins English Dictionary terms:
 * - API call is handled server-side using COLLINS_API_KEY.
 * - Results are NEVER cached or stored to disk or localStorage.
 * - Results are held purely in transient React component state.
 */
export async function lookupCollinsDefinition(word: string): Promise<CollinsDefinitionResult> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) {
    return {
      definition: "No word specified.",
      source: "Collins English Dictionary API"
    };
  }

  try {
    const res = await fetch(`/api/dictionary/definition?word=${encodeURIComponent(cleanWord)}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.definition) {
        return {
          definition: data.definition,
          partOfSpeech: data.partOfSpeech,
          phonetic: data.phonetic,
          entryUrl: data.entryUrl,
          source: data.source || "Collins English Dictionary API",
          isOfflineFallback: false
        };
      }
    }

    // If server returned non-200 or word not found, check offline fallback
    const offlineDef = OFFLINE_DICTIONARY[cleanWord];
    if (offlineDef) {
      return {
        definition: offlineDef,
        partOfSpeech: "common",
        source: "Collins English Dictionary (Offline Fallback)",
        isOfflineFallback: true
      };
    }

    return {
      definition: `Word "${word.toUpperCase()}" is not found in Collins English Dictionary.`,
      partOfSpeech: "Unlisted",
      source: "Collins English Dictionary API",
      isOfflineFallback: false
    };
  } catch (err) {
    // Network or server unreachable: graceful fallback to offline dictionary
    const offlineDef = OFFLINE_DICTIONARY[cleanWord];
    if (offlineDef) {
      return {
        definition: offlineDef,
        partOfSpeech: "common",
        source: "Collins English Dictionary (Offline Fallback)",
        isOfflineFallback: true
      };
    }

    return {
      definition: "Unable to connect to Collins English Dictionary API.",
      source: "Collins English Dictionary API",
      isOfflineFallback: true
    };
  }
}

/**
 * Validate whether a word exists in Collins English Dictionary.
 */
export async function verifyWordWithCollins(word: string): Promise<{ valid: boolean; source: string }> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return { valid: false, source: "Collins English Dictionary API" };

  try {
    const res = await fetch(`/api/dictionary/validate?word=${encodeURIComponent(cleanWord)}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data.valid === 'boolean') {
        return { valid: data.valid, source: data.source || "Collins English Dictionary API" };
      }
    }
  } catch (err) {
    console.warn("Collins API validation check encountered an issue:", err);
  }

  // Fallback to false if unverified
  return { valid: false, source: "Collins English Dictionary API" };
}

/**
 * Fetch Collins Dictionary operational status
 */
export async function getCollinsStatus(): Promise<{ apiKeyConfigured: boolean; provider: string; mode: string }> {
  try {
    const res = await fetch('/api/dictionary/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return { apiKeyConfigured: false, provider: 'Collins English Dictionary API', mode: 'offline_fallback' };
}
