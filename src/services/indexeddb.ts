// ピュアなIndexedDB操作ラッパー
// 将来的にNeon REST APIへの切り替えを容易にするため、インターフェースを統一

const DB_NAME = 'task-manager-db'
const DB_VERSION = 1

// ストア名
const STORES = {
  TASKS: 'tasks',
  KNOWLEDGES: 'knowledges',
  TAGS: 'tags'
}

let dbInstance: IDBDatabase | null = null

// データベース初期化
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Tasksストア
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' })
        taskStore.createIndex('completed', 'completed', { unique: false })
        taskStore.createIndex('dueDate', 'dueDate', { unique: false })
        taskStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Knowledgesストア
      if (!db.objectStoreNames.contains(STORES.KNOWLEDGES)) {
        const knowledgeStore = db.createObjectStore(STORES.KNOWLEDGES, { keyPath: 'id' })
        knowledgeStore.createIndex('tag', 'tag', { unique: false })
        knowledgeStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Tagsストア
      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        const tagStore = db.createObjectStore(STORES.TAGS, { keyPath: 'id' })
        tagStore.createIndex('name', 'name', { unique: true })
      }
    }
  })
}

// 汎用的なCRUD操作

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function add<T>(storeName: string, item: T): Promise<T> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.add(item)

    request.onsuccess = () => resolve(item)
    request.onerror = () => reject(request.error)
  })
}

export async function put<T>(storeName: string, item: T): Promise<T> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onsuccess = () => resolve(item)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteItem(storeName: string, id: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clear(storeName: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// インデックスを使用した検索
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export { STORES }
