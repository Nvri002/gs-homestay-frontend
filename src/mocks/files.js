// Penyimpanan berkas bukti bayar (IndexedDB; cadangan di memori bila tidak tersedia).
const NAME = 'gsh-mock-files'
const STORE = 'proofs'
const memory = new Map()

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no idb'))
    const req = indexedDB.open(NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(mode, fn) {
  return open().then(
    (idb) =>
      new Promise((resolve, reject) => {
        const t = idb.transaction(STORE, mode)
        const r = fn(t.objectStore(STORE))
        t.oncomplete = () => resolve(r?.result)
        t.onerror = () => reject(t.error)
      }),
  )
}

export async function putProof(id, blob) {
  memory.set(String(id), blob)
  try {
    await tx('readwrite', (s) => s.put(blob, String(id)))
  } catch {
    /* cukup di memori */
  }
}

export async function getProof(id) {
  try {
    const blob = await tx('readonly', (s) => s.get(String(id)))
    if (blob) return blob
  } catch {
    /* lanjut ke memori */
  }
  return memory.get(String(id)) || null
}

export async function clearProofs() {
  memory.clear()
  try {
    await tx('readwrite', (s) => s.clear())
  } catch {
    /* abaikan */
  }
}
