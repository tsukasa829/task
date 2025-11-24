import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { useTaskStore, SYNC_INTERVAL_MS } from '../stores/todoStore'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { useTagStore } from '../stores/tagStore'
import TaskList from '../components/TaskList'
import Header from '../components/Header'
import '../styles/index.css'

const Popup: React.FC = () => {
  const { tasks, isLoading, error, fetchTasks, syncToGitHub } = useTaskStore()
  const loadKnowledges = useKnowledgeStore(state => state.loadKnowledges)
  const loadTags = useTagStore(state => state.loadTags)

  // 起動時にすべてのデータを取得
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchTasks(),
        loadKnowledges(),
        loadTags()
      ])
    }
    init()
    
    // 定期同期を設定（1分ごと）
    const syncInterval = setInterval(() => {
      syncToGitHub()
    }, SYNC_INTERVAL_MS)
    
    // クリーンアップ
    return () => clearInterval(syncInterval)
  }, [])

  return (
    <div className="w-[400px] h-[600px] bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>
    </div>
  )
}

export default Popup

// Chrome拡張用: popup.htmlから直接呼ばれる場合のみレンダリング
// 開発モードではmain.tsxが処理するのでここでは何もしない
if (typeof window !== 'undefined' && import.meta.env.MODE === 'production') {
  const rootElement = document.getElementById('root')
  if (rootElement && !rootElement.hasAttribute('data-react-root')) {
    rootElement.setAttribute('data-react-root', 'true')
    ReactDOM.createRoot(rootElement).render(<Popup />)
  }
}
