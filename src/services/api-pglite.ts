import { PGlite } from '@electric-sql/pglite'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  dueDate?: string
}

export interface Knowledge {
  id: string
  content: string
  tag: string
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  createdAt: string
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
    );
    
    CREATE TABLE IF NOT EXISTS knowledges (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      tag TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
  
  // デフォルトタグを挿入（存在しない場合のみ）
  await db.query(`
    INSERT INTO tags (name) VALUES ('メンタル'), ('戦略'), ('メモ')
    ON CONFLICT (name) DO NOTHING
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

// ===== Knowledge API =====

// 全てのナレッジを取得
export async function fetchKnowledges(): Promise<Knowledge[]> {
  await initDb()
  const db = await getDb()
  
  const result = await db.query(`
    SELECT * FROM knowledges 
    ORDER BY created_at DESC
  `)
  
  return result.rows.map((row: any) => ({
    id: String(row.id),
    content: row.content,
    tag: row.tag,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }))
}

// ナレッジを追加
export async function addKnowledge(content: string, tag: string): Promise<Knowledge> {
  await initDb()
  const db = await getDb()
  
  const result = await db.query(`
    INSERT INTO knowledges (content, tag)
    VALUES ($1, $2)
    RETURNING *
  `, [content, tag])
  
  const row: any = result.rows[0]
  
  return {
    id: String(row.id),
    content: row.content,
    tag: row.tag,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }
}

// ナレッジを削除
export async function deleteKnowledge(knowledgeId: string): Promise<void> {
  await initDb()
  const db = await getDb()
  
  await db.query(`
    DELETE FROM knowledges WHERE id = $1
  `, [parseInt(knowledgeId)])
}

// タグごとのナレッジ数を取得
export async function getKnowledgeCountByTag(): Promise<Record<string, number>> {
  await initDb()
  const db = await getDb()
  
  const result = await db.query(`
    SELECT tag, COUNT(*) as count
    FROM knowledges
    GROUP BY tag
    ORDER BY count DESC
  `)
  
  const counts: Record<string, number> = {}
  result.rows.forEach((row: any) => {
    counts[row.tag] = parseInt(row.count)
  })
  
  return counts
}

// ===== Tag API =====

// 全てのタグを取得
export async function fetchTags(): Promise<Tag[]> {
  await initDb()
  const db = await getDb()
  
  const result = await db.query(`
    SELECT * FROM tags 
    ORDER BY created_at ASC
  `)
  
  return result.rows.map((row: any) => ({
    id: String(row.id),
    name: row.name,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }))
}

// タグを追加
export async function addTag(name: string): Promise<Tag> {
  await initDb()
  const db = await getDb()
  
  const result = await db.query(`
    INSERT INTO tags (name)
    VALUES ($1)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING *
  `, [name])
  
  const row: any = result.rows[0]
  
  return {
    id: String(row.id),
    name: row.name,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }
}

// タグを削除
export async function deleteTag(tagId: string): Promise<void> {
  await initDb()
  const db = await getDb()
  
  await db.query(`
    DELETE FROM tags WHERE id = $1
  `, [parseInt(tagId)])
}
