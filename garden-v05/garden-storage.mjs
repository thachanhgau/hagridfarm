// Prototype saves: one atomic envelope per local garden; previews stay in memory.
let activeStorage;
export function getGardenStorage() { return activeStorage || globalThis.localStorage; }

export function createGardenStorage({scope, persistent = true, storage = globalThis.localStorage, legacyKeys = []}) {
  const storageKey = `${scope}-v23-save`;
  let memory = {}, pending = null;
  function read() {
    if (pending) return pending;
    if (!persistent) return memory;
    const raw = storage.getItem(storageKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('Bản lưu khu vườn không hợp lệ.');
      return parsed;
    }
    return Object.fromEntries(legacyKeys.map(key => [key, storage.getItem(key)]).filter(([, value]) => value !== null));
  }
  function write(data) {
    if (persistent) storage.setItem(storageKey, JSON.stringify(data));
    else memory = data;
  }
  return {
    storageKey,
    getItem(key) { return read()[key] ?? null; },
    setItem(key, value) {
      if (pending) pending[key] = String(value);
      else write({...read(), [key]: String(value)});
    },
    transaction(fn) {
      if (pending) return fn();
      pending = {...read()};
      try {
        const result = fn();
        write(pending);
        return result;
      } finally { pending = null; }
    },
  };
}

export function configureGardenStorage(options) {
  activeStorage = createGardenStorage(options);
  return activeStorage;
}

export function applyGardenReward(inventory, supplies, reward) {
  const add = (target, id, amount) => {
    if (!Number.isSafeInteger(amount) || amount < 0 || !(id in target)) throw Error(`Phần thưởng không hợp lệ: ${id}`);
    target[id] += amount;
  };
  // Rewards are water or nước phép (`boost`) plus optional crops/rations; kits no longer exist.
  if (reward.kind !== 'water' && reward.kind !== 'boost') throw Error(`Phần thưởng không hợp lệ: ${reward.kind}`);
  add(supplies, reward.kind, reward.amount);
  if (reward.waterBonus) add(supplies, 'water', reward.waterBonus);
  if (reward.itemId && reward.bonusQty) add(inventory, reward.itemId, reward.bonusQty);
  return {inventory, supplies};
}
