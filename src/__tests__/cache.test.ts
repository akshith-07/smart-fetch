import { MemoryCacheAdapter, LocalStorageCacheAdapter } from '../cache';
import { CacheEntry } from '../types';

describe('Cache Adapters', () => {
  describe('MemoryCacheAdapter', () => {
    let adapter: MemoryCacheAdapter;

    beforeEach(() => {
      adapter = new MemoryCacheAdapter();
    });

    it('should set and get cache entries', async () => {
      const entry: CacheEntry = {
        data: { message: 'test' },
        timestamp: Date.now(),
        key: 'test-key',
      };

      await adapter.set('test-key', entry);
      const retrieved = await adapter.get('test-key');

      expect(retrieved).toEqual(entry);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await adapter.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should delete cache entries', async () => {
      const entry: CacheEntry = {
        data: { message: 'test' },
        timestamp: Date.now(),
        key: 'test-key',
      };

      await adapter.set('test-key', entry);
      await adapter.delete('test-key');
      const retrieved = await adapter.get('test-key');

      expect(retrieved).toBeNull();
    });

    it('should clear all cache entries', async () => {
      const entry1: CacheEntry = {
        data: { message: 'test1' },
        timestamp: Date.now(),
        key: 'test-key-1',
      };
      const entry2: CacheEntry = {
        data: { message: 'test2' },
        timestamp: Date.now(),
        key: 'test-key-2',
      };

      await adapter.set('test-key-1', entry1);
      await adapter.set('test-key-2', entry2);
      await adapter.clear();

      expect(await adapter.get('test-key-1')).toBeNull();
      expect(await adapter.get('test-key-2')).toBeNull();
    });

    it('should expire entries based on TTL', async () => {
      const entry: CacheEntry = {
        data: { message: 'test' },
        timestamp: Date.now() - 10000, // 10 seconds ago
        ttl: 5000, // 5 second TTL
        key: 'test-key',
      };

      await adapter.set('test-key', entry);
      const retrieved = await adapter.get('test-key');

      expect(retrieved).toBeNull();
    });
  });

  describe('LocalStorageCacheAdapter', () => {
    let adapter: LocalStorageCacheAdapter;

    beforeEach(() => {
      adapter = new LocalStorageCacheAdapter();
      localStorage.clear();
    });

    it('should set and get cache entries', async () => {
      const entry: CacheEntry = {
        data: { message: 'test' },
        timestamp: Date.now(),
        key: 'test-key',
      };

      await adapter.set('test-key', entry);
      const retrieved = await adapter.get('test-key');

      expect(retrieved).toEqual(entry);
    });

    it('should return null for non-existent keys', async () => {
      const retrieved = await adapter.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should expire entries based on TTL', async () => {
      const entry: CacheEntry = {
        data: { message: 'test' },
        timestamp: Date.now() - 10000, // 10 seconds ago
        ttl: 5000, // 5 second TTL
        key: 'test-key',
      };

      await adapter.set('test-key', entry);
      const retrieved = await adapter.get('test-key');

      expect(retrieved).toBeNull();
    });
  });
});
