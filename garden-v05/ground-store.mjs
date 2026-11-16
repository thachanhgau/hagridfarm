// The finished ground layer, kept in IndexedDB per runtime version and ground key: a later visit decodes the stored PNG
// off the main thread (createImageBitmap) instead of rebuilding the world-size layer, which froze the garden on entry
// (owner 16/11/2026 «mỗi lần lag vậy sao chịu nổi»). Any failure (private mode, quota, no IndexedDB) means "rebuild".
const DB = 'hagrid-ground', STORE = 'layers', KEEP = 3;

const request = (r) => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

export function groundStore(version) {
  if (!version || typeof indexedDB === 'undefined' || typeof createImageBitmap !== 'function') return null;
  let opened;
  const db = () => (opened ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
  }));
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
        const blob = canvas.convertToBlob ? await canvas.convertToBlob({type: 'image/png'}) : await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
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
