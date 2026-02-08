/**
 * Detects whether a string value contains HTML markup.
 * Looks for common HTML indicators like doctype declarations,
 * root-level HTML tags, or a significant number of HTML elements.
 */
export function isHtmlDocument(value: string): boolean {
  if (typeof value !== "string" || value.length < 7) {
    return false;
  }

  const trimmed = value.trimStart();

  // Check for DOCTYPE or <html> at the start
  if (/^<!doctype\s+html/i.test(trimmed)) {
    return true;
  }

  if (/^<html[\s>]/i.test(trimmed)) {
    return true;
  }

  // Check for a combination of structural HTML tags
  const hasHead = /<head[\s>]/i.test(value);
  const hasBody = /<body[\s>]/i.test(value);

  if (hasHead && hasBody) {
    return true;
  }

  // Check for multiple block-level HTML elements (at least 2 distinct tags)
  const blockTags =
    /<(div|p|h[1-6]|section|article|header|footer|nav|main|table|form|ul|ol)[\s>]/gi;
  const matches = value.match(blockTags);

  if (matches && matches.length >= 2) {
    return true;
  }

  return false;
}
