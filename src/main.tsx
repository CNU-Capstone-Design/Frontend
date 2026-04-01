import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App' // app 폴더 안의 App.tsx를 불러옵니다.
import './styles/index.css'  // 글로벌 스타일 (Tailwind 포함)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)