const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPT_TAGS = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;

export function sanitizeText(value: string, maxLength = 4000): string {
  const withoutControl = value.replace(CONTROL_CHARS, "");
  const withoutScripts = withoutControl.replace(SCRIPT_TAGS, "");
  const withoutHtml = withoutScripts.replace(HTML_TAGS, "");
  return withoutHtml.trim().slice(0, maxLength);
}

export function sanitizeEmail(value: string): string {
  return sanitizeText(value, 320).toLowerCase().replace(/\s+/g, "");
}

export function sanitizeUnknown<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item)) as T;
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = sanitizeUnknown(item);
    }
    return output as T;
  }
  return value;
}
