import { ActionFunction, json, redirect } from "remix";
import invariant from "tiny-invariant";
import { sendEvent } from "~/graphJSON.server";
import { createFromRawJson } from "~/jsonDoc.server";

type CreateFromFileError = {
  filename?: boolean;
  rawJson?: boolean;
};

export const action: ActionFunction = async ({ request, context }) => {
  const formData = await request.formData();
  const filename = formData.get("filename");
  const rawJson = formData.get("rawJson");

  const errors: CreateFromFileError = {};

  if (!filename) errors.filename = true;
  if (!rawJson) errors.rawJson = true;

  if (Object.keys(errors).length) {
    return json(errors, { status: 400 });
  }

  invariant(typeof filename === "string", "filename must be a string");
  invariant(typeof rawJson === "string", "rawJson must be a string");

  try {
    const doc = await createFromRawJson(filename, rawJson);

    const url = new URL(request.url);

    context.waitUntil(
      sendEvent({
        type: "create",
        from: "file",
        id: doc.id,
        source: url.searchParams.get("utm_source") ?? url.hostname,
      })
    );

    // Return JSON with document ID for multiple uploads
    return json({ id: doc.id, success: true, title: doc.title });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
};
