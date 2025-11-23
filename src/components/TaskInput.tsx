import React, { useState } from 'react'
import { useTaskStore } from '../stores/todoStore'

const TaskInput: React.FC = () => {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const { addTaskWithApi } = useTaskStore()

  const handleSubmit = async (e: React.FormEvent, useWeekDueDate = false) => {
    e.preventDefault()
    
    if (!title.trim()) return

    // 期限が指定されていない場合は1日後をデフォルトに
    let finalDueDate = dueDate
    if (!finalDueDate) {
      const date = new Date()
      date.setDate(date.getDate() + (useWeekDueDate ? 7 : 1))
      finalDueDate = date.toISOString().split('T')[0]
    }

    await addTaskWithApi(title.trim(), finalDueDate)

    setTitle('')
    setDueDate('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSubmit(e as any, true)
    }
  }

  const setQuickDueDate = async (days: number) => {
    if (!title.trim()) return

    const date = new Date()
    date.setDate(date.getDate() + days)
    const quickDueDate = date.toISOString().split('T')[0]
    
    await addTaskWithApi(title.trim(), quickDueDate)
    
    setTitle('')
    setDueDate('')
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="新しいタスクを入力... (Ctrl+Enter: 1週間後)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            追加
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">クイック追加:</span>
          <button
            type="button"
            onClick={() => setQuickDueDate(1)}
            disabled={!title.trim()}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            1日
          </button>
          <button
            type="button"
            onClick={() => setQuickDueDate(7)}
            disabled={!title.trim()}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            1週間
          </button>
          <button
            type="button"
            onClick={() => setQuickDueDate(365)}
            disabled={!title.trim()}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            1年
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskInput
