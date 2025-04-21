import Dexie, { Table } from 'dexie';

// Define offline document type
interface OfflineDocument {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: ArrayBuffer;
  timestamp: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
  error?: string;
}

// Define search history type
interface SearchHistoryItem {
  id?: number;
  query: string;
  timestamp: Date;
  resultCount: number;
}

// Define annotation draft type
interface AnnotationDraft {
  id?: number;
  documentId: number;
  content: string;
  type: 'TEXT' | 'VOICE';
  timestamp: Date;
  audioData?: ArrayBuffer;
}

// Define PapierKraken database
class PapierKrakenDatabase extends Dexie {
  offlineDocuments!: Table<OfflineDocument, number>;
  searchHistory!: Table<SearchHistoryItem, number>;
  annotationDrafts!: Table<AnnotationDraft, number>;

  constructor() {
    super('PapierKrakenDB');
    
    // Define database schema with version
    this.version(1).stores({
      offlineDocuments: '++id, fileName, syncStatus, timestamp',
      searchHistory: '++id, query, timestamp',
      annotationDrafts: '++id, documentId, timestamp'
    });
  }
}

// Create and export database instance
export const db = new PapierKrakenDatabase();

// Helper function to clear all database data (for testing/logout)
export async function clearDatabaseData() {
  await db.transaction('rw', [db.offlineDocuments, db.searchHistory, db.annotationDrafts], async () => {
    await Promise.all([
      db.offlineDocuments.clear(),
      db.searchHistory.clear(),
      db.annotationDrafts.clear()
    ]);
  });
}
