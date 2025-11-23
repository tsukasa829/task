import { PGlite } from '@electric-sql/pglite'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  dueDate?: string
}

// グローバルにDBインスタンスを保持（シングルトン）
let dbInstance: PGlite | null = null
let isInitialized = false

// DBインスタンスを取得（初回のみ作成）
async function getDb(): Promise<PGlite> {
  if (!dbInstance) {
    dbInstance = new PGlite('idb://wiki-todo-db')
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
}

// GitHubからtodo.mdを取得（ダミー、互換性のため）
export async function fetchTodos(): Promise<{ tasks: Task[], sha: string }> {
  await initDb()
  const db = await getDb()
  
  const result = await db.query(`
    SELECT * FROM tasks 
    ORDER BY completed ASC, created_at DESC
  `)
  
  console.log('[PGlite] Loaded tasks count:', result.rows.length)
  
  return {
    tasks: result.rows.map((row: any) => ({
      id: `TASK:${String(row.id).padStart(3, '0')}`,
      title: row.title,
      completed: row.completed,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : row.created_at,
      dueDate: row.due_date ? (row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date) : undefined
    })),
    sha: '' // ローカルDBではSHA不要
  }
}

// タスクを追加
export async function addTodo(title: string, dueDate: string | undefined, _sha: string): Promise<{ newSha: string, newTask: Task }> {
  await initDb()
  const db = await getDb()
  
  const today = new Date().toISOString().split('T')[0]
  
  const result = await db.query(`
    INSERT INTO tasks (title, created_at, due_date, completed)
    VALUES ($1, $2, $3, false)
    RETURNING *
  `, [title, today, dueDate || null])
  
  const row: any = result.rows[0]
  console.log('[PGlite] Added task:', row.id, row.title)
  
  return {
    newSha: '',
    newTask: {
      id: `TASK:${String(row.id).padStart(3, '0')}`,
      title: row.title,
      completed: row.completed,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : row.created_at,
      dueDate: row.due_date ? (row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date) : undefined
    }
  }
}

// タスクの完了状態をトグル
export async function toggleTodo(taskId: string, _sha: string): Promise<string> {
  await initDb()
  const db = await getDb()
  
  const id = parseInt(taskId.replace('TASK:', ''))
  console.log('[PGlite] Toggling task:', id)
  
  await db.query(`
    UPDATE tasks 
    SET completed = NOT completed,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [id])
  
  return '' // ローカルDBではSHA不要
}

// タスクを削除
export async function deleteTodo(taskId: string, _sha: string): Promise<string> {
  await initDb()
  const db = await getDb()
  
  const id = parseInt(taskId.replace('TASK:', ''))
  console.log('[PGlite] Deleting task:', id)
  
  await db.query(`
    DELETE FROM tasks WHERE id = $1
  `, [id])
  
  return '' // ローカルDBではSHA不要
}

// タスクの期限を更新
export async function updateDueDate(taskId: string, dueDate: string, _sha: string): Promise<string> {
  await initDb()
  const db = await getDb()
  
  const id = parseInt(taskId.replace('TASK:', ''))
  console.log('[PGlite] Updating due date for task:', id, 'to:', dueDate)
  
  await db.query(`
    UPDATE tasks 
    SET due_date = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [dueDate, id])
  
  return '' // ローカルDBではSHA不要
}

// GitHubファイル更新（ダミー、互換性のため）
export async function updateTodoFile(_sha: string, _content: string, _message: string): Promise<string> {
  // ローカルDBでは何もしない
  return ''
}
