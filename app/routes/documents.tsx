import {
  LoaderFunction,
  MetaFunction,
  useLoaderData,
  Link,
} from "remix";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { listDocuments, DocumentMetadata } from "~/jsonDoc.server";
import { getSession, getRecentDocuments, RecentDocument } from "~/services/toast.server";
import { useState, useMemo } from "react";
import { SearchIcon } from "@heroicons/react/outline";
import clsx from "clsx";

type LoaderData = {
  documents: DocumentMetadata[];
  recentDocuments: RecentDocument[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const documents = await listDocuments();
  const session = await getSession(request.headers.get("cookie"));
  const recentDocuments = getRecentDocuments(session);
  
  return { documents, recentDocuments };
};

export const meta: MetaFunction = () => ({
  title: "My Documents - JSON Hero",
  description: "View and manage all your uploaded JSON documents",
});

export default function DocumentsPage() {
  const { documents, recentDocuments } = useLoaderData<LoaderData>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const filteredAndSortedDocs = useMemo(() => {
    let filtered = documents.filter(doc =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case "newest":
        return filtered.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return filtered.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "name":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return filtered;
    }
  }, [documents, searchQuery, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950">
      <Header />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Documents</h1>
          <p className="text-slate-400">
            {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>

        {/* Recently Viewed Section */}
        {recentDocuments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Recently Viewed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentDocuments.slice(0, 4).map((doc) => {
                const docInfo = documents.find(d => d.id === doc.id);
                return (
                  <Link
                    key={doc.id}
                    to={`/j/${doc.id}`}
                    className="group block p-3 bg-gradient-to-br from-indigo-900 to-indigo-950 border border-indigo-700 rounded-lg hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 transition"
                  >
                    <h3 className="text-white font-semibold truncate group-hover:text-indigo-300 transition text-sm">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-indigo-200 mt-1">
                      Viewed {formatDate(doc.viewedAt)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">All Documents</h2>
          {filteredAndSortedDocs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">
                {documents.length === 0
                  ? "No documents yet. Upload your first JSON file to get started!"
                  : "No documents match your search."}
              </p>
              {documents.length === 0 && (
                <Link
                  to="/new"
                  className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Upload Document
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedDocs.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/j/${doc.id}`}
                  className="group block p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold truncate group-hover:text-indigo-400 transition">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Level {doc.level}
                      </p>
                    </div>
                    <span className="inline-block ml-2 px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded">
                      {doc.type}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <p>Created: {formatDate(doc.createdAt)}</p>
                    {doc.createdAt !== doc.updatedAt && (
                      <p>Updated: {formatDate(doc.updatedAt)}</p>
                    )}
                    {doc.readOnly && (
                      <p className="text-amber-400">🔒 Read-only</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
