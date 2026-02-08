import { useContext } from "react";
import { JSONDocument } from "~/jsonDoc.server";
import { JsonDocContext } from "./useJsonDoc";

type JsonDocType = {
  doc?: JSONDocument;
  path?: string;
  minimal?: boolean;
};

/**
 * Safe version of useJsonDoc that returns empty object if not in JsonDocProvider context
 * Used in components that may or may not be inside a document view (like Header on /documents)
 */
export function useOptionalJsonDoc(): JsonDocType {
  const context = useContext(JsonDocContext);
  return context || {};
}
