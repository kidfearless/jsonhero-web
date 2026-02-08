# Multi-Document Upload & Tracking Feature Implementation

## Overview
This feature implementation adds the ability to upload and track multiple JSON documents in JSON Hero. Previously, the app focused on viewing a single document. Now, the root-level has been elevated to become "Level 1" in a document hierarchy, allowing users to:

1. Upload and manage multiple JSON documents
2. View all previously uploaded documents
3. Track recently viewed documents
4. See document metadata (creation date, last updated, type, access level)

## Architecture

### Core Components

#### 1. **Document Collection System** ([jsonDoc.server.ts](app/jsonDoc.server.ts))

New types added:
- `DocumentMetadata`: Tracks individual document info (id, title, type, timestamps, level, access)
- `DocumentCollection`: Container for all documents with versioning and last updated timestamp

New functions:
- `getDocumentCollection()`: Retrieves the collection index
- `listDocuments()`: Returns all documents sorted by creation date (newest first)
- `addToCollection()`: Automatically tracks new documents with level assignment
- `updateDocumentInCollection()`: Updates metadata when documents change
- `deleteDocument()`: Extended to remove from collection index

**Level Assignment Logic:**
- Level is calculated as: `count of existing documents + 1`
- Root = Level 1 (first document)
- Each new document increments the level

#### 2. **Session-Based Document Tracking** ([services/toast.server.ts](app/services/toast.server.ts))

New types:
- `RecentDocument`: Tracks id, title, and viewedAt timestamp

New functions:
- `trackRecentDocument()`: Adds document to session's recent list (max 10)
- `getRecentDocuments()`: Retrieves recent documents from session

**Storage Location:**
- Uses existing cookie session storage
- Recent documents persist across page reloads
- Limited to 10 most recent items

#### 3. **Document Dashboard** ([routes/documents.tsx](app/routes/documents.tsx))

Features:
- **Search**: Filter documents by title (case-insensitive)
- **Sort Options**: 
  - Newest First (default)
  - Oldest First
  - Name (A-Z alphabetical)
- **Recently Viewed Section**: Shows last 4 recently viewed documents with view timestamp
- **All Documents Grid**: 3-column responsive grid showing all documents

Document Card Display:
```
┌─────────────────────────────────────┐
│ Document Title                [type]│
│ Level 5                             │
│ Created: Mon, 8 Feb, 1:23 PM        │
│ Updated: Mon, 8 Feb, 2:45 PM        │
│ 🔒 Read-only (if applicable)        │
└─────────────────────────────────────┘
```

#### 4. **Updated Document View** ([routes/j/$id.tsx](app/routes/j/$id.tsx))

Changes:
- Loader fetches document metadata
- Session tracking added via `trackRecentDocument()`
- Metadata passed to component context
- Cookie session headers returned from loader

#### 5. **Enhanced Header Navigation** ([components/Header.tsx](app/components/Header.tsx))

New elements:
- **"Docs" Button**: Links to `/documents` dashboard
- Icon: `CollectionIcon` from @heroicons/react/outline
- Placed alongside existing Delete/New/Share buttons

#### 6. **Breadcrumb Component** ([components/BreadcrumbNav.tsx](app/components/BreadcrumbNav.tsx))

Structure:
```
Documents / Current Document Title
```

Allows quick navigation back to document list.

## Storage Architecture

### KV Namespace Structure

```
Document Keys:
  {docId} -> JSONDocument

Collection Index:
  __DOCUMENTS_COLLECTION__ -> DocumentCollection
  {
    version: 1,
    documents: [
      {
        id: "ABC123...",
        title: "My Data",
        type: "raw",
        createdAt: "2025-02-08T...",
        updatedAt: "2025-02-08T...",
        readOnly: false,
        level: 1
      },
      ...
    ],
    lastUpdated: "2025-02-08T..."
  }
```

### Session Storage Structure

```
Session Cookie:
  recentDocuments: [
    {
      id: "XYZ789...",
      title: "Last Viewed",
      viewedAt: "2025-02-08T..."
    },
    ...
  ]
```

## User Workflows

### Workflow 1: Uploading First Document
1. User navigates to home page
2. Clicks "Upload Document" or uses drag-and-drop
3. System creates document with level = 1
4. Document added to collection index
5. User redirected to `/j/{docId}`
6. Document tracked in recent documents

### Workflow 2: View All Documents
1. User clicks "Docs" button in header
2. Navigates to `/documents`
3. Sees recently viewed documents section
4. Sees all documents grid with search/sort
5. Can click any document to open
6. Opening document updates recent list

### Workflow 3: Manage Multiple Documents
1. User has 5 uploaded documents (Levels 1-5)
2. Visits `/documents` dashboard
3. Searches for specific document
4. Sorts by creation date
5. Clicks to open desired document
6. Recent documents sidebar updates
7. Can navigate back to dashboard via "Docs" button

## File Changes Summary

| File | Changes |
|------|---------|
| `app/jsonDoc.server.ts` | +86 lines: Added collection system, metadata tracking |
| `app/services/toast.server.ts` | +48 lines: Added recent document tracking |
| `app/routes/documents.tsx` | NEW: 190 lines: Dashboard with search/sort |
| `app/routes/j/$id.tsx` | +15 lines: Added metadata fetching, session tracking |
| `app/components/Header.tsx` | +2 lines: Added "Docs" navigation button |
| `app/components/BreadcrumbNav.tsx` | NEW: 18 lines: Breadcrumb navigation (optional) |

## Future Enhancements

Potential features to build on this foundation:

1. **Nested Document Organization**
   - Create collections/folders for documents
   - Hierarchical navigation

2. **User Authentication**
   - Personal document storage per user
   - Share documents with others

3. **Advanced Search**
   - Search by document content
   - Filter by type, date range, size

4. **Document Versioning**
   - Track document changes over time
   - Rollback to previous versions

5. **Analytics**
   - View most-used documents
   - Track document access patterns

6. **Export/Import**
   - Bulk export documents
   - Import document collections

7. **Tagging & Labels**
   - Organize documents with tags
   - Filter by tags

8. **Document Comparison**
   - Compare two documents side-by-side
   - Highlight differences

## Testing Checklist

- [ ] Upload new JSON document → appears in collection
- [ ] Document shows correct level number
- [ ] View `/documents` → shows recently viewed docs
- [ ] Search filters documents by title
- [ ] Sort by "Newest First" works
- [ ] Sort by "Oldest First" works  
- [ ] Sort by "Name (A-Z)" works
- [ ] Click document card → opens document
- [ ] "Docs" button appears in header
- [ ] Click "Docs" button → navigates to dashboard
- [ ] View document → appears in recent list
- [ ] Recently viewed limit (max 10) works
- [ ] Delete document → removed from collection
- [ ] Update document title → collection updates
- [ ] Session persists across page reloads
- [ ] Responsive design on mobile/tablet/desktop

## Database Migration Note

If deploying to existing instance with existing documents:
- Collection index will be empty initially
- On first document upload/creation, new collection index is created
- Existing documents won't appear in `/documents` until re-indexed
- Consider adding migration script to populate index from existing documents

## API Endpoints

### New Routes

- `GET /documents` - Document dashboard
- Existing routes enhanced:
  - `GET /j/$id` - Now tracks recently viewed
  - `POST /actions/createFromFile` - Now tracks in collection
  - `POST /actions/createFromUrl` - Now tracks in collection
  - `POST /api/create.json` - Now tracks in collection
  - `DELETE /j/$id` - Now removes from collection

No new APIs added; uses existing document creation/deletion flow.
