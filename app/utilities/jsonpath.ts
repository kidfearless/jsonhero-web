import { JSONPath } from "jsonpath-plus";

export type JSONPathResult = {
  path: string;
  value: unknown;
  pointer: string;
};

/**
 * Evaluates a JSONPath expression against a JSON document.
 * Returns an array of matching results with their paths.
 */
export function evaluateJSONPath(
  json: unknown,
  expression: string
): JSONPathResult[] {
  try {
    // Check if the expression looks like a JSONPath query (starts with $ or contains brackets/operators)
    if (!isJSONPathExpression(expression)) {
      return [];
    }

    const results = JSONPath({
      path: expression,
      json: json as object,
      resultType: "all",
    }) as Array<{ path: (string | number)[]; value: any }>;

    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((result) => ({
      path: result.path.join("."),
      value: result.value,
      pointer: pathArrayToPointer(result.path),
    }));
  } catch (error) {
    // Invalid JSONPath expression
    return [];
  }
}

/**
 * Checks if a string looks like a JSONPath expression.
 */
export function isJSONPathExpression(expression: string): boolean {
  if (!expression || typeof expression !== "string") {
    return false;
  }

  const trimmed = expression.trim();

  // JSONPath expressions typically start with $ or contain special operators
  if (trimmed.startsWith("$")) {
    return true;
  }

  // Check for common JSONPath operators
  const jsonPathOperators = [
    "[",
    "]",
    "..",
    "*",
    "?(",
    "@",
  ];

  return jsonPathOperators.some((op) => trimmed.includes(op));
}

/**
 * Converts a JSONPath array notation to a JSON Pointer string.
 * JSONPath uses ["$", "users", "0", "name"] format
 * We convert to "$users.0.name" format used by @jsonhero/path
 */
function pathArrayToPointer(pathArray: (string | number)[]): string {
  if (!Array.isArray(pathArray) || pathArray.length === 0) {
    return "$";
  }

  // Remove the leading "$" from the array
  const parts = pathArray.slice(1);

  if (parts.length === 0) {
    return "$";
  }

  return "$" + parts.map((part) => `.${part}`).join("");
}
