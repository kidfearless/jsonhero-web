import {
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilAltIcon,
  CheckIcon,
} from "@heroicons/react/outline";
import { ColumnViewNode } from "~/useColumnView";
import { Body } from "./Primitives/Body";
import {
  useJsonColumnViewAPI,
  useJsonColumnViewState,
} from "../hooks/useJsonColumnView";
import { useHotkeys } from "react-hotkeys-hook";
import { memo, useEffect, useRef, useState } from "react";
import { useJson } from '~/hooks/useJson';
import { JSONHeroPath } from '@jsonhero/path';
import { evaluateJSONPath, isJSONPathExpression } from '~/utilities/jsonpath';

export function PathBar() {
  const [isEditable, setIsEditable] = useState(false);
  const { selectedNodes, highlightedNodeId } = useJsonColumnViewState();
  const { goToNodeId } = useJsonColumnViewAPI();
  const [json] = useJson();

  if (isEditable) {
    return (
      <PathBarText
        selectedNodes={selectedNodes}
        onConfirm={(newPath) => {
          setIsEditable(false);
          const heroPath = new JSONHeroPath(newPath);
          const node = heroPath.first(json);
          if (node) {
            goToNodeId(newPath, 'pathBar');
          }
        }}
      />
    );
  }

  return (
    <PathBarLink
      selectedNodes={selectedNodes}
      highlightedNodeId={highlightedNodeId}
      enableEdit={() => setIsEditable(true)}
    />
  );
}

export function PathBarText({ selectedNodes, onConfirm }: { selectedNodes: ColumnViewNode[], onConfirm: (newPath: string) => void; }) {
  const [path, setPath] = useState('');
  const [jsonPathResults, setJsonPathResults] = useState<Array<{ path: string; value: unknown; pointer: string }>>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const [json] = useJson();

  useEffect(() => {
    setPath(selectedNodes.at(-1)?.id || '');
  }, [selectedNodes]);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);

  // Evaluate JSONPath expressions as the user types
  useEffect(() => {
    if (isJSONPathExpression(path)) {
      const results = evaluateJSONPath(json, path);
      setJsonPathResults(results);
      setSelectedResultIndex(0);
    } else {
      setJsonPathResults([]);
      setSelectedResultIndex(0);
    }
  }, [path, json]);

  const handleSubmit = () => {
    if (jsonPathResults.length > 0) {
      // Use the selected result from JSONPath query
      const result = jsonPathResults[selectedResultIndex];
      onConfirm(result.pointer);
    } else {
      // Regular path navigation
      onConfirm(path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (jsonPathResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedResultIndex((prev) => 
          Math.min(prev + 1, jsonPathResults.length - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedResultIndex((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          handleSubmit();
          e.preventDefault();
        }}
        className="flex overflow-x-hidden items-center bg-slate-300 dark:bg-slate-700 rounded-sm"
      >
        <label className="grow">
          <input
            ref={ref}
            className={
              "w-full border-none outline-none text-ellipsis text-base px-2 py-0 rounded-sm bg-transparent dark:text-slate-200"
            }
            style={{ boxShadow: 'none' }}
            type="text"
            name="title"
            spellCheck="false"
            placeholder="Path or JSONPath query (e.g., $.users[*].name)"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </label>
        <button type="submit" className="flex ml-auto justify-center items-center w-[26px] h-[26px] hover:bg-slate-400 dark:text-slate-400 dark:hover:bg-white dark:hover:bg-opacity-[10%]">
          <CheckIcon className='h-5' />
        </button>
      </form>
      
      {jsonPathResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="p-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            {jsonPathResults.length} result{jsonPathResults.length !== 1 ? 's' : ''} found
          </div>
          {jsonPathResults.map((result, index) => (
            <div
              key={index}
              className={`px-3 py-2 cursor-pointer border-b border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                index === selectedResultIndex ? 'bg-slate-100 dark:bg-slate-700' : ''
              }`}
              onClick={() => {
                setSelectedResultIndex(index);
                handleSubmit();
              }}
            >
              <div className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                {result.pointer}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                {typeof result.value === 'object' 
                  ? JSON.stringify(result.value).substring(0, 100) + '...'
                  : String(result.value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type PathBarLinkProps = {
  selectedNodes: ColumnViewNode[];
  highlightedNodeId?: string;
  enableEdit: () => void;
};

export function PathBarLink({
  selectedNodes,
  highlightedNodeId,
  enableEdit,
}: PathBarLinkProps) {
  const { goToNodeId } = useJsonColumnViewAPI();

  return (
    <div
      className="flex flex-shrink-0 flex-grow-0 overflow-x-hidden"
      onClick={enableEdit}
    >
      {selectedNodes.map((node, index) => {
        return (
          <PathBarItem
            key={index}
            node={node}
            isHighlighted={highlightedNodeId === node.id}
            onClick={(id) => goToNodeId(id, "pathBar")}
            isLast={index == selectedNodes.length - 1}
          />
        );
      })}
      <button
        className="flex ml-auto justify-center items-center w-[26px] h-[26px] hover:bg-slate-300 dark:text-slate-400 dark:hover:bg-white dark:hover:bg-opacity-[10%]"
        onClick={(e) => {
          e.stopPropagation();
          enableEdit();
        }}>
        <PencilAltIcon className='h-5' />
      </button>
    </div>
  );
}

export function PathHistoryControls() {
  const { canGoBack, canGoForward } = useJsonColumnViewState();
  const { goBack, goForward } = useJsonColumnViewAPI();

  useHotkeys(
    "[",
    () => {
      goBack();
    },
    [goBack]
  );

  useHotkeys(
    "]",
    () => {
      goForward();
    },
    [goForward]
  );

  return (
    <div className="flex h-full">
      <button
        className="flex justify-center items-center w-[26px] h-[26px] disabled:text-slate-400 disabled:text-opacity-50 text-slate-700 hover:bg-slate-300 hover:disabled:bg-transparent rounded-sm transition dark:disabled:text-slate-700 dark:text-slate-400 dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:hover:disabled:bg-transparent"
        disabled={!canGoBack}
        onClick={goBack}
      >
        <ArrowLeftIcon className="w-5 h-6" />
      </button>
      <button
        className="flex justify-center items-center w-[26px] h-[26px] disabled:text-slate-400 disabled:text-opacity-50 text-slate-700 hover:bg-slate-300 hover:disabled:bg-transparent rounded-sm transition dark:disabled:text-slate-700 dark:text-slate-400 dark:hover:bg-white dark:hover:bg-opacity-[5%] dark:hover:disabled:bg-transparent"
        disabled={!canGoForward}
        onClick={goForward}
      >
        <ArrowRightIcon className="w-5 h-6" />
      </button>
    </div>
  );
}

function PathBarElement({
  node,
  isHighlighted,
  onClick,
  isLast,
}: {
  node: ColumnViewNode;
  isHighlighted: boolean;
  onClick?: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <div
      className="flex items-center min-w-0"
      style={{
        flexShrink: 1,
      }}
    >
      <div
        className={`flex items-center hover:cursor-pointer min-w-0 transition ${isHighlighted
          ? "text-slate-700 bg-slate-300 px-2 py-[3px] rounded-sm dark:text-white dark:bg-slate-700"
          : "hover:bg-slate-300 px-2 py-[3px] rounded-sm transition dark:hover:bg-white dark:hover:bg-opacity-[5%]"
          }`}
        style={{
          flexShrink: 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(node.id);
        }}
      >
        <div className="w-4 flex-shrink-[0.5] flex-grow-0 flex-col justify-items-center whitespace-nowrap overflow-x-hidden transition dark:text-slate-400">
          {node.icon && <node.icon className="h-3 w-3" />}
        </div>
        <Body className="flex-shrink flex-grow-0 whitespace-nowrap overflow-x-hidden text-ellipsis transition dark:text-slate-400">
          {node.title}
        </Body>
      </div>

      {isLast ? (
        <></>
      ) : (
        <ChevronRightIcon className="flex-grow-0 flex-shrink-[0.5] w-4 h-4 text-slate-400 whitespace-nowrap overflow-x-hidden" />
      )}
    </div>
  );
}

const PathBarItem = memo(PathBarElement);
