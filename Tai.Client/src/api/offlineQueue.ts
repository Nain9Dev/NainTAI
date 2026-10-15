import { openDB, type IDBPDatabase } from 'idb';
import { useConnectionStore } from '../store/useConnectionStore';

export interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body: unknown;
  timestamp: number;
  /** How many times this request has been replayed without success. */
  attempts: number;
}

/** What the caller decided about a replayed request. */
export type DrainOutcome = 'sent' | 'discard' | 'retry-later';

const DB_NAME = 'nain_tai_offline_db';
const DB_VERSION = 2;
const STORE_NAME = 'requests_queue';

/**
 * A request that keeps failing is dropped rather than retried forever. Without a cap, one
 * poisoned entry blocks the queue behind it on every reconnection.
 */
const MAX_ATTEMPTS = 5;

/**
 * Writes made while offline, replayed when connectivity returns.
 *
 * IndexedDB rather than localStorage: the queue survives a reload, holds structured values
 * without serialising by hand, and never blocks the main thread.
 */
class OfflineQueue {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  /**
   * Opens the database on first use rather than on import.
   *
   * Opening it in the constructor meant the module could not be imported anywhere without
   * IndexedDB present — it threw in Node, and in a browser it created a database for every
   * visitor, including the ones who never go offline.
   */
  private db(): Promise<IDBPDatabase> {
    this.dbPromise ??= openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });

    return this.dbPromise;
  }

  /**
   * Publishes the pending count so a reload with queued writes shows them straight away.
   * Called once at start-up; failure is not fatal, the queue simply does not persist.
   */
  async initialize(): Promise<void> {
    await this.publishCount();
  }

  async enqueue(path: string, method: string, body: unknown): Promise<void> {
    const db = await this.db();

    await db.put(STORE_NAME, {
      id: crypto.randomUUID(),
      path,
      method,
      body,
      timestamp: Date.now(),
      attempts: 0,
    } satisfies QueuedRequest);

    await this.publishCount();
  }

  async pending(): Promise<QueuedRequest[]> {
    const db = await this.db();
    const all = (await db.getAll(STORE_NAME)) as QueuedRequest[];
    // Oldest first: replaying an exam out of order would scramble the history.
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }

  async count(): Promise<number> {
    const db = await this.db();
    return db.count(STORE_NAME);
  }

  /**
   * Replays queued requests in order, stopping at the first network failure so the rest
   * keep their position instead of burning an attempt each.
   */
  async drain(send: (request: QueuedRequest) => Promise<DrainOutcome>): Promise<void> {
    const requests = await this.pending();
    if (requests.length === 0) {
      return;
    }

    const connection = useConnectionStore.getState();
    connection.setSyncing(true);

    try {
      for (const request of requests) {
        let outcome: DrainOutcome;

        try {
          outcome = await send(request);
        } catch {
          // Still offline. Leave the remaining entries untouched.
          break;
        }

        if (outcome === 'sent' || outcome === 'discard') {
          await this.remove(request.id);
          continue;
        }

        const attempts = request.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await this.remove(request.id);
          continue;
        }

        await this.recordAttempt(request, attempts);
        break;
      }
    } finally {
      connection.setSyncing(false);
      await this.publishCount();
    }
  }

  async remove(id: string): Promise<void> {
    const db = await this.db();
    await db.delete(STORE_NAME, id);
    await this.publishCount();
  }

  async clear(): Promise<void> {
    const db = await this.db();
    await db.clear(STORE_NAME);
    await this.publishCount();
  }

  private async recordAttempt(request: QueuedRequest, attempts: number): Promise<void> {
    const db = await this.db();
    await db.put(STORE_NAME, { ...request, attempts });
  }

  private async publishCount(): Promise<void> {
    try {
      useConnectionStore.getState().setPendingWrites(await this.count());
    } catch {
      // IndexedDB is unavailable in private mode on some browsers. The queue simply does
      // not persist there; the application still works online.
    }
  }
}

export const offlineQueue = new OfflineQueue();
