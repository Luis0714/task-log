type AdoErrorPayload = {
  message?: string;
  Message?: string;
  customProperties?: {
    ErrorMessage?: string;
  };
};

function tryParseJson(raw: string): AdoErrorPayload | null {
  try {
    return JSON.parse(raw) as AdoErrorPayload;
  } catch {
    return null;
  }
}

function extractEmbeddedErrorMessage(raw: string): string | null {
  const match = raw.match(/"ErrorMessage"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (!match?.[1]) return null;
  return match[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim();
}

export type ParsedAdoError = {
  summary: string;
  detail?: string;
};

export function parseAdoError(raw: string): ParsedAdoError {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { summary: "Ocurrió un error desconocido." };
  }

  const separatorIndex = trimmed.indexOf(" — ");
  if (separatorIndex > 0) {
    const prefix = trimmed.slice(0, separatorIndex).trim();
    const suffix = trimmed.slice(separatorIndex + 3).trim();
    const parsedSuffix = parseAdoError(suffix);
    return {
      summary: prefix || parsedSuffix.summary,
      detail: parsedSuffix.detail ?? parsedSuffix.summary,
    };
  }

  const json = tryParseJson(trimmed);
  const adoMessage =
    json?.customProperties?.ErrorMessage?.trim() ||
    json?.message?.trim() ||
    json?.Message?.trim() ||
    extractEmbeddedErrorMessage(trimmed);

  if (adoMessage) {
    const firstSentence = adoMessage.split(/(?<=[.!?])\s+/)[0]?.trim() || adoMessage;
    return {
      summary: firstSentence,
      detail: adoMessage.length > firstSentence.length ? adoMessage : undefined,
    };
  }

  if (trimmed.length <= 240) {
    return { summary: trimmed };
  }

  return {
    summary: `${trimmed.slice(0, 240).trim()}…`,
    detail: trimmed,
  };
}

export function formatAdoErrorMessage(raw: string): string {
  return parseAdoError(raw).summary;
}
