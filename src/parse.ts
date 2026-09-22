import type { HighlightOptions, LineRequest } from "jelight";
import { SUPPORTED_LANGUAGES } from "jelight";

type HighlightMode = NonNullable<HighlightOptions["mode"]>;

/** Thrown when a client sends a malformed highlight request (HTTP 400). */
export class InvalidRequestError extends Error {}

/** Validate and normalize an untrusted highlight request body. */
export function parseHighlightRequest(body: unknown): {
  code: string;
  lines: LineRequest[];
  lang: string;
  mode: HighlightMode;
} {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new InvalidRequestError("Request body must be a JSON object");
  }

  const { code, lines, lang, mode } = body as Record<string, unknown>;
  if (typeof code !== "string") {
    throw new InvalidRequestError("code must be a string");
  }
  if (typeof lang !== "string" || !SUPPORTED_LANGUAGES.has(lang)) {
    throw new InvalidRequestError("lang is not supported");
  }
  if (mode !== undefined && mode !== "assist" && mode !== "full") {
    throw new InvalidRequestError('mode must be "assist" or "full"');
  }
  if (!Array.isArray(lines)) {
    throw new InvalidRequestError("lines must be an array");
  }

  const lineNumbers = new Set<number>();
  const requests = lines.map((line, index): LineRequest => {
    if (typeof line !== "object" || line === null || Array.isArray(line)) {
      throw new InvalidRequestError(`lines[${index}] must be an object`);
    }
    const { line: text, lineNumber } = line as Record<string, unknown>;
    if (typeof text !== "string") {
      throw new InvalidRequestError(`lines[${index}].line must be a string`);
    }
    if (!Number.isSafeInteger(lineNumber) || (lineNumber as number) < 0) {
      throw new InvalidRequestError(
        `lines[${index}].lineNumber must be a non-negative integer`
      );
    }
    const validLineNumber = lineNumber as number;
    if (lineNumbers.has(validLineNumber)) {
      throw new InvalidRequestError(`lineNumber ${validLineNumber} is duplicated`);
    }
    lineNumbers.add(validLineNumber);
    return { line: text, lineNumber: validLineNumber };
  });

  return { code, lines: requests, lang, mode: mode ?? "assist" };
}
