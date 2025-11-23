import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './popup/Popup.tsx'
import './styles/index.css'

// 開発用: Chrome拡張のポップアップサイズをシミュレート
const DevWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// main.tsxは開発モード用のエントリーポイント
// popup.tsxが既にレンダリングを処理しているのでここでは何もしない
const rootElement = document.getElementById('root')
if (rootElement && !rootElement.hasAttribute('data-react-root')) {
  rootElement.setAttribute('data-react-root', 'true')
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <DevWrapper>
        <Popup />
      </DevWrapper>
    </React.StrictMode>
  )
}
