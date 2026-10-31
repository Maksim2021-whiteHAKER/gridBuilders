// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './toolbar.css';

console.log("JS ЗАГРУЗИЛСЯ!");

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>       
        <App/>
    </React.StrictMode>
)