import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CacheEntry, CacheStrategy } from '../types';

interface CacheDB extends DBSchema {
  cache: {
    key: string;
    value: CacheEntry;
  };
}

export interface CacheAdapter {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, value: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map();
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      await this.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  async set<T>(key: string, value: CacheEntry<T>): Promise<void> {
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

export class LocalStorageCacheAdapter implements CacheAdapter {
  private prefix: string;

  constructor(prefix = 'smart-fetch-cache:') {
    this.prefix = prefix;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry = JSON.parse(item) as CacheEntry<T>;

      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      // Handle quota exceeded errors
      console.warn('LocalStorage quota exceeded, clearing old entries');
      await this.clear();
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

export class IndexedDBCacheAdapter implements CacheAdapter {
  private dbName: string;
  private storeName: string;
  private db: IDBPDatabase<CacheDB> | null = null;

  constructor(dbName = 'smart-fetch-cache', storeName = 'cache') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async getDB(): Promise<IDBPDatabase<CacheDB>> {
    if (!this.db) {
      this.db = await openDB<CacheDB>(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        },
      });
    }
    return this.db;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const db = await this.getDB();
      const entry = await db.get(this.storeName, key);

      if (!entry) return null;

      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      return entry as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: CacheEntry<T>): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put(this.storeName, value);
    } catch (error) {
      console.error('IndexedDB error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      await db.delete(this.storeName, key);
    } catch (error) {
      console.error('IndexedDB error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      await db.clear(this.storeName);
    } catch (error) {
      console.error('IndexedDB error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      const entry = await db.get(this.storeName, key);
      return entry !== undefined;
    } catch {
      return false;
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

export class CacheManager {
  private adapters: Map<CacheStrategy, CacheAdapter>;

  constructor() {
    this.adapters = new Map([
      ['memory', new MemoryCacheAdapter()],
      ['localStorage', new LocalStorageCacheAdapter()],
      ['indexedDB', new IndexedDBCacheAdapter()],
    ]);
  }

  getAdapter(strategy: CacheStrategy): CacheAdapter | null {
    if (strategy === 'none') return null;
    return this.adapters.get(strategy) || null;
  }

  async get<T>(strategy: CacheStrategy, key: string): Promise<CacheEntry<T> | null> {
    const adapter = this.getAdapter(strategy);
    if (!adapter) return null;
    return adapter.get<T>(key);
  }

  async set<T>(strategy: CacheStrategy, key: string, value: CacheEntry<T>): Promise<void> {
    const adapter = this.getAdapter(strategy);
    if (!adapter) return;
    await adapter.set(key, value);
  }

  async delete(strategy: CacheStrategy, key: string): Promise<void> {
    const adapter = this.getAdapter(strategy);
    if (!adapter) return;
    await adapter.delete(key);
  }

  async clear(strategy: CacheStrategy): Promise<void> {
    const adapter = this.getAdapter(strategy);
    if (!adapter) return;
    await adapter.clear();
  }

  async invalidatePattern(strategy: CacheStrategy, pattern: string): Promise<void> {
    const adapter = this.getAdapter(strategy);
    if (!adapter) return;

    // For simplicity, clear all cache when pattern matching is requested
    // In production, you might want to implement more sophisticated pattern matching
    await adapter.clear();
  }
}
