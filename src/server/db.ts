import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseState } from './types.ts';
import { createInitialSeed } from './seed.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'eventpro-db.json');

let memoryCache: DatabaseState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function ensureLoaded(): DatabaseState {
  if (memoryCache) return memoryCache;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    memoryCache = initial;
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseState;
    if (
      parsed.settings?.stats &&
      parsed.settings.stats.some((s) => (s.key as string) === 'experience' || s.value === 'À configurer')
    ) {
      parsed.settings.stats = createInitialSeed().settings.stats;
    }
    if (Array.isArray(parsed.gallery)) {
      const seededGallery = createInitialSeed().gallery;
      const existingIds = new Set(parsed.gallery.map((g) => g.id));
      const newItems = seededGallery.filter((g) => !existingIds.has(g.id));
      if (newItems.length > 0) {
        parsed.gallery = [...newItems, ...parsed.gallery];
      }
    }
    if (
      Array.isArray(parsed.testimonials) &&
      parsed.testimonials.length === 2 &&
      parsed.testimonials.some((t) => t.id === 'test_1') &&
      parsed.testimonials.some((t) => t.id === 'test_2') &&
      !parsed.testimonials.some((t) => t.id === 'test_3')
    ) {
      const third = createInitialSeed().testimonials.find((t) => t.id === 'test_3');
      if (third) {
        parsed.testimonials = [...parsed.testimonials, third];
      }
    }
    memoryCache = parsed;
    return parsed;
  } catch (error) {
    console.error('Failed to read database file, reinitializing:', error);
    const fallback = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf8');
    memoryCache = fallback;
    return fallback;
  }
}

export function readDb(): DatabaseState {
  return ensureLoaded();
}

export async function mutateDb<T>(mutator: (state: DatabaseState) => T | Promise<T>): Promise<T> {
  let result!: T;
  const run = writeQueue.then(async () => {
    const state = ensureLoaded();
    result = await mutator(state);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  });
  writeQueue = run.catch(() => {});
  await run;
  return result;
}
