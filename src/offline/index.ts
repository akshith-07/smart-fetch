import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineQueueEntry, RequestConfig } from '../types';
import { isOnline } from '../utils';

interface OfflineDB extends DBSchema {
  queue: {
    key: string;
    value: OfflineQueueEntry & { id: string };
  };
}

export class OfflineQueue {
  private dbName: string;
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  constructor(dbName = 'smart-fetch-offline', _storeName = 'queue') {
    this.dbName = dbName;
    this.setupOnlineListener();
  }

  private async getDB(): Promise<IDBPDatabase<OfflineDB>> {
    if (!this.db) {
      this.db = await openDB<OfflineDB>(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('queue')) {
            db.createObjectStore('queue', { keyPath: 'id' });
          }
        },
      });
    }
    return this.db;
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  async enqueue(config: RequestConfig): Promise<string> {
    const db = await this.getDB();
    const id = this.generateId();

    const entry: OfflineQueueEntry & { id: string } = {
      id,
      config,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.add('queue' as const, entry);
    return id;
  }

  async dequeue(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('queue' as const, id);
  }

  async getAll(): Promise<OfflineQueueEntry[]> {
    const db = await this.getDB();
    return db.getAll('queue' as const);
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear('queue' as const);
  }

  async size(): Promise<number> {
    const db = await this.getDB();
    return db.count('queue' as const);
  }

  onProcessed(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !isOnline()) {
      return;
    }

    this.isProcessing = true;

    try {
      const entries = await this.getAll();

      for (const entry of entries) {
        try {
          // The actual request will be processed by the SmartFetch client
          // We just notify listeners that there are requests to process
          this.notifyListeners();
          await this.dequeue(entry.id);
        } catch (error) {
          // Update retry count
          const db = await this.getDB();
          const updatedEntry = { ...entry, retryCount: entry.retryCount + 1 };

          // Remove from queue if too many retries
          if (updatedEntry.retryCount > 3) {
            await this.dequeue(entry.id);
          } else {
            await db.put('queue' as const, updatedEntry);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
