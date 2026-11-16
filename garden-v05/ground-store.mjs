// The finished ground layer, kept in IndexedDB per runtime version and ground key: a later visit decodes the stored PNG
// off the main thread (createImageBitmap) instead of rebuilding the world-size layer, which froze the garden on entry
// (owner 16/11/2026 «mỗi lần lag vậy sao chịu nổi»). Any failure (private mode, quota, no IndexedDB) means "rebuild".
const DB = 'hagrid-ground', STORE = 'layers', KEEP = 3;

const request = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

const toPng = (canvas) => (canvas.convertToBlob ? canvas.convertToBlob({type: 'image/png'}) : new Promise((resolve) => canvas.toBlob(resolve, 'image/png')));

/** IndexedDB here when the page may use it, else the HPVN shell's copy through `host` (the sandboxed game frame has no
 * IndexedDB: SecurityError), else null (always rebuild). */
export function groundStore(version, host = null) {
  if (!version || typeof createImageBitmap !== 'function') return null;
  return localStore(version) ?? (typeof host === 'function' ? shellStore(version, host) : null);
}

// The shell answers within a few ms; an older shell never answers, so a lookup gives up quickly and the ground is built.
const SHELL_WAIT_MS = 800;
function shellStore(version, host) {
  const id = (key) => `${version}|${key}`;
  const within = (promise) => Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), SHELL_WAIT_MS))]);
  return {
    async load(key) {
      try {
        const blob = await within(host({op: 'get', key: id(key)}));
        return blob instanceof Blob ? await createImageBitmap(blob) : null;
      } catch { return null; }
    },
    async save(key, canvas) {
      try { const blob = await toPng(canvas); if (blob) host({op: 'put', key: id(key), blob}); } catch { /* rebuilt next visit */ }
    },
  };
}

function localStore(version) {
  if (typeof indexedDB === 'undefined') return null;
  let first;
  try { first = indexedDB.open(DB, 1); } catch { return null; }
  let opened;
  const db = () => (opened ??= new Promise((resolve, reject) => {
    const r = first ?? indexedDB.open(DB, 1); first = null;
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  }));
  db().catch(() => {});
  const store = async (mode) => (await db()).transaction(STORE, mode).objectStore(STORE);
  const id = (key) => `${version}|${key}`;
  return {
    async load(key) {
      try {
        const record = await request((await store('readonly')).get(id(key)));
        return record?.blob ? await createImageBitmap(record.blob) : null;
      } catch { return null; }
    },
    async save(key, canvas) {
      try {
        const blob = await toPng(canvas);
        if (!blob) return;
        const layers = await store('readwrite');
        await request(layers.put({blob, at: Date.now()}, id(key)));
        // Keep the newest few of this version; an older version's layers can never be read again.
        const [keys, records] = await Promise.all([request(layers.getAllKeys()), request(layers.getAll())]);
        const mine = keys.map((k, i) => [k, records[i].at]).filter(([k]) => String(k).startsWith(version + '|')).sort((a, b) => b[1] - a[1]);
        const drop = [...keys.filter((k) => !String(k).startsWith(version + '|')), ...mine.slice(KEEP).map(([k]) => k)];
        for (const k of drop) layers.delete(k);
      } catch { /* a ground that is not stored is rebuilt next visit */ }
    },
  };
}
