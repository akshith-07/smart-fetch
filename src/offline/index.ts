import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { OfflineQueueEntry, RequestConfig } from '../types';
import { isOnline } from '../utils';

interface OfflineDB extends DBSchema {
  queue: {
    key: string;
    value: OfflineQueueEntry;
  };
}

export class OfflineQueue {
  private dbName: string;
  private storeName: string;
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  constructor(dbName = 'smart-fetch-offline', storeName = 'queue') {
    this.dbName = dbName;
    this.storeName = storeName;
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

    const entry: OfflineQueueEntry = {
      id,
      config,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.add(this.storeName, entry);
    return id;
  }

  async dequeue(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(this.storeName, id);
  }

  async getAll(): Promise<OfflineQueueEntry[]> {
    const db = await this.getDB();
    return db.getAll(this.storeName);
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear(this.storeName);
  }

  async size(): Promise<number> {
    const db = await this.getDB();
    return db.count(this.storeName);
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
          entry.retryCount++;

          // Remove from queue if too many retries
          if (entry.retryCount > 3) {
            await this.dequeue(entry.id);
          } else {
            await db.put(this.storeName, entry);
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
