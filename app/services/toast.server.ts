import { createCookieSessionStorage, Session } from "remix";

export type ToastMessage = {
  message: string;
  title: string;
  type: "success" | "error";
  id: string;
};

export type RecentDocument = {
  id: string;
  title: string;
  viewedAt: string;
};

const ONE_YEAR = 1000 * 60 * 60 * 24 * 365;

export const { commitSession, getSession } = createCookieSessionStorage({
  cookie: {
    name: "__message",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR,
    secrets: [SESSION_SECRET],
    secure: true,
  },
});

export function setSuccessMessage(
  session: Session,
  message: string,
  title: string
) {
  session.flash("toastMessage", {
    message,
    title,
    type: "success",
    id: crypto.randomUUID(),
  });
}

export function setErrorMessage(
  session: Session,
  message: string,
  title: string
) {
  session.flash("toastMessage", {
    message,
    title,
    type: "error",
    id: crypto.randomUUID(),
  });
}

/**
 * Track a recently viewed document in the session
 */
export function trackRecentDocument(
  session: Session,
  docId: string,
  title: string
) {
  const recent = (session.get("recentDocuments") as RecentDocument[]) || [];
  
  // Remove if already exists
  const filtered = recent.filter(d => d.id !== docId);
  
  // Add to front with current timestamp
  const updated = [
    {
      id: docId,
      title,
      viewedAt: new Date().toISOString(),
    },
    ...filtered,
  ].slice(0, 10); // Keep only last 10
  
  session.set("recentDocuments", updated);
}

/**
 * Get recently viewed documents from session
 */
export function getRecentDocuments(session: Session): RecentDocument[] {
  return (session.get("recentDocuments") as RecentDocument[]) || [];
}
