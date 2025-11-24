import { PGlite } from '@electric-sql/pglite'

// PGliteインスタンスをサービスワーカーにキャッシュ
let dbInstance = null
let isInitialized = false

// DBインスタンスを取得（初回のみ作成）
async function getDb() {
  if (!dbInstance) {
    dbInstance = new PGlite('idb://wiki-todo-db')
    console.log('[ServiceWorker] PGlite instance created')
  }
  return dbInstance
}

// データベース初期化
async function initDb() {
  if (isInitialized) return
  
  const db = await getDb()
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      created_at DATE NOT NULL,
      due_date DATE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  isInitialized = true
  console.log('[ServiceWorker] Database initialized')
}

// 起動時にDB初期化
initDb().catch(console.error)

console.log('Wiki Editor background script loaded');

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToWiki',
    title: 'Wikiに追加',
    contexts: ['selection']
  });
  
  // 拡張機能インストール時にもDB初期化
  initDb().catch(console.error)
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToWiki') {
    const selectedText = info.selectionText;
    
    // Open popup with selected text
    chrome.storage.local.set({ 
      quickAdd: selectedText 
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getQuickAdd') {
    chrome.storage.local.get(['quickAdd'], (result) => {
      sendResponse({ text: result.quickAdd || '' });
      chrome.storage.local.remove(['quickAdd']);
    });
    return true;
  }
  
  // PGliteの操作を処理
  if (request.action === 'db:fetchTodos') {
    handleFetchTodos(sendResponse)
    return true
  }
  
  if (request.action === 'db:addTodo') {
    handleAddTodo(request.title, request.dueDate, sendResponse)
    return true
  }
  
  if (request.action === 'db:toggleTodo') {
    handleToggleTodo(request.taskId, sendResponse)
    return true
  }
  
  if (request.action === 'db:deleteTodo') {
    handleDeleteTodo(request.taskId, sendResponse)
    return true
  }
});

// タスク一覧を取得
async function handleFetchTodos(sendResponse) {
  try {
    await initDb()
    const db = await getDb()
    
    const result = await db.query(`
      SELECT * FROM tasks 
      ORDER BY completed ASC, created_at DESC
    `)
    
    console.log('[ServiceWorker] Loaded tasks count:', result.rows.length)
    
    const tasks = result.rows.map((row) => ({
      id: `TASK:${String(row.id).padStart(3, '0')}`,
      title: row.title,
      completed: row.completed,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : row.created_at,
      dueDate: row.due_date ? (row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date) : undefined
    }))
    
    sendResponse({ success: true, tasks, sha: '' })
  } catch (error) {
    console.error('[ServiceWorker] Error fetching todos:', error)
    sendResponse({ success: false, error: error.message })
  }
}

// タスクを追加
async function handleAddTodo(title, dueDate, sendResponse) {
  try {
    await initDb()
    const db = await getDb()
    
    const today = new Date().toISOString().split('T')[0]
    
    const result = await db.query(`
      INSERT INTO tasks (title, created_at, due_date, completed)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `, [title, today, dueDate || null])
    
    const row = result.rows[0]
    console.log('[ServiceWorker] Added task:', row.id, row.title)
    
    const newTask = {
      id: `TASK:${String(row.id).padStart(3, '0')}`,
      title: row.title,
      completed: row.completed,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : row.created_at,
      dueDate: row.due_date ? (row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date) : undefined
    }
    
    sendResponse({ success: true, newSha: '', newTask })
  } catch (error) {
    console.error('[ServiceWorker] Error adding todo:', error)
    sendResponse({ success: false, error: error.message })
  }
}

// タスクの完了状態をトグル
async function handleToggleTodo(taskId, sendResponse) {
  try {
    await initDb()
    const db = await getDb()
    
    const id = parseInt(taskId.replace('TASK:', ''))
    console.log('[ServiceWorker] Toggling task:', id)
    
    await db.query(`
      UPDATE tasks 
      SET completed = NOT completed,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id])
    
    sendResponse({ success: true, newSha: '' })
  } catch (error) {
    console.error('[ServiceWorker] Error toggling todo:', error)
    sendResponse({ success: false, error: error.message })
  }
}

// タスクを削除
async function handleDeleteTodo(taskId, sendResponse) {
  try {
    await initDb()
    const db = await getDb()
    
    const id = parseInt(taskId.replace('TASK:', ''))
    console.log('[ServiceWorker] Deleting task:', id)
    
    await db.query(`
      DELETE FROM tasks WHERE id = $1
    `, [id])
    
    sendResponse({ success: true, newSha: '' })
  } catch (error) {
    console.error('[ServiceWorker] Error deleting todo:', error)
    sendResponse({ success: false, error: error.message })
  }
}
