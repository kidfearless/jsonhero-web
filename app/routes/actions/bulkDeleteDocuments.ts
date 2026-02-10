import { ActionFunction, redirect } from "remix";
import { deleteDocument } from "~/jsonDoc.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const documentIds = formData.getAll("documentIds");

  if (!documentIds || documentIds.length === 0) {
    return { error: "No documents selected" };
  }

  // Delete all selected documents
  await Promise.all(
    documentIds.map((id) => deleteDocument(id.toString()))
  );

  return redirect("/documents");
};
