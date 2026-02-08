import { ArrowCircleDownIcon, CheckCircleIcon } from "@heroicons/react/outline";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Form, useSubmit } from "remix";
import invariant from "tiny-invariant";

type UploadedDoc = {
  filename: string;
  docId: string;
  success: boolean;
  error?: string;
};

export function DragAndDropForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const filenameInputRef = useRef<HTMLInputElement>(null);
  const rawJsonInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const submit = useSubmit();

  const onDrop = useCallback(
    (acceptedFiles: Array<File>) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      setIsUploading(true);
      setUploadedDocs([]);

      // Process files sequentially
      let processedCount = 0;
      const results: UploadedDoc[] = [];

      acceptedFiles.forEach((file, index) => {
        const reader = new FileReader();

        reader.onabort = () => {
          results.push({
            filename: file.name,
            docId: "",
            success: false,
            error: "File reading was aborted",
          });
          processedCount++;
          if (processedCount === acceptedFiles.length) {
            setUploadedDocs(results);
            setIsUploading(false);
          }
        };

        reader.onerror = () => {
          results.push({
            filename: file.name,
            docId: "",
            success: false,
            error: "File reading has failed",
          });
          processedCount++;
          if (processedCount === acceptedFiles.length) {
            setUploadedDocs(results);
            setIsUploading(false);
          }
        };

        reader.onload = async () => {
          if (reader.result == null) {
            results.push({
              filename: file.name,
              docId: "",
              success: false,
              error: "No data read",
            });
            processedCount++;
            if (processedCount === acceptedFiles.length) {
              setUploadedDocs(results);
              setIsUploading(false);
            }
            return;
          }

          let jsonValue: string | undefined = undefined;

          if (typeof reader.result === "string") {
            jsonValue = reader.result;
          } else {
            const decoder = new TextDecoder("utf-8");
            jsonValue = decoder.decode(reader.result);
          }

          if (!jsonValue) {
            results.push({
              filename: file.name,
              docId: "",
              success: false,
              error: "No JSON content",
            });
            processedCount++;
            if (processedCount === acceptedFiles.length) {
              setUploadedDocs(results);
              setIsUploading(false);
            }
            return;
          }

          // Upload the file
          try {
            const formData = new FormData();
            formData.append("filename", file.name);
            formData.append("rawJson", jsonValue);

            const response = await fetch("/actions/createFromFile", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              results.push({
                filename: file.name,
                docId: data.id || "",
                success: true,
              });
            } else {
              results.push({
                filename: file.name,
                docId: "",
                success: false,
                error: `Upload failed (${response.status})`,
              });
            }
          } catch (error) {
            results.push({
              filename: file.name,
              docId: "",
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }

          processedCount++;
          if (processedCount === acceptedFiles.length) {
            setUploadedDocs(results);
            setIsUploading(false);
          }
        };

        reader.readAsArrayBuffer(file);
      });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: onDrop,
    maxSize: 1024 * 1024 * 1,
    multiple: true,
    accept: "application/json",
  });

  return (
    <div>
      <Form method="post" action="/actions/createFromFile" ref={formRef}>
        <div
          {...getRootProps()}
          className="block min-w-[300px] cursor-pointer rounded-md border-2 border-dashed border-slate-600 bg-slate-900/40 p-4 text-base text-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
        >
          <input {...getInputProps()} />
          <div className="flex items-center">
            <ArrowCircleDownIcon
              className={`mr-3 inline h-6 w-6 ${
                isDragActive ? "text-lime-500" : ""
              }`}
            />
            <p className={`${isDragActive ? "text-lime-500" : ""}`}>
              {isDragActive
                ? "Now drop to upload…"
                : "Drop JSON files here, or click to select"}
            </p>
          </div>

          <input type="hidden" name="filename" ref={filenameInputRef} />
          <input type="hidden" name="rawJson" ref={rawJsonInputRef} />
        </div>
      </Form>

      {/* Upload Results */}
      {uploadedDocs.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-slate-300">
            Upload Results ({uploadedDocs.filter((d) => d.success).length}/{uploadedDocs.length})
          </p>
          {uploadedDocs.map((doc, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded text-sm ${
                doc.success
                  ? "bg-green-900/30 text-green-300"
                  : "bg-red-900/30 text-red-300"
              }`}
            >
              <CheckCircleIcon
                className={`w-4 h-4 flex-shrink-0 ${
                  doc.success ? "text-green-500" : "text-red-500"
                }`}
              />
              <span className="truncate">
                {doc.filename}
                {doc.success ? " ✓" : ` ✗ (${doc.error})`}
              </span>
            </div>
          ))}
          {uploadedDocs.some((d) => d.success) && (
            <p className="text-xs text-slate-400 mt-3">
              Successfully uploaded {uploadedDocs.filter((d) => d.success).length} document
              {uploadedDocs.filter((d) => d.success).length !== 1 ? "s" : ""}. You can
              view them in the <a href="/documents" className="text-indigo-400 hover:text-indigo-300">Documents</a> section.
            </p>
          )}
        </div>
      )}

      {isUploading && (
        <div className="mt-4 text-sm text-slate-400">
          Uploading files...
        </div>
      )}
    </div>
  );
}
