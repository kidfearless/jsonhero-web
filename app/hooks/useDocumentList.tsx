import { createContext, ReactNode, useContext } from "react";
import { DocumentMetadata } from "~/jsonDoc.server";

type DocumentListContextType = {
  documents: DocumentMetadata[];
};

const DocumentListContext = createContext<DocumentListContextType>({
  documents: [],
});

export function DocumentListProvider({
  children,
  documents,
}: {
  children: ReactNode;
  documents: DocumentMetadata[];
}) {
  return (
    <DocumentListContext.Provider value={{ documents }}>
      {children}
    </DocumentListContext.Provider>
  );
}

export function useDocumentList(): DocumentListContextType {
  return useContext(DocumentListContext);
}
