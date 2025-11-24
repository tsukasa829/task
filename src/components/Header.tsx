import React, { useState, useEffect } from 'react'
import { useTaskStore } from '../stores/todoStore'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { useTagStore } from '../stores/tagStore'

const STORAGE_KEY = 'task_form_draft'

const Header: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false)
  const { tasks, addTaskWithApi } = useTaskStore()
  const { addKnowledge, getTopTagsByCount } = useKnowledgeStore()
  const { getTagNames } = useTagStore()
  const [title, setTitle] = useState('')
  
  // ナレッジ数の多い順に3個表示、0件の場合はデフォルトタグ
  const topTags = getTopTagsByCount(3)
  const displayTags = topTags.length > 0 ? topTags : getTagNames().slice(0, 3)

  // localStorage から復元
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY)
    if (savedDraft) {
      setTitle(savedDraft)
    }
  }, [])

  // 入力内容を localStorage に保存
  useEffect(() => {
    if (title) {
      localStorage.setItem(STORAGE_KEY, title)
    }
  }, [title])

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }

  const handleSubmit = async (e: React.FormEvent, useWeekDueDate = false) => {
    e.preventDefault()
    
    if (!title.trim()) return

    // 期限が指定されていない場合は1日後をデフォルトに
    const date = new Date()
    date.setDate(date.getDate() + (useWeekDueDate ? 7 : 1))
    const finalDueDate = date.toISOString().split('T')[0]

    await addTaskWithApi(title.trim(), finalDueDate)

    // フォームをリセットし、localStorage もクリア
    setTitle('')
    localStorage.removeItem(STORAGE_KEY)
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
    
    // フォームをリセットし、localStorage もクリア
    setTitle('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleQuickKnowledge = (tag: string) => {
    if (!title.trim()) return
    
    addKnowledge(title.trim(), tag)
    
    // フォームをリセットし、localStorage もクリア
    setTitle('')
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <form onSubmit={handleSubmit} className="space-y-2">
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

          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    JSONダンプ
                  </button>
                </div>
              </>
            )}
          </div>
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">ナレッジ:</span>
          {displayTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickKnowledge(tag)}
              disabled={!title.trim()}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tag}
            </button>
          ))}
        </div>
      </form>
    </header>
  )
}

export default Header
