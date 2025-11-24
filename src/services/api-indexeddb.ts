import * as db from './indexeddb'
import type { Task } from '../types'

const STORE_NAME = db.STORES.TASKS

// タスク一覧取得
export async function fetchTodos(): Promise<{ tasks: Task[], sha: string }> {
  const tasks = await db.getAll<Task>(STORE_NAME)
  
  // dueDateでソート（近い順）、完了済みは最後
  const sortedTasks = tasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  
  return { tasks: sortedTasks, sha: '' }
}

// タスク追加
export async function addTodo(
  title: string,
  dueDate?: string,
  sha: string = ''
): Promise<{ newTask: Task, sha: string }> {
  const newTask: Task = {
    id: `TASK:${Date.now()}`,
    title,
    completed: false,
    createdAt: new Date().toISOString().split('T')[0],
    dueDate
  }
  
  await db.add(STORE_NAME, newTask)
  
  return { newTask, sha: '' }
}

// タスク完了状態をトグル
export async function toggleTodo(id: string, sha: string = ''): Promise<string> {
  const task = await db.getById<Task>(STORE_NAME, id)
  
  if (task) {
    task.completed = !task.completed
    await db.put(STORE_NAME, task)
  }
  
  return ''
}

// タスク削除
export async function deleteTodo(id: string, sha: string = ''): Promise<string> {
  await db.deleteItem(STORE_NAME, id)
  return ''
}

// 期限日を更新
export async function updateDueDate(
  id: string,
  dueDate: string,
  sha: string = ''
): Promise<string> {
  const task = await db.getById<Task>(STORE_NAME, id)
  
  if (task) {
    task.dueDate = dueDate
    await db.put(STORE_NAME, task)
  }
  
  return ''
}

// ダミーのGitHub更新関数（互換性のため）
export async function updateTodoFile(
  sha: string,
  content: string,
  commitMessage: string
): Promise<string> {
  return ''
}
