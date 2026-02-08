import { memo, useMemo } from "react";
import { Link } from "remix";
import {
  DocumentIcon,
  GlobeAltIcon,
} from "@heroicons/react/outline";
import { useDocumentList } from "~/hooks/useDocumentList";
import { useJsonDoc } from "~/hooks/useJsonDoc";
import { Title } from "./Primitives/Title";
import { Body } from "./Primitives/Body";
import { Mono } from "./Primitives/Mono";
import { ChevronRightIcon } from "@heroicons/react/outline";
import { CollectionIcon } from "@heroicons/react/outline";

function DocumentsColumnElement() {
  const { documents } = useDocumentList();
  const { doc } = useJsonDoc();

  const sortedDocs = useMemo(() => {
    return [...documents].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [documents]);

  return (
    <div className="column flex-none border-r-[1px] border-slate-300 w-80 transition dark:border-slate-600">
      <div className="flex items-center text-slate-800 bg-slate-50 mb-[3px] p-2 pb-0 transition dark:bg-slate-900 dark:text-slate-300">
        <CollectionIcon className="h-6 w-6 mr-1" />
        <Title className="text-ellipsis overflow-hidden">Documents</Title>
      </div>
      <div className="overflow-y-auto h-viewerHeight no-scrollbar">
        {sortedDocs.map((d) => (
          <DocumentColumnItem
            key={d.id}
            docMeta={d}
            isHighlighted={d.id === doc.id}
          />
        ))}
        {sortedDocs.length === 0 && (
          <div className="flex items-center justify-center h-20 text-slate-400 dark:text-slate-500">
            <Body>No documents yet</Body>
          </div>
        )}
      </div>
    </div>
  );
}

export const DocumentsColumn = memo(DocumentsColumnElement);

function DocumentColumnItem({
  docMeta,
  isHighlighted,
}: {
  docMeta: { id: string; title: string; type: string; createdAt: string };
  isHighlighted: boolean;
}) {
  const stateStyle = useMemo<string>(() => {
    if (isHighlighted) {
      return "bg-slate-300 text-slate-700 hover:bg-slate-400 hover:bg-opacity-60 transition duration-75 ease-out dark:bg-white dark:bg-opacity-[15%] dark:text-slate-100";
    }
    return "hover:bg-slate-100 transition duration-75 ease-out dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:text-slate-400";
  }, [isHighlighted]);

  const IconComponent = docMeta.type === "url" ? GlobeAltIcon : DocumentIcon;

  const formattedDate = useMemo(() => {
    const date = new Date(docMeta.createdAt);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [docMeta.createdAt]);

  return (
    <Link to={`/j/${docMeta.id}`} prefetch="intent">
      <div
        className={`flex h-9 items-center justify-items-stretch mx-1 px-1 py-1 my-1 rounded-sm ${stateStyle}`}
      >
        <div className="w-4 flex-none flex-col justify-items-center">
          <IconComponent
            className={`h-5 w-5 ${
              isHighlighted
                ? "text-slate-900 dark:text-slate-300"
                : "text-slate-500"
            }`}
          />
        </div>

        <div className="flex flex-grow flex-shrink items-baseline justify-between truncate">
          <Body className="flex-grow flex-shrink-0 pl-3 pr-2">
            {docMeta.title}
          </Body>
          <Mono
            className={`truncate pr-1 transition duration-75 ${
              isHighlighted
                ? "text-gray-500 dark:text-slate-100"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {formattedDate}
          </Mono>
        </div>

        <ChevronRightIcon className="flex-none w-4 h-4 text-gray-400" />
      </div>
    </Link>
  );
}
