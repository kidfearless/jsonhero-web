import { customRandom } from "nanoid";
import safeFetch from "./utilities/safeFetch";
import createFromRawXml from "./utilities/xml/createFromRawXml";
import isXML from "./utilities/xml/isXML";

type BaseJsonDocument = {
  id: string;
  title: string;
  readOnly: boolean;
};

export type RawJsonDocument = BaseJsonDocument & {
  type: "raw";
  contents: string;
};

export type UrlJsonDocument = BaseJsonDocument & {
  type: "url";
  url: string;
};

export type CreateJsonOptions = {
  ttl?: number;
  readOnly?: boolean;
  injest?: boolean;
  metadata?: any;
};

export type JSONDocument = RawJsonDocument | UrlJsonDocument;

// Document collection and tracking types
export type DocumentMetadata = {
  id: string;
  title: string;
  type: "raw" | "url";
  createdAt: string;
  updatedAt: string;
  readOnly: boolean;
  level: number; // Level in hierarchy (root = 0, first uploaded = 1, etc.)
};

export type DocumentCollection = {
  version: number;
  documents: DocumentMetadata[];
  lastUpdated: string;
};

// Constant for the collection index key
const COLLECTION_INDEX_KEY = "__DOCUMENTS_COLLECTION__";

export async function createFromUrlOrRawJson(
  urlOrJson: string,
  title?: string
): Promise<JSONDocument | undefined> {
  if (isUrl(urlOrJson)) {
    return createFromUrl(new URL(urlOrJson), title);
  }

  if (isJSON(urlOrJson)) {
    return createFromRawJson("Untitled", urlOrJson);
  }

  // Wrapper for createFromRawJson to handle XML
  // TODO ? change from urlOrJson to urlOrJsonOrXml
  if (isXML(urlOrJson)) {
    return createFromRawXml("Untitled", urlOrJson);
  }
}

export async function createFromUrl(
  url: URL,
  title?: string,
  options?: CreateJsonOptions
): Promise<JSONDocument> {
  if (options?.injest) {
    const response = await safeFetch(url.href);

    if (!response.ok) {
      throw new Error(`Failed to injest ${url.href}`);
    }

    return createFromRawJson(title || url.href, await response.text(), options);
  }

  const docId = createId();

  const doc: JSONDocument = {
    id: docId,
    type: <const>"url",
    url: url.href,
    title: title ?? url.hostname,
    readOnly: options?.readOnly ?? false,
  };

  await DOCUMENTS.put(docId, JSON.stringify(doc), {
    expirationTtl: options?.ttl ?? undefined,
    metadata: options?.metadata ?? undefined,
  });

  // Add to collection index
  await addToCollection(docId, doc.title, "url", doc.readOnly);

  return doc;
}

export async function createFromRawJson(
  filename: string,
  contents: string,
  options?: CreateJsonOptions
): Promise<JSONDocument> {
  const docId = createId();
  const doc: JSONDocument = {
    id: docId,
    type: <const>"raw",
    contents,
    title: filename,
    readOnly: options?.readOnly ?? false,
  };

  JSON.parse(contents);
  await DOCUMENTS.put(docId, JSON.stringify(doc), {
    expirationTtl: options?.ttl ?? undefined,
    metadata: options?.metadata ?? undefined,
  });

  // Add to collection index
  await addToCollection(docId, doc.title, "raw", doc.readOnly);

  return doc;
}

export async function getDocument(
  slug: string
): Promise<JSONDocument | undefined> {
  const doc = await DOCUMENTS.get(slug);

  if (!doc) return;

  return JSON.parse(doc);
}

export async function updateDocument(
  slug: string,
  title: string
): Promise<JSONDocument | undefined> {
  const document = await getDocument(slug);

  if (!document) return;

  const updated = { ...document, title };

  await DOCUMENTS.put(slug, JSON.stringify(updated));

  // Update in collection index
  await updateDocumentInCollection(slug, { title });

  return updated;
}

export async function deleteDocument(slug: string): Promise<void> {
  await DOCUMENTS.delete(slug);
  
  // Remove from collection index
  const collection = await getDocumentCollection();
  const updated = {
    ...collection,
    documents: collection.documents.filter(doc => doc.id !== slug),
    lastUpdated: new Date().toISOString(),
  };
  await DOCUMENTS.put(COLLECTION_INDEX_KEY, JSON.stringify(updated));
}

/**
 * Get the collection index of all documents
 */
export async function getDocumentCollection(): Promise<DocumentCollection> {
  const data = await DOCUMENTS.get(COLLECTION_INDEX_KEY);
  
  if (!data) {
    return {
      version: 1,
      documents: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  
  return JSON.parse(data);
}

/**
 * List all documents with their metadata
 */
export async function listDocuments(): Promise<DocumentMetadata[]> {
  const collection = await getDocumentCollection();
  return collection.documents.sort((a, b) => {
    // Sort by creation date, newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Add a document to the collection index
 */
async function addToCollection(
  docId: string,
  title: string,
  type: "raw" | "url",
  readOnly: boolean
): Promise<void> {
  const collection = await getDocumentCollection();
  
  // Count existing documents to determine level
  const level = collection.documents.length + 1;
  
  const metadata: DocumentMetadata = {
    id: docId,
    title,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readOnly,
    level,
  };
  
  collection.documents.push(metadata);
  collection.lastUpdated = new Date().toISOString();
  
  await DOCUMENTS.put(COLLECTION_INDEX_KEY, JSON.stringify(collection));
}

/**
 * Update a document's metadata in the collection
 */
export async function updateDocumentInCollection(
  slug: string,
  updates: Partial<DocumentMetadata>
): Promise<void> {
  const collection = await getDocumentCollection();
  const docIndex = collection.documents.findIndex(d => d.id === slug);
  
  if (docIndex === -1) return;
  
  collection.documents[docIndex] = {
    ...collection.documents[docIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  collection.lastUpdated = new Date().toISOString();
  await DOCUMENTS.put(COLLECTION_INDEX_KEY, JSON.stringify(collection));
}

function createId(): string {
  const nanoid = customRandom(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    12,
    (bytes: number): Uint8Array => {
      const array = new Uint8Array(bytes);
      crypto.getRandomValues(array);
      return array;
    }
  );
  return nanoid();
}

function isUrl(possibleUrl: string): boolean {
  try {
    new URL(possibleUrl);
    return true;
  } catch {
    return false;
  }
}

function isJSON(possibleJson: string): boolean {
  try {
    JSON.parse(possibleJson);
    return true;
  } catch (e: any) {
    throw new Error(e.message);
  }
}
