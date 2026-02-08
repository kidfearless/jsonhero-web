import { Link } from "remix";
import { ChevronRightIcon } from "@heroicons/react/outline";
import { useJsonDoc } from "~/hooks/useJsonDoc";

export function BreadcrumbNav() {
  const { doc } = useJsonDoc();

  return (
    <nav className="flex items-center gap-1 px-4 py-2 bg-slate-800 border-b border-slate-700 text-sm">
      <Link
        to="/documents"
        className="text-indigo-400 hover:text-indigo-300 transition"
      >
        Documents
      </Link>
      <ChevronRightIcon className="w-4 h-4 text-slate-500" />
      <span className="text-slate-300 truncate max-w-sm" title={doc.title}>
        {doc.title}
      </span>
    </nav>
  );
}
